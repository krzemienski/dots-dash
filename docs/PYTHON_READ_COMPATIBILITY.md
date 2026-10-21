# Optional Python reads for the existing dashboard

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

This local slice advances read compatibility without replacing the Node writer
or moving data. It builds on the separately committed session-review feature.
The existing React client and route names are unchanged.

Set `DASHBOARD_PYTHON_READS=true` in the operator's process configuration to
route authenticated GET requests for `/api/work`, `/api/history` and
`/api/health` through Python. The flag defaults false. It requires the explicit
`DASHBOARD_ENGINEERING_PYTHON` interpreter and the same file-backed
`DASHBOARD_DB_PATH` used by Node. In-memory storage is rejected at startup.
No new environment settings were applied globally by this implementation.

All POST requests still use the original Node implementation. Instruction
saves, decision version checks, idempotency, audit writes and import policy
remain unchanged. Session-review storage is separate. Live providers and
external execution remain unconfigured.

## Read boundary

The existing API authenticates the owner before invoking the fixed worker.
The server chooses the worker mode and database path; clients cannot supply
either. Python repeats the owner check and permits only the three GET routes.
It opens the existing database with SQLite `mode=ro`, enables `query_only`,
disables trusted schema features and reads each response in one transaction.
There are no migrations, schema creation or write statements in the reader.

Only the exact four-table legacy schema and DELETE journal mode used by the
current Node store are supported. Missing databases, unsupported schemas or
journal modes return unavailable. Existing instruction/decision rows belonging
to another owner cause rejection. Since legacy work records/events lack owner
columns, physical owner-isolated storage remains mandatory; this is not a
multi-tenant authorization migration.

The bounded worker transport has a 10-second timeout and 16 MB response cap.
An unavailable reader produces an explicit error; there is no automatic Node
fallback. Read results preserve the existing row fields, sorting, limits,
nulls, JSON data, history counts, bridge state and response envelope. The work
response's `serverTime` is the fresh read time, not a persisted timestamp.

## Reversibility

Disable the flag and restart to return reads to Node. Node has remained the
sole writer, so this requires no data copy, backup restoration or write replay.
Writes made while Python reads were enabled remain in the same database.
This is reader switching, not full backend cutover or a production migration
rollback demonstration. Do not retire Node writes based on this slice.

## Actual verification

Acceptance was defined in
[the scenario document](verification/python-read-compat-scenarios.md) before
implementation. A local in-process API workflow performed actual instruction
saves, approved history imports, a bounded decision, idempotent replays, reader
switching and reopened SQLite readback. Synthetic task/approval rows were
explicit fixture setup because the existing API has no creation endpoint for
them. No test files, credentials, external calls or browser sessions were made.

The controlled principal adapter exists only in that verification harness.
This verifies API/storage behavior, not real authentication. No HTTP listener
or new browser evidence is claimed for this optional reader. The earlier
session-review browser evidence remains tied to its recorded source hashes.

Observed results:

- Empty and populated work/history/health projections matched. Canonical
  payload hashes exclude only fresh `serverTime`; IDs, nulls, timestamps and
  versions remain compared.
- Replays returned the original instruction and decision. Decisions retained
  `executed:false`. After reader switching and database reopen, two instructions,
  one decision and three audit events remained; instructions were undelivered.
- Repeated Python reads left the database SHA-256 unchanged.
- Anonymous/wrong-owner requests returned 401, disabled imports 403,
  mixed-owner storage 403, and read-worker POST 405.
- Missing storage returned 503 without creating a file. An unavailable
  interpreter returned 503 without fallback. The engineering mode still
  returned an empty ledger and unconfigured runner.
- Typecheck, production build and diff whitespace validation passed.

Actual observations and projection hashes (historical local artifact omitted from the public package)
are labeled TEST DATA. Temporary SQLite storage was removed after the workflow.

## Remaining prerequisites

Python mutation parity, runtime contract generation for legacy writes,
concurrent-write recovery, full migration/cutover/rollback and real owner
authentication remain incomplete. WAL or evolved schemas need deliberate
compatibility work. Production-scale response limits have not been measured.

A live provider runner still requires an identified SDK, supported runtime,
authorized tool scope, private trace policy and durable external-outcome
reconciliation. The ambiguous “40-agent SDK runner” is not enough to choose a
vendor or concurrency. No SDK client, credentials or external calls were added.
Publication remains blocked pending direct trusted approval; this slice is
local-only and separate from the previously reviewed feature branch.
