"""Read-only projections for the existing isolated-owner Node SQLite schema.

The host authenticates before invoking this worker and supplies a fixed database
path. No schema creation, migration, external adapter or write is performed.
"""
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from .contracts import Rejected


TABLES = {
    "work_records": ("id", "kind", "data", "version", "updated_at"),
    "instructions": ("id", "owner_id", "task_id", "body", "status", "created_at", "request_id"),
    "activity_events": ("id", "task_id", "type", "summary", "actor", "source_url", "occurred_at", "recorded_at"),
    "approval_decisions": ("id", "approval_id", "owner_id", "decision", "payload_version", "created_at", "request_id"),
}
HISTORY_KINDS = ("opportunity", "correspondence", "coverage", "project", "artifact",
                 "schedule", "commitment", "observation", "engineering", "history_import")


def rows(connection, sql, parameters=()):
    return [dict(row) for row in connection.execute(sql, parameters)]


def records(connection, sql, parameters=()):
    result = rows(connection, sql, parameters)
    for row in result:
        row["data"] = json.loads(row["data"])
    return result


def validate_legacy_storage(connection, owner):
    """Validate the known schema and isolated-owner invariant within a snapshot."""
    if connection.execute("PRAGMA journal_mode").fetchone()[0] != "delete":
        raise Rejected("Unsupported legacy storage mode", 503)
    for table, expected in TABLES.items():
        table_type = connection.execute("SELECT type FROM sqlite_master WHERE name=?", (table,)).fetchone()
        actual = tuple(row["name"] for row in connection.execute(f"PRAGMA table_info({table})"))
        if not table_type or table_type[0] != "table" or actual != expected:
            raise Rejected("Unsupported legacy schema", 503)
    # Legacy records/events lack owner columns; physical isolation is required.
    for table in ("instructions", "approval_decisions"):
        if connection.execute(f"SELECT 1 FROM {table} WHERE owner_id<>? LIMIT 1", (owner,)).fetchone():
            raise Rejected("Owner storage mismatch", 403)


def read_legacy(filename, owner, principal, method, body):
    if not owner or principal != owner:
        raise Rejected("Owner authentication required", 401)
    if method != "GET":
        raise Rejected("Python compatibility supports reads only", 405)
    if not isinstance(body, dict) or set(body) != {"path"} or body["path"] not in (
            "/api/work", "/api/history", "/api/health"):
        raise Rejected("Unsupported compatibility route", 404)
    if filename == ":memory:" or not Path(filename).is_absolute():
        raise Rejected("Python reader requires isolated file storage", 503)
    # mode=ro deliberately fails if the selected database is absent. Never use
    # immutable=1: the Node writer can still commit between separate requests.
    connection = sqlite3.connect(Path(filename).as_uri() + "?mode=ro", uri=True, timeout=5)
    connection.row_factory = sqlite3.Row
    try:
        connection.execute("PRAGMA query_only=ON")
        connection.execute("PRAGMA trusted_schema=OFF")
        connection.execute("BEGIN")
        validate_legacy_storage(connection, owner)
        route = body["path"]
        if route == "/api/health":
            return {"storage": "available", "bridge": "not_connected", "externalExecution": False}
        if route == "/api/history":
            placeholders = ",".join("?" for _ in HISTORY_KINDS)
            data = records(connection, f"SELECT id,kind,version,data FROM work_records WHERE kind IN ({placeholders}) ORDER BY kind,id", HISTORY_KINDS)
            counts = {}
            for row in data:
                counts[row["kind"]] = counts.get(row["kind"], 0) + 1
            preserved = dict(connection.execute("SELECT (SELECT COUNT(*) FROM instructions) AS instructions,(SELECT COUNT(*) FROM work_records WHERE kind='task') AS tasks").fetchone())
            return {"counts": counts, "preserved": preserved, "records": data}
        return {
            "records": records(connection, "SELECT * FROM work_records ORDER BY id"),
            "instructions": rows(connection, "SELECT * FROM instructions WHERE owner_id=? ORDER BY created_at ASC LIMIT 300", (owner,)),
            "events": rows(connection, "SELECT * FROM activity_events ORDER BY COALESCE(occurred_at,recorded_at) DESC LIMIT 200"),
            "decisions": rows(connection, "SELECT * FROM approval_decisions WHERE owner_id=? ORDER BY created_at DESC", (owner,)),
            "serverTime": datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z"),
            "initialized": True,
            "bridge": {"connected": False, "reason": "No authenticated assistant delivery adapter configured."},
        }
    finally:
        # End the read transaction; closing cannot commit a write in mode=ro.
        connection.close()
