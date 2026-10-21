"""Deterministic evidence-gap analysis, not semantic intent mind-reading."""
from .contracts import digest


def create_review(export):
    findings = []
    superseded = {ref for event in export["events"] for ref in event["supersedes"]}
    for event in export["events"]:
        event["status"] = "superseded" if event["id"] in superseded else "recorded"
    for goal in export["goals"]:
        related = [e for e in export["events"] if goal["id"] in e["goalIds"] and e["status"] != "superseded"]
        if not any(e["kind"] == "action" for e in related):
            findings.append({"kind": "missing_action", "goalId": goal["id"], "sourceEventIds": goal["sourceEventIds"],
                             "critique": "No linked action is present in this export; activity outside its coverage is unknown."})
        if any(e["kind"] == "claim" for e in related):
            findings.append({"kind": "unverified_completion", "goalId": goal["id"],
                             "sourceEventIds": [e["id"] for e in related if e["kind"] == "claim"],
                             "critique": "Completion is a transcript claim. Perform the acceptance steps and attach an observation."})
        findings.append({"kind": "acceptance_gap", "goalId": goal["id"], "sourceEventIds": goal["sourceEventIds"],
                         "critique": "Expected behavior has no recorded end-user observation at this revision."})
    for event in export["events"]:
        if event["status"] == "superseded":
            continue
        if event["outcome"] in ("fail", "blocked"):
            findings.append({"kind": "recorded_" + event["outcome"], "goalId": next(iter(event["goalIds"]), None),
                             "sourceEventIds": [event["id"]],
                             "critique": "A recorded negative outcome remains visible within its stated scope; unrelated passing checks do not close it."})
        if event["kind"] == "evidence" and (event["codeRevision"] != export["revision"] or not event["inputHashes"]):
            findings.append({"kind": "provenance_gap", "goalId": next(iter(event["goalIds"]), None),
                             "sourceEventIds": [event["id"]],
                             "critique": "Receipt has stale revision or missing input provenance. Historical evidence does not establish current behavior."})
        if event["kind"] == "action" and not event["goalIds"]:
            findings.append({"kind": "possible_drift", "goalId": None, "sourceEventIds": [event["id"]],
                             "critique": "Action has no goal association. Review its relevance; this is not proof it was unauthorized."})
    for index, finding in enumerate(findings):
        finding.update(id=f"finding-{index + 1}", basis="rule_inference", status="open")
    tasks = []
    for finding in findings:
        goal = next((g for g in export["goals"] if g["id"] == finding["goalId"]), None)
        tasks.append({"id": "task-" + finding["id"], "findingId": finding["id"], "goalId": finding["goalId"],
                      "status": "draft", "selectedSkillId": None,
                      "applicableSkillIds": [s["id"] for s in export["skills"] if finding["goalId"] in s["goalIds"]],
                      "prompt": "Review-only draft; does not authorize execution.\n"
                      + f"Project {export['projectId']}; revision {export['revision']}.\n"
                      + finding["critique"] + "\n"
                      + (f"Expected observable behavior: {goal['expectedBehavior']}\nUser steps: "
                         + " → ".join(goal["userSteps"]) if goal else "Link the action to a supported goal or record the unresolved scope decision.")
                      + "\nSource events: " + ", ".join(finding["sourceEventIds"])
                      + ". Record observed evidence and pass/fail/gap; never infer success from a completion claim."})
    return {"id": "review-" + digest(export)[:24], "version": 1, "export": export,
            "findings": findings, "tasks": tasks, "observations": [], "runs": [],
            "coverage": "Only this owner-curated export; no live provider or repository observation.",
            "analysisVersion": "evidence-gaps-v1"}
