"""Owner-reported coverage metadata only; never opens sources or runs processing."""
import json
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from .contracts import Rejected, IDENTIFIER, REFERENCE, HASH, digest, sanitize, text, validate


FORMAT = "dots-source-coverage"
DISPOSITIONS = ("denied", "unreadable", "unsupported", "unknown", "read_empty", "read_nonempty")
DDL = (
    "CREATE TABLE coverage_schema (id INTEGER PRIMARY KEY CHECK(id=1), version INTEGER NOT NULL)",
    "INSERT INTO coverage_schema VALUES (1,1)",
    "CREATE TABLE coverage_inventories (id TEXT PRIMARY KEY, version INTEGER NOT NULL, data TEXT NOT NULL)",
    "CREATE TABLE coverage_sources (id TEXT PRIMARY KEY, inventory_id TEXT NOT NULL REFERENCES coverage_inventories(id), data TEXT NOT NULL)",
    "CREATE TABLE coverage_snapshots (id TEXT PRIMARY KEY, source_id TEXT NOT NULL REFERENCES coverage_sources(id), data TEXT NOT NULL)",
    "CREATE TABLE coverage_observations (id TEXT PRIMARY KEY, inventory_id TEXT NOT NULL REFERENCES coverage_inventories(id), source_id TEXT NOT NULL REFERENCES coverage_sources(id), snapshot_id TEXT REFERENCES coverage_snapshots(id), data TEXT NOT NULL)",
    "CREATE TABLE coverage_operations (id TEXT PRIMARY KEY, hash TEXT NOT NULL, response TEXT NOT NULL)",
    "CREATE TABLE coverage_audit (sequence INTEGER PRIMARY KEY, inventory_id TEXT NOT NULL REFERENCES coverage_inventories(id), action TEXT NOT NULL, data TEXT NOT NULL, recorded_at TEXT NOT NULL)",
)


def fields(value, names):
    if not isinstance(value, dict) or set(value) != set(names):
        raise Rejected("Invalid coverage fields")


def scalar(value, schema):
    validate(value, schema)
    if isinstance(value, str) and (len(value) > schema.get("maxLength", 2000) or sanitize(value) != value):
        raise Rejected("Invalid coverage value")
    return value


def interval(value):
    if value is None:
        return None
    fields(value, ("start", "end"))
    for key in ("start", "end"):
        scalar(value[key], text(40, format="date-time"))
    if datetime.fromisoformat(value["start"].replace("Z", "+00:00")) >= datetime.fromisoformat(value["end"].replace("Z", "+00:00")):
        raise Rejected("Coverage interval must have increasing endpoints")
    return dict(value)


