# Owner-asserted snapshot/review associations

> Status reconciliation, 21 October 2026: the later [isolated publication report](verification/source-review-publication.md) exercised the principal paths described here. “Unperformed” and holds below describe the original design/implementation baseline, not the later publication workflow. Not every fault permutation or real-owner/production scenario is verified. See the [product audit](PRODUCT_AUDIT.md) for current source bindings and remaining gaps.

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Baseline: `730cd5af8ce98225bb35094a9668d687c52d5a22`.
The [design and eight acceptance scenarios](SNAPSHOT_REVIEW_ASSOCIATIONS.md)
govern this slice. All eight scenarios remain unperformed. Applies the project
session-intent-review workflow; no source or processing certificate is created.

## Closed contract, defined before implementation

New endpoint: `GET/POST /api/snapshot-review-associations`. GET accepts optional
`snapshotId` and `reviewId`, with complete target lookups and no migrations. When
both are present it offers server-derived candidate pins only for eligible
same-owner/project records. History is scoped to associations touching either
selected target (or all owner associations when neither is selected).

POST requires exactly `format: dots-snapshot-review-association`, integer
`schemaVersion: 1`, `requestId`, `action`, and these action fields:

| Action | Fields |
| --- | --- |
| `create` | `pins` |
| `replace` | `associationId`, `version`, `reasonRef`, `pins` |
| `revoke` | `associationId`, `version`, `reasonRef` |

Pins contain exactly projectId, inventoryId, inventoryVersion, sourceId,
snapshotId, snapshotMetadataDigest, reviewId, reviewVersion, reviewExportDigest,
analysisVersion and hashAlgorithm (`stored-json-digest-v1`). Server resolves
owner, provenance, association identity and time. Client attribution/access
fields reject. Expected versions/digests are checked against complete stored
records inside the write transaction; hash domains are never equated.

An independent host flag defaults off. GET requires the existing owner binding;
POST additionally requires same origin and the host grant. No source target
content is opened. Writes require an existing owner-bound engineering database
and create only new association tables, in the same transaction as the first
accepted operation. No target table or hash is rewritten.

Association rows are immutable. Append-only lifecycle events and a separate
operation/audit namespace implement replacement, revocation and exact replay.
Retention is 100 historical association identities; rejected writes never prune
history. There is no grant from this relation to source-read, parsing, processing,
skill invocation or remediation completion.

## Intended observable behavior

From the inventory panel choose stored snapshot metadata and the selected saved
review, then load the association context. Inspect the separate digests and
owner assertion before saving. Saved history exposes original pins, attribution,
current metadata relevance and lifecycle separately, with navigation back to
each available target. Replacement uses an explicitly selected association,
fresh candidate pins and a reason reference; revocation needs only its expected
version and reason reference. Both retain prior events and targets.

Lost responses retain a frozen payload/ID while mounted; new writes are blocked
until reconciliation. A confirmed mutation followed by failed refresh remains
confirmed. Durable recovery after unmount/reload is not supplied. All UI,
replay/rollback, migration and ownership outcomes require separately permitted
functional evidence; static checks cannot establish them.

## Implemented source and migration boundary

| Source | Source-level behavior, not demonstrated runtime acceptance |
| --- | --- |
| [Association handler](../python/dots_engineering/snapshot_associations.py) | Closed action/pin validation; complete owner-bound target resolution; independent digests; relevance projection; immutable association rows and append-only lifecycle; separate atomic audit/replay. |
| [Worker dispatch](../python/worker.py) and [host transport](../server/engineering.mjs) | Dedicated association methods bypass the review service constructor; host grant defaults false and is checked before replay. |
| [API route](../server/api.ts) | Owner authentication, same-origin writes, bounded JSON and query validation; worker transport failures remain unconfirmed 503 responses. |
| [Host startup](../server/start.mjs) | Only explicit `DASHBOARD_ALLOW_SNAPSHOT_ASSOCIATIONS=true` enables writes. No configuration or capability was enabled during this task. |
| [Browser contract](../lib/work/snapshot-associations.ts) and [association panel](../ui/snapshot-associations.tsx) | Explicit context loading; loaded-selection labels; owner attribution and distinct hash domains; correction/revocation controls; frozen in-memory request reconciliation. |
| [Inventory](../ui/source-inventory.tsx) and [review](../ui/session-review.tsx) | Pass selected metadata into the panel and navigate to full stored records, including IDs outside the latest index page. No original source navigation is added. |

The schema declaration adds five `snapshot_review_*` tables: schema version,
immutable associations, lifecycle events, operations and audit. Only an enabled
POST against an existing regular owner-bound database can initialize them. DDL,
mutation, events, audit and stored response share one `BEGIN IMMEDIATE`
transaction. GET uses SQLite read-only mode and never initializes tables. This
handler creates no database file or directory; it does not instantiate the
existing review `Store`. Existing target schemas, records and hash functions are
untouched by its mutation statements.

An exact previously accepted request replays before checking changed target
pins, after current authentication and capability checks. Different content at
the same request ID rejects. Replacement creates a new identity and supersedes
the old one; revocation appends an event. Historical identities count toward the
100-record bound, so replacement/create can reject at capacity while revocation
remains available. No pruning, reactivation or cross-project replacement exists.

