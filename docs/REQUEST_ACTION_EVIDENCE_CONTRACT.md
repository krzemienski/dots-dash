# Request action claims and evidence bindings — proposed v1

**Historical design baseline**, based on `c3296c24bd2771206811796444341d685c942126`.
The subsequent [bounded implementation report](REQUEST_ACTION_CLAIMS.md) and its
source-bound ledger record implementation and performed acceptance separately.
No schema, migration, endpoint, receipt resolver or completion certification is
implemented by this document. Actual-user V301 and production identity remain open.

## Outcome and vocabulary

An owner can state one bounded action claim, attach one explicitly selected stored
review event, and inspect the claim, its asserted relationship to that evidence,
the original outcome, uncertainty and correction history from the exact Request.
They can withdraw a mistaken report without erasing it. Nothing changes the
Request's status, completed summary, permissions or source-processing coverage.

| Concept | Meaning and visible label |
| --- | --- |
| Claim | Owner says what occurred or remains unknown: **Owner-reported action claim** |
| Source link | Pointer to request context; neither fetched content nor action proof |
| Performed action | Actual occurrence requires a producer-bound observation. V1 can only display **Owner reports performed** or **Performance unknown** |
| Evidence binding | Owner asserts an event supports, contradicts or contextualizes this claim; not an automatic semantic judgment |
| Verified result | A trusted producer's result for its exact operation, inputs, environment and acceptance scope. Unsupported as a v1 claim state; never inferred from status, URL, imported `sourceKind`, owner report or a passing checklist |

A failed event and a claimed success remain visible together. A targeted pass
cannot erase failure, establish external delivery or complete the whole request.
Historical request-level links are never backfilled into action bindings.

## Reuse and deliberately missing pieces

- Keep Node's canonical `work_records` commitment and existing import hashes
  unchanged. Reuse its exact-ID owner-gated metadata projection, not the first-50
  search list, from the [API/context-link pattern](../server/api.ts).
- Reuse [Python strict contracts and canonical digest](../python/dots_engineering/contracts.py),
  [owner-bound transactional replay](../python/dots_engineering/store.py), and
  [immutable association lifecycle patterns](../python/dots_engineering/snapshot_associations.py).
  Reuse patterns, not existing table names or operation namespaces.
- Bind only a retained normalized `events[]` entry of kind `action`, `claim` or
  `evidence` from an owner-readable review. Preserve its stored `basis`, attribution,
  `sourceKind`, outcome/scope, revision and input hashes; do not rerun normalization.
- [Owner review reports](OWNER_REVIEW_REPORTS.md) establish reported review of
  retained items, not action performance. They cannot be used as success receipts.
  [Owned browser receipts](OWNED_BROWSER_RECEIPTS.md) have stronger producer pins,
  but need a separate trusted resolver and semantic scope contract before binding
  them as verified results. An imported receipt-like event remains imported evidence.
