"""Bounded operation identity and durable evidence for local reconciliation."""
import json
from .history_validation import require, string
from .instruction_rehearsal import instruction_input
from .decision_rehearsal import decision_input, js_truthy


def operation_identity(body, owner, digest):
    require(isinstance(body, dict))
    if "action" not in body:
        require(string(body.get("batchId"), 120))
        return dict(kind="history", batchId=body["batchId"], hash=digest)
    if body["action"] == "instruction":
        request_id, value, task = instruction_input(body)
        return dict(kind="instruction", requestId=request_id, hash=digest,
                    expected=dict(owner_id=owner, body=value, task_id=task, status="saved_not_delivered"))
    require(body["action"] == "decision")
    request_id, approval, decision, version = decision_input(body)
    return dict(kind="decision", requestId=request_id, hash=digest,
                expected=dict(owner_id=owner, approval_id=approval, decision=decision, payload_version=version))


def matching_receipt(connection, pending):
    kind = pending["kind"]
    if kind == "history":
        row = connection.execute("SELECT id,data FROM work_records WHERE id=? AND kind='history_import'",
                                 ("history-import:" + pending["batchId"],)).fetchone()
        if row and json.loads(row["data"]).get("hash") == pending["hash"]:
            return dict(kind=kind, id=row["id"], batchId=pending["batchId"], receiptHash=pending["hash"])
        return None
    table = {"instruction": "instructions", "decision": "approval_decisions"}.get(kind)
    if not table:
        return None
    row = connection.execute(f"SELECT * FROM {table} WHERE request_id=?", (pending["requestId"],)).fetchone()
    if not row or any(row[key] != value for key, value in pending["expected"].items()):
        return None
    event = connection.execute("SELECT * FROM activity_events WHERE id=?", (kind + "-" + row["id"],)).fetchone()
    if not event or event["actor"] != "Owner":
        return None
    if kind == "instruction":
        if event["type"] != "instruction_saved" or event["summary"] != "Instruction saved; not delivered" or event["task_id"] != row["task_id"]:
            return None
    else:
        approval = connection.execute("SELECT data,version FROM work_records WHERE id=? AND kind='approval'",
                                      (row["approval_id"],)).fetchone()
        if not approval:
            return None
        data = json.loads(approval["data"])
        expected_state = "approved" if row["decision"] == "approve" else "declined"
        if (not isinstance(data, dict) or data.get("state") != expected_state
                or approval["version"] < row["payload_version"] + 1 or event["type"] != "decision"
                or event["summary"] != "Decision recorded: " + row["decision"] + ". No external execution."):
            return None
        if event["task_id"] != (data.get("taskId") if js_truthy(data.get("taskId")) else None):
            return None
    return dict(kind=kind, id=row["id"], requestId=pending["requestId"],
                requestHash=pending["hash"], basis="Normalized receipt fields and persisted audit evidence")