Complete authorized lookup alone can mark a target missing. Lookup failures
clear the context to unavailable/unknown, rather than showing missing or empty
history. Absent owner storage is explicitly unavailable for history counts.
Loaded scope remains visible when the current selection changes; creation uses
matching selected IDs and review version, with all pins checked again by the
server. Metadata versions, material changes and lifecycle are separate labels.
No original-source freshness is inferred, and subsequent access observations or
new snapshots do not silently replace a historical relation.

No SQL connection, migration, API call, application import or browser workflow
was executed in this task. Transaction rollback, database permissions/sidecars,
disk/lock failures, concurrent requests, backup/restore and runtime owner
isolation are unverified. Existing storage remains private; future migration
approval must cover the configured database and its backup/recovery policy.

## Checks and acceptance limits

Performed only static/build checks on final source:

- `node node_modules/typescript/bin/tsc --noEmit` passed.
- `node scripts/build.mjs` passed; generated ignored client artifacts only.
- `node --check server/engineering.mjs` and `node --check server/start.mjs` passed.
- Python `ast.parse` and in-memory `compile` passed for the association module
  and worker; neither was imported or executed.
- Source/report hashes, build-manifest bytes, relative documentation targets,
  ledger JSON and diff whitespace were checked. Exact results are recorded in
  the existing coverage ledger (historical local artifact omitted from the public package)
  under `associationImplementation`; earlier evidence remains historical.

All eight [design acceptance scenarios](SNAPSHOT_REVIEW_ASSOCIATIONS.md#failure-replay-and-acceptance)
remain **unperformed**: reopen either target; distinct hash domains/empty
snapshot; ownership/capability/stale pins; version versus material changes;
later failed reads/new snapshots; correction/revocation/concurrency/reassertion;
lost-response replay/conflict/revoked capability; missing/unavailable/off-index
targets. No test files, runtime fixtures or private content were added.

This slice supplies no ingestion adapter, processor, contiguous progress,
source-access grant, skill invocation, remediation completion or durable retry
after unmount/reload. New association operations are blocked while that panel
has an uncertain pending operation; this is not a global application write lock.

Next task, when specifically permitted: use disposable labeled TEST DATA to
observe the eight scenarios, inspect target-byte preservation and persisted
atomicity/replay, then observe keyboard/reopen/narrow-screen behavior. Keep the
capability off pending that evidence. V301, runtime acceptance and publication
remain held; no push, PR, merge or deployment is part of this change.

## Schema availability and history navigation remediation

Source-review baseline: `ff7dbdb355f486f05c349696385f11f7ed2ee2bd`.
Two source-level gaps were identified; neither was reproduced at runtime.
The earlier implementation evidence remains historical. The ledger's
`associationRemediation` block records the new source commit and static evidence.

1. Target helpers formerly returned the same absence value for a missing schema
   and for a successfully queried missing row. The
   [target resolution helpers](../python/dots_engineering/snapshot_associations.py#L75)
   now reject missing required target schemas as unavailable (503). Snapshot
   resolution checks the supported coverage marker and all three target/parent
   tables before querying a snapshot. Only a successful row lookup can return
   target absence. Missing parent records remain unavailable, as before.
   A missing database still returns unknown storage without initialization;
   existing owner-bound storage with no associations can report empty association
   history when no target lookup was requested. Neither case certifies source
   access or missing original transcripts.
2. A replacement changing both targets could hide its predecessor from the
   selected-target response, and the panel did not expose its recorded
   `replacesId`. The [association panel](../ui/snapshot-associations.tsx)
   now offers an explicit all-owner-history read and predecessor/successor
   controls. These use the existing no-query GET, bounded to 100 historical
   identities under the existing owner binding. Navigation loads that history
   and focuses the referenced association; it does not change target selection
   or association records. Loaded scope states that it spans owner projects,
   and each record shows its project and target IDs. Selected context can be
   loaded again for fresh creation/replacement pins.

If a referenced association is absent from a successful complete retained-history
read, the panel reports that fact without deleting or repairing the reference.
An unavailable read retains unknown status and supplies no empty/missing-history
claim. A failed target lookup still makes the whole association response
unavailable; this change does not add partial history responses. A navigation
control does not grant authority to read original sources or write associations.

Only the two target helpers, association panel and navigation focus style changed
in runtime source. The write transaction, DDL, normalization, pin comparison,
owner/capability gates, replay and append-only event logic are unchanged. No
schema migration was added or applied, and no host flag was enabled.

All eight original acceptance scenarios remain **unperformed**. Two specific
observations are now required within those held scenarios:

- In separately permitted disposable TEST DATA storage, distinguish a missing
  required table/unsupported coverage schema from a successful missing-row
  lookup, including a missing parent table when the snapshot row is absent.
  Unavailable must stay unknown; queried absence may be missing. Include ordinary
  pre-initialization and wrong-owner cases without creating storage through GET.
- Replace an assertion while changing both targets within the same owner/project,
  reopen the successor, and follow predecessor then successor history. Repeat
  after a whole-view reload, with targets outside the latest indexes and with
  writes disabled. Inspect retained pins/events and keyboard focus; distinguish
  unavailable reads from a referenced association absent in complete history.

Performed checks passed: TypeScript no-emit, client-only build, Python
AST/in-memory compilation, source AST/digest comparisons, documentation targets,
build-manifest hashes and diff whitespace. The evidence commit also validates
ledger JSON and records exact results under `associationRemediation`; none
establishes the observations above. No test files or fixtures are added. V301,
all runtime acceptance and publication holds remain binding.
