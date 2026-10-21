"""Owner-curated selected records only; no file reader or provider adapter."""
import copy
import re
from datetime import datetime
from .contracts import (EXPORT_SCHEMA, IDENTIFIER, REFERENCE, Rejected, array,
                        enum, normalize_export, obj, sanitize, validate)


SELECTION_SCHEMA = obj({
    "format": enum("dots-selected-records"), "version": {"const": 1},
    "export": EXPORT_SCHEMA,
    "projectBinding": obj({
        "directoryProjectId": IDENTIFIER, "declaredProjectId": IDENTIFIER,
        "confirmedProjectId": IDENTIFIER,
        "state": enum("unresolved", "owner_confirmed"), "confirmationRef": REFERENCE,
    }),
    "records": array(obj({
        "eventId": IDENTIFIER, "role": enum("user", "assistant", "tool", "system", "developer", "unknown"),
        "origin": enum("human", "generated", "unknown"),
        "contentKind": enum("text", "metadata", "tool_result", "private_instruction", "sensitive"),
    })),
    "corrections": array(obj({
        "eventId": IDENTIFIER, "targetId": IDENTIFIER,
        "goalIds": array(IDENTIFIER, 20, 1), "scopeRef": REFERENCE,
    })),
})


def normalize_selection(payload, owner):
    validate(payload, SELECTION_SCHEMA)
    raw = payload["export"]
    if raw["ownerId"] != owner:
        raise Rejected("Owner mismatch", 403)
    binding = payload["projectBinding"]
    if (binding["state"] != "owner_confirmed" or
            binding["confirmedProjectId"] != raw["projectId"] or
            binding["declaredProjectId"] != raw["projectId"]):
        raise Rejected("Project binding unresolved. Confirm the declared project explicitly; directory labels do not establish identity.", 409)
    # Identifiers/references must not become a side channel for recognized
    # secrets. Free text is handled field by field after exclusion below.
    def safe_metadata(value):
        if isinstance(value, str) and sanitize(value) != value:
            raise Rejected("Unsafe selection metadata", 400)
        if isinstance(value, dict):
            for child in value.values():
                safe_metadata(child)
        if isinstance(value, list):
            for child in value:
                safe_metadata(child)
    safe_metadata({k: v for k, v in payload.items() if k != "export"})
    for key, value in raw.items():
        if key not in ("events", "goals", "skills"):
            safe_metadata(value)
    for group, text_keys in (("events", {"text"}), ("goals", {"text", "expectedBehavior", "userSteps"}),
                             ("skills", {"name", "summary"})):
        for row in raw[group]:
            safe_metadata({k: v for k, v in row.items() if k not in text_keys})
    events = {e["id"]: e for e in raw["events"]}
    records = {r["eventId"]: r for r in payload["records"]}
    if len(events) != len(raw["events"]) or len(records) != len(payload["records"]) or set(events) != set(records):
        raise Rejected("Classify each selected event exactly once", 400)
    if any(len({r["id"] for r in raw[group]}) != len(raw[group]) for group in ("goals", "skills")):
        raise Rejected()
    goal_ids = {g["id"] for g in raw["goals"]}
    if any(not set(e["goalIds"]) <= goal_ids or not set(e["supersedes"]) <= set(events) for e in events.values()):
        raise Rejected()
    if any(not set(g["sourceEventIds"]) <= set(events) for g in raw["goals"]):
        raise Rejected()
    if any(not set(skill["goalIds"]) <= goal_ids for skill in raw["skills"]):
        raise Rejected()
    rows, retained = [], set()
    for event_id, record in records.items():
        kind, role, origin = record["contentKind"], record["role"], record["origin"]
        reason = None
        if kind != "text":
            reason = "excluded_" + kind
        elif role in ("system", "developer", "tool", "assistant"):
            reason = "excluded_non_user_role"
        elif origin == "generated":
            reason = "excluded_generated_record"
        elif re.search(r"(?i)<(?:system-reminder|system_prompt|developer_instructions|private_instruction)\b", events[event_id]["text"]):
            reason = "excluded_instruction_wrapper"
        attribution = "supplied_human_origin" if role == "user" and origin == "human" else "origin_unknown"
        rows.append({**record, "disposition": "excluded" if reason else "retained",
                     "reason": reason or "selected_text", "attribution": attribution})
        if not reason:
            retained.add(event_id)
    # Corrections are scoped assertions, not a request to globally supersede a
    # prior decision. Preserve both records and the explicitly supplied edge.
    edges = {(e["id"], target) for e in events.values() for target in e["supersedes"]}
    corrections = []
    seen = set()
    for c in payload["corrections"]:
        edge = (c["eventId"], c["targetId"])
        if edge in seen or edge not in edges or edge[0] == edge[1]:
            raise Rejected("Correction must identify one explicit edge", 400)
        source, target = events[edge[0]], events[edge[1]]
        if source["kind"] != "decision" or not set(c["goalIds"]) <= set(source["goalIds"]) & set(target["goalIds"]):
            raise Rejected("Correction goal scope must be shared by both records", 400)
        if datetime.fromisoformat(source["observedAt"].replace("Z", "+00:00")) < datetime.fromisoformat(target["observedAt"].replace("Z", "+00:00")):
            raise Rejected("Correction predates its target", 400)
        seen.add(edge)
        corrections.append({**c, "effect": "context_only_no_supersession",
                            "sourceAvailable": edge[0] in retained, "targetAvailable": edge[1] in retained})
    if seen != edges:
        raise Rejected("Each correction requires explicit goal scope", 400)
    result = copy.deepcopy(raw)
    exclusions = []
    result["goals"] = []
    for goal in raw["goals"]:
        source_ids = [i for i in goal["sourceEventIds"] if i in retained]
        if not source_ids:
            exclusions.append({"field": "goals." + goal["id"], "reason": "no_retained_source"})
        else:
            result["goals"].append({**goal, "sourceEventIds": source_ids})
            if source_ids != goal["sourceEventIds"]:
                exclusions.append({"field": "goals." + goal["id"] + ".sourceEventIds", "reason": "excluded_sources_removed"})
    if not result["goals"]:
        raise Rejected("No goal has a retained selected source. Record empty coverage separately; do not invent intent.", 400)
    retained_goals = {g["id"] for g in result["goals"]}
    if any(not set(c["goalIds"]) <= retained_goals for c in corrections):
        raise Rejected("Correction scope has no retained goal source", 400)
    result["events"] = [{**e, "goalIds": [i for i in e["goalIds"] if i in retained_goals], "supersedes": []}
                        for e in raw["events"] if e["id"] in retained]
    for event in result["events"]:
        if event["goalIds"] != events[event["id"]]["goalIds"]:
            exclusions.append({"field": "events." + event["id"] + ".goalIds", "reason": "excluded_goals_removed"})
    result["skills"] = []
    for skill in raw["skills"]:
        ids = [i for i in skill["goalIds"] if i in retained_goals]
        if ids:
            result["skills"].append({**skill, "goalIds": ids})
        else:
            exclusions.append({"field": "skills." + skill["id"], "reason": "no_retained_goal"})
    changes = []
    for group, keys in (("events", ("text",)), ("goals", ("text", "expectedBehavior", "userSteps")),
                        ("skills", ("name", "summary"))):
        for row in result[group]:
            for key in keys:
                values = row[key] if isinstance(row[key], list) else [row[key]]
                for index, value in enumerate(values):
                    if sanitize(value) != value:
                        changes.append({"field": f"{group}.{row['id']}.{key}" + (f".{index}" if isinstance(row[key], list) else ""),
                                        "reason": "recognized_sensitive_value_or_control_removed"})
    result = normalize_export(result, owner)
    for event in result["events"]:
        event["basis"] = "owner_selected_origin_unknown" if records[event["id"]]["origin"] != "human" or records[event["id"]]["role"] != "user" else "owner_asserted_human_origin"
    result["admission"] = {"version": 1, "basis": "owner_supplied_selection_not_source_observation",
                           "projectBinding": {**binding, "directoryDiffers": binding["directoryProjectId"] != binding["declaredProjectId"]},
                           "records": rows, "fieldChanges": changes + exclusions, "corrections": corrections,
                           "sourceRead": False, "processingComplete": False, "executionAuthority": False}
    return result
