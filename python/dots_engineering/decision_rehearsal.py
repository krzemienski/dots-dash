"""Local approval decision parity on the disposable rehearsal snapshot only."""
import json
import math
import re
import sqlite3
import uuid
from datetime import datetime, timezone
from .contracts import Rejected
from .instruction_rehearsal import InstructionRehearsal, validate_operation_size
from .legacy_read import validate_legacy_storage


def decision_input(body):
    if not isinstance(body, dict) or body.get("action") != "decision":
        raise Rejected("Only decisions are supported in this rehearsal", 400)
    request_id, approval_id = body.get("requestId"), body.get("approvalId")
    decision, version = body.get("decision"), body.get("version")
    if (not isinstance(request_id, str) or not re.fullmatch(r"[a-zA-Z0-9_-]{16,100}", request_id)
            or not isinstance(approval_id, str) or decision not in ("approve", "decline")
            or type(version) not in (int, float) or abs(version) > 2**53 - 1
            or not math.isfinite(version) or int(version) != version):
        raise Rejected("Invalid decision request", 400)
    return request_id, approval_id, decision, int(version)


def js_truthy(value):
    # Empty containers are truthy in the existing Node scope guard.
    return value is not None and value is not False and value != "" and not (type(value) in (int, float) and value == 0)


def expiry_allows(value, now):
    if not js_truthy(value):
        return True
    # Supported migration representation: ISO date or timezone-bearing timestamp.
    # Other JavaScript Date coercions are deliberately not guessed.
    if not isinstance(value, str):
        return False
    try:
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
            expiry = datetime.fromisoformat(value).replace(tzinfo=timezone.utc)
        elif re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})", value):
            expiry = datetime.fromisoformat(value.replace("Z", "+00:00"))
        else:
            return False
        return expiry > now
    except ValueError:
        return False


class DecisionRehearsal(InstructionRehearsal):
    """Reuse snapshot ownership/cleanup, replacing instruction mutation with decisions."""

    def save(self, principal, body):
        snapshot = self._authorized_snapshot(principal)
        validate_operation_size(body)
        request_id, approval_id, decision, version = decision_input(body)
        connection = sqlite3.connect(snapshot.as_uri() + "?mode=rw", uri=True, timeout=5)
        connection.row_factory = sqlite3.Row
        try:
            connection.execute("PRAGMA trusted_schema=OFF")
            self._begin_write(connection)
            validate_legacy_storage(connection, self.owner)
            previous = connection.execute("SELECT * FROM approval_decisions WHERE request_id=?", (request_id,)).fetchone()
            if previous:
                if (previous["owner_id"] != self.owner or previous["approval_id"] != approval_id
                        or previous["decision"] != decision or previous["payload_version"] != version):
                    raise Rejected("Conflicting request ID", 409)
                connection.commit()
                return {"ok": True, "decision": dict(previous), "duplicate": True, "executed": False}
            record = connection.execute("SELECT * FROM work_records WHERE id=? AND kind='approval'", (approval_id,)).fetchone()
            if not record:
                raise Rejected("Approval not found", 404)
            data = json.loads(record["data"])
            now = datetime.now(timezone.utc)
            if (not isinstance(data, dict) or data.get("state") != "pending" or record["version"] != version
                    or not expiry_allows(data.get("expiresAt"), now)
                    or not all(js_truthy(data.get(key)) for key in ("destination", "scope", "cost"))):
                raise Rejected("Approval is stale, expired, incomplete, or already decided", 409)
            identifier = str(uuid.uuid4())
            timestamp = now.isoformat(timespec="milliseconds").replace("+00:00", "Z")
            connection.execute("INSERT OR IGNORE INTO approval_decisions(id,approval_id,owner_id,decision,payload_version,created_at,request_id) VALUES (?,?,?,?,?,?,?)",
                               (identifier, approval_id, self.owner, decision, version, timestamp, request_id))
            saved = connection.execute("SELECT * FROM approval_decisions WHERE id=?", (identifier,)).fetchone()
            if not saved:
                raise Rejected("Another decision won the race", 409)
            state = "approved" if decision == "approve" else "declined"
            updated = connection.execute("UPDATE work_records SET data=json_set(data,'$.state',?),version=version+1,updated_at=? WHERE id=? AND version=?",
                                         (state, timestamp, approval_id, version))
            if updated.rowcount != 1:
                raise Rejected("Approval changed", 409)
            task = data.get("taskId") if js_truthy(data.get("taskId")) else None
            connection.execute("INSERT INTO activity_events(id,task_id,type,summary,actor,occurred_at,recorded_at) VALUES (?,?,'decision',?,'Owner',?,?)",
                               ("decision-" + identifier, task, "Decision recorded: " + decision + ". No external execution.", timestamp, timestamp))
            connection.commit()
            return {"ok": True, "decision": dict(saved), "executed": False}
        except BaseException:
            connection.rollback()
            raise
        finally:
            connection.close()
