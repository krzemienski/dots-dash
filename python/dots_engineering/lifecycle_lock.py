"""Serialize cooperating local lifecycle operations, never confer process authority."""
import fcntl
import os
import sqlite3
import stat
from contextlib import contextmanager
from .contracts import Rejected


def _bind_identity(directory, held):
    # The binding belongs only to this marked disposable database. First binding
    # is atomic even if competing callers opened different lock inodes. Existing
    # or empty bindings are never replaced as an implicit recovery operation.
    connection = sqlite3.connect((directory / "snapshot.sqlite").as_uri() + "?mode=rw", uri=True, timeout=5)
    try:
        exists = connection.execute("SELECT 1 FROM sqlite_master WHERE name='rehearsal_lifecycle'").fetchone()
        if not exists:
            connection.execute("BEGIN IMMEDIATE")
            exists = connection.execute("SELECT 1 FROM sqlite_master WHERE name='rehearsal_lifecycle'").fetchone()
            if not exists:
                connection.execute("CREATE TABLE rehearsal_lifecycle(id INTEGER PRIMARY KEY CHECK(id=1),device INTEGER NOT NULL,inode INTEGER NOT NULL)")
                connection.execute("INSERT INTO rehearsal_lifecycle VALUES (1,?,?)", (held.st_dev, held.st_ino))
            connection.commit()
        rows = connection.execute("SELECT id,device,inode FROM rehearsal_lifecycle").fetchall()
        if rows != [(1, held.st_dev, held.st_ino)]:
            raise OSError("Lifecycle lock identity changed")
    finally:
        connection.close()


@contextmanager
def lifecycle_guard(directory):
    descriptor = None
    try:
        try:
            path = directory / "lifecycle.lock"
            descriptor = os.open(path, os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW, 0o600)
            fcntl.flock(descriptor, fcntl.LOCK_EX | fcntl.LOCK_NB)
            held, current = os.fstat(descriptor), path.lstat()
            if (not stat.S_ISREG(held.st_mode) or held.st_mode & 0o077 or held.st_nlink != 1
                    or not stat.S_ISREG(current.st_mode)
                    or (held.st_dev, held.st_ino) != (current.st_dev, current.st_ino)):
                raise OSError("Lifecycle lock identity unavailable")
            _bind_identity(directory, held)
        except (OSError, sqlite3.DatabaseError) as error:
            raise Rejected("Rehearsal lifecycle is busy or unavailable", 409) from error
        yield
    finally:
        if descriptor is not None:
            os.close(descriptor)
