# Operation reconciliation after reload — proposed contract

Design only, 21 October 2026. Inspected source: `fb086b81a7f4631c2b2030d4f04fd6f948ffedcf`.
No implementation, migration, client persistence, capability change or runtime
acceptance is included. This addresses priority 3 of the [product audit](PRODUCT_AUDIT.md).

Subsequent implementation: the [manual shared-store receipt lookup](OPERATION_LOOKUP.md)
now provides the first bounded read-only slice described below. The source baseline
and proposal remain historical; registration, retention, migrations and the D1–D12
durable protocol are still unimplemented/unperformed. Its separate 11-observation
lookup evidence does not establish durable discovery or retry after reload.

## Outcome and boundary

After a lost save response, navigation, browser restart or server restart, the
authenticated owner should find the original attempt and its actual stored result
without submitting a replacement. A local commit is not a verified product outcome:
claims stay owner-reported, observations retain failure, and a checklist receipt
still attests only its bounded checks. No provider, source reader, worker queue,
general command runner, automatic retry or cancellation system is proposed.

The first durable protocol should cover **request action claims only**. Its existing
operation digest, request scope and bounded receipt are the clearest foundation.
Session review, context links and retained-review reports are compatibility targets,
not silently covered by that implementation. Inventory/snapshot writes, core Node
instructions/decisions, correspondence and external actions are outside this version.

## Source-backed starting point

