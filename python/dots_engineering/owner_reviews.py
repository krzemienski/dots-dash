"""Owner assertions about retained records; no source reader or processing certificate."""
import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from .contracts import Rejected, IDENTIFIER, HASH, REFERENCE, array, enum, obj, text, validate, digest, sanitize
from .source_inventory import check_owner, tables

FORMAT = "dots-retained-record-review"
PROCESSOR = {"processorId": "owner-record-review", "processorVersion": "1"}
COMMON = {"format": {"const": FORMAT}, "schemaVersion": {"const": 1}, "requestId": IDENTIFIER}
PINS = {"manifestId": IDENTIFIER, "manifestDigest": HASH, "projectId": IDENTIFIER,
        "processorId": {"const": PROCESSOR["processorId"]}, "processorVersion": {"const": "1"},
        "expectedHead": {"anyOf": [IDENTIFIER, {"type": "null"}]}}
REPORT = {"itemId": IDENTIFIER, "result": enum("reviewed", "unresolved"),
          "observedAt": text(40, format="date-time"), "evidenceRefs": array(REFERENCE, 10, 1)}
SCHEMAS = {
    "create_manifest": obj({**COMMON, "action": {"const": "create_manifest"}, "reviewId": IDENTIFIER,
                            "reviewVersion": {"type": "integer", "minimum": 1}, "projectId": IDENTIFIER,
                            "reviewExportDigest": HASH, "analysisVersion": IDENTIFIER}),
    "append_reports": obj({**COMMON, **PINS, "action": {"const": "append_reports"}, "reports": array(obj(REPORT), 100, 1)}),
    "correct_report": obj({**COMMON, **PINS, "action": {"const": "correct_report"}, "reportId": IDENTIFIER,
                           "replacement": obj(REPORT), "reasonRef": REFERENCE}),
    "withdraw_report": obj({**COMMON, **PINS, "action": {"const": "withdraw_report"}, "reportId": IDENTIFIER, "reasonRef": REFERENCE}),
}
TABLES = {"rr_schema", "rr_manifests", "rr_events", "rr_checkpoints", "rr_operations", "rr_audit"}
DDL = (
    "CREATE TABLE rr_schema (version INTEGER NOT NULL)", "INSERT INTO rr_schema VALUES (1)",
    "CREATE TABLE rr_manifests (id TEXT PRIMARY KEY, digest TEXT UNIQUE NOT NULL, review_id TEXT NOT NULL, data TEXT NOT NULL)",
    "CREATE TABLE rr_events (sequence INTEGER PRIMARY KEY, id TEXT UNIQUE NOT NULL, manifest_id TEXT NOT NULL REFERENCES rr_manifests(id), processor TEXT NOT NULL, data TEXT NOT NULL)",
    "CREATE TABLE rr_checkpoints (sequence INTEGER PRIMARY KEY, id TEXT UNIQUE NOT NULL, manifest_id TEXT NOT NULL REFERENCES rr_manifests(id), processor TEXT NOT NULL, data TEXT NOT NULL)",
    "CREATE TABLE rr_operations (id TEXT PRIMARY KEY, hash TEXT NOT NULL, response TEXT NOT NULL)",
    "CREATE TABLE rr_audit (sequence INTEGER PRIMARY KEY, request_id TEXT UNIQUE NOT NULL, data TEXT NOT NULL)",
)


def checked(value, schema):
    def strict(v, rule):
        if "anyOf" in rule:
            for choice in rule["anyOf"]:
                try:
                    strict(v, choice)
                    return
                except Rejected: pass
            raise Rejected()
        if rule.get("type") == "null":
            if v is not None: raise Rejected()
            return
        if rule.get("type") == "object":
            if not isinstance(v, dict) or set(v) != set(rule["properties"]): raise Rejected()
            for key, child in rule["properties"].items(): strict(v[key], child)
        elif rule.get("type") == "array":
            if not isinstance(v, list) or not rule["minItems"] <= len(v) <= rule["maxItems"]: raise Rejected()
            for child in v: strict(child, rule["items"])
        else:
            validate(v, rule)
            if rule.get("type") == "integer" and not rule.get("minimum", v) <= v <= rule.get("maximum", v): raise Rejected()
            if isinstance(v, str) and len(v) > rule.get("maxLength", 2000): raise Rejected()
    strict(value, schema)
    def safe(v):
        if isinstance(v, str) and sanitize(v) != v:
            raise Rejected("Unsafe report metadata")
        if isinstance(v, dict):
            for child in v.values(): safe(child)
        if isinstance(v, list):
            for child in v: safe(child)
    safe(value)
    return value


