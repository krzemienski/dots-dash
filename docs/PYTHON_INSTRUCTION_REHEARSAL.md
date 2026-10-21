# Disposable Python instruction-write rehearsal

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

This local prerequisite implements instruction saves in a newly created
scratch SQLite snapshot. It is not connected to the application server,
worker mode or environment configuration. Node remains the application writer.
The earlier feature and read-compatibility branches remain intact.

## Why this boundary

Instruction saves have a small, concrete contract: persist the owner's text as
`saved_not_delivered`, append an audit event atomically and replay the same
request ID without duplicating either record. Implementing this against a
disposable snapshot establishes useful write semantics before deciding whether
to migrate the application writer. It creates no delivery or execution path.

`InstructionRehearsal` opens only the explicitly selected source database in
SQLite read-only mode, validates its known schema/owner isolation and uses the
SQLite backup API to make a consistent snapshot. The scratch directory is
newly generated with private permissions; the snapshot file is mode 0600.
No public method accepts an existing write destination. Every operation opens
only that scratch snapshot, and ordinary exit removes it. The original source
is never opened for writing. A forced process kill may leave scratch files
for the operator to remove; no crash-cleanup guarantee is claimed.

Schema/owner validation is shared with the optional legacy reader. This is
still physically isolated-owner storage, not multi-tenant row authorization.

## Local operator workflow

Use only an explicitly authorized source and an existing private scratch
directory. Do not point this tool at denied session stores, production data
without authorization, or unrelated project files. The tool does not discover
paths, configure authentication, create credentials or access a provider.

```sh
python3 -B python/rehearse_instructions.py \
  --source /absolute/authorized/synthetic.sqlite \
  --scratch-root /absolute/private/scratch \
  --owner synthetic-owner < selected-instruction-operations.json
```

Input is a JSON list of 1–20 instruction operations in the existing API shape:

```json
[{"action":"instruction","requestId":"synthetic_request_001","body":"TEST DATA: retain locally.","taskId":null}]
```

The CLI prints operation outcomes and final work readback, then discards its
snapshot. Input/output can contain owner data and must remain private outside
synthetic examples. `--owner` declares the expected owner for a local operator;
it is not authentication and must never be exposed as an HTTP identity adapter.
Filesystem permission and explicit local operator authority remain required.

There is no production installation step or write-toggle flag. The application
worker explicitly rejects the rehearsal mode. Never wire the CLI into an
application request handler as a shortcut to writer migration.

## Implemented semantics

- Original request IDs and normalized content bind replay. Same ID/content
  returns the original saved row; different body or task conflicts.
- Task references must identify an existing task. Empty/omitted task IDs
  normalize to null, consistent with the existing Node validator.
- Compact UTF-8 operation JSON is limited to 12,000 bytes before field checks.
  Body/task limits use UTF-16 code units, and trimming follows JavaScript
  whitespace semantics. Raw HTTP whitespace/framing is not modeled by the CLI.
- A single `BEGIN IMMEDIATE` transaction includes replay checks, instruction
  insert and audit insert. Failure rolls back the complete save. Separate
  connections serialize concurrent identical requests into one saved outcome.
- A new connection can read the saved projection. Wrong principals, closed
  rehearsals, missing sources and mixed-owner sources are rejected.
- Only instruction operations exist. Decisions, imports, external delivery and
  model execution are unsupported. No source schema is migrated.

## Actual observed workflow

[Acceptance scenarios](verification/python-instruction-rehearsal-scenarios.md)
were recorded before implementation using the project-owned session-review
workflow. Verification used the real CLI, the existing Node API, the Python
rehearsal and actual disposable SQLite files. No test files, credentials,
application tabs, outside agents or external calls were used.

The workflow saved an instruction and read it back on a new connection,
replayed it, changed its body/task, submitted invalid inputs, and compared
Node's statuses and semantic effects on a separate synthetic clone. Generated
UUIDs/timestamps naturally differ between writers; replay identity within each
writer and the instruction/audit content were checked separately.

One discrepancy was observed and corrected: a large Unicode body reached the
Node HTTP byte limit before its field validator, producing 413 instead of the
rehearsal's initial 400. The corrected per-operation boundary produced the same
nine observed Node statuses. An additional 8,001-character ASCII body remained
below the byte cap but correctly failed the field limit with 400. The original
discrepancy is retained in the evidence rather than overwritten.

Two concurrent calls returned the same saved ID, one marked duplicate, with
one instruction and one audit event. A deliberately installed trigger on the
scratch audit table then rejected a real audit insert: neither its instruction
nor audit persisted. Removing that synthetic failure and retrying saved one
outcome. This failure injection is verification setup, not a product option.

The source file hash stayed unchanged; closing the rehearsal removed its
scratch directory. Missing source returned unavailable without creating a
replacement. Mixed-owner source returned 403 before snapshot creation. The
application worker rejected `instruction_rehearsal` with 400.

Workflow observations (historical local artifact omitted from the public package)
retain counts, statuses, semantic comparisons, the discovered mismatch and
its corrected outcome. Build/typecheck and diff whitespace checks passed.
The earlier browser evidence belongs to its earlier feature revision; no new
browser or production identity verification is claimed for this CLI slice.

## Remaining work

This is not full write/API parity, a migration utility or a cutover approval.
It does not establish transport/auth parity, arbitrary malformed Unicode/JSON
compatibility, production load behavior or recovery after forced termination.
Python mutations are intentionally unavailable to the application.

The next useful bounded task is decision-write rehearsal on disposable
snapshots: retain stale/expired/incomplete approval rejection, version changes,
unique decision handling, atomic audit and `executed:false`. Only after both
mutation families and import semantics have evidence should a migration plan
select writer ownership, backup/checkpoint gates and rollback rules for
post-cutover writes. Publication remains blocked; do not push this branch.
