# Python read compatibility: acceptance before implementation

> Historical design and implementation context. See [current scoped verification](source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Baseline: local reviewed feature commit `027a2c1792b752da942e578cbf5cc5ec24989e97`.
Scope: optional Python GET projections for existing work/history/health routes.
Node remains the only writer. No new credentials, test files or external calls.

| User goal | Actual workflow | Expected observable behavior |
|---|---|---|
| Keep saved work while changing the reader | Save an instruction through the existing API; read with Node and Python | Same persisted ID/body/null task/status; saved_not_delivered and bridge disconnected |
| Preserve decisions and audit history | Record a bounded local approval through Node; read with both backends | Same version increment, decision and activity; executed:false on write |
| Preserve history and provenance | Import labeled synthetic history through the existing authorized importer; read with both backends | Same IDs, kinds, versions, timestamps, counts, nulls, source references and preserved counts |
| Avoid duplicate effects | Replay the instruction and decision requests while Python reads are enabled | One logical instruction/decision and original audit entries |
| Switch back safely | Disable Python reads, save another instruction, re-enable Python reads | All post-switch writes remain visible; no snapshot restoration or data copy |
| Keep reads genuinely read-only | Read via Python repeatedly; inspect database digest and row counts | No database byte changes, writes, schema creation or synthetic records from reads |
| Fail closed | Anonymous/wrong owner, disabled import, missing database, mixed-owner rows, unavailable worker | Denial or explicit unavailable response; no fallback, no missing database creation |
| Retain frontend boundary | Use the existing route names and response envelopes | React receives compatible data; no UI rewrite or alternate frontend API |

Verification will exercise actual local API operations against temporary real
SQLite storage, with controlled synthetic principals injected only into the
in-process verification harness. It will create no authentication credentials
or browser sessions. This supports API/storage behavior, not production auth,
browser validation of this reader option or full Python write migration.
