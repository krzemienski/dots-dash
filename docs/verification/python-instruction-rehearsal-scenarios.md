# Instruction write rehearsal acceptance

> Historical design and implementation context. See [current scoped verification](source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Defined before implementation. Baseline: `5881d496c462f084e4f90a868108a4a8355f7cbd`.
Only a newly created disposable snapshot may receive Python writes. No
application route, environment flag or existing database writer is added.

| User goal | Performed workflow | Observable acceptance |
|---|---|---|
| Save an instruction | Submit a valid instruction with optional task link to a scratch snapshot | Persisted saved_not_delivered instruction and matching audit event; no delivery |
| Recover a save | Reopen the scratch connection and read current work | Same instruction ID, request ID, body and status |
| Retry safely | Submit the same request twice, then change its body or task | Identical replay returns original row; changed content returns conflict without extra audit events |
| Preserve validation | Submit blank/oversized input, unknown task and malformed request ID | Rejection with no write; Unicode length follows existing browser/Node UTF-16 limits |
| Keep save and audit atomic | Make the scratch audit table reject an insert, then save | Neither instruction nor audit persists; retry after removing the scratch failure succeeds once |
| Handle contention | Submit the same request concurrently on separate connections | One instruction and one audit entry; other caller receives the same persisted ID |
| Preserve Node behavior | Perform the equivalent valid/replay/conflict workflow through Node on a separate synthetic clone | Matching statuses and semantic effects; generated IDs/timestamps may differ |
| Preserve live ownership | Complete and close rehearsal | Original source hash unchanged, scratch snapshot removed, Node application writer untouched |
| Fail closed | Wrong owner, mixed-owner source, absent source, unsupported operation | Reject without opening a write path to the source or creating an empty substitute |

Use actual local operations and inspect SQLite outcomes. Synthetic approval or
task fixtures are setup, not evidence of a user creation flow. No test files,
credentials, application tabs, outside agents or external calls are involved.
This verifies instruction semantics only; decisions/imports/full cutover remain
outside the slice.