def initialized(db):
    names = tables(db)
    present = names & TABLES
    if not present: return False
    if present != TABLES or db.execute("SELECT version FROM rr_schema").fetchall() != [(1,)]:
        raise Rejected("Owner review schema unavailable", 503)
    return True


def connect(filename, owner, write=False):
    path = Path(filename)
    if path.is_symlink() or not path.is_file():
        raise Rejected("Owner review storage unavailable; explicit migration required", 503)
    db = sqlite3.connect(path.resolve().as_uri() + ("?mode=rw" if write else "?mode=ro"), uri=True, isolation_level=None)
    try:
        db.execute("PRAGMA foreign_keys=ON")
        db.execute("BEGIN IMMEDIATE" if write else "BEGIN")
        if not check_owner(db, owner): raise Rejected("Owner storage binding unavailable", 403)
        return db
    except BaseException:
        db.close()
        raise


def migrate(filename, owner):
    """Explicit operator call only; HTTP requests never initialize this schema."""
    if not owner: raise Rejected("Owner required", 403)
    db = connect(filename, owner, True)
    try:
        if not initialized(db):
            for statement in DDL: db.execute(statement)
            for table in sorted(TABLES):
                for operation in ("UPDATE", "DELETE"):
                    db.execute(f"CREATE TRIGGER {table}_{operation.lower()} BEFORE {operation} ON {table} BEGIN SELECT RAISE(ABORT, 'Owner review history is immutable'); END")
        db.commit()
    finally: db.close()


def review_target(db, review_id):
    if "reviews" not in tables(db): return None, "unavailable"
    row = db.execute("SELECT data FROM reviews WHERE id=?", (review_id,)).fetchone()
    return (json.loads(row[0]), "available") if row else (None, "missing")


def candidate(db, owner, review_id):
    review, availability = review_target(db, review_id)
    if review is None: return None, availability
    export = review["export"]
    if export.get("ownerId") != owner: raise Rejected("Review outside owner scope", 403)
    admission = export.get("admission")
    if not admission: return None, "ineligible_legacy_review"
    records = {row["eventId"]: row for row in admission["records"]}
    events = export["events"]
    if (not 1 <= len(events) <= 100 or len(records) != len(admission["records"])
            or len({e["id"] for e in events}) != len(events)
            or {e["id"] for e in events} != {k for k, v in records.items() if v["disposition"] == "retained"}):
        raise Rejected("Retained record bindings are inconsistent", 409)
    items = [{"position": i + 1, "itemId": e["id"], "eventDigest": digest(e),
              "sourceRef": e["sourceRef"], "attribution": records[e["id"]]["attribution"]} for i, e in enumerate(events)]
    identity = {"domain": "dots-retained-record-manifest-v1", "ownerId": owner, "projectId": export["projectId"],
                "selectionDigest": digest(export), "orderContract": "retained-export-array-v1",
                "items": [{k: item[k] for k in ("position", "itemId", "eventDigest")} for item in items]}
    return {**identity, "items": items, "manifestDigest": digest(identity), "reviewId": review_id,
            "reviewVersion": review["version"], "analysisVersion": review["analysisVersion"],
            "digestDomain": "stored-normalized-review-export-v1", "dataLabel": export["dataLabel"],
            "itemCount": len(items), "excludedCount": sum(r["disposition"] == "excluded" for r in records.values()),
            "unknownAttributionCount": sum(i["attribution"] == "origin_unknown" for i in items)}, "available"


def manifest(db, manifest_id, owner):
    row = db.execute("SELECT data FROM rr_manifests WHERE id=?", (manifest_id,)).fetchone()
    if not row: raise Rejected("Manifest not found", 404)
    result = json.loads(row[0])
    if result["ownerId"] != owner: raise Rejected("Manifest outside owner scope", 403)
    return result


def stream(db, m):
    key = PROCESSOR["processorId"] + ":" + PROCESSOR["processorVersion"]
    events = [json.loads(row[0]) for row in db.execute("SELECT data FROM rr_events WHERE manifest_id=? AND processor=? ORDER BY sequence", (m["id"], key))]
    active = {}
    for event in events:
        if event["action"] == "withdraw_report": active.pop(event["itemId"], None)
        else: active[event["report"]["itemId"]] = event["report"]
    reviewed = {item for item, report in active.items() if report["result"] == "reviewed"}
    prefix = 0
    for item in m["items"]:
        if item["itemId"] not in reviewed: break
        prefix += 1
    checkpoints = [json.loads(row[0]) for row in db.execute("SELECT data FROM rr_checkpoints WHERE manifest_id=? AND processor=? ORDER BY sequence", (m["id"], key))]
    return {"head": checkpoints[-1]["id"] if checkpoints else None, "activeReports": active,
            "reviewedCount": len(reviewed), "prefixCount": prefix, "events": events, "checkpoints": checkpoints}


