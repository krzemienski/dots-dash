"""Authenticated-call domain API. Authentication is performed by the Node host.

No public HTTP listener. Server-controlled principal/policy never comes from the
request body. Every mutation is versioned, transactional and idempotent.
"""
from datetime import datetime, timezone
import uuid
import sys
from .contracts import (EXPORT_SCHEMA, IDENTIFIER, REFERENCE, REVISION, Rejected,
                        array, digest, enum, normalize_export, obj, sanitize, text, validate)
from .review import create_review
from .runner import LocalChecklistRunner
from .store import Store
from .admission import SELECTION_SCHEMA, normalize_selection


class Service:
    def __init__(self, filename, owner=None, allow_import=False, runner=None):
        self.filename, self.owner = filename, owner
        self.allow_import, self.runner = allow_import, runner

    def handle(self, principal, method, body=None):
        if not self.owner or principal != self.owner:
            raise Rejected("Owner authentication required", 401)
        capabilities = {"import": self.allow_import, "runner": self.runner.name if self.runner else "unconfigured",
                        "executeChecklist": bool(self.runner and "review_checklist" in self.runner.capabilities()),
                        "externalExecution": False, "providers": {name: "unavailable" for name in ("codex", "claude", "cursor", "oh_my_pi")}}
        if method == "SCHEMA":
            return {"$schema": "https://json-schema.org/draft/2020-12/schema", **EXPORT_SCHEMA}
        if method == "SELECTION_SCHEMA":
            return {"$schema": "https://json-schema.org/draft/2020-12/schema", **SELECTION_SCHEMA}
        if method not in ("GET", "POST"):
            raise Rejected("Method not allowed", 405)
        if method == "POST":
            if not isinstance(body, dict):
                raise Rejected()
            validate(body.get("requestId"), IDENTIFIER)
            if body.get("action") in ("import", "import_selection") and not self.allow_import:
                raise Rejected("Owner import capability is disabled", 403)
            if body.get("action") == "run" and not capabilities["executeChecklist"]:
                raise Rejected("Runner is unconfigured", 403)
        store = Store(self.filename, self.owner)
        try:
            if method == "GET":
                index = store.index()
                if body is not None:
                    validate(body, obj({"reviewId": IDENTIFIER}))
                selected = body["reviewId"] if body else (index[0]["id"] if index else None)
                total = store.db.execute("SELECT COUNT(*) FROM reviews").fetchone()[0]
                return {"schemaVersion": 1, "capabilities": capabilities, "reviewIndex": index,
                        "totalReviews": total, "reviews": [store.get(selected)] if selected else []}
            # Only hashes of normalized/sanitized content reach persistence.
            normalized = self.normalize(body)
            return store.mutate(body["requestId"], digest(normalized), lambda: self.apply(store, normalized))
        finally:
            store.close()

    def normalize(self, body):
        action = body.get("action")
        if action == "import_selection":
            if set(body) != {"action", "requestId", "selection"}:
                raise Rejected()
            return {"action": action, "requestId": body["requestId"], "export": normalize_selection(body["selection"], self.owner)}
        if action == "import":
            if set(body) != {"action", "requestId", "export"}:
                raise Rejected()
            return {**body, "export": normalize_export(body["export"], self.owner)}
        base = {"action": enum("select", "run", "observe"), "requestId": IDENTIFIER,
                "reviewId": IDENTIFIER, "version": {"type": "integer"}}
        if action in ("select", "run"):
            base.update(taskId=IDENTIFIER, skillId=IDENTIFIER)
            if action == "run":
                base.update(expectedRevision=REVISION, skillRevision=REVISION,
                            capability=enum("review_checklist"), authorized={"const": True})
        elif action == "observe":
            base.update(goalId=IDENTIFIER, revision=REVISION, sourceRef=REFERENCE,
                        result=enum("pass", "fail", "gap"), observed=text(),
                        performedSteps=array(text(500), 20, 1))
        else:
            raise Rejected()
        validate(body, obj(base))
        if type(body["version"]) is not int or body["version"] < 1:
            raise Rejected()
        if action == "observe":
            return {**body, "observed": sanitize(body["observed"]),
                    "performedSteps": [sanitize(step) for step in body["performedSteps"]]}
        return body

    def apply(self, store, body):
        now = datetime.now(timezone.utc).isoformat()
        action = body["action"]
        if action in ("import", "import_selection"):
            review = create_review(body["export"])
            try:
                existing = store.get(review["id"])
                return {"ok": True, "review": existing, "duplicate": True, "executed": False}
            except Rejected as error:
                if error.status != 404:
                    raise
        else:
            review = store.get(body["reviewId"])
            if review["version"] != body["version"]:
                raise Rejected("Review changed; refresh before authorizing", 409)
            if len(review["runs"]) >= 100 or len(review["observations"]) >= 100:
                raise Rejected("Review retention limit reached; create a new scoped export", 409)
            if action in ("select", "run"):
                task = next((t for t in review["tasks"] if t["id"] == body["taskId"]), None)
                skill = next((s for s in review["export"]["skills"] if s["id"] == body["skillId"]), None)
                if not task or not skill or skill["id"] not in task["applicableSkillIds"]:
                    raise Rejected("Skill not applicable to this task", 400)
                if action == "select":
                    task["selectedSkillId"] = skill["id"]
                else:
                    if (task["selectedSkillId"] != skill["id"] or body["expectedRevision"] != review["export"]["revision"]
                            or body["skillRevision"] != skill["revision"]):
                        raise Rejected("Authorization pins changed", 409)
                    # Only the local bounded adapter is shipped. Future remote
                    # adapters require durable unknown/reconciliation semantics.
                    if not isinstance(self.runner, LocalChecklistRunner):
                        raise Rejected("Unsupported execution adapter", 403)
                    receipt = self.runner.run(review, task, skill)
                    receipt.update(id="run-" + uuid.uuid4().hex, taskId=task["id"], skillId=skill["id"],
                                   skillRevision=skill["revision"], revision=body["expectedRevision"],
                                   inputHash=digest(review), authorizationHash=digest(body), recordedAt=now,
                                   startedAt=now, completedAt=datetime.now(timezone.utc).isoformat(),
                                   runtime="Python " + sys.version.split()[0])
                    review["runs"].append(receipt)
                    task["status"] = "reviewed_not_remediated"
            else:
                if not any(g["id"] == body["goalId"] for g in review["export"]["goals"]):
                    raise Rejected()
                if body["revision"] != review["export"]["revision"]:
                    raise Rejected("Observation revision differs", 409)
                observation = {key: body[key] for key in ("goalId", "revision", "sourceRef", "result", "observed", "performedSteps")}
                observation.update(id="observation-" + uuid.uuid4().hex, recordedAt=now, basis="owner_reported")
                review["observations"].append(observation)
                for finding in review["findings"]:
                    if finding["goalId"] == body["goalId"] and finding["kind"] == "acceptance_gap":
                        finding["status"] = "observation_recorded_not_independently_verified"
            review["version"] += 1
        store.save(review, action, now)
        return {"ok": True, "review": review, "executed": action == "run", "externalExecution": False}
