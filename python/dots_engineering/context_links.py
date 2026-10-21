"""Local association metadata only. Canonical requests remain Node-owned."""
from datetime import datetime, timezone
import json
import uuid
from .contracts import IDENTIFIER, REVISION, HASH, Rejected, obj, enum, text, validate, sanitize, digest
from .store import Store

SOURCE_ID = text(620, pattern=r"^commitment:[A-Za-z0-9_.:-]+$")
ARTIFACT = text(180, pattern=r"^artifact:[A-Za-z0-9_.#:-]+$")
CREATE = obj({"action": enum("link"), "requestId": IDENTIFIER,
              "sourceRequestId": SOURCE_ID, "sourceRequestVersion": {"type": "integer"},
              "sourceRequestHash": HASH, "reviewId": IDENTIFIER,
              "reviewVersion": {"type": "integer"}, "projectId": IDENTIFIER,
              "revision": REVISION, "repositoryRef": ARTIFACT, "title": text(300)})


def handle_context(filename, owner, principal, method, body, sources, allow_links):
    if not owner or principal != owner:
        raise Rejected("Owner authentication required", 401)
    if method not in ("CONTEXT_GET", "CONTEXT_POST"):
        raise Rejected("Method not allowed", 405)
    if method == "CONTEXT_POST" and not allow_links:
        raise Rejected("Context link capability is disabled", 403)
    # Fifty page candidates plus at most one independently selected exact target.
    if not isinstance(sources, dict) or not isinstance(sources.get("requests"), list) or len(sources["requests"]) > 51 or type(sources.get("complete")) is not bool:
        raise Rejected("Request projection unavailable", 503)
    requests = []
    for source in sources["requests"]:
        validate(source, obj({"id": SOURCE_ID, "version": {"type": "integer"}, "hash": HASH, "title": text(200)}))
        requests.append({**source, "title": sanitize(source["title"])})
    store = Store(filename, owner)
    try:
        store.db.executescript("""
            CREATE TABLE IF NOT EXISTS context_links (id TEXT PRIMARY KEY, data TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS context_link_audit (sequence INTEGER PRIMARY KEY, link_id TEXT NOT NULL, snapshot TEXT NOT NULL, recorded_at TEXT NOT NULL);
        """)
        def project(link):
            request = next((r for r in requests if r["id"] == link["sourceRequestId"]), None)
            request_state = ("current" if request["version"] == link["sourceRequestVersion"] and request["hash"] == link["sourceRequestHash"] else "stale") if request else ("missing" if sources["complete"] else "unknown")
            try:
                review = store.get(link["reviewId"])
                review = {"id": review["id"], "version": review["version"], "revision": review["export"]["revision"], "projectId": review["export"]["projectId"]}
            except Rejected as error:
                if error.status != 404:
                    raise
                review = None
            review_state = ("current" if review["version"] == link["reviewVersion"] and review["revision"] == link["revision"] and review["projectId"] == link["projectId"] else "stale") if review else "missing"
            return {**link, "requestState": request_state, "reviewState": review_state,
                    "currentRequest": request, "currentReview": review,
                    "permissions": {"requestRead": "available" if request else "unavailable", "reviewRead": "available" if review else "unavailable",
                                    "repositoryAccess": "not_granted", "execution": "not_granted", "send": "not_granted"}}
        if method == "CONTEXT_GET":
            return {"schemaVersion": 1, "capabilities": {"link": bool(allow_links), "externalExecution": False, "send": False},
                    "requests": requests, "requestCoverageComplete": sources["complete"],
                    "tasks": [project(json.loads(row[0])) for row in store.db.execute("SELECT data FROM context_links ORDER BY rowid DESC")]}
        validate(body, CREATE)
        if min(body["sourceRequestVersion"], body["reviewVersion"]) < 1:
            raise Rejected()
        normalized = {**body, "title": sanitize(body["title"])}
        def create():
            # Validate the stored value, not only the pre-sanitization input.
            # Keep historical normalization/replay hashes unchanged: these checks
            # apply only to new creations inside Store.mutate's action callback.
            validate(normalized["title"], text(300))
            if len(normalized["title"]) > 300:
                raise Rejected("Normalized title exceeds 300 characters", 400)
            source = next((r for r in requests if r["id"] == normalized["sourceRequestId"]), None)
            if not source:
                raise Rejected("Request unavailable in current permitted projection", 404)
            if source["version"] != normalized["sourceRequestVersion"] or source["hash"] != normalized["sourceRequestHash"]:
                raise Rejected("Request changed; refresh before linking", 409)
            review = store.get(normalized["reviewId"])
            if review["version"] != normalized["reviewVersion"] or review["export"]["revision"] != normalized["revision"] or review["export"]["projectId"] != normalized["projectId"]:
                raise Rejected("Review pins changed; refresh before linking", 409)
            if store.db.execute("SELECT COUNT(*) FROM context_links").fetchone()[0] >= 100:
                raise Rejected("Context association limit reached", 409)
            link = {k: normalized[k] for k in ("sourceRequestId", "sourceRequestVersion", "sourceRequestHash", "reviewId", "reviewVersion", "projectId", "revision", "repositoryRef", "title")}
            now = datetime.now(timezone.utc).isoformat()
            link.update(id="context-" + uuid.uuid4().hex, recordedAt=now, basis="owner_linked_metadata")
            data = json.dumps(link)
            store.db.execute("INSERT INTO context_links VALUES (?,?)", (link["id"], data))
            store.db.execute("INSERT INTO context_link_audit(link_id,snapshot,recorded_at) VALUES (?,?,?)", (link["id"], data, now))
            return {"ok": True, "task": link, "executed": False, "sent": False, "externalExecution": False}
        return store.mutate(normalized["requestId"], digest(normalized), create)
    finally:
        store.close()