| Workflow | Existing evidence | Gap relevant to reload |
|---|---|---|
| Session import/select/run/observe | [UI envelope and phases](../ui/session-review.tsx#L129); [transactional operation store](../python/dots_engineering/store.py#L50) | Body/ID retained only in mounted memory. Shared operation table stores hash/full response, without an action namespace or recovery timestamp. No exact read-only lookup route |
| Request/context links | [pending envelope](../ui/context-links.tsx#L32); [link mutation](../python/dots_engineering/context_links.py#L17) | Same shared operation store. Paging/exact target lookup is not operation lookup. An absent link cannot disprove an attempt |
| Retained-record reports | [operation lookup](../python/dots_engineering/owner_reviews.py#L174); [UI digest comparison](../ui/owner-review-reports.tsx#L26) | Exact lookup exists while operation ID is known. A missing operation is unconfirmed; no durable pre-submission inventory |
| Request action claims | [request-scoped operations and latest 50](../python/dots_engineering/request_claims.py#L147); [UI recovery](../ui/request-action-claims.tsx#L22) | Committed operations are discoverable after reopening the Request, but this cannot discover an uncommitted attempt or prove which lost action the owner intended |

The [Node authentication boundary](../server/api.ts#L15) derives the owner before
reads. Python storage separately verifies physical owner binding. New read-only
lookup must use the [read-only connection convention](../python/dots_engineering/owner_reviews.py#L81),
not instantiate `Store` merely to query: its constructor can create tables/bindings.
Current shared, retained-review and claim operation digests have different
normalization rules. Do not recompute historical hashes using one new convention.
Shared-store and retained-report hashes include their normalized request IDs;
claim normalization excludes `operationId`. Keep those schemes distinct.
Existing operation tables have no general expiry contract; this design does not
authorize deletion or modification of them.

## Options and recommendation

| Option | Benefit | Limitation / decision |
|---|---|---|
| Persist full envelope in localStorage/IndexedDB | Can replay after reload | Reject for this slice: duplicates private exports, observations and prompts in origin storage; account switching, XSS and stale authorization risks |
| Persist only opaque client IDs | Smaller browser footprint | Still origin/account metadata; clearing storage, another device and lost pre-write acknowledgement break discovery. IDs do not prove owner or payload identity. Not selected |
| Search committed server receipts only | Reuses current data; no new payload retention | Recommended first read-only slice, explicitly incomplete for unknown/uncommitted attempts |
| Server metadata registration before submission | Survives reload without persistent browser data; inventories uncertain attempts | Recommended durable follow-up, default off. Requires explicit schema/protocol and retention decisions; not a background executor |

Encryption in browser storage would still require a key and recovery policy and
would not make same-origin compromised code trustworthy. No such security claim
or new key/credential requirement is introduced. The selected design stores no
recovery payload in localStorage, sessionStorage, IndexedDB, service-worker caches,
URL fragments, query strings or browser history. Manual copying of an opaque
operation reference is optional convenience, not the recovery mechanism.

## Minimal durable identity and privacy

Proposed server metadata, versioned independently of existing mutation contracts:

| Field | Purpose / constraint |
|---|---|
| `recoveryId` | Server-generated random opaque identifier; not a bearer credential |
| `ownerBinding`, `storeInstanceId`, `recoverySchemaVersion` | Server-derived physical owner/database/protocol binding; never trust body owner or a browser prefix |
| `domain`, `operationId`, `action` | Fixed allowlisted workflow and action; uniqueness includes the existing operation namespace. Same ID/different domain or content conflicts |
| `payloadDigest`, `digestScheme` | Existing server normalization result and version, kept owner-private; a hash is neither anonymization nor independently observed authorship |
| `targetPins` | Only identifiers, versions and digests required to identify the affected stream; for claims, exact Request and claim/revision if present. IDs can themselves be sensitive |
| `registeredAt`, `retentionClass` | Server time and explicit lifecycle policy, not evidence of execution time |
| `dispositionEvents` | Append-only acknowledgement/attention history; never overwrite a prior failure, unknown outcome or canonical receipt |

Do not persist titles, summaries, transcripts, exported records, observation text,
instructions, evidence bodies, URLs, credentials or full response copies in this
index. The registration handler may validate/normalize the same already-permitted
request body transiently to compute its existing digest, but must neither log nor
persist that body nor invoke the mutation/runner. Avoid copying target names into
errors, logs or metrics. Project/source links confer no recovery or execution rights.

Recovery endpoints require current owner authentication and physical store binding;
unconfigured auth fails closed. Responses use private/no-store and bounded fields.
Use read-only POST lookup bodies to avoid putting operation references in URLs;
the verb does not authorize mutation. No HTTP migration or lazy schema creation.
Wrong owner, unavailable store, invalid schema and absent record remain distinct
internally without disclosing another owner's operation existence. Read permission
may outlive a write capability; a revoked login permits neither.

## Proposed protocol, not an implemented API

1. With a separately disabled host capability and explicit migration, the UI freezes
   its in-memory envelope/operation ID. Before submitting a new claim, it registers
   the attempt with the authenticated server. Registration performs authorization,
   normalizer and target-scope checks but no mutation or local checklist execution.
   Registration replay with identical namespace/ID/digest returns the same metadata;
   changed content conflicts. A lost registration response leaves a discoverable
   uncertain entry, not permission to submit blindly.
2. Only after registration is acknowledged does the UI submit the existing claim
   mutation with the matching recovery reference. The server rechecks current owner,
   capability, body digest and target/version pins at mutation time. Registration is
   not a permission reservation. When this protocol is enabled, new covered writes
   lacking registration reject explicitly; old clients cannot bypass the uncertainty
   gate. Already committed exact legacy replay preserves existing hash semantics and
   current authorization checks. Default-off operation remains backward compatible.
3. Registration and the covered mutation use the same owner-bound engineering DB.
   The mutation's transaction checks registration/stream constraints and commits its
   existing result, audit and receipt atomically. Recovery reads join canonical
   receipts; a separate, fallible post-commit index update cannot be the only proof.
   A crash before commit must leave no successful receipt. No distributed atomicity
   with the Node Request database is claimed; current target pins remain mandatory.
4. On authenticated reload, explicitly opening Recovery reads bounded owner metadata
   (50 per page, stable sequence ceiling plus exact-ID lookup). It does not execute
   or resubmit anything. New writes in the same affected stream remain blocked while
   a registered unresolved attempt exists, including in another tab. The server,
   not only React state, enforces this. Unrelated streams may continue. For an initial
   claim creation use the Request stream; correcting/withdrawing uses its claim stream.
   Broader domain-specific conflict scopes need their own contracts before expansion.
5. Read-only exact lookup verifies owner/store/domain/operation/digest/target bindings
   and projects a minimal receipt summary and safe internal result ID. It never
   returns a raw stored response or fetches referenced material. Open the result
   through its existing authenticated exact-ID route. If that GET fails after the
   commit is established, show **Saved; result unavailable** and offer only refresh.

| Observed state | Required UI meaning / next step |
|---|---|
| Matching canonical receipt | Commit confirmed for that operation and historical pins; current target may be stale, withdrawn or missing. No completion upgrade |
| Registration exists, receipt absent | Outcome unknown: not proof of no commit, rejection, cancellation or safe replacement. Lookup again; no automatic retry |
| No registration/receipt | Not found in this inspected store/scope; historical attempt may predate protocol, have another binding or be absent after restore. No negative execution certificate |
| Auth revoked / schema or store unavailable | Recovery unavailable; retain uncertainty. Do not create a replacement or query another owner/store |
| Mismatched digest/domain/pins | Conflict; preserve both historical identifiers, do not rebind or silently recompute |
| Definitive rejection of one submission | That submission rejected; it cannot disprove an earlier uncertain attempt. Record separately from commit evidence |

After reload the payload is intentionally gone. Recovery is **result discovery,
not durable replay**. There is no “Retry” action unless a separately reviewed flow
can obtain exactly the same authorized envelope and pins; do not reconstruct it
from a receipt, current form fields or old session text. Prepared records are not
jobs. A timeout is not proof that a child exited; no cancellation claim follows.

## Expiry, cleanup and restore constraints

Recommended policy for review: at most 100 active recovery entries per owner for
this first slice; refuse new registration at the bound, without eviction. Retain
unresolved metadata without automatic expiry. Mark it aged after 30 days, but age
cannot clear the stream gate or turn unknown into not committed. This indefinite
minimal retention is a privacy/storage tradeoff requiring explicit acceptance.

For confirmed entries, an owner acknowledgement may retire the discovery entry
after 30 days through explicit maintenance, never a new background scheduler.
Canonical operation receipts, audits, revisions and idempotency keys remain intact;
cleanup must not make a formerly committed ID executable again. Acknowledgement is
not withdrawal, cancellation or acceptance of the underlying product result.
Unresolved deletion/unblocking is deliberately deferred: it needs a transactionally
enforced sealing protocol and proof that late submissions cannot commit. No generic
“forget and retry” control is safe in this version.

Store identity must survive ordinary process restart. An owner change, replacement
database or restore of older backup cannot silently reuse recovery certainty.
Restore needs an explicit generation/reset procedure, new authorization checks and
unknown-state presentation; neither timestamps nor a copied UUID alone prove the
database was not rolled back. Until that procedure is defined and verified, crash
restart with the same database is in scope, backup/restore certification is not.

## Observable acceptance — all unperformed for this design

| ID | Owner-visible scenario | Required evidence |
|---|---|---|
| D1 | Register, commit, lose response, reload and reopen Recovery | Exact matching receipt/result found; one mutation and one audit; no resubmission or client payload storage |
| D2 | Lose registration response before mutation is sent | Same owner discovers unresolved registration; registration replay is idempotent; no claim/runner effect |
| D3 | Reload while mutation is still in flight | Unknown until receipt is visible; server blocks conflicting stream writes across two tabs; unrelated stream allowed |
| D4 | Receipt confirmed, result GET fails; restart browser/server | Commit remains confirmed, only read refresh offered; original failure/negative evidence preserved |
| D5 | Wrong owner, revoked login/write capability, missing or mismatched schema | No leakage/migration; authenticated reads can reconcile after write revocation, while writes/replays still deny |
| D6 | Same ID with changed content/domain/pins, or stale target | Conflict with no duplicate receipt/audit; historical hash schemes preserved; no automatic reassociation |
| D7 | No receipt, absent registration, timeout or unavailable store | Unknown/unavailable clearly distinguished; none unlocks retry or certifies non-execution |
| D8 | 51 entries, active cap, acknowledgement and retention cleanup | Bounded complete navigation; no silent eviction; unresolved remains gated; receipt/idempotency history unchanged |
| D9 | Inspect browser persistence, requests, URLs and structured logs | No recovery payload/client persistence or reference-bearing URL; server index contains only allowlisted metadata |
| D10 | Restart same DB versus deliberate owner/store/restore-generation mismatch | Same-DB recovery works; mismatches fail closed. Backup rollback remains unsupported unless separately proved |
| D11 | Keyboard/error/empty/narrow-screen recovery and interrupted reads | Scope/unknown state announced; focus follows exact result; stale responses cannot replace current owner state |
| D12 | Older committed records lacking registration/namespace | Clearly historical/partial discovery; unknown action cannot be guessed; no claim of all attempts inventoried |

These require future isolated rendered UI/API/persistence workflows with synthetic
data, not new unsolicited test files. Static document review cannot pass them.

## Smallest implementation task and required decisions

**First slice:** add an owner-authenticated, bounded, read-only exact-operation
summary for Session review/context operations and a reviewable Recovery lookup UI.
Reuse existing report/claim lookups where compatible. Do not return full `operations.response`.
For legacy shared-store records without namespace/action metadata, report only what
the stored response and expected digest establish; unknown action/domain stays unknown
and cannot clear a pending operation whose binding is unproved. No registration,
storage migration, persistent client storage or retry-after-reload button in this slice.
Its outcome is useful manual receipt inspection, explicitly **not durable discovery**.

Then implement registration only for action claims, after reviewing (a) the
server-only metadata choice, (b) 100-entry bound and indefinite unresolved retention,
(c) conflict scope and no-unresolved-delete behavior, and (d) explicit migration and
store-generation/restore boundary. A later task must authorize implementation;
this pass expressly stops at design. Applying migration or enabling the capability
on an owner instance needs its own authorization. None permits new credentials,
broader access, provider execution, deployment, merge or changes to other projects.

Project `session-intent-review` guidance was read and manually applied to outcome,
provenance, uncertainty and acceptance boundaries. This is a source/document review,
not invocation of a runner or runtime verification. The appended
[recovery evidence ledger](verification/session-save-recovery.json) records inspected
source hashes and document-only checks without replacing historical runtime evidence.
