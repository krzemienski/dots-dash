# Current implementation and gaps

> Historical design and implementation context. See [current scoped verification](../verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Assessment date: October 15, 2026. Based on inspected source files and implementation-owner reports. Changes in progress must be rechecked against the exact revision before release. No personal runtime records are included.

## Two distinct deliverables
The private prototype uses React, a Sites/Vinext worker, hosted authentication, and D1. It contains private runtime integrations and owner bindings that must not be copied into the reusable repository.

The reusable extraction contains React views, the bounded history importer and validators, an empty SQL schema, assistant adapter contracts, and local preview/test tooling. It excludes private prototype server routes, identity bindings, service authorization, source data, deployment configuration, and original Git history; newly authored generic application routes are separate. It now includes a generic Node/SQLite application server and dashboard shell, with authentication denied by default and import disabled by default. It remains unverified as an independently authenticated live integration.

| Capability | Private prototype | Reusable extraction | Remaining proof or work |
|---|---|---|---|
| Persistent work records | D1 implementation | Real SQLite application/store and empty schema | Actual identity adapter and signed-in functional proof |
| Correspondence | Imported messages, filters, timeline, verified-source links | Views and Gmail-specific importer | Live sync, provider-neutral normalization, signed-in browser QA |
| Opportunities | Role, consulting, project/advice categories and detail | Views and schema validation | Generic workflow states and links to requests/actions |
| Schedule and itinerary | Imported personal calendar and optional organization events | Views and imported schedule shape | Live calendar sync, travel segments, recurrence, robust owner timezone |
| Source coverage | Imported coverage disclosures | Coverage record/view support | Measured freshness, connector health and cursors |
| Instructions | Durable save with saved-not-delivered state | Durable application save; delivery unconfigured | Authenticated routing to intended assistant plus receipt |
| Decisions | Version/expiry checks and local audit in prototype | Local decision API and persistence | End-to-end action-time authorization and executor |
| Request accountability | Commitment ledger reported | Commitment/observation components in application | Acceptance, attempts, outcomes, needs-user links and functional evidence |
| Source imports | Bounded manual service ingestion in private boundary | Callable single-owner library | Secure generic HTTP ingress and account isolation |
| Automatic updates | Not established | None | Worker scheduling, reconciliation, durable event stream |
| MCP assistant bridge | Not activated | Proposed only | Supported transport, owner installation approval, receipt and revoke tests |
| Mobile | Responsive web code | Dashboard views | Real mobile browser verification; native iOS not built |

## Evidence boundaries
Existing extraction checks cover isolated validation, importer behavior, empty rendering, type checks, and static build. Those checks do not establish live provider integration, production authentication, cross-owner isolation, browser interaction, concurrent-write safety, or backup restoration. A clean dependency install was not previously established. Rerun supported commands against the final revision and report actual results.

A source-specific fixed correction route is not a general reconciliation system. A manual evidence import is not an active mailbox monitor. A local decision is not external execution. An observed outgoing message does not establish which assistant or person sent it unless independent attribution exists.

## Known architectural debt
- The generic work_records and activity tables lack per-row owner IDs. Choose physically isolated owner storage for the first release or migrate to fully scoped multi-tenancy before any shared deployment.
- Existing assistant contracts use an accepted boolean and omit routing/version/idempotency fields. Migrate to the richer states in this package without treating accepted as delivered.
- The history format is Gmail-specific and uses free-text opportunity states. Normalize through explicit adapters rather than renaming fields and implying universal support.
- Schedule validation needs strict IANA time zones, end ordering, all-day date semantics, recurrence and cancellation handling. Current preview displays UTC, not configurable owner time zones.
- Current snapshot upserts are not a complete maintained revision history. Preserve append-only corrections and versions before claiming full accountability.
- Service host checks and absent Origin headers are not portable authentication. A new deployment needs independent verified session/service identity boundaries.
- Conflicting task and opportunity states require evidence-backed reconciliation. Never silently choose whichever record looks more recent or favorable.

## Release reporting
For every capability report implemented, verified, blocked, or planned; include revision, environment, check time, test method, and limits. Repository creation, local commits, remote push, CI, deployment, and authenticated end-to-end behavior are separate facts. No remote repository or publication is established by this document.

## Subsequent reusable application implementation delta

The extraction now includes the dashboard shell, commitment and observation components, real SQLite store, and generic /api/work, /api/history and /api/health routes. Authentication is an injected server-only adapter and defaults to deny; no production provider is implemented. Owner import remains disabled by default. Instructions persist as saved-not-delivered; local decisions never execute external actions. Twelve isolated tests and real unauthenticated HTTP smoke checks passed. This advances the application foundation but does not close the real-session, signed-in browser, live connector, scheduler, event-stream or assistant-bridge gates in the matrix above. See [application setup](../APPLICATION_SETUP.md).

## Version 3 scope status
The Python backend migration, engineering context graph, permitted session review adapters for Oh My Pi/Cursor/Claude/Codex, user-owned project settings inventory, host/terminal controls, writer fencing, real subagent orchestration, evidence-based daily summaries and next-work drafts are proposed only. No working provider session API, terminal stream, active scheduler or host connection is established here. The existing Node/SQLite application remains the actual implementation until a measured Python migration completes. Documentation and design-contract validation are not operational tests.

## Local session-review implementation delta — 2026-10-16

The optional Python extension now persists sanitized owner-curated exports,
source-linked goals/decisions, rule-based drift and provenance findings,
remediation drafts, selected checklist skills, actual bounded local receipts
and owner-reported end-user observations. The React Day workspace exposes the
integrated flow through the existing authenticated API boundary. The generic
export adapter is implemented; named provider adapters remain unavailable.
Default import and runner policies deny. No private source records are bundled.

Isolated synthetic HTTP and signed-in browser user workflows have been
performed and persisted outcomes inspected. Browser source-navigation and
field-validation defects were fixed and rechecked. Build/typecheck passed.
This is not production identity-provider or provider-agent proof. Detailed evidence and remaining
gates are in [the verification report](../verification/session-review-report.md).

## Local Python read compatibility delta

The optional `DASHBOARD_PYTHON_READS` mode reads existing work/history/health
projections through Python using the same file-backed SQLite store in read-only
transactions. Node remains the sole writer; the mode defaults disabled and
does not fall back silently on errors. Isolated local API workflows verified
projection parity, idempotent writes, reader switching and unchanged database
hashes during reads. No new credentials, browser sessions or external calls
were used. This is not full Python write migration or production cutover.
See [scope and observed evidence](../PYTHON_READ_COMPATIBILITY.md).

## Local instruction-write rehearsal delta

A separate operator tool now rehearses Python instruction saves on disposable
snapshots only. Real local operations established save/readback, replay/conflict,
concurrent duplicate handling and rollback after a scratch audit insert failure.
The source database stayed unchanged, and normal completion removed scratch
storage. The application worker rejects this mode; Node remains its sole writer.
No new credentials or browser work was used. See
[scope, evidence and limits](../PYTHON_INSTRUCTION_REHEARSAL.md).

## Local decision-write rehearsal delta

The disposable-snapshot operator boundary now also supports approval decisions.
Actual CLI/API operations matched Node for 19 bounded cases and demonstrated
stale-version rejection, single version increments, concurrent winner/replay
semantics and rollback of decision/state/audit on an audit failure. All successful
responses retain executed:false. No application write path, credentials or browser
work was added. See [decision evidence and limits](../PYTHON_DECISION_REHEARSAL.md).
History-import write parity and full migration remain incomplete.

## Local history-import rehearsal delta

The disposable Python operator now imports all nine history groups for a
documented canonical subset. Actual API/CLI/storage workflows matched Node in
19 cases and observed replay, monotonic versions, source-account enforcement,
source-link preservation, atomic audit rollback and unchanged source storage.
Unsupported date/URL/JSON representations and inherited immutable audit behavior
remain explicit gaps. Node remains the application writer, imports default off,
and no browser verification is claimed. See
[history evidence and limits](../PYTHON_HISTORY_REHEARSAL.md). Full migration
and writer cutover remain incomplete.

## History compatibility follow-up

Python rehearsal now preserves timezone-bearing ISO event strings and matches
Node hashing for safe integral float spellings. Actual before/after workflows
verified both changes. A synthetic Node sequence also reproduced mixed-format
snapshot ordering that discarded newer evidence and accepted older evidence.
Canonical Python batch timestamps remain required. No fencing or cutover work
was started; first define shared instant ordering and reconciliation without
rewriting historical batch hashes. See
[compatibility evidence](../PYTHON_HISTORY_COMPATIBILITY.md).

## Shared snapshot-ordering delta

Node and the Python disposable rehearsal compare supported timestamps by instant
inside the SQLite upsert, preserving source strings and receipt hashes. Twenty
reconciliation cases matched persisted outcomes; injected concurrent changes and
audit failures verified ordering and rollback. Historical receipts replay; fresh
imports touching ambiguous stored times reject without overwriting. No live data
was inspected or rewritten, and no cutover occurred. See
[ordering evidence and remaining gates](../HISTORY_INSTANT_ORDERING.md).

## Disposable replay and handoff delta

Concurrent Node history requests now reconcile durable receipts after a failed
transaction: identical input replays, changed input conflicts, and absent receipts
do not fabricate success. Actual barrier-controlled requests verified counts and
versions. A history-only disposable controller handed ownership Node→Python→Node
with increasing epochs, retained post-transfer writes, rejected stale leases and
reconciled discarded completed responses. Missing/mismatched receipts stayed
unresolved. No live cutover, full-process recovery or browser claim is made. See
[readiness and evidence](../REPLAY_AND_HANDOFF_REHEARSAL.md).

## Fenced mutation and restart delta

Instruction/decision dispatch now shares the disposable epoch guard with history.
Recovery checks normalized receipts and audit evidence. New private sessions have
file/session identity plus exclusive controller locks; explicit resume advances
epochs before reconciliation. Actual owned-process kills demonstrated committed
receipt recovery and partial-transaction rollback in Node and Python. Missing
receipts stayed unresolved. No live writer change or browser claim is made. See
[restart scope, gaps and evidence](../FENCED_RESTART_REHEARSAL.md).

## Surviving owned-worker delta

A retained-handle supervisor now launches only fixed local Node rehearsal workers
and records confirmed exits. Actual controller failures left workers alive before
dispatch, inside a transaction and after commit; restart/stop/receipt outcomes
were inspected on disposable storage. Unconfirmed exits block handoff and cleanup.
Concurrent identical instruction/decision races now return matching duplicate
receipts; conflicts still reject. Broader policy choices are documented without
dependent changes. See [scope and readiness](../OWNED_PROCESS_SUPERVISION.md).

## Supervisor-handle-loss delta

Controller status now distinguishes unresolved operation receipts from unconfirmed
worker exits. Shared lifecycle checks reject uncertain or inconsistent terminal
evidence. Actual supervisor loss after owned-child exit but before durable exit
recording preserved the blocked state and storage, with or without a receipt.
No live-orphan recovery or retry authority was added; fresh-import compatibility
remains unchanged. See [bounded evidence](../SUPERVISOR_HANDLE_LOSS.md).

## Lifecycle race delta

A reproduced cleanup/launch race could delete disposable storage while a new
worker lived. A per-session lifecycle lock now serializes those checks/actions
and the related controller operations. Actual cross-process contention denies
competing operations, while durable uncertainty and epoch fencing remain intact.
No live writer or compatibility policy changed. See [race evidence](../LIFECYCLE_RACE_GUARDS.md).

## Bounded disruption/startup delta

Lifecycle locks now bind identity in disposable SQLite; removal/replacement cannot
silently establish a second lifecycle lock. Three injected startup failures
retained original ownership and uncertain outcomes. No startup behavior or live
writer changed. The next recommended user outcome is contextual navigation from
remediation to its goal, receipt and verification form using existing contracts.
See [evidence and source-based UI assessment](../LOCK_DISRUPTION_AND_STARTUP.md).

## Remediation navigation delta

Cards now link to their goal, verification form and latest actual task receipt,
with return focus to the initiating card. An isolated Chrome workflow verified
repeated navigation, shared goals, missing receipts, persisted owner-report
readback and unchanged historical receipt semantics. No backend or compatibility
behavior changed. See [browser evidence and limits](../REMEDIATION_NAVIGATION.md).

## Historical assessment display delta

The UI now labels import-time findings/drafts and separately links owner reports
for the acceptance-gap goal/revision. Actual isolated browser readback preserved
historical findings, receipts, negative events and attribution. Independent check
evidence with relevance invalidation remains the prioritized V310 gap, not a
completed gate. See [journey review](../JOURNEY_ACCEPTANCE_REVIEW.md).

## Declared evidence revision delta

Evidence cards now compare recorded evidence and declared review revisions,
visibly identifying a mismatch as stale without changing historical outcomes.
Actual isolated browser imports used the earlier real browser artifact, checked
against its Git source/artifact hashes. Matching, changed and rejected missing
revision cases preserved records and export attribution across reload. This is
metadata relevance; trusted issuer/environment/live-input verification remains
open under V310. No backend, live writer or compatibility policy changed. See
[scope, evidence and authority boundary](../EVIDENCE_REVISION_RELEVANCE.md).

The existing isolated browser workflow has now been assessed as the candidate
V310 producer. Its persisted artifacts match their hashes, but no current
application-owned run/channel authenticates their production. The fixed rehearsal
supervisor cannot adopt a browser run. The [local browser receipt adapter
specification](../V310_LOCAL_BROWSER_RECEIPT_ADAPTER.md) defines the smallest
prospective ownership/channel/receipt boundary. This is design only, not an
implemented capability or a request for new credentials/user design decisions.

## Owned local browser receipt delta

The fixed local adapter now creates pending runs before browser launch, retains
browser/driver handles, receives results through inherited pipes, and writes
immutable receipts after source/environment/artifact and resource checks. Actual
synthetic browser success, interruption with preserved history, duplicate
collection, conflicting receipt denial and changed input/artifact rejection are
recorded in [owned browser receipts](../OWNED_BROWSER_RECEIPTS.md). No old import
is upgraded. The adapter is host-internal and disabled unless explicitly enabled;
the dashboard API, normal runner and Node live-writer authority are unchanged.
No lost-handle recovery, production verification or full V310 completion is claimed.

## Browser receipt dashboard delta

The optional owner-authenticated receipt reader now projects the existing ledger
into Session review's run and evidence views. Actual fresh success, interrupted
and pending runs were viewed in an isolated browser; duplicate collection kept
one row, changed measured files showed stale relevance, and owner reports retained
their attribution/version boundary across reload. No execution/receipt mutation
API was added. Source/bundle comparisons run on reads, not background monitoring.
See [evidence and remaining limits](../BROWSER_RECEIPT_DASHBOARD.md). Production
setup, lost-coordinator recovery and all pending compatibility choices remain open.

## Browser receipt pagination delta

The read-only receipt view now reaches runs beyond the first 50 using anchored
cursors and Older/Newer/Latest controls. Actual isolated acceptance used 53 owned
runs and verified stable membership across insertion, repeated navigation,
missing/unknown distinctions, page-scoped evidence, failure recovery and persisted
owner attribution. State and measurements are reread; reload starts at Latest.
No producer, Python, storage schema, production writer or compatibility policy
changed. See [evidence and limits](../BROWSER_RECEIPT_PAGINATION.md).

## Dependency and environment relevance delta

The owned receipt reader now compares ten allowlisted recorded build dependencies
and explicitly bound runtime files/host facts on each read. Actual isolated UI
refreshes covered unchanged, changed, unavailable, symlinked and unconfigured
inputs, restoration and persisted owner attribution. Seven unmeasurable runtime/
build-context fields remain unknown; original outcomes and hashes stay immutable.
No monitoring, execution, automatic rerun or production writer change was added.
See [the exact allowlist, evidence and limits](../BROWSER_RUNTIME_RELEVANCE.md).

## Request context linkage delta — acceptance pending

A local association API and UI now reference canonical Node commitment IDs from
immutable Python-owned repository-task metadata and session-review pins. Separate
link capability defaults off; links grant no repository, execution or send access.
Source inspection and static checks are complete. Actual synthetic browser/API
acceptance was rejected by automatic approval review and has not run. No V301
completion or production behavior is claimed. See
[scope and blocker](../REQUEST_CONTEXT_LINKS.md).
