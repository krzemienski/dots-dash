# Python first migration and version 3 acceptance

> Current status index: [product and completion audit, 21 October 2026](../PRODUCT_AUDIT.md). Later isolated TEST DATA evidence covers principal context-link, inventory-pagination, association and correction workflows. Earlier blocked/unperformed statements below remain historical; actual-user V301, production integrations and full Python cutover remain open.

> Historical design and implementation context. See [current scoped verification](../verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

## Architecture decision
New backend, adapter, ingestion, orchestration, migration and verification tooling should be Python-first. The existing reusable application has a Node/SQLite server and React/TypeScript client; this is an observed foundation, not a mandate to silently rewrite it or abandon working behavior. Preserve the current frontend as an explicit browser boundary until the owner chooses a different frontend. A browser still requires web assets; do not claim Python has replaced client JavaScript merely because the server changed.

Proposed target: Python application/API and orchestration service, Python runtime schemas and connector protocols, SQLite for isolated local instances with a replaceable transactional store, and the existing React UI consuming versioned JSON/SSE contracts. Select exact Python framework, supported version and deployment runtime during implementation after inspecting operational requirements. No new dependency or framework is claimed installed by this document.

## Safe migration sequence

Current local slice: Python contracts/API/storage are implemented only for
`/api/engineering`, behind the existing Node authentication boundary. The
engineering ledger is a separate owner-bound SQLite database. Existing
`/api/work`, `/api/history`, `/api/health` and their storage are unchanged.
P1 is partial; P2-P5 and V314 cutover/rollback parity are not complete. Removing
the optional bridge returns to the prior runtime without migrating old data.

Subsequent local compatibility slice: an opt-in read adapter now implements
the existing work/history/health GET projections against the same SQLite file.
Node remains the sole writer. Actual isolated API operations established
bounded read parity and reversible reader switching; Python mutations, full
cutover/rollback and V314 remain incomplete. See
[Python read compatibility](../PYTHON_READ_COMPATIBILITY.md).

Instruction-write prerequisite: a local operator rehearsal now saves
instructions only in newly created disposable SQLite snapshots. Save/replay,
conflict, concurrent duplicate handling and atomic audit failure have actual
local workflow evidence. It is not exposed by the application worker and does
not enable Python application writes. Decision rehearsal is documented below;
imports/full cutover remain pending. See [instruction rehearsal](../PYTHON_INSTRUCTION_REHEARSAL.md).

Decision-write prerequisite: a separate disposable-snapshot rehearsal now
supports local choices with atomic decision/state/version/audit effects and
executed:false. Nineteen canonical cases matched the Node API; stale revisions,
concurrent choices and audit-failure rollback have observed local evidence.
This remains outside the application worker. History-import mutation parity,
writer cutover and V314 are not complete. See
[decision rehearsal](../PYTHON_DECISION_REHEARSAL.md).

History-import prerequisite: the disposable rehearsal now covers all nine
history groups within a canonical date/URL/JSON subset. Nineteen cases matched
Node status and persisted semantics; rollback, concurrency and privacy boundaries
have local evidence. Unsupported representations, audit semantics, writer fencing,
cutover/recovery and V314 remain incomplete. No application mutations are enabled.
See [history rehearsal](../PYTHON_HISTORY_REHEARSAL.md).

Compatibility follow-up: event ISO forms and safe integral-number hash spelling
have before/after evidence. The subsequently demonstrated mixed-format chronology
defect is fixed locally by shared instant comparison inside SQLite mutations.
Equal instants retain first accepted evidence; ambiguous affected rows reject;
historical hashes replay unchanged. Twenty reconciliation cases plus concurrent
change/rollback workflows provide disposable evidence. No live records were
inspected or rewritten and no cutover occurred. Other compatibility and V314
gates remain open. See [ordering assessment](../HISTORY_INSTANT_ORDERING.md).

Replay/handoff follow-up: identical concurrent Node history requests now return
one import plus one replay; changed content returns a conflict. Actual disposable
Node→Python→Node history handoff retained post-transfer data and enforced epoch
guards. Matching receipts resolved discarded completed responses; absence or
mismatch stayed unresolved. This is not whole-application cutover, process-crash
recovery, production identity or browser evidence. V314 remains incomplete. See
[handoff scope and readiness](../REPLAY_AND_HANDOFF_REHEARSAL.md).

Fenced restart follow-up: instructions and decisions now share the disposable
guard. Marked sessions support exclusive-controller resume, epoch revocation and
receipt/audit reconciliation. Six recorded owned-process crash scenarios covered
post-commit recovery and pre-audit rollback in Node/Python. Missing outcomes remain
blocked. No live migration, host power-loss, surviving-process supervision or
browser proof follows from this evidence; V314 remains incomplete. See
[restart assessment](../FENCED_RESTART_REHEARSAL.md).

Surviving-worker follow-up: a retained-handle local supervisor verified three
controller-failure phases using actual Node processes and disposable SQLite.
Unconfirmed exits block cleanup/handoff; receipt absence remains unresolved.
Concurrent instruction/decision replay now has matching duplicate responses.
Supervisor-loss recovery and explicit compatibility policy decisions remain
open, as do browser/live identity/load/hosted-storage gates. No production writer
changed; V314 is incomplete. See [supervision assessment](../OWNED_PROCESS_SUPERVISION.md).

Handle-loss follow-up: separate exit-unconfirmed status and lifecycle guards
were verified after an owned supervisor exited before persisting its child's
exit result, both with and without a matching domain receipt. Inconsistent
terminal evidence also blocks. This does not prove live-orphan recovery or
grant retry authority. Compatibility behavior remains unchanged pending the
owner's decision. See [handle-loss assessment](../SUPERVISOR_HANDLE_LOSS.md).

Lifecycle follow-up: a reproduced concurrent launch/cleanup defect now has a
serialized local check/action boundary. Cross-process exclusion, ongoing
uncertainty, stale-epoch denial and normal lifecycle progress were observed on
disposable storage. No live-orphan recovery or full scheduling proof follows;
V314 remains incomplete. See [race assessment](../LIFECYCLE_RACE_GUARDS.md).

Bounded disruption/startup follow-up: lock removal/replacement now rejects via a
durable disposable-session identity binding. Pre-spawn and two post-spawn fault
windows retained ownership and blocked unresolved completion. This grants no
live-orphan recovery or retry authority. V314 remains incomplete; the next UI
recommendation uses existing contracts. See [assessment](../LOCK_DISRUPTION_AND_STARTUP.md).

P0 Capture exact current server routes, persistence behavior, denial defaults and known gaps. Freeze a read-only backup through an approved private process; record schema version and test baseline. Do not migrate private runtime data into source control.

P1 Define Python canonical runtime schemas and emit JSON Schema/OpenAPI; generate or verify TypeScript client types from that contract. Preserve opaque IDs, timestamps, saved-not-delivered semantics and executed:false decisions. Add version negotiation rather than loosely accepting incompatible JSON.

P2 Implement a Python compatibility server for existing /api/work, /api/history and /api/health behavior in an isolated test instance. Default authentication remains deny and import remains disabled. Exercise the real SQLite repository through the same functional contract, preserving idempotency and audit atomicity.

P3 Compare Python and Node read projections on an authorized redacted migration dataset. Never dual-dispatch external actions. Validate counts, hashes, versions, null/date semantics, approval histories and evidence links. Maintain a single authoritative writer during cutover; readers may compare snapshots without creating duplicate events.

P4 Pause new writes, drain or reconcile jobs, take a consistent backup, record final cursor/version, migrate transactionally and switch the API boundary. Test owner auth, persistence, cancellation and stale request rejection. Rollback requires checking post-cutover writes and schema compatibility; never blindly restore an old snapshot over new work.

P5 Retire old write paths only after proof of parity and approved rollback window. Keep compatibility documentation and preserve audit history. New engineering adapters and orchestration run in Python; frontend changes remain limited to the agreed contract boundary.

## Version 3 migration entities
Add owner-scoped ContextLink, ProviderSession, ProjectConfig, HostBinding, WorkspaceBinding, RepositorySnapshot, ExecutionPlan, ExecutionRun, ChildRun, WriterLease, TerminalChunk, CompletionClaim, TestEvidence, DailySummary and NextWorkPrompt. Existing Requests/Tasks/Actions/Evidence remain canonical. Use foreign keys or validated associations; do not duplicate existing correspondence/schedule records into session transcripts. Version each imported export format and normalize only permitted visible fields.

Legacy transcript claims import as unverified claims with export provenance. Existing instruction saves remain undelivered. No host becomes connected and no test becomes passed merely because a migration creates its record. A schema upgrade must not widen account grants, path permissions or read scopes.

## Acceptance gates
| ID | Real functional test | Gate |
|---|---|---|
| V301 | Link an authorized correspondence request to an actual repository task and return | Same request/evidence links persist; no authority or private context leaks across boundaries |
| V302 | Import permitted owner-visible session export for each supported adapter | Format/version and source owner validated; unsupported target stays unavailable; hidden/secret fields excluded |
| V303 | Attempt a denied or out-of-root session/config read using a controlled negative test | No content read, copied or re-routed; denial recorded safely without probing protected contents |
| V304 | Inspect explicitly selected user-owned project configuration | Correct revision and redacted content; no implicit execution or loading of instructions |
| V305 | Observe a real controlled terminal run in read-only mode | Ordered redacted stream, gaps/truncation disclosed, no stdin/signal access |
| V306 | Request a bounded authorized command, then alter hash/revision | Real allowed run executes once; altered or stale request rejected |
| V307 | Run two real subagents on disjoint authorized scopes with parent join | Actual run identities, outputs, tests and parent evidence; no fabricated agent progress |
| V308 | Attempt concurrent overlapping writes and expired writer resumption | Fencing rejects stale writer; user work preserved; unknown process state prevents unsafe reassignment |
| V309 | Cancel a real controlled parent/child job and interrupt host connection | Descendants' actual status reconciled; unknown is not canceled; completed effects retained |
| V310 | Claim completion without test evidence, then attach an actual check | First unverified; second tied to exact revision/environment/result; later edits invalidate relevance |
| V311 | Inject controlled nonsecret redaction canaries and hostile terminal escapes | Output sanitized before retention/display; unsafe content neither executed nor leaked |
| V312 | Generate daily summary and next-work draft from real authorized events | Accurate bounded period, coverage, evidence and corrections; draft cannot silently execute |
| V313 | Revoke host/session adapter capability during a run | New reads/writes stop under policy; cancellation/reconciliation remains bounded; no fallback bypass |
| V314 | Run Python parity/cutover/rollback on controlled actual SQLite instances | No lost history, duplicate effects, permission broadening or wrong-owner access |
| V315 | Independently install second private owner and repeat engineering review | No shared credentials, session data, terminal streams or machine bindings |

V310 partial evidence: [declared-review revision display](../EVIDENCE_REVISION_RELEVANCE.md)
was exercised with an existing real browser artifact, matching and changed local
revisions, and a rejected missing revision. Original results and owner attribution
remain intact. This does not close V310: trusted check/artifact ingestion,
environment validation and live relevant-input invalidation remain unimplemented.

Further bounded V310 evidence: [owned local browser receipts](../OWNED_BROWSER_RECEIPTS.md)
bind a fresh fixed synthetic journey to an application-owned pending run,
retained process handles, measured inputs/environment and immutable artifacts.
Actual interruption, duplicate finalization and integrity rejection preserve
history. This does not add production acceptance, dashboard receipt projection,
automatic live invalidation or lost-coordinator recovery; the full gate stays open.

The subsequent [dashboard receipt projection](../BROWSER_RECEIPT_DASHBOARD.md)
now exposes those local receipts read-only, with actual viewer evidence for
success, interrupted/unknown, missing receipts, duplicate collection, stale
measured files and preserved owner-report attribution. It adds no live monitoring,
recovery or production execution; the broader V310 gate remains open.

The [receipt pagination follow-up](../BROWSER_RECEIPT_PAGINATION.md) adds read-only
access beyond 50 records. Actual isolated acceptance over 53 owned runs covered
page boundaries, repeated/back navigation, concurrent additions, pending-state
readback, invalid cursors and preserved attribution. This closes that browsing
gap only; monitoring, recovery, production verification and full V310 remain open.

The [on-demand runtime relevance follow-up](../BROWSER_RUNTIME_RELEVANCE.md)
compares recorded allowlisted dependency bytes and explicitly bound environment
inputs without execution. Actual isolated UI evidence establishes unchanged,
changed, unavailable, unsafe and restored comparisons plus persisted attribution.
Unmeasurable runtime versions/context/build fields remain unknown; historical
passes are never rewritten. This closes bounded read-time comparison coverage,
not production verification, continuous monitoring or full V310.

V301 source implementation: [local request/task/review associations](../REQUEST_CONTEXT_LINKS.md)
now provide immutable pins and separate permission state in the UI/API. Static
checks passed; actual synthetic browser/API acceptance has not run because of an
automatic approval-review rejection. V301 remains open both for local functional
verification and for an actual authorized correspondence/repository request.

Real subagent tests use the supported executor/orchestration path and permitted resources. They must not create new persistent grants or incur unapproved charges to pass. An isolated test double may test parsing but cannot establish V302, V305-V309 or a live adapter. Each named product needs its own supported-route evidence before its adapter can be advertised.

## Version 3 release gate
Complete the applicable existing functional tests plus V301-V315 for every advertised engineering capability. Record exact revision, environment, permission scope, real run evidence, passed/failed/not-run and remaining gaps. Live sessions, arbitrary shell, public release, new credentials and production migrations remain outside this document's execution authority.
