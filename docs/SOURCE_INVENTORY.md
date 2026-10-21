# Owner-reported source inventory: bounded implementation

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Baseline: `7eed436f591e395802b424449158c874bf89af46`.
Applies the repository session-intent-review skill and the
[companion design](build-package/16-source-coverage-checkpoints.md).
This document defines observable acceptance before code changes.

## Scope and acceptance

This slice records inventory and owner-reported access observations, including
metadata for a supplied selection reported read-empty or read-nonempty.
It does not read sources, ingest transcripts, verify supplied hashes, or
implement processing checkpoints. Partial/processed snapshot status remains
unestablished; no saved review, count, skill or checklist upgrades it.

The nine design scenarios remain **functionally unperformed**:

| Design case | This slice's intended result |
| --- | --- |
| Inventory for two tools/project/time; reopen | Persist one bounded inventory and separately added source metadata. Tool/time may explicitly be unknown. |
| No observation, denied, unreadable, unsupported | Keep distinct append-only owner reports; do not attempt access or infer empty. |
| Read-empty without goals | Persist zero-item snapshot metadata atomically with the owner-reported access observation, without a review or invented event. |
| 3-of-5 then 5-of-5 processing | Deferred: no checkpoint input accepted; partial/processed cannot be established. |
| Unknown count, changed content/processor | Snapshot count for a reported successful read must be known. Each read report gets immutable snapshot metadata; no progress is inherited or inferred. General unknown-count snapshots and processors are deferred. |
| Checklist/report/review changes | Coverage records remain independent; none advances processing. |
| Response loss, replay, stale predecessor | Inventory mutations use a frozen request ID/payload and version pin, atomic operation/audit, exact replay and conflict rejection. Processing predecessor semantics remain deferred. |
| Truncated inventory, legacy review, later failed read | Disclose index truncation and selected scope; preserve all bounded selected-inventory history. No backfill from reviews and no whole-transcript coverage claim. |
| Wrong owner/capability disabled | Fail closed before writes; read-only access to previously saved data remains owner-scoped. |

Additional required UI observations: an unavailable read must not appear as an
empty inventory; unresolved saves retain their payload while the view stays
mounted and block new writes; a confirmed save followed by failed refresh must
remain confirmed rather than being resubmitted. Keyboard/reload/narrow-screen
behavior and persisted outcomes require separately permitted functional checks.

## Migration and execution boundary

New companion tables share the host-configured owner-bound engineering SQLite
file. Creation is intended only during the first valid, explicitly enabled
coverage mutation, in the same transaction as that mutation. GET is read-only
and must neither initialize storage nor migrate it. Existing review, operation,
context-link and audit tables are not rewritten. No new configuration is enabled
by implementing this code.

No browser/API workflow, SQLite migration or side-effectful test may run during
this implementation task. Source/AST/type/build checks are allowed and cannot
establish end-user acceptance. Runtime lock contention, disk failure, migration
rollback and UI reconciliation remain unverified until authorized.

## Implemented boundary

- [Python companion](../python/dots_engineering/source_inventory.py): strict
  metadata validation, owner binding, read-only GET, transactional schema version
  1, separate replay/audit tables and immutable access/snapshot records.
- [Host route](../server/api.ts): authenticated `GET/POST /api/source-coverage`,
  same-origin POST, 8 KB request bound and unconfirmed transport failures as 503.
  The fixed Python worker receives a host capability, never a body-supplied grant.
- [UI](../ui/source-inventory.tsx): explicit load, create inventory, add metadata,
  record an access report, display history and unknown processing status.
  Existing saved-review exports and source-coverage/correction projections are
  unchanged; the companion is not populated from them.

`DASHBOARD_ALLOW_SOURCE_INVENTORY` defaults false and enables writes only when the
host operator explicitly configures it as `true`. This task did not set it.
Reading previously saved companion metadata remains authenticated and available
with writes disabled. No provider/source-read/processing capability is added.

GET accepts only an optional `inventoryId` and returns format/schema version,
capabilities, initialization state, a latest-50 index with total/truncation, and
one complete bounded inventory's sources, observations and snapshot metadata.
There is no inventory filter, older-index pagination or processing endpoint yet;
an older known ID can be requested directly. Unknown/malformed queries reject.
Unavailable storage is an error, not an empty result.

POST requires `format: dots-source-coverage`, integer `schemaVersion: 1`,
`requestId`, `action`, and exactly these action fields:

| Action | Required fields |
| --- | --- |
| `create_inventory` | `projectId`, `selectionRef`, `requestedInterval` |
| `add_source` | `inventoryId`, `version`, `sourceRef`, `toolLabel`, `sessionRef`, `declaredInterval`, `declaredAt` |
| `observe_access` | `inventoryId`, `version`, `sourceId`, `disposition`, `observedAt`, `evidenceRef`, `snapshot` |

Optional metadata uses explicit null. An interval is null or exactly
`{start,end}` with increasing offset-bearing ISO times. Read-empty/nonempty
requires exactly `{contentHash,selectionRef,itemCount,selectedInterval}` in
`snapshot`; all other dispositions require null. Read-empty requires count zero;
read-nonempty requires 1–1,000,000. The item unit is owner-reported visible event
records, not original transcript tokens, turns or processed work. General
unknown-count snapshots are deferred. Sanitizer-changing values reject rather
than persisting their raw input. Unknown properties, processing counts,
client-selected basis and owner grants are not accepted.

New IDs, owner binding, receipt times and `owner_reported` basis are server
assigned. A source must belong to the version-pinned inventory. Every accepted
mutation increments that inventory's version except creation, which starts at
1. Matching operation replay returns its original response before checking the
now-newer inventory version; conflicting content rejects. Revoked write
capability gates replay too, so an earlier uncertain write can remain unresolved.

The UI freezes request ID/payload before sending, blocks duplicate submissions,
and retains uncertain attempts while mounted. A first definite rejection clears
the pending envelope; a rejection after uncertainty does not. Confirmed writes
clear the pending operation before refresh. Leaving the view can lose that
in-memory payload; the browser unload warning is not durable recovery. There is
no automatic retry, navigation guard for other tabs, or cross-device reconciliation.

Retention is bounded at 100 inventories, 100 sources per inventory and 200
access observations per inventory. Attempts beyond these limits reject; records
are not silently deleted. Each read report receives a new snapshot metadata row;
hashes are owner assertions, not verified bytes or deduplicated source identity.
An absent original reader remains absent regardless of reported state.

## Evidence and remaining risk

TypeScript checking, client build, Python AST parse/compile and Node syntax
checks passed, including the final API transport-error adjustment. These are
static/compiler results only. No application modules were imported by the Python
check; no SQLite connection or migration executed.
The implementation checkpoint (historical local artifact omitted from the public package)
records hashes, commands and scenario coverage.

First authorized POST may create parent directories and an empty mode-0600
database file before the SQL transaction; a later rejection can leave those
empty filesystem objects. SQL schema/owner binding/mutation/audit/replay commit
together or roll back. Existing file permissions are not changed. Unrecognized
owner binding, incomplete companion schema and unsupported schema versions fail
closed. Operational backup/restore, concurrent writes, disk/lock failure and
actual transaction rollback are not verified. Keep this feature default-off
until its permitted isolated acceptance is performed.

Next: perform the inventory/access cases and mutation reconciliation/rollback
checks on authorized disposable storage, then inspect the actual UI. Processing
checkpoints, provider reads, correction of disputed access reports and broader
coverage remain separate work. V301 and the eight correction-display scenarios
remain unperformed and held; this implementation grants no new execution approval.