def relevance(db, owner, m):
    try: current, status = candidate(db, owner, m["reviewId"])
    except Rejected: return "unknown"
    if current is None: return status
    if current["selectionDigest"] != m["selectionDigest"] or current["analysisVersion"] != m["analysisVersion"]: return "stale"
    return "pins_match_version_changed" if current["reviewVersion"] != m["reviewVersion"] else "pins_match"


def read_state(db, owner, body, enabled):
    ready = initialized(db)
    result = {"format": FORMAT, "schemaVersion": 1, "initialized": ready, "writeEnabled": enabled,
              "basis": "owner_reported", **PROCESSOR, "candidate": None, "candidateStatus": "no_review_selected",
              "manifests": [], "manifest": None, "stream": None, "relevance": "unknown"}
    if body.get("operationId"):
        row = db.execute("SELECT hash,response FROM rr_operations WHERE id=?", (body["operationId"],)).fetchone() if ready else None
        return {**result, "operation": {"state": "committed", "payloadDigest": row[0], "response": json.loads(row[1])} if row else {"state": "unconfirmed"}}
    if body.get("reviewId"):
        result["candidate"], result["candidateStatus"] = candidate(db, owner, body["reviewId"])
        if ready:
            result["manifests"] = [json.loads(row[0]) for row in db.execute("SELECT data FROM rr_manifests WHERE review_id=? ORDER BY rowid DESC", (body["reviewId"],))]
    selected = body.get("manifestId") or (result["manifests"][0]["id"] if result["manifests"] else None)
    if selected:
        if not ready: raise Rejected("Explicit owner review migration required", 503)
        m = manifest(db, selected, owner)
        if body.get("reviewId") and m["reviewId"] != body["reviewId"]: raise Rejected("Manifest outside selected review", 409)
        s = stream(db, m)
        ceiling = body.get("ceiling", len(s["checkpoints"]))
        offset = body.get("offset", 0)
        if ceiling > len(s["checkpoints"]) or (offset and offset >= ceiling): raise Rejected("Invalid history page")
        history = list(reversed(s["checkpoints"][:ceiling]))[offset:offset + 50]
        result.update(manifest=m, relevance=relevance(db, owner, m), stream={k: s[k] for k in ("head", "activeReports", "reviewedCount", "prefixCount")},
                      history=history, page={"ceiling": ceiling, "offset": offset, "total": ceiling,
                      "start": offset + 1 if history else 0, "end": offset + len(history), "hasOlder": offset + len(history) < ceiling})
    return result


