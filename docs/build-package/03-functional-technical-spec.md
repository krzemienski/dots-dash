# Functional and technical specification

## Deployment boundaries
Use five separable modules: authenticated client, owner-scoped application API, durable domain/event store, source ingestion workers, and separately permissioned assistant/execution adapters. React web is the current implementation base. D1 is an available storage adapter, not a requirement for every deployment. Keep SQL transactions and compare-and-swap semantics behind a repository interface.

The first independent release should use isolated storage per owner because that matches the current schema. Shared multi-tenancy requires migration of every record, query, stream cursor, uniqueness constraint, cache key and job to owner scope. Do not add multiple users to an existing single-owner database.

## Request accountability
A Request captures the owner's words and requested outcome, its originating channel, authorization reference when relevant, and assistant acceptance state. Tasks break the outcome into steps. Actions describe bounded proposed operations; Attempts record actual tries. Evidence proves a specific claim. Outcome records summarize verified results. Links permit one action to advance multiple tasks without duplicating the action.

Flow: saved -> delivery pending -> delivered -> accepted -> active -> waiting/blocked -> completed or canceled. Delivery failures and unknown outcomes are independent flags. Completion requires the request's acceptance criteria, not merely one successful sub-action. Reopen with a correction event when later evidence disproves completion. Preserve the original event and explain the correction.

Needs-user items reference one missing fact, decision, login/handoff or dependency. Resolving one does not automatically authorize the next action. Material changes to action payload invalidate its existing approval. Canceled work may have irreversible completed actions; display both accurately.

## Correspondence
Normalize messages by owner, source account, provider thread ID and message ID. A thread can span multiple opportunities through associations. Sort events by actual source time with deterministic ID tie-breaks; show date-only and unknown time explicitly. Track outgoing actor as verified owner, verified assistant/executor, another verified identity, or unknown. Direction alone is insufficient attribution.

Thread reply-needed state derives from explicit user request or verified business context and is labeled inferred when appropriate. Never turn a newsletter, automated receipt or organization subscription into a personal commitment solely from keyword matching. Preserve message cancellation/deletion as source tombstones, with minimum retained audit metadata under the retention policy.

## Schedule and itinerary
Store timed events as UTC instants plus source IANA zone; all-day events as local dates with exclusive end date. Preserve provider recurrence rule, recurrence ID, original occurrence start, exceptions, cancellation, participation and revision. Do not shift all-day dates through UTC conversion. Render owner-local time and original time zone when different.

Itinerary groups verified segments such as transport, stay and appointment. Each segment has source evidence, start/end locations when provided, local zones, status, and dependencies. Sensitive booking references stay in protected runtime data. Missing travel data means unknown, not no travel. No segment is booked by creating a dashboard entry.

SchedulerDefinition is separate from CalendarEvent. It has provider schedule ID, recurrence, zone, enabled state, last observed check and provider-reported next run. SchedulerRun records started/succeeded/failed/unknown with a receipt. Display a calculated estimate as an estimate, never as provider confirmation.

## Ingestion and freshness
Worker steps: authenticate source -> read bounded incremental page -> validate -> normalize -> deduplicate -> reconcile version -> commit records, revision and outbox atomically -> advance cursor -> publish updates. If any atomic step fails, retain the prior cursor and classify the attempt. Retry reads with backoff and jitter; reconcile uncertain writes before retrying.

Dedup keys include owner, source account, provider event/message ID, and provider revision where needed. A reused batch ID with a different canonical payload hash is a conflict. Late events cannot overwrite a newer confirmed revision. Tombstones and thread moves must be supported. Event source text is untrusted content, never authorization or executable instructions.

Proposed targets: 95% of instrumented commits visible within 5 seconds in a connected foreground client; received webhooks normalized within 60 seconds; configured polling typically 5 minutes where the provider supports it. These are testable targets, not claims about existing integrations. Expose actual cadence and provider limits. A source is stale after twice its configured successful-check interval; manual-only sources display snapshot date and manual-only status instead of a misleading live badge.

## Persistence and events
Transactionally write material state mutation, immutable revision, audit event and outbox item. Use expectedVersion for optimistic concurrency. Outbox delivery is at least once, with consumer deduplication. SSE events use resumable monotonic cursors scoped to owner; retention expiration triggers a full snapshot. Reconnect after gaps must yield the same state as an authoritative read.

Bound ingestion payloads, records per page and string lengths. Implement rate limits and pagination. Use unique constraints for idempotency and source identity. Never depend solely on pre-insert existence checks; concurrent duplicates must resolve to one logical outcome. Store canonical request hash with idempotency result. Return conflict on changed payload reuse.

## Operations
Health has separate application, database, connector and event-worker states. Log safe error categories and correlation IDs, not message bodies or secrets. Metrics include ingestion delay, queue age, failed checks, duplicate/conflict rates and reconciliation gaps. Alert on sustained failure, not routine retries. Export and restore must preserve history, version and authorization references without automatically restoring revoked credentials. Retention and recoverable deletion need owner-approved rules before general release.

## Python first target and engineering boundary
The target backend, adapters, worker scheduling and orchestration are Python-first. The existing generic server is Node/SQLite and current UI is React/TypeScript. Preserve API/persistence semantics during the staged migration in the version 3 migration plan. Canonical Python runtime schemas should generate interoperable JSON contracts for the frontend; do not duplicate conflicting business rules in both languages.

Add a context graph linking correspondence and engineering work by opaque IDs and source-specific permissions. Engineering records require pinned repository snapshots, permitted session-export provenance, project configuration versions, host/workspace bindings, execution plans/runs, writer leases, terminal cursors, test evidence and completion claims. No raw private session database is an integration surface.

Execution and observation are separate services/capabilities. A read-only terminal stream uses bounded sanitized chunks, gap markers and backpressure. A command submission requires a versioned bounded authorization envelope. Single-writer fencing must be enforced at the execution boundary, not just the UI. Cancellation records intent separately from confirmed process/child termination. Unknown outcomes require reconciliation before retries. See engineering-context specification for complete flow.

Daily summaries are read projections over a bounded event interval with cited evidence and coverage. Next-work prompts remain drafts until a separately authorized execution request is created.