def normalize(body):
    if not isinstance(body, dict):
        raise Rejected()
    action = body.get("action")
    common = ("format", "schemaVersion", "requestId", "action")
    specific = {
        "create_inventory": ("projectId", "selectionRef", "requestedInterval"),
        "add_source": ("inventoryId", "version", "sourceRef", "toolLabel", "sessionRef", "declaredInterval", "declaredAt"),
        "observe_access": ("inventoryId", "version", "sourceId", "disposition", "observedAt", "evidenceRef", "snapshot"),
    }
    if not isinstance(action, str) or action not in specific:
        raise Rejected("Unsupported coverage action")
    fields(body, common + specific[action])
    if body["format"] != FORMAT or type(body["schemaVersion"]) is not int or body["schemaVersion"] != 1:
        raise Rejected("Unsupported coverage version")
    scalar(body["requestId"], IDENTIFIER)
    result = dict(body)
    if action == "create_inventory":
        scalar(body["projectId"], IDENTIFIER)
        scalar(body["selectionRef"], REFERENCE)
        result["requestedInterval"] = interval(body["requestedInterval"])
    else:
        scalar(body["inventoryId"], IDENTIFIER)
        if type(body["version"]) is not int or body["version"] < 1:
            raise Rejected()
    if action == "add_source":
        scalar(body["sourceRef"], REFERENCE)
        if body["sessionRef"] is not None:
            scalar(body["sessionRef"], REFERENCE)
        if body["toolLabel"] is not None:
            scalar(body["toolLabel"], text(80))
        scalar(body["declaredAt"], text(40, format="date-time"))
        result["declaredInterval"] = interval(body["declaredInterval"])
    if action == "observe_access":
        scalar(body["sourceId"], IDENTIFIER)
        scalar(body["evidenceRef"], REFERENCE)
        scalar(body["observedAt"], text(40, format="date-time"))
        if body["disposition"] not in DISPOSITIONS:
            raise Rejected()
        snapshot = body["snapshot"]
        if body["disposition"] in ("read_empty", "read_nonempty"):
            fields(snapshot, ("contentHash", "selectionRef", "itemCount", "selectedInterval"))
            scalar(snapshot["contentHash"], HASH)
            scalar(snapshot["selectionRef"], REFERENCE)
            count = snapshot["itemCount"]
            if type(count) is not int or not 0 <= count <= 1000000:
                raise Rejected("Invalid supplied selection count")
            if (count == 0) != (body["disposition"] == "read_empty"):
                raise Rejected("Read disposition and supplied count disagree")
            result["snapshot"] = {**snapshot, "selectedInterval": interval(snapshot["selectedInterval"])}
        elif snapshot is not None:
            raise Rejected("This access outcome cannot assert a snapshot")
    return result


