# Implementation milestones and dependency graph

Each milestone ends in a reviewable commit or pull request, a test report against that revision, and an updated capability matrix. A blocked approval or missing provider API pauses only dependent work. Do not mark a milestone complete because its UI renders.

## Dependency graph
M0 baseline and privacy -> M1 secure application foundation -> M2 correspondence -> M3 schedule and itinerary.

M1 -> M4 request accountability; M2 and M3 provide associations to M4.

M1 -> M5 source workers and reconciliation; M2/M3 adapters feed M5.

M4 + approved supported bridge -> M6 assistant delivery and bounded decisions.

M2 + M3 + M4 + M5 -> M7 independent-owner release hardening.

M7 -> M8 native iOS. M7 + license + explicit publication approval -> M9 public release.

Correspondence and schedule remain the first user-visible implementation priorities. M4 and M5 can proceed in parallel after M1 using agreed contracts. M6 may stay explicitly unconfigured without blocking a useful read-oriented release.

## M0 Baseline and privacy
Inspect source, existing checks and private/reusable boundaries. Inventory implemented versus planned features. Establish fresh private repository history and exclude runtime data. Confirm license is pending. Reproduce supported checks and record blocked clean-install steps. Gate: exact revision, no private data in export, honest capability ledger, reviewed plan. Local commit and remote push are separate deliverables.

## M1 Secure application foundation
Implement owner bootstrap, session checks, isolated storage binding, migrations, API runtime schemas, request correlation, idempotency and atomic audit/outbox. Generate OpenAPI from actual implemented routes. Gate: empty-instance login/read/write, wrong-owner/anonymous rejection, concurrent command integrity and restart persistence. No production seeds.

## M2 Correspondence first
Implement actual email read adapter, bounded backfill and incremental normalization, thread/message UI, source links, direction/attribution and reply-needed basis. Preserve date precision and unknown delivery/read states. Gate: controlled authorized sent and incoming messages appear once in the correct thread, original source agrees, reconnect/replay causes no duplication, and signed-in browser navigation works.

## M3 Schedule and itinerary
Implement actual calendar reads, personal/subscription distinction, recurrence exceptions, cancellations, owner timezone and all-day semantics. Add itinerary grouping only for verified segments. Display real scheduler definitions and runs when supported. Gate: authorized test event, reschedule, cancellation, all-day and daylight-saving cases reconcile correctly; provider scheduler state is read back before it is labeled enabled.

## M4 Request action evidence ledger
Implement request acceptance, task/action/attempt/outcome links, Done/Pending/Next/Needs you, artifacts, role/consulting associations and immutable corrections. Gate: one controlled authorized request can be traced through its real action and receipt; failed/blocked substeps remain visible; completion needs evidence; contradictory records surface reconciliation rather than fake success.

## M5 Maintained history and real updates
Implement workers, provider cursors, durable outbox, measured coverage, reconnect replay, source failure handling and reconciliation schedule. Gate: event replay and source interruption recover to authoritative snapshot, configured worker actually runs, timestamps remain distinct, and freshness targets are measured under declared conditions.

## M6 Assistant bridge and decisions
Discover supported transport; obtain required owner approval before installing/granting access. Implement narrow owner-scoped tools and revocation first. Implement reverse delivery only if actually supported. Gate: exact destination receipt and assistant acceptance for a controlled request, unknown-outcome recovery, no cross-owner delivery, expired/replayed approval rejection. If unsupported, ship unconfigured state and an explicit blocker instead of a substitute assistant.

## M7 Private independent-owner release
Complete clean installation, auth/privacy review, functional tests, browser/mobile accessibility, retention/export/recovery, observed operational monitoring and second isolated owner setup. Gate: no shared secrets/data, all advertised features pass live functional acceptance, documented gaps, reproducible setup. Review license and costs; no public release yet.

## M8 Native iOS
Choose native framework after web/API stability. Implement secure auth, shared API schemas, overview/correspondence/schedule/needs-user, deep links and safe notification preferences. Gate: actual device sessions, revoked tokens, offline age labels, reconnect parity and no approval replay. Browser responsiveness is not native completion.

## M9 Public source release
Select license, audit dependencies/notices and complete export/history/log/artifact scan. Confirm private runtime separation and contribution/security process. Obtain explicit approval to make repository public. Gate: verified public visibility and exact published revision, independent empty install, no private data; hosted user workspaces remain private.

## Definition of done
A milestone is done only when code, migrations, tests, operator instructions, permission implications, evidence and limitations are committed together. Report passed, failed and not-run checks. Never hide a blocker by lowering the gate or using a fabricated success response.

## Version 3 engineering track and Python sequencing
The existing M0-M9 plan remains the base; this track adds dependencies rather than claiming those milestones complete.

E0 Capability and privacy inventory: verify supported visible export/API formats per target, authorized project config roots and host routes. No credential or denied-session harvesting. Gate: documented supported/unavailable matrix and consent boundaries.

E1 Python parity foundation: execute P0-P5 migration with canonical schemas and existing frontend compatibility. Gate: real isolated persistence/API/auth-denial parity, single-writer cutover and safe rollback. Existing Node backend remains until this gate passes.

E2 Context and review: after E0 and schema foundation, link correspondence/request to repository, permitted sessions and selected project configuration. Gate: V301-V304 and evidence-backed diff/test review.

E3 Host observation: after E0/E1, implement approved host/workspace bindings and redacted read-only terminal stream. Gate: V305, V311, V313; no implicit command authority.

E4 Bounded execution and orchestration: after E2/E3 and required approvals, implement execution DAG, parent/child scope, real subagent runs, fencing, cancellation and reconciliation. Gate: V306-V309 with actual permitted executors and no duplicate external effects.

E5 Completion and daily continuity: after E2 and event store, add claimed-versus-verified completion, daily summaries and next-work drafts. Gate: V310/V312; schedule and notification delivery require real provider setup before advertised.

E6 Independent private hardening: combine E1-E5 with M7; run V314-V315 and prior security/functional gates. Native iOS and public release remain later separately approved steps.

Dependency summary: E0 -> E2; E0 + E1 -> E3; E2 + E3 -> E4; E2 + durable evidence -> E5; E1 + E2 + E3 + E4 + E5 -> E6. Read-only session review can ship before execution if accurately scoped.
