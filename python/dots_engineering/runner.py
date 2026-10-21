"""Provider-neutral boundary; the shipped adapter has no shell/network tools."""
from typing import Protocol


class RunnerAdapter(Protocol):
    name: str

    def capabilities(self) -> tuple[str, ...]: ...

    def run(self, review: dict, task: dict, skill: dict) -> dict: ...


class LocalChecklistRunner:
    name = "local_checklist_v1"

    def capabilities(self):
        return ("review_checklist",)

    def run(self, review, task, skill):
        goal_id = task["goalId"]
        events = [e for e in review["export"]["events"] if goal_id in e["goalIds"] and e["status"] != "superseded"]
        observations = [o for o in review["observations"] if o["goalId"] == goal_id
                        and o["revision"] == review["export"]["revision"]]
        results = []
        for check in skill["checks"]:
            if check == "goal_has_action":
                passed = any(e["kind"] == "action" for e in events)
                refs = [e["sourceRef"] for e in events if e["kind"] == "action"]
            elif check == "claim_has_evidence":
                # Export evidence cannot independently prove a claim.
                passed = not any(e["kind"] == "claim" for e in events)
                refs = [e["sourceRef"] for e in events if e["kind"] == "claim"]
            else:
                passed = bool(observations)
                refs = [o["sourceRef"] for o in observations]
            results.append({"check": check, "result": "pass" if passed else "gap", "sourceRefs": refs})
        return {"state": "succeeded", "executed": True, "externalExecution": False,
                "adapter": self.name, "scope": "declarative_checklist_only",
                "checks": results, "productVerification": "not_independently_verified",
                "acceptance": observations[-1]["result"] if observations else "gap",
                "acceptanceBasis": "owner_reported" if observations else "missing_observation"}
