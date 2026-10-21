"""Instruction write parity on a new, disposable SQLite snapshot only.

Not registered with worker.py or the application API. The original database is
opened read-only; no method accepts an existing write destination.
"""
import hashlib
import json
import os
import re
import sqlite3
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path
from .contracts import Rejected
from .legacy_read import read_legacy, validate_legacy_storage


JS_WHITESPACE = "\t\n\v\f\r \u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff"


def utf16_length(value):
    return len(value.encode("utf-16-le", errors="surrogatepass")) // 2


def validate_operation_size(body):
    # Compact UTF-8 framing matches the supported browser JSON request shape.
    encoded = json.dumps(body, ensure_ascii=False, separators=(",", ":")).encode("utf-8", errors="surrogatepass")
    if len(encoded) > 12000:
        raise Rejected("Request too large", 413)


def instruction_input(body):
    if not isinstance(body, dict) or body.get("action") != "instruction":
        raise Rejected("Only instruction saves are supported in this rehearsal", 400)
    request_id, value, task = body.get("requestId"), body.get("body"), body.get("taskId")
    if not isinstance(request_id, str) or not re.fullmatch(r"[a-zA-Z0-9_-]{16,100}", request_id):
        raise Rejected("Invalid instruction input", 400)
    if not isinstance(value, str) or not value.strip(JS_WHITESPACE) or utf16_length(value) > 8000:
        raise Rejected("Invalid instruction input", 400)
    if task is not None and (not isinstance(task, str) or utf16_length(task) > 100):
        raise Rejected("Invalid instruction input", 400)
    return request_id, value.strip(JS_WHITESPACE), task or None


class InstructionRehearsal:
    def __init__(self, source_database, scratch_root, owner, principal):
        if not owner or principal != owner:
            raise Rejected("Owner authentication required", 401)
        source, scratch = Path(source_database), Path(scratch_root)
        if not source.is_absolute() or not scratch.is_absolute() or not scratch.is_dir():
            raise Rejected("Explicit source and scratch paths required", 400)
        self.owner = owner
        self._temporary = None
        self._snapshot = None
        source_connection = sqlite3.connect(source.as_uri() + "?mode=ro", uri=True, timeout=5)
        source_connection.row_factory = sqlite3.Row
        try:
            source_connection.execute("PRAGMA query_only=ON")
            source_connection.execute("PRAGMA trusted_schema=OFF")
            source_connection.execute("BEGIN")
            validate_legacy_storage(source_connection, owner)
            self._temporary = tempfile.TemporaryDirectory(prefix="dots-instruction-rehearsal-", dir=scratch)
            self._snapshot = Path(self._temporary.name) / "snapshot.sqlite"
            descriptor = os.open(self._snapshot, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
            os.close(descriptor)
            target = sqlite3.connect(self._snapshot)
            try:
                source_connection.backup(target)
            finally:
                target.close()
            self.snapshot_file_hash = hashlib.sha256(self._snapshot.read_bytes()).hexdigest()
        except BaseException:
            self.close()
            raise
        finally:
            source_connection.close()

    def _authorized_snapshot(self, principal):
        if principal != self.owner:
            raise Rejected("Owner authentication required", 401)
        if self._snapshot is None:
            raise Rejected("Rehearsal is closed", 409)
        return self._snapshot

    def read(self, principal):
        return read_legacy(str(self._authorized_snapshot(principal)), self.owner, principal,
                           "GET", {"path": "/api/work"})

    def _begin_write(self, connection):
        connection.execute("BEGIN IMMEDIATE")

    def save(self, principal, body):
        snapshot = self._authorized_snapshot(principal)
        # The CLI frames each operation as compact UTF-8 JSON, as the browser's
        # JSON.stringify request does. Match the existing /api/work byte limit
        # before applying its UTF-16 field-length validation.
        validate_operation_size(body)
        request_id, value, task_id = instruction_input(body)
        connection = sqlite3.connect(snapshot.as_uri() + "?mode=rw", uri=True, timeout=5)
        connection.row_factory = sqlite3.Row
        try:
            connection.execute("PRAGMA trusted_schema=OFF")
            self._begin_write(connection)
            validate_legacy_storage(connection, self.owner)
            if task_id and not connection.execute("SELECT id FROM work_records WHERE id=? AND kind='task'", (task_id,)).fetchone():
                raise Rejected("Task not found", 404)
            previous = connection.execute("SELECT * FROM instructions WHERE request_id=?", (request_id,)).fetchone()
            if previous:
                if previous["owner_id"] != self.owner or previous["body"] != value or previous["task_id"] != task_id:
                    raise Rejected("Request ID already used for different content", 409)
                connection.commit()
                return {"ok": True, "instruction": dict(previous), "duplicate": True}
            identifier = str(uuid.uuid4())
            now = datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
            connection.execute("INSERT INTO instructions(id,owner_id,task_id,body,status,created_at,request_id) VALUES (?,?,?,?,?,?,?)",
                               (identifier, self.owner, task_id, value, "saved_not_delivered", now, request_id))
            connection.execute("INSERT INTO activity_events(id,task_id,type,summary,actor,occurred_at,recorded_at) VALUES (?,?,'instruction_saved','Instruction saved; not delivered','Owner',?,?)",
                               ("instruction-" + identifier, task_id, now, now))
            saved = dict(connection.execute("SELECT * FROM instructions WHERE id=?", (identifier,)).fetchone())
            connection.commit()
            return {"ok": True, "instruction": saved}
        except BaseException:
            connection.rollback()
            raise
        finally:
            connection.close()

    def close(self):
        self._snapshot = None
        if self._temporary is not None:
            self._temporary.cleanup()
            self._temporary = None

    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.close()
