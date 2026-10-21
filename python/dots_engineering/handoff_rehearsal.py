"""Writer handoff on a newly owned, explicitly marked disposable SQLite copy.

Local operator authority, not authentication or a production migration adapter.
Resume accepts only a marked session in the selected scratch root, never an app store.
"""
import hashlib
import fcntl
import json
import os
import shutil
import sqlite3
import subprocess
import threading
import uuid
from contextlib import contextmanager
from pathlib import Path
from .contracts import Rejected
from .history_rehearsal import HistoryRehearsal
from .history_validation import canonical_json, require
from .instruction_rehearsal import InstructionRehearsal
from .decision_rehearsal import DecisionRehearsal
from .legacy_read import validate_legacy_storage
from .rehearsal_receipts import operation_identity, matching_receipt
from .supervision_state import supervision_status, require_settled_supervision
from .lifecycle_lock import lifecycle_guard


class HandoffRehearsal(HistoryRehearsal):
    def __init__(self, source_database, scratch_root, owner, principal, *, source_account=None):
        self._controller_lock = None
        self._retained_directory = None
        self._operation_lock = threading.Lock()
        super().__init__(source_database, scratch_root, owner, principal, source_account=source_account)
        self._dispatch_lease = None
        try:
            self._lock(self._snapshot.parent, create=True)
            session_id = str(uuid.uuid4())
            with self._control(principal) as connection:
                connection.execute("CREATE TABLE rehearsal_handoff(id INTEGER PRIMARY KEY CHECK(id=1),owner TEXT NOT NULL,writer TEXT NOT NULL,epoch INTEGER NOT NULL,pending TEXT,checkpoint TEXT)")
                connection.execute("INSERT INTO rehearsal_handoff VALUES (1,?,'node',1,NULL,NULL)", (owner,))
                connection.execute("CREATE TABLE rehearsal_session(id TEXT PRIMARY KEY,version INTEGER NOT NULL,owner TEXT NOT NULL)")
                connection.execute("INSERT INTO rehearsal_session VALUES (?,2,?)", (session_id, owner))
            stat = self._snapshot.stat()
            lock_stat = os.fstat(self._controller_lock)
            manifest = dict(version=2,sessionId=session_id,owner=owner,sourceAccount=source_account,
                            databaseDevice=stat.st_dev,databaseInode=stat.st_ino,sourceHash=self.snapshot_file_hash,
                            lockDevice=lock_stat.st_dev,lockInode=lock_stat.st_ino)
            manifest_path = self._snapshot.parent / "rehearsal.json"
            descriptor = os.open(manifest_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(descriptor, "w") as stream:
                json.dump(manifest, stream)
                stream.flush()
                os.fsync(stream.fileno())
        except BaseException:
            self.close()
            raise

    def _lock(self, directory, *, create=False):
        flags = os.O_RDWR | os.O_NOFOLLOW
        if create:
            flags |= os.O_CREAT | os.O_EXCL
        descriptor = os.open(directory / "controller.lock", flags, 0o600)
        try:
            fcntl.flock(descriptor, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BaseException:
            os.close(descriptor)
            raise Rejected("Rehearsal controller is already active", 409)
        self._controller_lock = descriptor

    def _unlock(self):
        if self._controller_lock is not None:
            fcntl.flock(self._controller_lock, fcntl.LOCK_UN)
            os.close(self._controller_lock)
            self._controller_lock = None

    @classmethod
    def resume(cls, snapshot_directory, scratch_root, owner, principal):
        if not owner or principal != owner:
            raise Rejected("Owner authentication required", 401)
        directory, root = Path(snapshot_directory), Path(scratch_root)
        require(directory.is_absolute() and root.is_absolute() and directory.parent.resolve() == root.resolve()
                and directory.name.startswith("dots-instruction-rehearsal-") and not directory.is_symlink())
        for name in ("snapshot.sqlite", "rehearsal.json", "controller.lock"):
            file = directory / name
            require(file.is_file() and not file.is_symlink() and file.stat().st_mode & 0o077 == 0)
        try:
            manifest = json.loads((directory / "rehearsal.json").read_text())
        except (OSError, ValueError) as error:
            raise Rejected("Invalid rehearsal manifest", 400) from error
        require(isinstance(manifest, dict))
        require(set(manifest) == {"version", "sessionId", "owner", "sourceAccount", "databaseDevice",
                                  "databaseInode", "sourceHash", "lockDevice", "lockInode"}
                and isinstance(manifest["sessionId"], str) and isinstance(manifest["sourceHash"], str)
                and len(manifest["sourceHash"]) == 64)
        require(manifest.get("version") == 2 and manifest.get("owner") == owner)
        stat = (directory / "snapshot.sqlite").stat()
        require(stat.st_dev == manifest.get("databaseDevice") and stat.st_ino == manifest.get("databaseInode"))
        lock_stat = (directory / "controller.lock").stat()
        require(lock_stat.st_dev == manifest.get("lockDevice") and lock_stat.st_ino == manifest.get("lockInode"))
        instance = cls.__new__(cls)
        instance.owner, instance.source_account = owner, manifest.get("sourceAccount")
        instance._snapshot = directory / "snapshot.sqlite"
        instance._temporary, instance._retained_directory = None, directory
        instance._controller_lock, instance._dispatch_lease = None, None
        instance._operation_lock = threading.Lock()
        instance.snapshot_file_hash = manifest["sourceHash"]
        try:
            with lifecycle_guard(directory):
                instance._lock(directory)
                locked_stat = os.fstat(instance._controller_lock)
                require(locked_stat.st_dev == manifest["lockDevice"] and locked_stat.st_ino == manifest["lockInode"])
                # Writable open only after filesystem/session binding: SQLite
                # may need to roll back a hot journal from the killed writer.
                with instance._control(principal) as connection:
                    connection.execute("BEGIN IMMEDIATE")
                    validate_legacy_storage(connection, owner)
                    session = connection.execute("SELECT * FROM rehearsal_session").fetchall()
                    require(len(session) == 1 and session[0]["id"] == manifest["sessionId"]
                            and session[0]["owner"] == owner and session[0]["version"] == 2)
                    instance._state(connection)
                    # Revoke stale child-writer leases before reconciliation.
                    connection.execute("UPDATE rehearsal_handoff SET epoch=epoch+1 WHERE id=1")
            return instance
        except BaseException:
            instance._unlock()
            instance._snapshot, instance._retained_directory = None, None
            raise

    @contextmanager
    def _exclusive_operation(self):
        if not self._operation_lock.acquire(blocking=False):
            raise Rejected("A rehearsal operation is still active", 409)
        try:
            if self._snapshot is None:
                yield
            else:
                with lifecycle_guard(self._snapshot.parent):
                    yield
        finally:
            self._operation_lock.release()

    def park(self, principal):
        with self._exclusive_operation():
            return self._park(principal)

    def _park(self, principal):
        path = self._authorized_snapshot(principal)
        with self._control(principal) as connection:
            self._no_live_supervised(connection)
        if self._dispatch_lease is not None:
            raise Rejected("Cannot park an active dispatch", 409)
        if self._temporary is not None:
            target = path.parent.parent / ("dots-instruction-rehearsal-restart-" + str(uuid.uuid4()))
            path.parent.rename(target)
            self._temporary.cleanup()
            self._temporary = None
        else:
            target = path.parent
        self._snapshot, self._retained_directory = None, None
        self._unlock()
        return str(target)

    def close(self):
        with self._exclusive_operation():
            self._close()

    def _close(self):
        if self._snapshot is not None:
            with self._control(self.owner) as connection:
                self._no_live_supervised(connection)
        retained, self._retained_directory = self._retained_directory, None
        try:
            super().close()
            if retained is not None:
                shutil.rmtree(retained)
        finally:
            self._unlock()

    @contextmanager
    def _control(self, principal):
        path = self._authorized_snapshot(principal)
        connection = sqlite3.connect(path.as_uri() + "?mode=rw", uri=True, timeout=5)
        connection.row_factory = sqlite3.Row
        try:
            with connection:
                yield connection
        finally:
            connection.close()

    def _state(self, connection):
        row = connection.execute("SELECT * FROM rehearsal_handoff WHERE id=1").fetchone()
        if not row or row["owner"] != self.owner:
            raise Rejected("Rehearsal owner mismatch", 403)
        return dict(row)

    def _no_live_supervised(self, connection):
        require_settled_supervision(connection, self.owner)

    def _lease(self, state, writer, epoch):
        if writer not in ("node", "python") or type(epoch) is not int or state["writer"] != writer or state["epoch"] != epoch:
            raise Rejected("Stale rehearsal writer lease", 409)

    def status(self, principal):
        with self._control(principal) as connection:
            state = self._state(connection)
            return dict(writer=state["writer"], epoch=state["epoch"], unresolved=state["pending"] is not None,
                        supervision=supervision_status(connection, self.owner),
                        checkpoint=json.loads(state["checkpoint"]) if state["checkpoint"] else None)

    def save(self, principal, body):
        raise Rejected("Use the guarded dispatch interface", 409)

    def _begin_write(self, connection):
        connection.execute("BEGIN IMMEDIATE")
        if self._dispatch_lease is None:
            raise Rejected("Rehearsal dispatch lease required", 409)
        writer, epoch, digest = self._dispatch_lease
        state = self._state(connection)
        self._lease(state, writer, epoch)
        pending = json.loads(state["pending"]) if state["pending"] else None
        if not pending or pending["hash"] != digest:
            raise Rejected("Unresolved operation does not match dispatch", 409)

    def dispatch(self, principal, writer, epoch, body, *, discard_response=False):
        with self._exclusive_operation():
            return self._dispatch(principal, writer, epoch, body, discard_response=discard_response)

    def _dispatch(self, principal, writer, epoch, body, *, discard_response=False):
        pending = self._prepare_dispatch(principal, writer, epoch, body)
        digest = pending["hash"]
        return self._execute_dispatch(principal, writer, epoch, body, pending, digest, discard_response)

    def prepare_external(self, principal, writer, epoch, body):
        """Prepare one Node operation for a separately retained owned supervisor."""
        with self._exclusive_operation():
            require(writer == "node")
            self._authorized_snapshot(principal)
            # Move before any child starts, retaining manual cleanup ownership.
            # A forgotten controller must not GC-delete a surviving worker's DB.
            if self._temporary is not None:
                target = self._snapshot.parent.parent / ("dots-instruction-rehearsal-owned-" + str(uuid.uuid4()))
                self._snapshot.parent.rename(target)
                self._temporary.cleanup()
                self._temporary = None
                self._retained_directory = target
                self._snapshot = target / "snapshot.sqlite"
            pending = self._prepare_dispatch(principal, writer, epoch, body)
            return self._node_envelope(principal, epoch, body, pending)

    def _node_envelope(self, principal, epoch, body, pending):
        return dict(database=str(self._authorized_snapshot(principal)),owner=self.owner,
                    epoch=epoch,body=body,sourceAccount=self.source_account,kind=pending["kind"])

    def _prepare_dispatch(self, principal, writer, epoch, body):
        self._authorized_snapshot(principal)
        encoded = canonical_json(body).encode("utf-8")
        limit = 12000 if isinstance(body, dict) and "action" in body else 900000
        if len(encoded) > limit:
            raise Rejected("Request too large", 413)
        digest = hashlib.sha256(encoded).hexdigest()
        pending = operation_identity(body, self.owner, digest)
        with self._control(principal) as connection:
            connection.execute("BEGIN IMMEDIATE")
            state = self._state(connection)
            self._lease(state, writer, epoch)
            self._no_live_supervised(connection)
            if state["pending"] is not None:
                raise Rejected("Reconcile the unresolved operation first", 409)
            connection.execute("UPDATE rehearsal_handoff SET pending=? WHERE id=1", (json.dumps(pending),))
        return pending

    def _execute_dispatch(self, principal, writer, epoch, body, pending, digest, discard_response):
        # Durable intent is committed before the real writer is called. Exceptions
        # retain pending state; an absent receipt never grants automatic retry.
        if writer == "python":
            self._dispatch_lease = (writer, epoch, digest)
            try:
                writer_class = {"history": HistoryRehearsal, "instruction": InstructionRehearsal, "decision": DecisionRehearsal}[pending["kind"]]
                response = dict(status=200, body=writer_class.save(self, principal, body))
            except Rejected as error:
                response = dict(status=error.status, body=dict(error=str(error)))
            finally:
                self._dispatch_lease = None
        else:
            executable = shutil.which("node")
            if not executable:
                raise Rejected("Node runtime unavailable; reconcile before retrying", 503)
            script = Path(__file__).resolve().parents[2] / "server" / "rehearse-handoff.mjs"
            envelope = self._node_envelope(principal, epoch, body, pending)
            result = subprocess.run([executable, str(script)], input=json.dumps(envelope), text=True,
                                    capture_output=True, timeout=30)
            if result.returncode != 0:
                raise Rejected("Node outcome unavailable; reconcile before retrying", 503)
            response = json.loads(result.stdout)
        if discard_response or response["status"] >= 500:
            return dict(status="unresolved", externalExecution=False)
        with self._control(principal) as connection:
            connection.execute("BEGIN IMMEDIATE")
            state = self._state(connection)
            self._lease(state, writer, epoch)
            if state["pending"] != json.dumps(pending):
                raise Rejected("Dispatch state changed; reconcile before retrying", 409)
            connection.execute("UPDATE rehearsal_handoff SET pending=NULL WHERE id=1")
        return response

    def reconcile(self, principal):
        with self._exclusive_operation():
            return self._reconcile(principal)

    def _reconcile(self, principal):
        with self._control(principal) as connection:
            connection.execute("BEGIN IMMEDIATE")
            state = self._state(connection)
            if state["pending"] is None:
                return dict(resolved=True, reason="No unresolved operation")
            pending = json.loads(state["pending"])
            receipt = matching_receipt(connection, pending)
            if not receipt:
                return dict(resolved=False, reason="Matching durable receipt unavailable; do not retry")
            connection.execute("UPDATE rehearsal_handoff SET pending=NULL WHERE id=1")
            return dict(resolved=True, **receipt, externalExecution=False)

    def transfer(self, principal, writer, epoch, target):
        with self._exclusive_operation():
            return self._transfer(principal, writer, epoch, target)

    def _transfer(self, principal, writer, epoch, target):
        require(target in ("node", "python") and target != writer)
        with self._control(principal) as connection:
            connection.execute("BEGIN IMMEDIATE")
            state = self._state(connection)
            self._lease(state, writer, epoch)
            self._no_live_supervised(connection)
            if state["pending"] is not None:
                raise Rejected("Reconcile the unresolved operation before handoff", 409)
            # Checkpoint is an attestation of current data, never a restorable copy.
            tables = {table: [dict(row) for row in connection.execute(f"SELECT * FROM {table} ORDER BY id")]
                      for table in ("work_records", "instructions", "approval_decisions", "activity_events")}
            checkpoint = dict(epoch=epoch, writer=writer, counts={key:len(value) for key,value in tables.items()},
                              dataHash=hashlib.sha256(json.dumps(tables,sort_keys=True).encode()).hexdigest())
            connection.execute("UPDATE rehearsal_handoff SET writer=?,epoch=epoch+1,checkpoint=? WHERE id=1",
                               (target, json.dumps(checkpoint)))
            return dict(writer=target, epoch=epoch+1, checkpoint=checkpoint, restoredOldSnapshot=False)
