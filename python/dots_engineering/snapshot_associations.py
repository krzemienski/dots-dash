"""Owner assertions over stored metadata; no source reads or processing."""
import json
import sqlite3
import stat
import uuid
from datetime import datetime, timezone
from pathlib import Path
from .contracts import Rejected, IDENTIFIER, REFERENCE, HASH, digest, text
from .source_inventory import fields, scalar, tables, check_owner, initialized as coverage_initialized


FORMAT = "dots-snapshot-review-association"
PIN_IDS = ("projectId", "inventoryId", "sourceId", "snapshotId", "reviewId")
PIN_VERSIONS = ("inventoryVersion", "reviewVersion")
PIN_HASHES = ("snapshotMetadataDigest", "reviewExportDigest")
PIN_KEYS = PIN_IDS + PIN_VERSIONS + PIN_HASHES + ("analysisVersion", "hashAlgorithm")
DDL = (
    "CREATE TABLE snapshot_review_schema (id INTEGER PRIMARY KEY CHECK(id=1), version INTEGER NOT NULL)",
    "INSERT INTO snapshot_review_schema VALUES (1,1)",
    "CREATE TABLE snapshot_review_associations (id TEXT PRIMARY KEY, data TEXT NOT NULL)",
    "CREATE TABLE snapshot_review_events (association_id TEXT NOT NULL REFERENCES snapshot_review_associations(id), version INTEGER NOT NULL, data TEXT NOT NULL, PRIMARY KEY(association_id,version))",
    "CREATE TABLE snapshot_review_operations (id TEXT PRIMARY KEY, hash TEXT NOT NULL, response TEXT NOT NULL)",
    "CREATE TABLE snapshot_review_audit (sequence INTEGER PRIMARY KEY, data TEXT NOT NULL)",
)


def positive(value):
    if type(value) is not int or value < 1:
        raise Rejected("Invalid expected version")


def normalize(body):
    if not isinstance(body, dict):
        raise Rejected()
    action = body.get("action")
    extra = {"create": ("pins",), "replace": ("associationId", "version", "reasonRef", "pins"),
             "revoke": ("associationId", "version", "reasonRef")}
    if not isinstance(action, str) or action not in extra:
        raise Rejected("Unsupported association action")
    fields(body, ("format", "schemaVersion", "requestId", "action") + extra[action])
    if body["format"] != FORMAT or type(body["schemaVersion"]) is not int or body["schemaVersion"] != 1:
        raise Rejected("Unsupported association version")
    scalar(body["requestId"], IDENTIFIER)
    if action != "create":
        scalar(body["associationId"], IDENTIFIER)
        scalar(body["reasonRef"], REFERENCE)
        positive(body["version"])
    if action != "revoke":
        pins = body["pins"]
        fields(pins, PIN_KEYS)
        for key in PIN_IDS:
            scalar(pins[key], IDENTIFIER)
        for key in PIN_VERSIONS:
            positive(pins[key])
        for key in PIN_HASHES:
            scalar(pins[key], HASH)
        scalar(pins["analysisVersion"], text(100))
        if pins["hashAlgorithm"] != "stored-json-digest-v1":
            raise Rejected("Unsupported metadata digest")
    return body


def initialized(db):
    names = tables(db)
    if "snapshot_review_schema" not in names:
        if any(name.startswith("snapshot_review_") for name in names):
            raise Rejected("Association schema incomplete", 503)
        return False
    row = db.execute("SELECT version FROM snapshot_review_schema WHERE id=1").fetchone()
    if row is None or row[0] != 1:
        raise Rejected("Unsupported association storage version", 503)
    return True


def snapshot_target(db, identity, owner):
    required = {"coverage_snapshots", "coverage_sources", "coverage_inventories"}
    if not coverage_initialized(db) or not required <= tables(db):
        raise Rejected("Snapshot target schema unavailable", 503)
    row = db.execute("SELECT data,source_id FROM coverage_snapshots WHERE id=?", (identity,)).fetchone()
    if row is None:
        return None
    snapshot = json.loads(row[0])
    source_row = db.execute("SELECT data,inventory_id FROM coverage_sources WHERE id=?", (row[1],)).fetchone()
    if source_row is None:
        raise Rejected("Snapshot parent unavailable", 503)
    source = json.loads(source_row[0])
    inventory_row = db.execute("SELECT data FROM coverage_inventories WHERE id=?", (source_row[1],)).fetchone()
    if inventory_row is None:
        raise Rejected("Inventory parent unavailable", 503)
    inventory = json.loads(inventory_row[0])
    if inventory["ownerId"] != owner:
        raise Rejected("Target not authorized", 403)
    if snapshot["id"] != identity or snapshot["sourceId"] != source["id"] or source["id"] != row[1] or source["scopeId"] != inventory["id"] or inventory["id"] != source_row[1]:
        raise Rejected("Snapshot parent binding differs", 503)
    return snapshot, source, inventory


