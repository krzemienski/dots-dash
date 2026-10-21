# dot work dashboard

A private-first dashboard for understanding an assistant's correspondence, scheduled work, approvals, and outcomes. The long-term goal is for each person to deploy an isolated instance and connect their own assistant through an authenticated adapter.

**Status: reusable application foundation, with production integrations incomplete.** Includes the dashboard UI, history/import validation, empty schema, real SQLite persistence, owner-gated APIs, saved instructions, local approval records, and an unconfigured assistant adapter. Private APIs deny access until a real server-side authentication adapter is supplied. No private records, credentials, live source connection, scheduler, or assistant delivery are bundled.

[Public repository](https://github.com/krzemienski/dots-dash) · [Release status and verification](docs/RELEASE_STATUS.md)

## Product scope and completion

Start with the [product and feature audit](docs/PRODUCT_AUDIT.md): outcomes, actual screens, FR01–FR23 status, source-bound evidence and ten prioritized gaps. The [proposed experience mockups](docs/mockups/product-review.html) use synthetic TEST DATA and do not add live functionality.

## Local checks and application

Use Node 24 or newer. Run `npm ci`, `npm test`, `npm run typecheck`, `npm run build`, then `npm start`. Read [application setup and actual verification](docs/APPLICATION_SETUP.md) before configuring authentication or importing data. The default server runs on loopback and refuses private API access; it does not fabricate a demo identity. `node --test tests/core.test.mjs tests/api.test.mjs` runs dependency-free isolated core/API checks.

## Product priorities

1. Correspondence: show verified incoming/outgoing activity, its source, what needs a reply, and delivery receipts.
2. Scheduled tasks: distinguish a proposed schedule, a real configured schedule, a running task, and its observed result.
3. Work context: projects, opportunities, approvals, instructions, and an audit trail.

The dashboard should never imply that saving a draft sends it, approving a record executes an external action, or recording a task schedules it.

## Full product build package

The optional [local Python session review](docs/SESSION_REVIEW.md) links
sanitized export evidence to intent, drift findings, remediation drafts,
selected skill checklists and actual local review receipts. Imports and runner
execution default disabled. Named provider adapters remain unavailable.

The [selected-record envelope](docs/SELECTED_RECORD_ADMISSION.md) preserves safe
goal text, reports exclusions and unknown attribution, requires explicit project
binding, and displays scoped corrections without granting execution authority.

An independent [opt-in Python read compatibility mode](docs/PYTHON_READ_COMPATIBILITY.md)
preserves the current frontend routes while Node remains the sole writer.

A [disposable instruction-write rehearsal](docs/PYTHON_INSTRUCTION_REHEARSAL.md)
advances Python mutation parity without enabling application writes.
The corresponding [decision-write rehearsal](docs/PYTHON_DECISION_REHEARSAL.md)
preserves approval versions, atomic audit and `executed:false` on scratch snapshots.
The [history-import rehearsal](docs/PYTHON_HISTORY_REHEARSAL.md) adds bounded
snapshot/replay parity and source-link preservation on disposable storage.
Its [compatibility assessment](docs/PYTHON_HISTORY_COMPATIBILITY.md) records
remaining blockers before any writer cutover rehearsal.
The [shared instant-ordering fix](docs/HISTORY_INSTANT_ORDERING.md) addresses the
demonstrated snapshot chronology defect without rewriting source evidence.
The [replay and handoff rehearsal](docs/REPLAY_AND_HANDOFF_REHEARSAL.md) verifies
history-only writer epochs and receipt-based recovery on disposable storage.
The [fenced restart extension](docs/FENCED_RESTART_REHEARSAL.md) adds instruction
and decision fencing plus marked-session process-crash recovery evidence.
The [journey acceptance review](docs/JOURNEY_ACCEPTANCE_REVIEW.md) distinguishes
historical assessments from recorded observations and prioritizes the remaining V310 gap.
The [evidence revision display](docs/EVIDENCE_REVISION_RELEVANCE.md) marks imported
evidence stale against a different declared review revision, preserving history
and attribution. Broader verification and live relevance invalidation remain open.
The [owned local browser adapter](docs/OWNED_BROWSER_RECEIPTS.md) now produces
immutable receipts for one fresh synthetic workflow using retained process
handles. The [dashboard receipt view](docs/BROWSER_RECEIPT_DASHBOARD.md) reads that
ledger with explicit outcome, provenance and stale-input distinctions.
[Read-only history pagination](docs/BROWSER_RECEIPT_PAGINATION.md) reaches older
runs with stable membership and page-scoped evidence links.
[On-demand runtime relevance](docs/BROWSER_RUNTIME_RELEVANCE.md) compares recorded
allowlisted dependency and runtime inputs, keeping unavailable coverage unknown
and historical outcomes intact. Production verification, live monitoring and
lost-coordinator recovery remain open.
The [request/task/review association slice](docs/REQUEST_CONTEXT_LINKS.md) is
implemented with separate permission state. Selected isolated TEST DATA browser/API
workflows now have [scoped verification](docs/verification/source-review-publication.md).
Actual-request V301 remains open.
The [remediation navigation](docs/REMEDIATION_NAVIGATION.md) connects cards to
their goals, actual checklist receipts and verification forms, with local browser evidence.
The [derived remediation view](docs/DERIVED_REMEDIATION_CONTEXT.md) preserves
scoped correction, attribution and project-binding context without rewriting
historical prompts or turning owner reports into certified success.
The separately default-off [retained-selection review reports](docs/OWNER_REVIEW_REPORTS.md)
record per-item owner assertions and contiguous gaps with immutable correction
history. Import success does not advance these reports or establish transcript coverage.
The [lock/startup assessment](docs/LOCK_DISRUPTION_AND_STARTUP.md) records lock
identity binding, owned startup-failure outcomes and the next UI integration gap.
The [lifecycle race fix](docs/LIFECYCLE_RACE_GUARDS.md) prevents concurrent local
worker launch from passing cleanup's guard before storage is deleted.
The [handle-loss safeguards](docs/SUPERVISOR_HANDLE_LOSS.md) report unconfirmed
worker exit separately from receipt resolution and keep lifecycle operations blocked.
The [owned-process supervisor](docs/OWNED_PROCESS_SUPERVISION.md) covers retained
worker handles across controller failure and records remaining policy choices.

[Read the complete PRD, technical specifications, API/domain design, build milestones, execution prompts, and functional acceptance plan](docs/build-package/README.md). These describe the full target product; proposed contracts are not claims of implemented integrations.

## Documentation

- [Architecture and adapter contract](docs/ARCHITECTURE.md)
- [Deployment instructions and production gates](docs/DEPLOYMENT.md)
- [Own-instance setup](docs/SETUP.md)
- [Security and privacy](SECURITY.md)
- [Verification and known gaps](docs/VERIFICATION.md)
- [Public-release roadmap](docs/ROADMAP.md)

## License and publication

Public source publication is authorized for the sanitized reusable application. Runtime dashboards and personal data remain private. See the release status for the verified source revision. No software license has been selected or granted by this package; do not describe it as a licensed open-source release until that decision is recorded. Existing third-party code retains its own terms; review those before incorporating it.