def mutate(db, owner, body):
    prior = db.execute("SELECT hash,response FROM rr_operations WHERE id=?", (body["requestId"],)).fetchone()
    if prior:
        if prior[0] != digest(body): raise Rejected("Request ID conflicts with prior content", 409)
        return {**json.loads(prior[1]), "duplicate": True}
    now = datetime.now(timezone.utc).isoformat()
    action = body["action"]
    checkpoint = None
    if action == "create_manifest":
        c, status = candidate(db, owner, body["reviewId"])
        if not c: raise Rejected("Selected review is unavailable or ineligible: " + status, 409)
        if any(body[k] != c[v] for k, v in (("reviewVersion", "reviewVersion"), ("reviewExportDigest", "selectionDigest"), ("analysisVersion", "analysisVersion"), ("projectId", "projectId"))):
            raise Rejected("Manifest creation pins changed", 409)
        prior_manifest = db.execute("SELECT data FROM rr_manifests WHERE digest=?", (c["manifestDigest"],)).fetchone()
        if prior_manifest: m = json.loads(prior_manifest[0])
        else:
            if db.execute("SELECT COUNT(*) FROM rr_manifests").fetchone()[0] >= 100: raise Rejected("Manifest retention limit reached", 409)
            m = {**c, "id": "manifest-" + uuid.uuid4().hex, "recordedAt": now, "basis": "owner_reported"}
            db.execute("INSERT INTO rr_manifests VALUES (?,?,?,?)", (m["id"], m["manifestDigest"], m["reviewId"], json.dumps(m)))
    else:
        m = manifest(db, body["manifestId"], owner)
        if m["manifestDigest"] != body["manifestDigest"] or m["projectId"] != body["projectId"]: raise Rejected("Manifest scope or digest changed", 409)
        if relevance(db, owner, m) not in ("pins_match", "pins_match_version_changed"): raise Rejected("Manifest target relevance is unresolved", 409)
        s = stream(db, m)
        if body["expectedHead"] != s["head"]: raise Rejected("Report head changed; refresh before recording", 409)
        entries = body["reports"] if action == "append_reports" else [body.get("replacement")]
        if len(s["events"]) + len(entries) > 1000: raise Rejected("Review report retention limit reached", 409)
        item_ids = {i["itemId"] for i in m["items"]}
        target = None
        if action != "append_reports":
            target = next((r for r in s["activeReports"].values() if r["id"] == body["reportId"]), None)
            if not target: raise Rejected("Report is no longer active", 409)
        else:
            ids = [r["itemId"] for r in entries]
            if len(set(ids)) != len(ids) or any(i in s["activeReports"] for i in ids): raise Rejected("Duplicate or already active item report", 409)
        written = []
        key = PROCESSOR["processorId"] + ":" + PROCESSOR["processorVersion"]
        for entry in entries:
            event = {"id": "event-" + uuid.uuid4().hex, "action": action, "recordedAt": now, "basis": "owner_reported"}
            if target: event.update(targetReportId=target["id"], itemId=target["itemId"], reasonRef=body["reasonRef"])
            if entry is not None:
                if entry["itemId"] not in item_ids or (target and entry["itemId"] != target["itemId"]): raise Rejected("Report item outside manifest or correction scope", 409)
                if len(set(entry["evidenceRefs"])) != len(entry["evidenceRefs"]): raise Rejected("Duplicate evidence references")
                event["report"] = {**entry, "id": "report-" + uuid.uuid4().hex, "recordedAt": now, "basis": "owner_reported"}
            db.execute("INSERT INTO rr_events(id,manifest_id,processor,data) VALUES (?,?,?,?)", (event["id"], m["id"], key, json.dumps(event)))
            written.append(event)
        next_state = stream(db, m)
        checkpoint = {"id": "checkpoint-" + uuid.uuid4().hex, "manifestId": m["id"], "manifestDigest": m["manifestDigest"],
                      **PROCESSOR, "previousCheckpointId": s["head"], "requestId": body["requestId"], "events": written,
                      "recordedAt": now, "basis": "owner_reported", "reviewedCount": next_state["reviewedCount"], "prefixCount": next_state["prefixCount"]}
        db.execute("INSERT INTO rr_checkpoints(id,manifest_id,processor,data) VALUES (?,?,?,?)", (checkpoint["id"], m["id"], key, json.dumps(checkpoint)))
    response = {"ok": True, "manifestId": m["id"], "reviewId": m["reviewId"], "checkpoint": checkpoint, "executed": False, "basis": "owner_reported"}
    db.execute("INSERT INTO rr_operations VALUES (?,?,?)", (body["requestId"], digest(body), json.dumps(response)))
    db.execute("INSERT INTO rr_audit(request_id,data) VALUES (?,?)", (body["requestId"], json.dumps({"action": action, "response": response, "recordedAt": now})))
    return response


def handle_owner_reviews(filename, owner, principal, method, body=None, enabled=False):
    if not owner or principal != owner: raise Rejected("Owner authentication required", 401)
    if method not in ("REPORT_GET", "REPORT_POST"): raise Rejected("Method not allowed", 405)
    write = method == "REPORT_POST"
    if write and not enabled: raise Rejected("Owner review report writes are disabled", 403)
    if write:
        if not isinstance(body, dict) or not isinstance(body.get("action"), str) or body["action"] not in SCHEMAS: raise Rejected("Unsupported report action")
        checked(body, SCHEMAS[body["action"]])
    else:
        body = {} if body is None else body
        properties = {"reviewId": IDENTIFIER, "manifestId": IDENTIFIER, "operationId": IDENTIFIER,
                           "offset": {"type": "integer", "minimum": 0, "maximum": 1000},
                           "ceiling": {"type": "integer", "minimum": 0, "maximum": 1000}}
        if not isinstance(body, dict) or not set(body) <= set(properties): raise Rejected()
        checked(body, obj({k: properties[k] for k in body}))
        if body.get("operationId") and len(body) != 1: raise Rejected("Operation lookup must be separate")
        if body.get("offset", 0) % 50 or (body.get("offset") and "ceiling" not in body): raise Rejected("Invalid history offset")
    db = connect(filename, owner, write)
    try:
        if write:
            if not initialized(db): raise Rejected("Explicit owner review migration required", 503)
            result = mutate(db, owner, body)
            db.commit()
            return result
        return read_state(db, owner, body, enabled)
    finally:
        if db.in_transaction: db.rollback()
        db.close()
