# Decision rehearsal acceptance before implementation

> Historical design and implementation context. See [current scoped verification](source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Baseline: `736a938012c4cdb9d10f4a72a3bb1f06d6fb17dd`. Reuse the project-owned
session-intent-review workflow. Python writes only to new disposable snapshots;
Node remains the application writer. No browser or real identity proof implied.

| User goal | Actual local operation | Expected persisted outcome |
|---|---|---|
| Record a bounded choice | Approve one pending item, decline another | State changes, version increases exactly once, one decision/audit per item, executed:false |
| Retry safely | Repeat the original request after approval is no longer pending | Original decision ID returned with duplicate:true and executed:false; no extra writes |
| Reject altered replay | Change decision, approval ID or version under the same request ID | 409; prior choice unchanged |
| Reject stale authorization | Change approval version after reading it, then submit the old version | 409; current-version request can subsequently succeed |
| Enforce scope/expiry | Submit expired, invalid-expiry, incomplete or already-decided approvals | 409 without a decision or audit insert |
| Reject invalid targets/input | Missing or non-approval target, malformed ID/version/choice, oversized request | 404/400/413 as applicable, no write |
| Keep all effects atomic | Reject the scratch audit insert after decision/state update | Decision, state/version and audit all roll back; recovery retry succeeds once |
| Serialize competing choices | Concurrent identical requests; concurrent different choices for one approval | Same request replays once; competing choices produce one winner and one 409 |
| Preserve ownership | Wrong principal, mixed-owner source, closed rehearsal | Denial; no source mutation |
| Compare existing behavior | Submit equivalent choices to Node on another synthetic snapshot | Matching statuses/state/version/audit semantics, excluding generated UUIDs/timestamps |
| Retain isolation | Finish CLI workflow and inspect source/scratch | Source hash unchanged, scratch removed, application worker refuses rehearsal mode |

Approval rows are explicit synthetic setup: there is no existing approval-create
user endpoint. Actual decision API/CLI operations and SQLite readback provide
evidence; generated test files, credentials, application tabs and external calls
are excluded. Full migration remains incomplete.
