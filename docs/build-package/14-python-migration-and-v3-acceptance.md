# Python first migration and version 3 acceptance

## Architecture decision
New backend, adapter, ingestion, orchestration, migration and verification tooling should be Python-first. The existing reusable application has a Node/SQLite server and React/TypeScript client; this is an observed foundation, not a mandate to silently rewrite it or abandon working behavior. Preserve the current frontend as an explicit browser boundary until the owner chooses a different frontend. A browser still requires web assets; do not claim Python has replaced client JavaScript merely because the server changed.

Proposed target: Python application/API and orchestration service, Python runtime schemas and connector protocols, SQLite for isolated local instances with a replaceable transactional store, and the existing React UI consuming versioned JSON/SSE contracts. Select exact Python framework, supported version and deployment runtime during implementation after inspecting operational requirements. No new dependency or framework is claimed installed by this document.

## Safe migration sequence
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

Real subagent tests use the supported executor/orchestration path and permitted resources. They must not create new persistent grants or incur unapproved charges to pass. An isolated test double may test parsing but cannot establish V302, V305-V309 or a live adapter. Each named product needs its own supported-route evidence before its adapter can be advertised.

## Version 3 release gate
Complete the applicable existing functional tests plus V301-V315 for every advertised engineering capability. Record exact revision, environment, permission scope, real run evidence, passed/failed/not-run and remaining gaps. Live sessions, arbitrary shell, public release, new credentials and production migrations remain outside this document's execution authority.
