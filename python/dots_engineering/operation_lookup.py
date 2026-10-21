"""Minimal shared-operation receipt inspection. Never initializes or mutates storage."""
import json
import sqlite3
from pathlib import Path
from .contracts import HASH, IDENTIFIER, Rejected, obj, text, validate


def lookup_operation(filename, owner, principal, body, enabled=False):
    if not owner or principal != owner:
        raise Rejected("Owner authentication required", 401)
    if not enabled:
        raise Rejected("Operation lookup is disabled", 403)
    properties = {"operationId": IDENTIFIER, "expectedDigest": HASH}
    if not isinstance(body, dict) or "operationId" not in body or set(body) - set(properties):
        raise Rejected("Invalid operation lookup")
    validate(body, obj({key: properties[key] for key in body}))
    path = Path(filename)
    if path.is_symlink() or not path.is_file():
        raise Rejected("Receipt storage unavailable", 503)
    db = sqlite3.connect(path.resolve().as_uri() + "?mode=ro", uri=True)
    try:
        db.execute("PRAGMA query_only=ON")
        db.execute("BEGIN")
        tables = {r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        if not {"owner_binding", "operations"} <= tables:
            raise Rejected("Receipt schema unavailable", 503)
        if db.execute("SELECT id,owner FROM owner_binding").fetchall() != [(1, owner)]:
            raise Rejected("Owner storage binding unavailable", 403)
        # Bound materialization; never return the raw historical response.
        row = db.execute("SELECT hash,CASE WHEN length(CAST(response AS BLOB))<=2000000 THEN response END FROM operations WHERE id=?", (body["operationId"],)).fetchone()
        result = {"format": "dots-operation-lookup", "schemaVersion": 1,
                  "operationId": body["operationId"], "storeScope": "engineering_shared",
                  "readOnly": True, "action": "unknown", "binding": "legacy_namespace_not_recorded"}
        if row is None:
            return {**result, "state": "unknown", "digestMatch": None, "result": None}
        try:
            validate(row[0], HASH)
            response = json.loads(row[1])
            if not isinstance(response, dict) or response.get("ok") is not True or type(response.get("executed")) is not bool or response.get("externalExecution") is not False:
                raise ValueError()
            if "review" in response and "task" not in response:
                review = response["review"]
                validate(review["id"], IDENTIFIER)
                if type(review["version"]) is not int or review["version"] < 1:
                    raise ValueError()
                summary = {"kind": "review_snapshot", "reviewId": review["id"], "reviewVersion": review["version"]}
            elif "task" in response and "review" not in response:
                task = response["task"]
                validate(task["id"], text(40, pattern=r"^context-[a-f0-9]{32}$"))
                validate(task["reviewId"], IDENTIFIER)
                validate(task["sourceRequestId"], text(611, pattern=r"^commitment:[A-Za-z0-9_.:-]{1,600}$"))
                if type(task["reviewVersion"]) is not int or task["reviewVersion"] < 1 or response["executed"] is not False or response.get("sent") is not False or response.get("externalExecution") is not False:
                    raise ValueError()
                summary = {"kind": "context_link", "taskId": task["id"], "reviewId": task["reviewId"],
                           "reviewVersion": task["reviewVersion"], "sourceRequestId": task["sourceRequestId"]}
            else:
                raise ValueError()
        except (Rejected, ValueError, TypeError, KeyError):
            raise Rejected("Receipt cannot be safely summarized", 503)
        match = row[0] == body["expectedDigest"] if "expectedDigest" in body else None
        return {**result, "state": "receipt_found", "payloadDigest": row[0], "digestMatch": match,
                "storedExecutedFlag": response["executed"], "result": summary}
    finally:
        db.close()
