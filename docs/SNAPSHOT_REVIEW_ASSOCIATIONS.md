# Snapshot-to-review associations — proposed contract

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Design only. Baseline: `c27b11de752da32565bdfd72c1759987383e6941`.
No implementation, migration, source access or functional acceptance is supplied
by this document. Applies the project
[session-intent-review workflow](../.agents/skills/session-intent-review/SKILL.md).

## User outcome and current gap

An owner can explicitly associate existing inventory snapshot metadata with a
saved review, inspect both records, and withdraw or correct that assertion while
retaining history. The UI says **Owner-asserted context association**; it must not
say that the review was parsed or produced from the supplied snapshot.

The [coverage design](build-package/16-source-coverage-checkpoints.md#L123) only
mentions a future association. The [current inventory contract](../python/dots_engineering/source_inventory.py#L53)
accepts inventory/source/access actions and supplies no review link. Snapshots
store an owner-reported hash, not observed bytes. Conversely,
[review creation](../python/dots_engineering/review.py#L50) hashes a normalized,
annotated export. These are different hash domains. Review versions also change
on observations/skill actions ([service](../python/dots_engineering/service.py#L133));
a version increment alone does not establish changed source material.

## Proposed identity and authority

Define a separate versioned association contract; keep existing exports, reviews,
snapshots, IDs, hashes and analysis outputs unchanged. Resolve complete records
by ID under authenticated owner scope, never by presence in a paginated index.

| Pin | Meaning and constraint |
| --- | --- |
| `ownerId`, `projectId` | Server derives owner; inventory project must equal the review export's declared project. No cross-owner/project association. |
| `inventoryId`, `inventoryVersion`, `sourceId`, `snapshotId` | Validate the complete parent chain and expected inventory version at creation. A matching opaque label is not an identity join. |
| `snapshotMetadataDigest` | Server computes the existing `digest()` over the stored snapshot JSON. This binds metadata, including its owner-reported `contentHash`; it does not observe content bytes. |
| `reviewId`, `reviewVersion`, `reviewExportDigest`, `analysisVersion` | Server computes `digest(review.export)` over its stored normalized/annotated form and compares all expected pins. Do not recompute review IDs or rewrite historical hashes. |
| `associationId`, `version`, `recordedAt`, `basis` | Server assigns identity/time, initial version 1 and `owner_asserted_relationship` basis. The relationship grants no access or execution. |

Use the existing [digest implementation](../python/dots_engineering/contracts.py#L17)
without changing it; name its use `stored-json-digest-v1` in the new contract.
Do not compare `reviewExportDigest` to `snapshot.contentHash` as equality proof.
Never infer a tool, time interval, consent or parser from the association. Empty
snapshots may be associated as context, without creating an event or claiming
they produced the goal-bearing review. Multiple context links are allowed;
reject a second active association for the same snapshot/review pair.

Creation/correction requires a separately default-off host association-write
capability, authenticated owner and same-origin mutation. Client input cannot
choose attribution or grant capabilities. Read access remains owner-scoped.
No ingestion, original-source lookup, model call or processing endpoint is implied.

## Freshness and retained history

Keep relationship lifecycle and metadata relevance separate:

| Read-time observation | Display consequence |
| --- | --- |
| All stored pins match | Metadata pins match; original-source freshness/read coverage remains unknown. |
| Review/inventory version differs but material pins match | Metadata version changed; no source-change or processing inference. Preserve the original version pin. |
| Export digest, analysis version, snapshot digest or parent/project binding differs | Association needs review; show the differing pin and retain the historical link. No automatic relink. |
| Target absent after successful complete authorized lookup | Missing target; retain recorded identity/pins, disable unavailable navigation. |
| Lookup/storage/authorization result unavailable | Relevance unknown; do not call it missing or disclose inaccessible target details. |

New snapshots and later access failures do not silently replace or invalidate a
historical assertion. Present those records independently. Matching declared
timestamps or digests never means a live original source is current.

Lifecycle is `active`, `superseded` or `revoked`, projected from append-only
events. Replace requires the active association's expected version and fresh
replacement pins in the same owner/project scope; atomically append the new
association and a supersession event referencing it. Revoke requires expected
version and an opaque owner-supplied reason reference; append revocation without
deleting the association or modifying either target. Replacement also records a
reason reference. Reasserting a revoked relationship creates a new identity;
never silently reactivate it. Concurrent stale corrections reject.

Revocation withdraws only this relationship assertion. It does not revoke source
credentials, erase access reports, undo analysis or certify remediation. Revoking
the host write capability prevents further mutations, including replay, but
does not erase previously readable owner history.

## Failure, replay and acceptance

Use a separate operation namespace with request ID and canonical payload hash.
Authenticate and check capability first; resolve an exact prior replay before
evaluating changed version pins. Commit association/event/audit/replay response
atomically. Conflicting request reuse, stale pins and invalid references must
leave records unchanged. A transport failure after possible commit stays unknown:
retain the original payload and ID, block replacement writes and reconcile that
operation. Do not invent durable client recovery or automatic retry. GET must
not initialize/migrate storage. This proposal supplies no migration itself.

All prospective scenarios below are **unperformed** and require separately
authorized isolated TEST DATA workflows:

| Action | Observable acceptance |
| --- | --- |
| Associate eligible records and reopen from either side | Both IDs/pins, owner assertion and original evidence bases remain visible. No source-read, parser or completion certificate appears. |
| Different byte-domain/export hashes, or an empty snapshot | Context association may be asserted; no equality/derivation claim and no fabricated goal/event. |
| Wrong owner/project, disabled capability or stale creation pins | Rejected without disclosure or mutation; association authority never expands access. |
| Add an owner observation, then change material pins separately | Version-only and material differences are distinguished; original pins/hashes remain unchanged. |
| Add a later failed read or a new snapshot | Existing association remains historical; no automatic replacement or completion downgrade/upgrade. |
| Correct, revoke, concurrently correct, then reassert | Append-only history; atomic replacement, stale-version rejection and new identity on reassertion. Target records remain unchanged. |
| Lose a response, retry identical content, then conflict/revoke capability | At most one accepted operation/event set; conflicting payload rejects and revoked authority cannot resolve uncertainty through a write. |
| Target missing, read unavailable, or target outside latest index page | Only successful complete lookup establishes missing; unavailable remains unknown; paging alone never breaks the link. |

Contiguous processed progress still requires its own snapshot/processor-pinned
checkpoint and evidence. Association, skill applicability/selection, checklist
success and owner-reported acceptance advance none of it.

## Next implementation prompt

Implement only this default-off metadata association contract and owner-scoped
read display, preserving existing hashes and records. Define closed runtime
schemas and the explicit migration before adding writes; include exact replay,
version conflict and append-only correction/revocation semantics. Keep source
read, parsing and progress unavailable. Record static checks separately from the
unperformed scenarios above; do not execute held workflows. V301, browser/API
acceptance and publication holds remain binding.

The existing coverage ledger (historical local artifact omitted from the public package)
records this design checkpoint separately from implemented behavior.
