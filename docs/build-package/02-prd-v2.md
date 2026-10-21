# Work dashboard product requirements version 3

> Current status index: [product and completion audit, 21 October 2026](../PRODUCT_AUDIT.md). Later isolated TEST DATA evidence covers principal context-link, inventory-pagination, association and correction workflows. Earlier blocked/unperformed statements below remain historical; actual-user V301, production integrations and full Python cutover remain open.

> Historical design and implementation context. See [current scoped verification](../verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

## Product outcome
The owner can answer: What correspondence happened? What is on my schedule? What did I ask for? What has actually been done? What remains? What requires me? Each answer includes evidence and coverage limitations rather than confident-looking estimates.

This version supersedes the version 2 product scope. The filename is retained for link compatibility.

## Priority and scope
P0: private access; correspondence threads and replies; upcoming schedule and itinerary; truthful source coverage; durable history; clear empty/error states.

P1: request-to-action accountability; needs-user decisions; roles and consulting workflows; cross-linked projects; safe assistant delivery when a real supported bridge exists.

P2: automated reconciliation and reliable update streams; opt-in notifications; independent-owner onboarding; richer itinerary support; native iOS check-in. Scheduling infrastructure required by P0 connectors may ship earlier; do not confuse a displayed recurring task with a functioning scheduler.

The product covers all tracked work. Career is one category, not the entire application. Consulting, project advice, general projects, and travel or other commitments use common relationships. It is neither an exhaustive communication archive nor a replacement for every original service.

## Functional requirements
- FR01 Private workspace: authenticated owner-only reads, writes, source links, exports, and streams. Unauthorized users see no record metadata.
- FR02 Correspondence: searchable source-backed threads with inbound/outbound events, participants, original source links, timestamps, reply state, associated opportunity/project/request, next action, and unresolved coverage. Preserve sent, delivered, and read as different claims.
- FR03 Schedule: personal commitments first; organization subscriptions opt-in and labeled participation unknown. Distinguish confirmed events, tentative holds, inferred deadlines, scheduler definitions, scheduler runs, and itinerary segments.
- FR04 Accountability: each accepted request identifies requested outcome, owner, status, actual attempts, completed outcomes, remaining steps, blockers, needs-user items, evidence, and last verification. A saved request may remain unaccepted by the assistant.
- FR05 Needs user: one prioritized list of explicit decisions, missing facts, secure handoffs, and access blockers. Show exactly what is needed, why it matters, and what it blocks. Approval must be bounded to an action version.
- FR06 Opportunities: role, consulting, project/advice, or unclassified; filter by category, status, organization, counterpart, and last interaction. Keep closed and canceled records as history. Source-inferred classifications remain labeled.
- FR07 Projects: link requests, tasks, threads, schedules, artifacts and outcomes. An item can have multiple associations without duplicate counts.
- FR08 History: append-only event and revision trail, including corrections, cancellations, failed attempts and attribution unknown. Current summaries are projections of this history, not replacements for it.
- FR09 Coverage: account-level identity and capabilities, covered interval, observation/check times, enabled scheduling, failures, and last successful synchronization. No healthy status for unverified access.
- FR10 Instructions: save, deliver, accept, execute, and confirm outcome are distinct. Default delivery is unconfigured. A failed or unknown outcome never triggers blind resubmission.
- FR11 Updates: durable ingestion, deduplication, reconciliation, and recoverable streaming. No dependency on keeping a browser open. Imported snapshots display their age until a real refresh occurs.
- FR12 Notifications: meaningful decisions, time-sensitive changes, blockers and outcomes; deduplicated, quiet-hours aware, owner opt-in for external channels, privacy-safe lock-screen text.

## Design requirements
Flat black canvas, restrained dark surfaces, near-white type, subtle dividers, and small semantic accents. No decorative gradients or excessive cards. Primary navigation prioritizes Correspondence and Schedule; Overview summarizes those plus Needs you and Requests. Projects, Opportunities, Activity, and Sources remain readily accessible. Mobile uses a short primary navigation with More for secondary views.

Support 320-pixel and wider layouts, keyboard operation, visible focus, screen-reader labels, reduced motion, and text/icon status alongside color. Content updates must preserve focus and scroll. Temporary loading skeletons are allowed; fabricated operational rows, fake counters, mock success messages, and nonfunctional controls are not.

## Success criteria
In functional check-in sessions, the owner finds the latest relevant correspondence and the next personal commitment within 10 seconds each, and the next needed decision within 10 seconds. Every claimed completed external action has evidence. Every visible source has truthful health and coverage. Repeated imports create no duplicate messages or outcomes. An offline or disconnected client never claims current data.

## Non-goals and decisions
No public personal dashboard, automatic third-party communications, unapproved credential grants, or guessed travel bookings. An alternate model is a separately identified assistant, not the existing dot conversation. Shared API/domain rules enable future iOS; web UI component reuse is optional. Retention periods, license, hosting, identity provider, public release and new integrations require explicit decisions before their gates can close.

## Version 3 engineering requirements
- FR13 Context links: connect correspondence, requests and schedules to engineering sessions/repositories without merging access permissions or authorizing external replies.
- FR14 Session review: review only permitted owner-visible exports or supported APIs from Oh My Pi, Cursor, Claude and Codex; advertise each adapter only after independent verification. Denied storage and hidden instructions remain excluded.
- FR15 Project configuration: display explicitly selected user-owned skills/configurations with revision, provenance and redaction; no automatic activation or secret disclosure.
- FR16 Engineering evidence: show diffs, base/head revision, actual test runs and artifacts alongside claimed completion. Distinguish edited, tested, committed, pushed, CI-passed and deployed.
- FR17 Execution environments: show approved host/workspace availability and capability scope; default terminal access to sanitized read-only observation.
- FR18 Controlled execution: bounded authorized command requests, actual subagent run DAGs, least privilege, resource limits, single-writer/fenced coordination, safe cancellation and unknown-outcome reconciliation.
- FR19 Daily check-in: evidence-backed bounded daily summaries and reviewable next-work prompts; no new execution or notification authority is inferred.
- FR20 Python-first delivery: new backend/orchestration/adapters use Python-first architecture. Retain the current frontend boundary and migrate existing backend behavior with functional parity and rollback evidence.

Acceptance for FR13-FR20 is defined by V301-V315 in the migration plan. A product name in a connector list is a target, not a supported integration claim.

## Session accountability acceptance refinement

FR21: Before execution, capture the user's goal, expected observable behavior,
ordered user steps and source references. Persist performed steps, observed
evidence, pass/fail/gap and attribution separately from completion claims.
FR22: Link scoped drift findings to remediation tasks and reviewable prompts;
preserve requirement revisions, explicit decision supersession, code/input
provenance and negative outcomes. A status representation mismatch is not a
bug until its canonical semantics are established.
The [correction context display](../CORRECTION_CONTEXT_DISPLAY.md) compares
explicit supersession metadata and keeps original outcomes visible separately
from active findings. Differences require review; matching metadata does not
validate a correction. Later [isolated correction acceptance](../verification/source-review-publication.md) exercised its principal paths; broader real-owner and production acceptance remains open.
FR23: Show skill applicability, selection and proven invocation separately.
A local declarative checklist receipt must identify that limited scope and
must not claim the full skill or a provider agent executed.

The optional local slice implements this chain for owner-curated sanitized
exports. See [implementation boundaries](../SESSION_REVIEW.md). It does not
close the live provider, independent verification or browser acceptance gates.

Source coverage must distinguish the selected export from referenced event
records and skill inventory metadata. The current [display-only projection](../SOURCE_COVERAGE_PROJECTION.md)
keeps original-source read coverage unknown and preserves v1 persistence.
A future versioned companion contract is still needed to represent valid-empty,
unreadable and unsupported selected sources without fabricating goal events.