def review_target(db, identity, owner):
    if "reviews" not in tables(db):
        raise Rejected("Review target schema unavailable", 503)
    row = db.execute("SELECT data FROM reviews WHERE id=?", (identity,)).fetchone()
    if row is None:
        return None
    review = json.loads(row[0])
    if review["export"]["ownerId"] != owner:
        raise Rejected("Target not authorized", 403)
    if review["id"] != identity:
        raise Rejected("Review identity differs", 503)
    return review


def target_pins(target, review):
    if target is None or review is None:
        raise Rejected("Association target missing", 404)
    snapshot, source, inventory = target
    if inventory["projectId"] != review["export"]["projectId"]:
        raise Rejected("Association projects differ", 400)
    return {"projectId": inventory["projectId"], "inventoryId": inventory["id"],
            "inventoryVersion": inventory["version"], "sourceId": source["id"], "snapshotId": snapshot["id"],
            "snapshotMetadataDigest": digest(snapshot), "reviewId": review["id"], "reviewVersion": review["version"],
            "reviewExportDigest": digest(review["export"]), "analysisVersion": review["analysisVersion"],
            "hashAlgorithm": "stored-json-digest-v1"}


def provenance(target, review):
    snapshot = target[0]
    return {"snapshotBasis": snapshot["basis"], "claimedContentHash": snapshot["contentHash"],
            "snapshotSelectionRef": snapshot["selectionRef"], "snapshotEvidenceRef": snapshot["evidenceRef"],
            "snapshotItemCount": snapshot["itemCount"], "reviewSourceRef": review["export"]["sourceRef"],
            "reviewBasis": "owner_provided_export"}


def records(db, owner):
    rows = db.execute("SELECT data FROM snapshot_review_associations ORDER BY rowid DESC LIMIT 101").fetchall()
    if len(rows) > 100:
        raise Rejected("Association retention bounds exceeded", 503)
    result = []
    for row in rows:
        record = json.loads(row[0])
        if record["ownerId"] != owner:
            raise Rejected("Association not authorized", 403)
        events = [json.loads(r[0]) for r in db.execute("SELECT data FROM snapshot_review_events WHERE association_id=? ORDER BY version LIMIT 3", (record["id"],))]
        if not events or len(events) > 2:
            raise Rejected("Association history unavailable", 503)
        result.append({**record, "version": events[-1]["version"], "lifecycle": events[-1]["state"], "events": events})
    return result


def project(db, record, owner):
    pins = record["pins"]
    target = snapshot_target(db, pins["snapshotId"], owner)
    review = review_target(db, pins["reviewId"], owner)
    missing = (["snapshot"] if target is None else []) + (["review"] if review is None else [])
    material, versions = [], []
    if not missing:
        if target[2]["projectId"] != review["export"]["projectId"]:
            material = ["projectId"]
        else:
            current = target_pins(target, review)
            material = [key for key in PIN_KEYS if key not in PIN_VERSIONS and current[key] != pins[key]]
            versions = [key for key in PIN_VERSIONS if current[key] != pins[key]]
    return {**record, "relevance": {"state": "missing_target" if missing else "needs_review" if material else "version_changed" if versions else "metadata_matches",
                                    "missing": missing, "differentPins": material, "differentVersions": versions},
            "canOpenSnapshot": bool(target and target[2]["id"] == pins["inventoryId"] and target[2]["projectId"] == pins["projectId"]),
            "canOpenReview": bool(review and review["export"]["projectId"] == pins["projectId"])}


def read_state(db, owner, query, allow_write):
    result = {"format": FORMAT, "schemaVersion": 1, "capabilities": {"write": allow_write, "sourceRead": False, "processing": False, "externalExecution": False},
              "scope": {"snapshotId": query.get("snapshotId"), "reviewId": query.get("reviewId")},
              "storageAvailable": db is not None, "candidate": None, "candidateIssue": "Select both targets and load their pins.", "totalAssociations": 0, "associations": []}
    if db is None:
        result["candidateIssue"] = "Owner-bound target storage is not initialized; relevance is unknown."
        return result
    if initialized(db):
        saved = records(db, owner)
        result["totalAssociations"] = len(saved)
        result["associations"] = [project(db, row, owner) for row in saved if not query or
                                  any(row["pins"][key] == value for key, value in query.items())]
    if query.get("snapshotId") and query.get("reviewId"):
        target = snapshot_target(db, query["snapshotId"], owner)
        review = review_target(db, query["reviewId"], owner)
        try:
            pins = target_pins(target, review)
        except Rejected as error:
            if error.status not in (400, 404):
                raise
            result["candidateIssue"] = str(error)
        else:
            result.update(candidate={"pins": pins, "provenance": provenance(target, review)}, candidateIssue=None)
    return result