- The [broader Request/Action/Attempt model](build-package/03-functional-technical-spec.md#request-accountability)
  is a target, not an already implemented generic verifier. V1 adds no executor,
  automatic extraction, provider reader, file reader or external receipt upload.

## Minimal persisted contract

Proposed format `dots-request-action-claim`, schema version `1`. New companion
Python tables in the physically owner-bound engineering database: claim identity,
immutable revisions, operation responses and audit. Explicit isolated migration
and append-only protections are prerequisites; enabling the feature never migrates.

| Field | Constraint |
| --- | --- |
| `claimId`, `revision`, `recordedAt`, `ownerId` | Server assigned; positive sequential revision; server UTC time; authenticated owner, never a trusted body field |
| `sourceRequestId` | Canonical `commitment:<id>` key, up to 611 characters; exact lookup with `kind=commitment`, not the shorter engineering ID validator |
| `sourceRequestVersion`, `sourceRequestHash` | Independent positive version and SHA-256 of the exact stored Node `data` UTF-8 string; algorithm `node-stored-json-sha256-v1` |
| `projectId` | Explicit owner-selected engineering project, immutable for this claim; labeled asserted request/project association because commitments lack canonical project identity |
| `actionSummary`, `expectedResult` | Owner-curated plain text, 1–2000 characters each; one bounded action, no instruction execution |
| `performance`, `reportedResult`, `reportedAt` | `reported_performed` or `unknown`; `pass/fail/gap/blocked/unknown`; explicit-zone valid instant or null. All are owner reports, not producer measurements; actor stays unknown |
| `evidence` | Null or one binding described below; missing evidence never becomes success |
| `predecessorRevision`, `reason` | Required for correction/withdrawal; exact prior head and 1–500 character plain-text explanation |

Evidence binding: `reviewId`, `reviewVersion`, `reviewExportDigest`, `eventId`,
`eventDigest`, `analysisVersion`, `codeRevision`, and `relation` (`supports`,
`contradicts`, `context`). Use the existing `stored-json-digest-v1` canonical Python
digest for export/event pins, explicitly distinct from Node's raw-string hash.
The server derives a bounded immutable event snapshot and provenance from storage;
the client cannot supply or override the snapshot, basis, actor or outcome. Its
project must equal `projectId`. Bind to the retained normalized event, never raw
session bytes. Selection does not establish original-source access or authorship.

Unknown fields, unsupported versions/algorithms, invalid instants, malformed IDs,
oversized text, forbidden evidence kinds or mismatched pins reject before writes.
Reuse curated-text sanitization; reject changed text with a sanitized preview for
explicit resubmission, without storing/logging the rejected raw value. Hash the
accepted semantic envelope with Python canonical JSON; no Unicode normalization,
timestamp rewriting or silent pin repair. Client operation ID is transport identity,
excluded from that payload hash; schema/action and all accepted payload fields are
included. Reject bodies over 24 KB. No arbitrary JSON evidence payloads.

## API, identity, freshness and failure behavior

Proposed `/api/request-action-claims`; separate
`DASHBOARD_ALLOW_REQUEST_ACTION_CLAIMS=false` gates all writes. Authenticated owner
reads remain possible after write revocation. Unknown owner or physical database
owner mismatch denies before exposing records or operation existence. First release
uses isolated storage, not shared tenancy. Same-origin POST required. API/runtime
identity is trusted; any caller-supplied owner/provenance/capability field rejects.

POST accepts `format`, `schemaVersion`, `operationId`, `action` (`create`, `correct`,
`withdraw`) and an action-specific strict payload. Create contains the report/pins;
correct contains `claimId`, `expectedRevision`, reason and complete replacement
report/pins; withdraw contains `claimId`, `expectedRevision`, reason only. Server
derives predecessor and lifecycle. Every mutation commits revision, audit and
idempotency response atomically in one owner-scoped operation namespace.

For new writes, Node supplies the exact selected commitment metadata over the
existing internal worker channel; body data cannot replace it. Python independently
checks review/project/event identity and all version/digest pins. Missing exact
target after a successful query is distinct from unavailable schema/transport.
Current means equality at that read, not a cross-database lock or continuing grant.
Store separate request/evidence observation times. A later request edit can race
the Python commit: retain the historical pins and mark stale on the next read;
never claim atomic freshness or silently rebase them.

GET shows each target as `matching_at_read`, `stale`, `missing`, `unavailable` or
`not_bound`. Staleness includes version-only changes even when digest is unchanged.
Return separate mismatch dimensions; unchanged outcome hashes do not refresh an
old review version. Unknown or unavailable targets block new create/correct writes,
but an authenticated withdrawal of an existing report need not read its targets.
No automatic unlink, deletion, refreshed pin or completion promotion occurs.

Return 400 invalid input, 401/403 owner/capability denial, 404 successfully queried
missing target/claim, 409 version/pin/replay conflict, and 503 unconfigured,
unsupported/incomplete schema or unavailable target. Transport/5xx on POST remains
unconfirmed to the client even if the server may have rejected before committing.

## History, replay and navigation

Correction appends a complete new revision with reason; prior text, binding and
outcomes remain inspectable. Request identity and project cannot change in-place.
Correcting pins to a newer snapshot is an explicit revision, not a refresh. Withdrawal
appends a terminal revision, removes the claim from active reports and retains all
history; a later independent claim does not revive the withdrawn record.
Concurrent corrections compare-and-swap the head; one wins, others conflict.

Authenticate and check write capability before replay. Then look up operation ID
before checking current target freshness: identical accepted payload returns the
original response without another revision/audit, even if targets later change.
Changed payload conflicts. Replay never becomes fresh evidence. Read-only operation
lookup can reconcile after write revocation; not-found does not prove no commit.
UI freezes the exact envelope before POST, blocks conflicting writes while uncertain,
and reconciles by lookup or identical replay. Confirmed save plus failed GET is
saved-but-refresh-failed, requiring only a read. V1 mounted-memory recovery loses
the envelope on unmount/reload; disclose this and offer bounded operation history
to inspect before any new submission. Do not silently persist payloads in browser storage.

List claims for one exact request and history for one claim, max 50 per page with
owner/request-bound opaque cursor and immutable sequence ceiling. First page returns
the ceiling; new writes require explicit refresh. Show omitted/remaining scope,
not an all-history claim. Current-head projection reads the complete bounded stream,
never only the visible page; hard limits of 1,000 claims/request and 1,000 revisions/
claim reject further mutation with 409, without truncating prior evidence. Navigate
Request → claim → exact review/event and back via durable IDs; unavailable targets
have disabled navigation and explicit state. Never guess a replacement target.

## URLs and privacy

V1 accepts no new URL field: stored event references remain opaque. Existing
request-level HTTPS links stay in their current context section, with no automatic
conversion. Reuse the [Request UI](../ui/commitments.tsx) protocol/credential checks
before deliberately opening a link with `noopener noreferrer`; do not fetch,
preview, redirect-resolve, embed or scan it. Invalid links stay non-clickable.
Escape all text, do not execute Markdown/HTML, and never render historical text
as an instruction. No private runtime payloads or personal source paths in public
fixtures, logs or commits. Neither sanitization nor a URL allowlist proves that
arbitrary user-supplied content contains no secrets.

## Acceptance before any implementation claim

At this design baseline, all scenarios below were **unperformed design criteria**,
using isolated TEST DATA. Later results belong in the implementation report above.

| ID | Owner action / perturbation | Required observable result |
| --- | --- | --- |
| A1 | View old completed request with URLs; create a claim with no event | Old links remain context; new owner claim says evidence not bound; no verified result or Request status change |
| A2 | Bind one retained event with matching request/review pins, then reload | Exact claim/event and relation persist; original basis, outcome, revision, scope and unknown actor visible; source strings/hashes unchanged |
| A3 | Bind failed event as supporting a reported pass; bind imported receipt-like event | Both results remain visible; asserted relation labeled owner-reported; neither becomes trusted success |
| A4 | Submit other owner/project, forged snapshot, unknown field or unsupported version | Denial before mutation/disclosure; no revision/audit/operation success, no cross-owner lookup |
| A5 | Change request/review version only, content digest only, or event identity | New stale binding rejects; existing history stays pinned with separate mismatch states; explicit correction required |
| A6 | Missing row versus absent/incomplete schema or interrupted target query | Missing differs from unavailable; new writes fail closed; no inferred empty source or completed processing |
| A7 | Correct a claim/binding, race two corrections, then withdraw | One CAS winner; all prior snapshots/reasons visible; withdrawal terminal and independently possible with missing target; no lost failure |
| A8 | Commit then lose response; retry unchanged/changed operation; disable writes | Same envelope yields one revision/audit; changed payload conflicts; disabled write replay denies; owner lookup reconciles; not-found stays unknown |
| A9 | Confirm POST then fail GET; leave/reload during uncertainty | Saved/refresh-failed differs from unconfirmed; no duplicate write; mounted-memory limit disclosed and operation history available |
| A10 | Navigate 51 claims/revisions, insert during pagination, approach retention bound | Bounded stable pages and explicit ceiling; current head not derived from one page; limit rejection preserves history |
| A11 | Keyboard/narrow screen, exact review/event return, missing target, hostile text/link | Focus/readability retained; exact ID navigation; no execution, automatic URL fetch or unsafe clickable link |
| A12 | Compare durable stores before/after read, correction and withdrawal | Only companion writes change; original Requests/reviews/receipts, instructions, status and permissions unchanged; no provider run or processing certificate |

## Smallest safe implementation task

Implement only the owner-report contract above: strict schema, explicit companion
migration, separately disabled API, append-only lifecycle/replay and one Request
detail composer/history panel linking at most one existing normalized event. Reuse
the current request evidence projection and exact review navigation. Implement and
exercise A1–A12 in disposable storage before publication claims; no unsolicited test
files. Do not add trusted receipt ingress, extraction from historical summaries,
multi-action aggregation or a verified/completed transition. Those need a later
producer-resolution and whole-request acceptance contract.
