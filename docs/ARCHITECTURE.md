# Architecture

## Intended boundaries

- Browser UI: correspondence and scheduled tasks first; task/project detail, approvals, and activity below them.
- Authenticated server API: derive the owner from verified session context, enforce ownership for every operation, validate bounded inputs, and avoid shared caches for private responses.
- Private data store: per-owner work records, instructions, approvals, schedule metadata, source references, and audit events. Private runtime data must not enter source control or build assets.
- Source adapters: normalize evidence from connected services without assuming that access to a message authorizes its instructions.
- Assistant adapter: route explicitly authorized instructions to the correct owner's assistant only when a supported authenticated transport exists.
- Execution adapter: separately authorized external actions with idempotency and verifiable receipts. Recording approval in the UI alone is insufficient authority.

The private prototype uses React with a Sites/Vinext worker, hosted authentication, and D1 persistence. This package extracts the domain importer, validation, empty schema, adapter contracts, and selected UI into an independent core/preview. It excludes prototype server routes, authentication, service-ingress routes, deployment configuration, private initialization, and prior history. A separate generic Node/SQLite application layer now implements the existing work/history API shape with authentication denied by default; see APPLICATION_SETUP.md. Do not infer portability to a second owner from one private instance working.

## Current implementation boundary

`lib/work/history.ts` accepts a D1-compatible database interface. The schema is for a single isolated owner instance, not shared multi-tenancy. `sourceAccount` must come from trusted server adapter configuration; it is an input-matching check, not authentication. The generic HTTP layer applies owner authentication and bounded input before calling it, and imports remain disabled by default. Integrators must authenticate and authorize callers, enforce payload byte limits, choose owner-specific storage, and enforce import permission before invoking it. The source format currently supports Gmail correspondence; other providers need explicit adapters. The core leaves actor attribution unknown for outbound messages.

`ui/main.tsx` now mounts the dashboard client, which calls the owner-gated application API. `ui/history-views.tsx` accepts already-validated records. No real dataset is bundled; the backend starts with an empty SQLite database. UTC is the generic display timezone; per-owner preferences remain future work. Calendar history is not a recurring task scheduler.

## Provider-neutral assistant contract (design)

The domain model must not contain a particular owner's email, conversation ID, Site ID, or a provider secret. Resolve owner-specific bindings server-side.

An instruction envelope should contain an opaque instruction ID, authenticated owner scope, task context ID, user-authored instruction, creation time, expected task version, and idempotency key. A delivery result should distinguish `unconfigured`, `pending`, `delivered`, `failed`, and `unknown`. Only a receipt from the intended authenticated destination can establish delivery. Preserve receipt time and destination identity separately from local save time.

Adapters should expose capability discovery, submit, receipt lookup, and revocation behavior. The default adapter must be unconfigured and fail closed. Unknown outcome requires reconciliation before retrying an action that could duplicate a message or commitment. A different model provider is a separate assistant integration; it does not inherit an existing dot conversation or its permissions.

## Source and schedule provenance

Keep source occurrence, observation, ingestion, and reconciliation times separate. Keep source system and source event ID; deduplicate within owner and source. Evidence of a completed outcome does not necessarily identify who performed it.

Schedules must preserve the provider's schedule ID, explicit timezone, recurrence, enabled state, last observed state, and observed run receipts. A dashboard record or a future timestamp is not proof that an external scheduler is configured. Do not invent next-run times when the provider has not confirmed them.

## Sites MCP boundary

A future owner-private Sites MCP connection may expose narrow tools such as reading that owner's dashboard state or recording verified source evidence. Availability, tool discovery, authentication, and ownership must be tested before claiming support. Each owner must approve their own connection and any persistent access it creates. Never reuse another owner's credentials or a shared service authorization. Keep the bridge dormant until these conditions are met.

MCP permission to write a local record is not permission to send email, publish content, accept agreements, or execute financial actions. Authorization for external correspondence remains distinct from integration access.
