"""History imports on fresh disposable snapshots; never an application writer."""
import hashlib
import json
import sqlite3
from datetime import datetime, timezone
from .contracts import Rejected
from .history_validation import canonical_json, string, validate_history, require
from .history_time import snapshot_instant
from .instruction_rehearsal import InstructionRehearsal
from .legacy_read import HISTORY_KINDS, records, validate_legacy_storage


def history_projection(connection):
    placeholders = ",".join("?" for _ in HISTORY_KINDS)
    data = records(connection, f"SELECT id,kind,version,data FROM work_records WHERE kind IN ({placeholders}) ORDER BY kind,id", HISTORY_KINDS)
    counts = {}
    for row in data:
        counts[row["kind"]] = counts.get(row["kind"], 0) + 1
    preserved = dict(connection.execute("SELECT (SELECT COUNT(*) FROM instructions) AS instructions,(SELECT COUNT(*) FROM work_records WHERE kind='task') AS tasks").fetchone())
    return dict(counts=counts, preserved=preserved, records=data)


class HistoryRehearsal(InstructionRehearsal):
    def __init__(self, source_database, scratch_root, owner, principal, *, source_account=None):
        super().__init__(source_database, scratch_root, owner, principal)
        self.source_account = source_account

    def save(self, principal, body):
        snapshot = self._authorized_snapshot(principal)
        encoded = canonical_json(body).encode("utf-8")
        if len(encoded) > 900000:
            raise Rejected("Request too large", 413)
        require(isinstance(body, dict) and string(body.get("batchId"), 120))
        digest = hashlib.sha256(encoded).hexdigest()
        marker = "history-import:" + body["batchId"]
        connection = sqlite3.connect(snapshot.as_uri() + "?mode=rw", uri=True, timeout=5)
        connection.row_factory = sqlite3.Row
        try:
            connection.create_function("history_snapshot_ms", 1, snapshot_instant, deterministic=True)
            connection.execute("PRAGMA trusted_schema=OFF")
            self._begin_write(connection)
            validate_legacy_storage(connection, self.owner)
            existing = connection.execute("SELECT data FROM work_records WHERE id=?", (marker,)).fetchone()
            if existing:
                require(json.loads(existing["data"]).get("hash") == digest)
                result = dict(history_projection(connection), replayed=True)
                connection.commit()
                return result
            imported = validate_history(body, self.source_account)
            opportunity_ids = {r["data"]["id"] for r in imported if r["kind"] == "opportunity"}
            for row in imported:
                if row["kind"] == "correspondence":
                    opportunity = row["data"]["opportunityId"]
                    require(opportunity in opportunity_ids or connection.execute(
                        "SELECT id FROM work_records WHERE id=? AND kind='opportunity'", ("opportunity:" + opportunity,)).fetchone() is not None)
                prior = connection.execute("SELECT data FROM work_records WHERE id=?", (row["id"],)).fetchone()
                if prior:
                    prior_data = json.loads(prior["data"])
                    require(isinstance(prior_data, dict))
                    snapshot_instant(prior_data.get("snapshotReviewedAt"))
            now = datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
            for row in imported:
                connection.execute("""INSERT INTO work_records(id,kind,data,version,updated_at) VALUES (?,?,?,1,?)
                    ON CONFLICT(id) DO UPDATE SET data=excluded.data,version=work_records.version+1,updated_at=excluded.updated_at
                    WHERE work_records.kind=excluded.kind AND history_snapshot_ms(json_extract(work_records.data,'$.snapshotReviewedAt'))<history_snapshot_ms(json_extract(excluded.data,'$.snapshotReviewedAt'))""",
                    (row["id"], row["kind"], json.dumps(row["data"]), now))
                if row["kind"] == "correspondence":
                    data = row["data"]
                    outbound = data["direction"] == "outbound"
                    connection.execute("""INSERT OR IGNORE INTO activity_events(id,task_id,type,summary,actor,source_url,occurred_at,recorded_at)
                        VALUES (?,NULL,?,?,?,?,?,?)""", ("history-" + row["id"], "correspondence_" + data["status"],
                        ("Sent: " if outbound else "Received: ") + data["subject"],
                        "Outbound message; actor not established" if outbound else ", ".join(data["participants"]),
                        data["threadUrl"], data["occurredAt"], now))
            connection.execute("INSERT INTO work_records(id,kind,data,version,updated_at) VALUES (?,'history_import',?,1,?)",
                               (marker, json.dumps(dict(batchId=body["batchId"], hash=digest, verifiedAt=body["verifiedAt"], importedAt=now, recordCount=len(imported))), now))
            result = dict(history_projection(connection), importedBatch=body["batchId"])
            connection.commit()
            return result
        except BaseException:
            connection.rollback()
            raise
        finally:
            connection.close()