def event(db, identity, version, action, state, now, reason=None, replacement=None):
    data = {"associationId": identity, "version": version, "action": action, "state": state,
            "recordedAt": now, "reasonRef": reason, "replacementId": replacement}
    db.execute("INSERT INTO snapshot_review_events VALUES (?,?,?)", (identity, version, json.dumps(data)))


def mutate(db, body, owner):
    prior = db.execute("SELECT hash,response FROM snapshot_review_operations WHERE id=?", (body["requestId"],)).fetchone()
    if prior:
        if prior[0] != digest(body):
            raise Rejected("Association request ID conflict", 409)
        return {**json.loads(prior[1]), "duplicate": True}
    saved = records(db, owner)
    old = None
    if body["action"] != "create":
        old = next((r for r in saved if r["id"] == body["associationId"]), None)
        if old is None:
            raise Rejected("Association missing", 404)
        if old["version"] != body["version"] or old["lifecycle"] != "active":
            raise Rejected("Association changed; refresh before correcting", 409)
    now = datetime.now(timezone.utc).isoformat()
    new_id = None
    if body["action"] != "revoke":
        pins = body["pins"]
        target = snapshot_target(db, pins["snapshotId"], owner)
        review = review_target(db, pins["reviewId"], owner)
        if target_pins(target, review) != pins:
            raise Rejected("Association target pins changed", 409)
        if old and old["pins"]["projectId"] != pins["projectId"]:
            raise Rejected("Replacement project differs", 400)
        if any(r["lifecycle"] == "active" and r["id"] != (old["id"] if old else None) and r["pins"]["snapshotId"] == pins["snapshotId"] and r["pins"]["reviewId"] == pins["reviewId"] for r in saved):
            raise Rejected("An active association already exists for these targets", 409)
        if len(saved) >= 100:
            raise Rejected("Association retention limit reached", 409)
        new_id = "association-" + uuid.uuid4().hex
        record = {"id": new_id, "ownerId": owner, "version": 1, "pins": pins, "recordedAt": now,
                  "basis": "owner_asserted_relationship", "provenance": provenance(target, review),
                  "replacesId": old["id"] if old else None}
        db.execute("INSERT INTO snapshot_review_associations VALUES (?,?)", (new_id, json.dumps(record)))
        event(db, new_id, 1, "create", "active", now, body.get("reasonRef"))
    if old:
        event(db, old["id"], old["version"] + 1, body["action"], "superseded" if new_id else "revoked", now, body["reasonRef"], new_id)
    identity = new_id or old["id"]
    db.execute("INSERT INTO snapshot_review_audit(data) VALUES (?)", (json.dumps({"action": body["action"], "ownerId": owner,
               "associationId": identity, "previousId": old["id"] if old else None, "recordedAt": now, "requestHash": digest(body)}),))
    response = {"ok": True, "associationId": identity, "executed": False, "sourceRead": False, "processing": False, "externalExecution": False}
    db.execute("INSERT INTO snapshot_review_operations VALUES (?,?,?)", (body["requestId"], digest(body), json.dumps(response)))
    return response


def handle_associations(filename, owner, principal, method, body=None, allow_write=False):
    if not owner or principal != owner:
        raise Rejected("Owner authentication required", 401)
    if method not in ("ASSOCIATION_GET", "ASSOCIATION_POST"):
        raise Rejected("Method not allowed", 405)
    write = method == "ASSOCIATION_POST"
    if write and not allow_write:
        raise Rejected("Association writes are disabled", 403)
    if write:
        body = normalize(body)
    else:
        body = {} if body is None else body
        if not isinstance(body, dict) or not set(body) <= {"snapshotId", "reviewId"}:
            raise Rejected("Invalid association query")
        for value in body.values():
            scalar(value, IDENTIFIER)
    path = Path(filename)
    try:
        mode = path.lstat().st_mode
    except FileNotFoundError:
        if write:
            raise Rejected("Existing target storage required", 404)
        return read_state(None, owner, body, allow_write)
    if stat.S_ISLNK(mode) or not stat.S_ISREG(mode):
        raise Rejected("Target storage unavailable", 503)
    db = sqlite3.connect(path.resolve().as_uri() + ("?mode=rw" if write else "?mode=ro"), uri=True, timeout=5, isolation_level=None)
    try:
        db.execute("PRAGMA foreign_keys=ON")
        db.execute("BEGIN IMMEDIATE" if write else "BEGIN")
        if not check_owner(db, owner):
            raise Rejected("Existing owner-bound storage required", 503)
        if not write:
            return read_state(db, owner, body, allow_write)
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
