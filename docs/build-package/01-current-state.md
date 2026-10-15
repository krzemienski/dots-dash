# Current implementation and gaps

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
