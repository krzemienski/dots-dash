# Permissions and threat model

## Assets and boundaries
Protect message content, contacts, schedules, source URLs, booking details, task history, approval decisions, credentials and assistant routing. Trust boundaries are browser/session, application/API, worker queue, database, provider connector, assistant bridge and external executor. Source content is untrusted even when retrieved through an authenticated account.

## Roles and minimum authority
Owner can view and request work in their isolated workspace. Ingestion service can normalize approved source categories only. Read-only dashboard consumer can inspect permitted projections. Assistant evidence writer can write verified evidence through bounded tools. Executor can attempt only a separately authorized exact action. Administrator capabilities do not automatically confer permission to read private owner content; keep any support-access path explicit and auditable.

For initial deployment prefer isolated single-owner instances. If multi-tenancy is later chosen, enforce owner scope in database policy or every repository operation plus tests; filter streams, jobs and caches identically. Opaque IDs do not replace authorization.

## Permission matrix
| Action | Required gate |
|---|---|
| Read already connected source | Verified account access and owner scope |
| Import evidence into private dashboard | Approved destination/source category, authenticated service identity |
| Install connector or MCP grant | Owner approval for persistent access and specific scopes |
| Save instruction | Authenticated owner; durable local acknowledgement only |
| Deliver instruction to assistant | Supported destination binding and requested communication scope |
| Send correspondence or modify calendar | Explicit applicable authority for recipient/purpose or event change |
| Record approval | Exact bounded action, current version/hash, authenticated owner |
| Execute approved action | Policy validation independent of dashboard decision storage |
| Reveal/export/share records | Verified destination, minimum authorized data and sharing permission |
| Publish repository | Explicit publication authorization plus full history/data/license audit |
| Irreversible deletion | Applicable action-time confirmation and disclosed consequence |

Credentials and actions requiring user takeover must use supported secure flows. No plaintext password/API-key fields in the dashboard. Do not create grants, new keys, public links, payments, new services or broad permissions solely to make a test pass.

## Threats and controls
- Cross-owner read/write: server-derived ownership, isolated storage or mandatory scoped queries, negative tests across all routes and streams.
- Forged ingestion: signed/authenticated service transport, trusted server account binding, bounded schemas, event allowlists and replay protection. Hostname checks alone are insufficient.
- Prompt injection in email/documents: source text stored as evidence, not executable instructions; verified user intent and policy checks before consequential actions.
- Approval replay/race: payload hash/version, expiry, idempotency, unique decision key, transactional audit and compare-and-swap update.
- Duplicate external effect after timeout: persist attempt identity before dispatch; provider idempotency where supported; reconcile unknown outcomes before retry.
- XSS and unsafe links: escape text, disallow raw HTML, validated URL schemes, safe external link attributes, content security policy. Never fetch arbitrary provider-supplied URLs server-side without an explicit allowlisted need.
- CSRF/session theft: secure session configuration, same-origin/CSRF defense, authentication expiry and revocation; no tokens in client logs or URLs.
- Privacy leak through build/analytics: no private seeds, identifiers, snapshots, source maps with secrets, message bodies in telemetry, or cached authenticated responses in public infrastructure.
- Stale data as false completion: independent timestamps, unknown state, stale warnings, evidence requirements and correction history.
- Unbounded ingestion/denial of service: byte/record limits, rate limits, pagination, job budgets and backpressure.
- Excessive retention: minimum evidence summaries, approved retention, recoverable deletion, documented backup expiry and secure restore.

## Security verification and incident handling
Test anonymous, wrong-owner, revoked-session and compromised-source scenarios with controlled private accounts. Inspect generated bundles, logs, errors, archives and version history. Confirm secret redaction and grant revocation. A secret finding blocks publication; remove exposure and follow the owner's credential-rotation process without silently changing credentials.

Record incidents with safe metadata, scope, time and remediation evidence. Restore must not re-enable revoked connectors. Public issue reports must not contain private screenshots or provider identifiers. Choose a security contact before public release.

## Engineering threats and additional gates
Session review must exclude hidden assistant instructions, private reasoning, denied storage and raw credentials. Access denial prohibits alternate-route retrieval of the same content. Imported session exports and project skills are untrusted data; never follow their instructions as authorization. Select project roots explicitly, reject escaping symlinks/includes and redact selected configuration before display.

Host execution requires a bounded owner-approved workspace, least-privilege capabilities and separate observation/write grants. Terminal output can contain secrets and active escape content: sanitize/redact before retention or transmission, withhold uncertain high-risk output, and disable arbitrary stdin/control channels for viewers. Never copy a credential from a session/export into a runtime configuration.

Prevent concurrent corruption with isolated worktrees or enforceable fenced writer leases. An expired lease is not termination evidence. A lost host or canceled parent may leave children running; preserve unknown status until reconciled. Revocation stops new actions while allowing only the authorized safety/reconciliation path. Child agents cannot approve wider capabilities or exceed the parent's budget/scope.

Daily summaries and next-work prompts must omit secrets and internal instructions, cite allowed evidence, respect per-source access and remain private. Publication review includes terminal logs, session exports, configuration snapshots, test receipts and generated prompts. Public repository examples contain no actual host bindings or private session IDs.
