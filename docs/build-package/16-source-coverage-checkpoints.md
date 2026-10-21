# Persistent source inventory and processing checkpoints — proposed v1

> Historical design and implementation context. See [current scoped verification](../verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Current bounded addition: [selected-record admission](../SELECTED_RECORD_ADMISSION.md)
normalizes an owner-curated selection with supplied attribution, exclusions,
project confirmation and scoped corrections. It does not supply original-source
access, observed-byte evidence, snapshot-derived parsing or contiguous progress.
The broader source-admission matrix and A1–A8 below remain partly design-only;
the new selection workflow is not proof those full scenarios passed.

Original proposal baseline: `799a9c2baf25285f9cd2e7fdb4bd8e6f856dc70f`.
The original model and source observations below describe that baseline.
Subsequent [inventory/access persistence](../SOURCE_INVENTORY.md),
[bounded pagination](../SOURCE_INVENTORY_PAGINATION.md) and
[owner-asserted associations](../SNAPSHOT_REVIEW_IMPLEMENTATION.md) exist in source,
with their functional acceptance still unperformed. Source admission and
processing checkpoints remain design only; no reader or processor is supplied.
This addresses the requirement to retain tool/project/time coverage and processing
checkpoints without claiming that all transcripts were reviewed.

## Source-admission evidence matrix — proposed, not implemented

Documentation baseline: `82245b761968795eade733da46d3d18aab02960e`.
The observable goal is to explain exactly which selected material can enter a
review, why its read is permitted, what was actually observed, and what remains
unprocessed. These are independent evidence dimensions, not a completion ladder.
This section adds no runtime fields, endpoint, permission, import or checkpoint.
Follow the project [session-intent-review workflow](../../.agents/skills/session-intent-review/SKILL.md).

| Dimension | Required evidence in a future admission record | Honest limit |
| --- | --- | --- |
| Documented route | Exact product/version, supported visible export/API format and version, documentation reference and review date; distinguish format support from installation availability. | A discovered route, installed CLI or SDK name does not prove access, consent or an exported session. Unknown route remains unresolved. |
| Scoped authorization | Independently established authorization reference, owner/project, explicitly selected sessions or artifacts, permitted operation/audience, bounded time/selection scope, applicable expiry/revocation and exclusions. | Imported `consentRef`, file possession or an inventory entry cannot grant access. Unknown scope is not all projects or all time. Existing denials remain binding. |
| Observed read | Permitted attempt time, selected scope, outcome, evidence reference and producer/basis; explicitly distinguish no attempt, denied, unreadable, unsupported, unknown, read-empty and read-nonempty. | Route documentation and permission do not prove a read. Metadata listing does not prove transcript bytes were read; later failure does not erase earlier evidence. |
| Sanitized selection | Explicit selection reference, contract/version, owner/project/time bounds, provenance, omitted/unknown scope and data label; admit only already-sanitized permitted visible material. | A selected summary/export is not an exhaustive transcript. Sanitization must not require importing forbidden raw stores or hidden instructions. No actual source or TEST DATA may be relabeled as the other. |
| Snapshot binding | Immutable selection identity, defined item unit/order and count or unknown count; distinguish an owner-reported content hash, a measured supplied-artifact digest and the stored normalized-export/metadata digests. | Never equate distinct hash domains or rewrite existing hashes. An owner-asserted snapshot/review association does not prove byte observation, derivation, parsing or processing. |
| Processed contiguous coverage | Snapshot and processor identity/version, stable item order, evidenced contiguous prefix, previous-checkpoint reference, observation time and attribution. | Without this evidence show no processing checkpoint. Non-contiguous items, review versions, findings, checklist results and owner acceptance reports do not establish completed processing. |

All prospective references must be bounded opaque identifiers, with explicit
unknown values and evidence attribution. They are not fetchable paths or URLs.
Keep authorization applicable at the attempted operation separate from historical
read evidence; revoked permission blocks new access without rewriting history.
Admission must reject mismatched owner/project/selection/time scope before any
new source read or persistence. An existing sanitized artifact may be assessed
only within its separately authorized scope. This proposal supplies no authority
to obtain it, no automatic retry and no fallback around a denial.

### Evidence currently available to this project

| Requested surface | Established evidence | Unresolved boundary |
| --- | --- | --- |
| Owner-selected projects | Requested starting points only. No project-specific inventory references were present in the bounded repository documentation searched during the preceding audit. | References, tool/version, route, scoped authorization, read receipt, selection and processing coverage remain unresolved. Do not fabricate source rows or search their working trees. This is an audit-scope limit, not proof that no inventory exists elsewhere. |
| `dots-visible-session` v1 | Implemented [input contract](../../python/dots_engineering/contracts.py#L45) for owner-curated sanitized JSON; the [identified example](../../examples/session-review.synthetic.json) is TEST DATA. [Input/privacy documentation](../SESSION_REVIEW.md#supported-input-and-privacy) defines selected-export limits. | A format/schema route is not an actual available or authorized session export. No real owner-selected project export or original-source read is established by these artifacts. Goal-bearing v1 requires goals/source events; do not fabricate them for an empty selection. |
| Claude / Oh My Pi (OMP) | [Implemented provider capabilities](../../python/dots_engineering/service.py#L24) mark both unavailable. [Provider-review requirements](13-engineering-contexts-and-execution.md#provider-session-review) require independent product/version, route and permission verification. | No permitted installation-specific session export or metadata surface is established here. The [historical SDK research](15-runner-research.md) concerns candidate execution runners; it is not transcript access or an authorization grant. |

No runtime inventory was read or populated for this matrix. Development ledgers
are evidence of project work, not a list of all user tools/projects/sessions or
their processed checkpoints. Unknown intervals, excluded sources and missing
inventory references must stay visible rather than produce a coverage percentage.

### Prospective source-admission acceptance

Every scenario is **unperformed**. These are requirements for a future separately
authorized isolated export workflow, not instructions to execute held validation
or to create fixtures now. Use labeled TEST DATA for validation; an eventual
owner export requires its own established selection and permission.

| ID | Future action | Required observable outcome |
| --- | --- | --- |
| A1 | Supply an explicitly authorized, already-sanitized selected export within one owner/project/time scope. | Show route, authorization, read evidence, selection and snapshot binding separately; only supported evidence advances its corresponding dimension. Processing stays without a checkpoint until separately evidenced. |
| A2 | Present a documented route without authorization, or only permitted session metadata. | No transcript read or read-success claim. Show unresolved authorization or metadata-only observation; do not infer visible export availability. |
| A3 | Supply a different owner/project, an excluded session/selection, an out-of-scope interval, or a revoked grant. | Reject admission/new access without persistence or disclosure outside the authorized scope. Do not broaden permission or silently trim the selection into a purported match. |
| A4 | Present an unsupported format or material that fails the sanitized-input contract. | Reject the candidate without retaining forbidden payload content or attempting private-store recovery; record only permitted bounded failure evidence. TEST DATA remains labeled TEST DATA. |
| A5 | Observe a permitted empty selection, an unavailable read and an unattempted source separately. | Empty requires actual attributed read evidence and no invented goal/event; unavailable and unattempted remain distinct. None proves no work occurred. |
| A6 | Bind supplied material, then change selection/content or compare its hash with a normalized review digest. | Preserve original identities and hash domains; changed material needs a new snapshot. Association alone establishes no read or processing receipt. |
| A7 | For five stable ordered items, evidence processing of items 1, 2, 4 and 5, then later item 3 under the same snapshot/processor version. | Initial contiguous prefix is 2, not 4 or 5. Prefix 5 requires evidence for every item including the gap and a valid predecessor append; earlier history remains. Unknown total never becomes a percentage or complete state. |
| A8 | Change snapshot/processor version or append a checklist, owner acceptance report or newer review version. | No inherited prefix or processing advance. Exact checkpoint replay/conflict rules remain required; completed supplied-snapshot processing never means all transcripts reviewed or remediation complete. |

Next bounded design task: define the versioned admission contract and its evidence
references against this matrix before implementing any source reader or processor.
Populate real project references only from a separately supplied authorized
inventory; leave missing owner-selected project entries unresolved. Preserve v1 exports and
existing hashes. The coverage ledger (historical local artifact omitted from the public package)
records this documentation checkpoint separately. The eight association scenarios,
inventory/pagination acceptance, V301, runtime validation and publication remain held.

## Observable outcome, defined before implementation

An owner can reopen a selected project/time inventory and distinguish:
an inventoried but unread source, a denied/unreadable/unsupported source, a
successfully read empty selection, and a partly or fully processed **specific
supplied snapshot**. Each state retains its attribution and evidence. A completed
snapshot must never turn into “all transcripts reviewed.”

The current [coverage projection](../../lib/work/source-coverage.ts) and
[display](../../ui/source-coverage.tsx) correctly describe selected-export-only
coverage and unknown original reads. The missing behavior is persistence of
these distinctions, not an observed false-completion label.

The [v1 export](../../python/dots_engineering/contracts.py) requires source-linked
goals, so a truly empty source cannot be recorded without fabricating an event.
The [review response](../../python/dots_engineering/service.py) counts saved
reviews, not source reads. The [store](../../python/dots_engineering/store.py)
retains review snapshots and operation replay, but no source inventory or
processing cursor. `capturedAt` is not a reviewed time interval;
`review.version` changes on selection/observation/run and is not processing
progress. Neither a saved analysis version nor event count proves an original
transcript was read. Existing checkpoints under `docs/verification/` document
development work; they are not owner coverage records in the product.

## Proposed companion model

Use `dots-source-coverage` version 1 independently of `dots-visible-session` v1.
Keep the existing export, review hashes and API contracts intact. Reject unknown
fields on new mutation payloads. The following field names define the proposed
model; they are not fields accepted by the current API.

| Record | Required fields and meaning |
| --- | --- |
| `InventoryScope` | `id`, authenticated `ownerId`, `projectId`, `requestedInterval` (explicit offset-bearing `start`/`end`, or null), `selectionRef`, `createdAt`, `version`. The interval is the owner's selected scope, not proven coverage. |
| `SourceEntry` | `id`, `scopeId`, `sourceRef`, `toolLabel` (owner-supplied label or null), `sessionRef` (opaque or null), `declaredInterval` (start/end or null), `declaredAt`, `basis: owner_reported`. Listing an entry means inventory only. Unknown tool, time or session remains explicit. |
| `AccessObservation` | `id`, `sourceId`, `observedAt`, server `recordedAt`, `disposition`, `basis`, `evidenceRef`, `snapshotId` (or null). Append only; it describes one attempt, not permanent source health. |
| `SourceSnapshot` | `id`, `sourceId`, `materialKind: supplied_export`, `contentHash`, `selectionRef`, `itemCount` (nonnegative or null), `selectedInterval` (or null), `recordedAt`, `basis`, `evidenceRef`. Immutable identity for exactly the supplied sanitized material; no original-store paths or credentials. |
| `ProcessingCheckpoint` | `id`, `snapshotId`, `processorId`, `processorVersion`, `processedPrefixCount`, `previousCheckpointId` (or null), `observedAt`, server `recordedAt`, `basis`, `evidenceRef`, `reviewRef` (or null). Append only, pinned to the immutable snapshot and processor version. |

All IDs/references are bounded opaque labels. Reuse existing identifier, reference
and hash restrictions where applicable. No URL/path resolution or source discovery
is implied. Labels must be sanitized before storage and must not contain raw
provider payloads, private instructions or secrets. The authenticated owner is
server-derived; an imported owner field cannot grant access.

`requestedInterval`, `declaredInterval` and `selectedInterval` each mean different
things. Null means unknown, not “all time.” Validate start before end; use
half-open intervals `[start, end)`. Never derive a coverage interval from first/
last event timestamps or capture time: omitted events and intervening gaps are
unknown. Do not infer a tool from `sourceKind`, source-reference prefixes, a skill
name or the dashboard runner.

## Access and processing are separate dimensions

Allowed access dispositions:

- `read_nonempty`: supplied sanitized material was read; requires a snapshot
  with a known positive item count.
- `read_empty`: supplied selection was read and contained zero items; requires
  a zero-item snapshot. This is neither failure nor proof no work occurred.
- `denied`: access was refused; no snapshot from that attempt. No alternate read.
- `unreadable`: an authorized attempted read failed; no snapshot from that attempt.
- `unsupported`: no supported reader/format; no snapshot from that attempt.
- `unknown`: result of the attempt is unconfirmed; never coerce it to empty.

No access observations means **not observed**, not denied or unreadable. A later
failure retains prior read observations and snapshots, with dates and attribution;
it does not erase their history or establish current source availability. These
records concern the supplied selection. Original transcript read coverage remains
unknown unless a separately supported, permitted adapter establishes that scope.

`processedPrefixCount` counts a contiguous prefix of stable, ordered items in the
same immutable snapshot. It is not the last item seen, a timestamp watermark, a
count of findings or a count of successful outcomes. Gaps cannot be skipped.
An importer must define the item unit and deterministic order in its versioned
adapter contract before any checkpoint can be accepted.

For known item count N > 0: no checkpoint means **no processing checkpoint**;
an attributed count of 0 means **unprocessed**; 0 < count < N means **partial**;
count = N means **processed supplied snapshot**, always qualified by basis.
A zero-item snapshot says **read-empty; no items to process**. For unknown N,
display the recorded count and **completion unknown**, never a percentage or
processed-complete state. Counts must be nonnegative and cannot exceed known N.

Owner assertions render as **owner-reported**, including “owner-reported processed
supplied snapshot.” `adapter_receipt` is reserved for a supported server-controlled
producer binding the snapshot hash, processor version and performed operation;
clients cannot select that basis to certify themselves. No such producer is
shipped by this proposal. A local checklist receipt, skill selection or end-user
observation must not advance processing or accessibility.

## Persistence, replay and compatibility decisions

Add companion tables through an explicit migration in owner-bound engineering
storage; do not repurpose `reviews`, audit snapshots or existing operation IDs.
Create a separate default-off capability for coverage writes. Reads remain
authenticated and owner-scoped; writes require the existing same-origin boundary.
No route or capability is enabled by this document.

Inventory entries, observations, snapshots and checkpoints retain immutable
provenance. A disputed observation/checkpoint remains historical; correction
semantics need an explicit follow-up contract before a newer entry can be
presented as resolving that dispute. Source selection or content-hash changes
create a new snapshot. Do not transfer progress across snapshots or processor versions.
Inventory changes increment its version; progress additions do not imply the
source list was exhaustively enumerated.

A checkpoint append uses a request ID and normalized payload hash, plus
`previousCheckpointId` as compare-and-set within
`(owner, snapshot, processorId, processorVersion)`. Replay identical requests
without another row; reject conflicting request reuse and stale predecessors.
Commit the checkpoint, operation response and audit together. A lost response
is unknown until the same operation is reconciled; it must not synthesize success.
All referenced rows must belong to the same owner and inventory project scope.

Legacy v1 reviews remain **selected export only / original read unknown**.
Do not backfill access success or progress from a review's existence/version.
A later explicit association may link a review to a snapshot, but association
alone supplies no read or processing receipt. Preserve all prior hashes.

Any inventory list must disclose truncation, filter scope and missing pages.
An inventory summary may count its entries by observed state, but its denominator
is **entries in this selected inventory**, never all sessions, tools or transcripts.
Do not publish a percentage until the selected denominator and any paging gaps
are explicit. Inaccessible sources remain visible gaps.

## Prospective acceptance and next implementation

Every case below is **unperformed**, not a test result:

| Authorized hypothetical action | Observable acceptance |
| --- | --- |
| Save entries for two tools in one project and bounded requested interval; reopen the inventory. | Tool/project/selection scope persists, unknown declared time remains unknown, and the list never claims completeness beyond that inventory. |
| Save an entry without an access observation, then append denied, unreadable and unsupported observations. | Distinct reasons and history; no read attempt or empty result inferred by the application. |
| Record a successfully read empty supplied selection without any goals. | Empty snapshot persists independently of v1 review imports; neither failure nor completed work is asserted. |
| Record a 3-of-5 contiguous processing prefix, reopen, then append 5-of-5 at the same snapshot/processor version. | Partial then processed-supplied-snapshot, with attribution; historical checkpoint retained, no whole-transcript or remediation completion. |
| Record progress for unknown count, changed content, or a changed processor version. | Unknown count never becomes complete; new identity does not inherit progress. |
| Add a checklist receipt, owner acceptance report or newer review version. | Coverage and processing checkpoints do not advance. |
| Replay a checkpoint after response loss; submit conflicting replay or stale predecessor. | One accepted checkpoint/audit, exact replay reconciliation, conflicts rejected atomically. No automatic execution retry. |
| Load a truncated inventory, old v1 review or a source with a later failed read. | Explicit partial list, unknown original read, and retained historical evidence; no unqualified “all transcripts reviewed.” |
| Attempt cross-owner references or writes with coverage capability disabled. | No read/write disclosure or mutation; no grants broadened. |

The original inventory/access implementation step now has the source-only
follow-ups linked above. Next resolve the admission contract and one explicitly
supported supplied-export item unit before adding processing checkpoints.
Validate with permitted synthetic storage/UI workflows only when specifically
authorized; static checks alone cannot close these outcomes.
Do not bundle provider discovery, actual transcript reads, automatic execution,
the denied V301 workflow or publication.

The source/work checkpoint (historical local artifact omitted from the public package)
records inspected sources, documentation checks and remaining functional gaps.
