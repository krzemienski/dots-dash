"""Own fixed local Node rehearsal processes; never adopt a PID or scan processes.

Keep this supervisor alive independently of the disposable controller. Losing
these handles leaves durable running/launching rows unresolved, not kill authority.
"""
import hashlib
import json
import os
import select
import shutil
import sqlite3
import subprocess
import time
import uuid
from pathlib import Path
from .contracts import Rejected
from .history_validation import canonical_json, require
from .supervision_state import require_settled_supervision
from .lifecycle_lock import lifecycle_guard


class OwnedRehearsalSupervisor:
    def __init__(self, scratch_root):
        self.root = Path(scratch_root)
        require(self.root.is_absolute() and self.root.is_dir())
        self._runs = {}

    def _connect(self, path, *, readonly=False):
        connection = sqlite3.connect(path.as_uri() + ("?mode=ro" if readonly else "?mode=rw"), uri=True, timeout=5)
        connection.row_factory = sqlite3.Row
        return connection

    def _validate(self, envelope):
        require(isinstance(envelope, dict) and set(envelope) == {"database","owner","epoch","body","sourceAccount","kind"}
                and envelope.get("kind") in ("history", "instruction", "decision") and type(envelope["epoch"]) is int)
        path = Path(envelope["database"])
        require(path.is_absolute() and path.name == "snapshot.sqlite" and not path.is_symlink()
                and not path.parent.is_symlink() and path.parent.name.startswith("dots-instruction-rehearsal-")
                and path.parent.parent.resolve() == self.root.resolve())
        manifest_file = path.parent / "rehearsal.json"
        require(manifest_file.is_file() and not manifest_file.is_symlink())
        manifest = json.loads(manifest_file.read_text())
        stat = path.stat()
        require(manifest.get("version") == 2 and manifest.get("owner") == envelope.get("owner")
                and manifest.get("sourceAccount") == envelope.get("sourceAccount")
                and manifest.get("databaseDevice") == stat.st_dev and manifest.get("databaseInode") == stat.st_ino)
        digest = hashlib.sha256(canonical_json(envelope["body"]).encode()).hexdigest()
        connection = self._connect(path, readonly=True)
        try:
            session = connection.execute("SELECT * FROM rehearsal_session").fetchall()
            require(len(session) == 1 and session[0]["id"] == manifest["sessionId"]
                    and session[0]["owner"] == envelope["owner"] and session[0]["version"] == 2)
            self._check_pending(connection, envelope, digest)
        finally:
            connection.close()
        return path, digest

    def _check_pending(self, connection, envelope, digest):
        row = connection.execute("SELECT * FROM rehearsal_handoff WHERE id=1").fetchone()
        pending = json.loads(row["pending"]) if row and row["pending"] else None
        require(row and row["owner"] == envelope["owner"] and row["writer"] == "node"
                and row["epoch"] == envelope["epoch"] and pending and pending["hash"] == digest
                and pending["kind"] == envelope["kind"])

    def start(self, envelope, *, pause_at="before-dispatch"):
        path, _ = self._validate(envelope)
        with lifecycle_guard(path.parent):
            # Revalidate under the lock: cleanup or restart may have won since
            # the first read. Never launch from a stale pre-lock observation.
            return self._start(envelope, pause_at=pause_at)

    def _start(self, envelope, *, pause_at):
        require(pause_at in ("before-dispatch", "before-audit", "after-dispatch"))
        if sum(run["process"].poll() is None for run in self._runs.values()) >= 4:
            raise Rejected("Owned rehearsal process limit reached", 409)
        executable = shutil.which("node")
        if not executable:
            raise Rejected("Node runtime unavailable", 503)
        path, digest = self._validate(envelope)
        payload = (json.dumps(dict(envelope,pauseAt=pause_at),ensure_ascii=False,separators=(",",":"))+"\n").encode()
        if len(payload) > 1000000:
            raise Rejected("Owned worker envelope too large", 413)
        identifier = str(uuid.uuid4())
        connection = self._connect(path)
        try:
            connection.execute("BEGIN IMMEDIATE")
            self._check_pending(connection, envelope, digest)
            connection.execute("CREATE TABLE IF NOT EXISTS rehearsal_supervision(id TEXT PRIMARY KEY,owner TEXT NOT NULL,request_hash TEXT NOT NULL,state TEXT NOT NULL,exit_code INTEGER)")
            require_settled_supervision(connection, envelope["owner"])
            connection.execute("INSERT INTO rehearsal_supervision VALUES (?,?,?,'launching',NULL)", (identifier,envelope["owner"],digest))
            connection.commit()
        finally:
            connection.close()
        script = Path(__file__).resolve().parents[2] / "server" / "supervised-rehearsal.mjs"
        try:
            process = subprocess.Popen([executable,str(script)],stdin=subprocess.PIPE,stdout=subprocess.PIPE,
                                       stderr=subprocess.DEVNULL)
        except Exception:
            connection = self._connect(path)
            try:
                connection.execute("UPDATE rehearsal_supervision SET state='not_started' WHERE id=?", (identifier,))
                connection.commit()
            finally:
                connection.close()
            raise Rejected("Owned worker did not start; reconcile before retrying", 503)
        run = dict(process=process,path=path,owner=envelope["owner"],hash=digest,buffer=b"",recorded=False)
        self._runs[identifier] = run
        connection = self._connect(path)
        try:
            connection.execute("UPDATE rehearsal_supervision SET state='running' WHERE id=?", (identifier,))
            connection.commit()
        finally:
            connection.close()
        process.stdin.write(payload)
        process.stdin.flush()
        return identifier

    def _run(self, identifier):
        if identifier not in self._runs:
            raise Rejected("No process handle owned by this supervisor", 404)
        return self._runs[identifier]

    def _record_exit(self, identifier):
        run = self._run(identifier)
        code = run["process"].poll()
        if code is not None and not run["recorded"]:
            connection = self._connect(run["path"])
            try:
                changed = connection.execute("UPDATE rehearsal_supervision SET state='exited',exit_code=? WHERE id=? AND owner=? AND request_hash=?",
                                             (code,identifier,run["owner"],run["hash"]))
                require(changed.rowcount == 1)
                connection.commit()
                run["recorded"] = True
            finally:
                connection.close()
        return code

    def status(self, identifier):
        code = self._record_exit(identifier)
        return dict(running=code is None, exitConfirmed=code is not None, returncode=code)

    def next_event(self, identifier, *, timeout=10):
        run = self._run(identifier)
        deadline = time.monotonic() + min(max(timeout, 0), 30)
        while b"\n" not in run["buffer"]:
            remaining = deadline - time.monotonic()
            if remaining <= 0 or not select.select([run["process"].stdout], [], [], remaining)[0]:
                raise Rejected("Owned worker phase not reached", 408)
            chunk = os.read(run["process"].stdout.fileno(),65536)
            if not chunk:
                status = self.status(identifier)
                return dict(phase="exited" if status["exitConfirmed"] else "output-closed", **status)
            run["buffer"] += chunk
            if len(run["buffer"]) > 4000000:
                raise Rejected("Owned worker output exceeds rehearsal limit", 503)
        line, run["buffer"] = run["buffer"].split(b"\n",1)
        return json.loads(line)

    def proceed(self, identifier):
        run = self._run(identifier)
        if run["process"].poll() is not None:
            raise Rejected("Owned worker has already exited", 409)
        run["process"].stdin.write(b"continue\n")
        run["process"].stdin.flush()

    def wait_exit(self, identifier, *, timeout=5):
        run = self._run(identifier)
        try:
            run["process"].wait(timeout=min(max(timeout, 0),30))
        except subprocess.TimeoutExpired:
            raise Rejected("Owned worker exit is not confirmed", 409)
        return self.status(identifier)

    def stop(self, identifier):
        run = self._run(identifier)
        escalated = False
        if run["process"].poll() is None:
            run["process"].terminate()
            try:
                run["process"].wait(timeout=2)
            except subprocess.TimeoutExpired:
                escalated = True
                run["process"].kill()
                try:
                    run["process"].wait(timeout=5)
                except subprocess.TimeoutExpired:
                    raise Rejected("Owned worker exit remains unconfirmed", 503)
        return dict(self.status(identifier), escalated=escalated)

    def close(self):
        errors = []
        for identifier,run in self._runs.items():
            try:
                self.stop(identifier)
            except Exception as error:
                errors.append(error)
            if run["process"].poll() is not None:
                for stream in (run["process"].stdin,run["process"].stdout):
                    try:
                        stream.close()
                    except (BrokenPipeError,OSError):
                        pass
        if errors:
            raise errors[0]

    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.close()