def tables(db):
    return {row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")}


def check_owner(db, owner):
    names = tables(db)
    if "owner_binding" not in names:
        if names:
            raise Rejected("Owner storage binding unavailable", 403)
        return False
    row = db.execute("SELECT owner FROM owner_binding WHERE id=1").fetchone()
    if row is None or row[0] != owner:
        raise Rejected("Owner storage mismatch", 403)
    return True


def initialized(db):
    names = tables(db)
    if "coverage_schema" not in names:
        if any(name.startswith("coverage_") for name in names):
            raise Rejected("Coverage schema is incomplete", 503)
        return False
    row = db.execute("SELECT version FROM coverage_schema WHERE id=1").fetchone()
    if row is None or row[0] != 1:
        raise Rejected("Unsupported coverage storage version", 503)
    return True


def state(db, selected, allow_write, anchor=None, offset=0):
    result = {"format": FORMAT, "schemaVersion": 1,
              "capabilities": {"write": allow_write, "processing": False, "sourceRead": False, "externalExecution": False},
              "initialized": False, "totalInventories": 0, "inventoryIndex": [], "indexTruncated": False,
              "inventory": None, "sources": [], "observations": [], "snapshots": [],
              "page": {"anchor": None, "offset": 0, "limit": 50, "total": 0, "start": 0, "end": 0,
                       "hasOlder": False, "hasNewer": False}}
    if db is None or not initialized(db):
        if anchor:
            raise Rejected("Inventory page anchor unavailable", 400)
        if selected:
            raise Rejected("Inventory not found", 404)
        return result
    total = db.execute("SELECT COUNT(*) FROM coverage_inventories").fetchone()[0]
    if anchor:
        boundary = db.execute("SELECT rowid,id FROM coverage_inventories WHERE id=?", (anchor,)).fetchone()
        if boundary is None:
            raise Rejected("Inventory page anchor unavailable", 400)
    else:
        boundary = db.execute("SELECT rowid,id FROM coverage_inventories ORDER BY rowid DESC LIMIT 1").fetchone()
    ceiling = boundary[0] if boundary else 0
    page_total = db.execute("SELECT COUNT(*) FROM coverage_inventories WHERE rowid<=?", (ceiling,)).fetchone()[0]
    if offset and offset >= page_total:
        raise Rejected("Inventory page is outside this selection", 400)
    index = [json.loads(row[0]) for row in db.execute(
        "SELECT data FROM coverage_inventories WHERE rowid<=? ORDER BY rowid DESC LIMIT 50 OFFSET ?", (ceiling, offset))]
    result.update(initialized=True, totalInventories=total, inventoryIndex=index, indexTruncated=total > len(index),
                  page={"anchor": boundary[1] if boundary else None, "offset": offset, "limit": 50,
                        "total": page_total, "start": offset + 1 if index else 0, "end": offset + len(index),
                        "hasOlder": offset + len(index) < page_total, "hasNewer": offset > 0})
    selected = selected or (index[0]["id"] if index else None)
    if selected:
        row = db.execute("SELECT data FROM coverage_inventories WHERE id=?", (selected,)).fetchone()
        if row is None:
            raise Rejected("Inventory not found", 404)
        result["inventory"] = json.loads(row[0])
        result["sources"] = [json.loads(r[0]) for r in db.execute("SELECT data FROM coverage_sources WHERE inventory_id=? ORDER BY rowid LIMIT 101", (selected,))]
        result["observations"] = [json.loads(r[0]) for r in db.execute("SELECT data FROM coverage_observations WHERE inventory_id=? ORDER BY rowid LIMIT 201", (selected,))]
        result["snapshots"] = [json.loads(r[0]) for r in db.execute("SELECT p.data FROM coverage_snapshots p JOIN coverage_sources s ON s.id=p.source_id WHERE s.inventory_id=? ORDER BY p.rowid LIMIT 201", (selected,))]
        if len(result["sources"]) > 100 or len(result["observations"]) > 200 or len(result["snapshots"]) > 200:
            raise Rejected("Inventory exceeds supported read bounds", 503)
    return result


def mutate(db, body, owner):
    previous = db.execute("SELECT hash,response FROM coverage_operations WHERE id=?", (body["requestId"],)).fetchone()
    if previous:
        if previous[0] != digest(body):
            raise Rejected("Coverage request ID conflicts with prior content", 409)
        return {**json.loads(previous[1]), "duplicate": True}
    now = datetime.now(timezone.utc).isoformat()
    action = body["action"]
    record = None
    if action == "create_inventory":
        if db.execute("SELECT COUNT(*) FROM coverage_inventories").fetchone()[0] >= 100:
            raise Rejected("Inventory retention limit reached", 409)
        inventory = {k: body[k] for k in ("projectId", "selectionRef", "requestedInterval")}
        inventory.update(id="inventory-" + uuid.uuid4().hex, ownerId=owner, version=1, createdAt=now)
        db.execute("INSERT INTO coverage_inventories VALUES (?,?,?)", (inventory["id"], 1, json.dumps(inventory)))
        record = inventory
    else:
        row = db.execute("SELECT data FROM coverage_inventories WHERE id=?", (body["inventoryId"],)).fetchone()
        if row is None:
            raise Rejected("Inventory not found", 404)
        inventory = json.loads(row[0])
        if inventory["version"] != body["version"]:
            raise Rejected("Inventory changed; refresh before recording", 409)
        if action == "add_source":
            if db.execute("SELECT COUNT(*) FROM coverage_sources WHERE inventory_id=?", (inventory["id"],)).fetchone()[0] >= 100:
                raise Rejected("Source retention limit reached", 409)
            record = {k: body[k] for k in ("sourceRef", "toolLabel", "sessionRef", "declaredInterval", "declaredAt")}
            record.update(id="source-" + uuid.uuid4().hex, scopeId=inventory["id"], recordedAt=now, basis="owner_reported")
            db.execute("INSERT INTO coverage_sources VALUES (?,?,?)", (record["id"], inventory["id"], json.dumps(record)))
        else:
            if db.execute("SELECT id FROM coverage_sources WHERE id=? AND inventory_id=?", (body["sourceId"], inventory["id"])).fetchone() is None:
                raise Rejected("Source not found in this inventory", 404)
            if db.execute("SELECT COUNT(*) FROM coverage_observations WHERE inventory_id=?", (inventory["id"],)).fetchone()[0] >= 200:
                raise Rejected("Observation retention limit reached", 409)
            snapshot_id = None
            if body["snapshot"] is not None:
                snapshot_id = "snapshot-" + uuid.uuid4().hex
                snapshot = {**body["snapshot"], "id": snapshot_id, "sourceId": body["sourceId"],
                            "materialKind": "supplied_export", "itemUnit": "visible_event_record",
                            "recordedAt": now, "basis": "owner_reported", "evidenceRef": body["evidenceRef"]}
                db.execute("INSERT INTO coverage_snapshots VALUES (?,?,?)", (snapshot_id, body["sourceId"], json.dumps(snapshot)))
            record = {k: body[k] for k in ("sourceId", "disposition", "observedAt", "evidenceRef")}
            record.update(id="access-" + uuid.uuid4().hex, snapshotId=snapshot_id, recordedAt=now, basis="owner_reported")
            db.execute("INSERT INTO coverage_observations VALUES (?,?,?,?,?)", (record["id"], inventory["id"], body["sourceId"], snapshot_id, json.dumps(record)))
        inventory["version"] += 1
        db.execute("UPDATE coverage_inventories SET version=?,data=? WHERE id=?", (inventory["version"], json.dumps(inventory), inventory["id"]))
    db.execute("INSERT INTO coverage_audit(inventory_id,action,data,recorded_at) VALUES (?,?,?,?)", (inventory["id"], action, json.dumps(record), now))
    response = {"ok": True, "inventoryId": inventory["id"], "version": inventory["version"],
                "executed": False, "sourceRead": False, "externalExecution": False}
    db.execute("INSERT INTO coverage_operations VALUES (?,?,?)", (body["requestId"], digest(body), json.dumps(response)))
    return response


def handle_inventory(filename, owner, principal, method, body=None, allow_write=False):
    if not owner or principal != owner:
        raise Rejected("Owner authentication required", 401)
    if method not in ("COVERAGE_GET", "COVERAGE_POST"):
        raise Rejected("Method not allowed", 405)
    write = method == "COVERAGE_POST"
    if write and not allow_write:
        raise Rejected("Source inventory writes are disabled", 403)
    selected, anchor, offset = None, None, 0
    if write:
        body = normalize(body)
    elif body is not None:
        if not isinstance(body, dict) or not set(body) <= {"inventoryId", "anchor", "offset"}:
            raise Rejected("Invalid inventory page fields")
        if "inventoryId" in body:
            selected = scalar(body["inventoryId"], IDENTIFIER)
        if "anchor" in body:
            anchor = scalar(body["anchor"], IDENTIFIER)
        offset = body.get("offset", 0)
        if type(offset) is not int or offset not in (0, 50) or (offset and not anchor):
            raise Rejected("Invalid inventory page offset")
    path = Path(filename)
    if path.is_symlink():
        raise Rejected("Storage path rejected", 503)
    if not write and not path.exists():
        return state(None, selected, allow_write, anchor, offset)
    if write:
        path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        fd = os.open(path, os.O_CREAT | os.O_WRONLY | getattr(os, "O_NOFOLLOW", 0), 0o600)
        os.close(fd)
    db = sqlite3.connect(str(path) if write else path.resolve().as_uri() + "?mode=ro", uri=not write, timeout=5, isolation_level=None)
    try:
        db.execute("PRAGMA foreign_keys=ON")
        db.execute("BEGIN IMMEDIATE" if write else "BEGIN")
        bound = check_owner(db, owner)
        if not write:
            return state(db, selected, allow_write, anchor, offset)
        if not bound:
            db.execute("CREATE TABLE owner_binding (id INTEGER PRIMARY KEY CHECK(id=1), owner TEXT NOT NULL)")
            db.execute("INSERT INTO owner_binding VALUES (1,?)", (owner,))
        if not initialized(db):
            for statement in DDL:
                db.execute(statement)
        result = mutate(db, body, owner)
        db.commit()
        return result
    finally:
        if db.in_transaction:
            db.rollback()
        db.close()
