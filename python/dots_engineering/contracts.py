"""Versioned, strict JSON contracts shared with the browser through /schema.

Only owner-curated, already sanitized exports are accepted. This is not a
parser for any vendor's private transcript/database format.
"""
import hashlib
import json
import re
from datetime import datetime


class Rejected(Exception):
    def __init__(self, message="Invalid input", status=400):
        super().__init__(message)
        self.status = status


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()


def text(limit=2000, **extra):
    return {"type": "string", "minLength": 1, "maxLength": limit, **extra}


IDENTIFIER = text(100, pattern=r"^[A-Za-z0-9_-]+$")
REFERENCE = text(180, pattern=r"^(export|artifact|skill|receipt):[A-Za-z0-9_.#:-]+$")
REVISION = text(64, pattern=r"^[a-f0-9]{7,64}$")
HASH = text(64, pattern=r"^[a-f0-9]{64}$")


def array(items, limit=100, minimum=0):
    return {"type": "array", "items": items, "minItems": minimum, "maxItems": limit}


def obj(properties):
    return {"type": "object", "properties": properties, "required": list(properties), "additionalProperties": False}


def enum(*values):
    return {"type": "string", "enum": list(values)}


CHECKS = ("goal_has_action", "claim_has_evidence", "acceptance_observed")
EXPORT_SCHEMA = obj({
    "format": enum("dots-visible-session"), "version": {"const": 1},
    "ownerId": IDENTIFIER, "sessionId": IDENTIFIER, "projectId": IDENTIFIER,
    "sourceRef": REFERENCE, "consentRef": REFERENCE,
    "capturedAt": text(40, format="date-time"), "revision": REVISION,
    "sanitized": {"const": True}, "dataLabel": enum("TEST DATA", "OWNER PROVIDED"),
    "events": array(obj({
        "id": IDENTIFIER, "kind": enum("intention", "decision", "action", "claim", "evidence"),
        "text": text(), "sourceRef": REFERENCE, "goalIds": array(IDENTIFIER, 20),
        "sourceKind": enum("visible_turn", "project_artifact", "execution_receipt", "owner_annotation"),
        "observedAt": text(40, format="date-time"), "codeRevision": REVISION,
        "requirementRevision": IDENTIFIER, "inputHashes": array(HASH, 20),
        "outcomeScope": enum("intent", "decision", "investigation", "code_change", "targeted_check", "end_user_behavior", "release", "unknown"),
        "outcome": enum("pass", "fail", "gap", "blocked", "unknown"),
        "supersedes": array(IDENTIFIER, 20),
    })),
    "goals": array(obj({
        "id": IDENTIFIER, "text": text(), "sourceEventIds": array(IDENTIFIER, 20, 1),
        "expectedBehavior": text(), "userSteps": array(text(500), 20, 1),
    }), 20, 1),
    "skills": array(obj({
        "id": IDENTIFIER, "name": text(100), "summary": text(500),
        "sourceRef": REFERENCE, "revision": REVISION,
        "userOwned": {"const": True}, "explicitlySelected": {"const": True},
        "goalIds": array(IDENTIFIER, 20, 1), "checks": array(enum(*CHECKS), 3, 1),
    }), 20),
})


def validate(value, schema):
    if "const" in schema and (type(value) is not type(schema["const"]) or value != schema["const"]):
        raise Rejected()
    if "enum" in schema and value not in schema["enum"]:
        raise Rejected()
    kind = schema.get("type")
    if kind == "object":
        if not isinstance(value, dict) or set(value) != set(schema["required"]):
            raise Rejected()
        for key, child in schema["properties"].items():
            validate(value[key], child)
    elif kind == "array":
        if not isinstance(value, list) or not schema["minItems"] <= len(value) <= schema["maxItems"]:
            raise Rejected()
        for item in value:
            validate(item, schema["items"])
    elif kind == "string":
        if not isinstance(value, str) or not schema.get("minLength", 1) <= len(value.strip()) <= schema.get("maxLength", 2000):
            raise Rejected()
        if "pattern" in schema and not re.fullmatch(schema["pattern"], value):
            raise Rejected()
        if schema.get("format") == "date-time":
            try:
                if datetime.fromisoformat(value.replace("Z", "+00:00")).utcoffset() is None:
                    raise ValueError()
            except ValueError as error:
                raise Rejected() from error
    elif kind == "integer" and type(value) is not int:
        raise Rejected()


def sanitize(value):
    # Defense in depth, not a claim to detect arbitrary secrets. Only curated
    # visible text belongs at this ingress. Never retain the original payload.
    value = re.sub(r"\x1b\][^\x07]*(?:\x07|\x1b\\)", "", value)
    value = re.sub(r"\x1b\[[0-?]*[ -/]*[@-~]", "", value)
    value = re.sub(r"[\x00-\x08\x0b-\x1f\x7f\u202a-\u202e\u2066-\u2069]", "", value)
    value = re.sub(r"(?is)-----BEGIN [^-]*PRIVATE KEY-----.*?-----END [^-]*PRIVATE KEY-----", "[REDACTED]", value)
    value = re.sub(r"(?i)\b(?:sk-[\w-]{8,}|gh[pousr]_[\w]{8,}|bearer\s+\S+)", "[REDACTED]", value)
    value = re.sub(r"(?i)\b(password|secret|token|api[_-]?key)\s*[:=]\s*\S+", r"\1=[REDACTED]", value)
    return value


def normalize_export(payload, owner):
    validate(payload, EXPORT_SCHEMA)
    if payload["ownerId"] != owner:
        raise Rejected("Owner mismatch", 403)
    result = json.loads(json.dumps(payload))
    goal_ids = {g["id"] for g in result["goals"]}
    event_ids = {e["id"] for e in result["events"]}
    for group in ("events", "goals", "skills"):
        if len({row["id"] for row in result[group]}) != len(result[group]):
            raise Rejected()
    for event in result["events"]:
        if not set(event["goalIds"]) <= goal_ids or not set(event["supersedes"]) <= event_ids:
            raise Rejected()
        if event["supersedes"] and event["kind"] != "decision":
            raise Rejected()
        if event["id"] in event["supersedes"]:
            raise Rejected()
        event["text"] = sanitize(event["text"])
        event["basis"] = "export_claim" if event["kind"] == "claim" else "owner_provided_export"
    # Reject cycles; a later decision must not erase or recursively revive history.
    graph = {e["id"]: e["supersedes"] for e in result["events"]}
    dates = {e["id"]: datetime.fromisoformat(e["observedAt"].replace("Z", "+00:00")) for e in result["events"]}
    if any(dates[key] < dates[target] for key, targets in graph.items() for target in targets):
        raise Rejected()
    visited = set()
    def visit(key, active):
        if key in active:
            raise Rejected()
        if key in visited:
            return
        for target in graph[key]:
            visit(target, active | {key})
        visited.add(key)
    for key in graph:
        visit(key, set())
    for goal in result["goals"]:
        if not set(goal["sourceEventIds"]) <= event_ids:
            raise Rejected()
        goal["text"] = sanitize(goal["text"])
        goal["expectedBehavior"] = sanitize(goal["expectedBehavior"])
        goal["userSteps"] = [sanitize(step) for step in goal["userSteps"]]
    for skill in result["skills"]:
        if not set(skill["goalIds"]) <= goal_ids or len(set(skill["checks"])) != len(skill["checks"]):
            raise Rejected()
        skill["name"], skill["summary"] = sanitize(skill["name"]), sanitize(skill["summary"])
        skill["invocationScope"] = "declarative_checklist_only"
    return result
