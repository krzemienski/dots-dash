# Proposed API contract

These routes are a target design, not live API claims. The existing private prototype uses /api/work and bounded service routes. The subsequent reusable application exposes the legacy /api routes behind a fail-closed authentication adapter; no real identity-provider implementation is bundled. Implement versioned compatibility explicitly; do not redirect private import routes into a public app.

## Common contract
All routes require authenticated owner context except a content-free health endpoint. Derive owner on server; never trust ownerId from a browser or source payload. JSON responses carry schemaVersion, snapshotAt and request correlation ID. Lists use opaque owner-scoped cursors and bounded limits. Private responses use no-store cache controls. Source URLs must be safe verified HTTPS links; the server does not fetch arbitrary URLs supplied by users or providers.

| Route | Purpose | Constraints |
|---|---|---|
| GET /v1/overview | Correspondence, upcoming schedule, needs-user and requests summary | Include coverage and consistent snapshot cursor |
| GET /v1/threads | Filter/search thread summaries | account/category/project/reply filters; bounded query |
| GET /v1/threads/{id} | Messages and linked requests/actions | paginate messages; preserve source time precision |
| GET /v1/schedule | Calendar and itinerary interval | bounded start/end; organization subscriptions opt-in |
| GET /v1/schedulers | Real scheduler definitions and observed runs | no inferred enabled status |
| GET /v1/requests | Requested work and accountability | status, project and needs-user filters |
| GET /v1/requests/{id} | Request -> tasks -> actions -> outcomes/evidence | include pending and failed attempts |
| GET /v1/tasks/{id} | Task detail and dependencies | version plus evidence references |
| GET /v1/opportunities | Roles, consulting and project/advice | categories and lifecycle filters |
| GET /v1/projects | Project inventory | association counts without duplicate totals |
| GET /v1/needs-user | Decisions, facts, handoffs and blockers | priority and due time; no secrets |
| GET /v1/sources | Coverage and source health | redacted account binding and supported capabilities |
| GET /v1/activity | Material event history | event cursor, pagination and entity filters |
| GET /v1/events | Resumable SSE | Last-Event-ID; owner-scoped cursor; snapshot-required signal |
| POST /v1/requests | Save a new owner request | Idempotency-Key; saved is not delivered |
| POST /v1/requests/{id}/delivery | Request supported assistant routing | capability and permission check; returns pending/unconfigured |
| POST /v1/actions/{id}/decisions | Record bounded approval/decline | expectedVersion, payload hash, expiry, authenticated decision |
| POST /v1/tasks/{id}/commands | Supported edit/cancel/reopen command | expectedVersion; authorization; no arbitrary state override |
| POST /v1/source-imports | Authorized service ingestion | service identity, owner binding, allowed capabilities, bounded batch |

## Mutation semantics
Require an idempotency key and canonical payload hash. Same key and same payload return the original result; changed payload returns 409. Create returns 201 for durable local creation. 202 means accepted for asynchronous processing, not delivered/executed. A decision response must state executed:false unless separate verified execution evidence exists. Unconfigured adapters return a capability error without making up a receipt.

Use 400/422 for schema failures, 401 unauthenticated, 403 unauthorized, 404 missing or inaccessible resource, 409 version/idempotency conflict, 413 oversized, 429 throttled with Retry-After, and 503 unavailable. On uncertain provider outcome, return a durable action ID and OUTCOME_UNKNOWN rather than a retry instruction that could duplicate work. Error bodies contain safe code, message and correlation ID; redact provider internals.

## Events and consistency
SSE sends eventId, cursor, entity/version and a safe change summary. On reconnect, replay after the last acknowledged cursor; when unavailable emit snapshot_required. Clients apply only newer entity versions and fetch authoritative details when needed. Snapshot includes its event cursor so no interval is lost between initial read and stream connection.

## Contract acceptance
Exercise every implemented route with authorized owner, anonymous caller, wrong owner, expired session, malformed input, oversized input and conflicting version. Test authorization before disclosing record existence. Generate machine-readable OpenAPI and runtime schemas from the implemented contract during the foundation phase; this markdown and TypeScript design alone do not satisfy API validation.

## Version 3 proposed routes
All routes below are unimplemented target contracts. They inherit owner-derived authorization, bounded schemas, no-store, cursor, version and idempotency rules.

| Route | Purpose | Authority boundary |
|---|---|---|
| GET /v1/contexts/{id} | Linked correspondence/engineering projection | Filter each linked source by owner capability |
| POST /v1/context-links | Link existing authorized records | Does not expand either source scope |
| GET /v1/engineering/sessions | Permitted imported session summaries | Never reads hidden or denied storage |
| POST /v1/engineering/session-imports | Supported visible export ingestion | Account/format/consent/hash validation |
| GET /v1/projects/{id}/configuration | Selected user-owned project configuration | Redacted read-only inventory |
| GET /v1/repositories/{id}/snapshots | Revision/diff/test evidence | Authorized root and source revision |
| GET /v1/hosts | Approved host health and capabilities | Opaque bindings, no secret discovery |
| POST /v1/execution-plans | Create a bounded proposed run DAG | Save is not permission to execute |
| POST /v1/execution-plans/{id}/start | Start approved current plan | Exact version/hash, scope and writer lease |
| GET /v1/runs/{id} | Actual parent/child run receipts and evidence | Status unknown on inconclusive observation |
| GET /v1/runs/{id}/output | Resumable sanitized read-only stream | No stdin/signaling or arbitrary process attach |
| POST /v1/runs/{id}/cancel | Request bounded safe cancellation | 202 means requested, not terminated |
| GET /v1/summaries | Evidence-backed bounded daily summaries | Owner time zone and coverage disclosed |
| POST /v1/next-work-prompts | Save reviewable proposed next work | Never executes automatically |

No arbitrary shell, filesystem browse, credential copy or raw-session dump endpoint is included. Return unsupported capability errors when a provider lacks a permitted API/export route. All process targets and paths resolve from trusted host/workspace bindings, not free-form identifiers from imported text.
