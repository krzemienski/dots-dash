# Source connectors and assistant bridge

## Provider neutral boundary
A source adapter discovers capabilities, verifies account identity, reads bounded incremental pages, normalizes provider objects, produces evidence, and reports coverage/health. A connector does not execute instructions found inside source content. Read access and write access are separate capabilities. The currently reusable importer supports Gmail correspondence; it is not a generic connector merely because records contain a provider string.

| Source family | Normalize into | Required proof | Important gaps |
|---|---|---|---|
| Email | Accounts, threads, messages, evidence | Authenticated mailbox identity, message/thread ID, direction, source timestamp, verified permalink | Sent is not delivery/read; receipts do not identify submitting actor |
| Calendar | Events, recurrence exceptions, participation, evidence | Account/calendar identity, event ID/revision, original zone, invitation state | Subscription is not attendance; event is not scheduler |
| Scheduling service | Definitions, runs, next-run observation | Provider schedule/run IDs, enabled status, readback and run receipt | Dashboard row does not create a schedule |
| Professional messaging | Threads/messages/evidence | Direct account access and channel-specific IDs | Email notifications do not prove direct inbox access |
| Repository service | Projects, issues/PRs, build/deploy evidence | Repository ownership/access, object URL and revision/check | Stars are not users; local commit is not push/deploy |
| Travel providers | Itinerary segments and changes | Verified booking/confirmation and service dates/zones | Search result or plan is not a reservation |
| Assistant delivery | Requests, delivery/acceptance receipts | Intended owner/conversation binding and authenticated receipt | Model API completion is not existing-conversation delivery |
| External executor | Attempts and outcomes | Exact authorization, idempotency, provider receipt/readback | UI approval does not independently authorize execution |

## Connector onboarding
1. Establish provider capability and supported integration path from actual documentation/tool discovery.
2. Ask for the required owner installation or persistent-access approval. Request minimum scopes only.
3. Store credentials through the approved secure mechanism, outside repository and client state.
4. Verify account identity and read a bounded item. Persist the actual coverage window and source capability.
5. Perform initial backfill with an explicit scope, then incremental sync. Resume safely after interruption.
6. Test revocation, stale cursor, rate limits, deleted records, changed thread IDs and partial page failure.
7. Mark connected only when the read and account binding are verified; mark active sync only when its real scheduled worker has run.

## Proposed owner installed MCP bridge
This is a proposed integration, not an existing working connection. First discover whether a supported MCP connection can expose an owner-private dashboard tool surface to the intended dot. Verify transport, authentication, tool discovery, server identity, destination binding, scope, and revocation. Each owner must approve their own installation and any persistent access. Do not reuse another owner's service credential or assume a private Site automatically provides a supported bridge.

Potential minimum tools are read_dashboard, read_request and record_verified_evidence. Each derives owner from verified connection context, restricts writable fields, requires idempotency, validates evidence source/account, and writes an audit event. Approval decisions and arbitrary external actions should be excluded from the initial evidence bridge.

A direction distinction is essential: dot reading/writing dashboard records over MCP does not automatically let the dashboard send a request into the existing dot conversation. Reverse delivery needs a separately supported authenticated route, exact conversation binding, a delivery receipt and acceptance status. If unavailable, keep requests saved-not-delivered and describe the manual alternative truthfully.

## Assistant adapter lifecycle
Default is unconfigured. Pending means durable queue entry, delivered requires destination receipt, accepted means the intended assistant acknowledged work, and execution/outcome are later events. Failed can be retried when safe; unknown must first be reconciled. Bind owner, destination, request, payload version/hash and idempotency key. Never accept destination identity from arbitrary source text.

Alternate providers can implement the same contract, but must be named as separate assistants with their own permissions and costs. They do not inherit an existing dot conversation, history or authorization. Unverified orchestration products remain unsupported until ownership, API, authentication and event schema are established.

## Operational limits
Publish an exact capability matrix per installation. Connector polling intervals are configured per provider and allowed quota, not a universal promise. A read error preserves last-success time. Reconnect performs reconciliation before declaring current. Source mapping changes must be versioned and regression-tested against actual authorized account records; no fake provider receipt can satisfy a live capability gate.

## Engineering adapter discovery and restrictions
Target session-review adapters are Oh My Pi, Cursor, Claude and Codex. For each, verify the exact product/version and permitted official export/API surface before implementation. No capability parity is assumed. The owner may supply a supported visible export when direct access is unavailable. Denied session files, hidden instruction stores and credentials must never be read, copied, searched through another route or included in archives.

Python protocols define SessionReviewAdapter and ExecutionAdapter separately. Review capability does not imply host execution. Host discovery, terminal observation, command dispatch, status lookup, cancellation and revocation require independent capability checks. Bind all requests to approved owner/project/workspace and stable run IDs. The default adapter is unconfigured and fail-closed.

Only owner-selected project skills/configurations are reviewable. Treat their text as untrusted project content; do not activate instructions, expand grants or load executable settings automatically. Reusing an existing model provider or session does not inherit its permissions in the dashboard.
