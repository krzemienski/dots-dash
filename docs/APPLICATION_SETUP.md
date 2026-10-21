# Local application and authentication boundary

## Implemented application

The reusable application includes the dashboard shell and task/instruction/decision views, correspondence, opportunities, calendar history, requests/commitments, projects, source coverage, activity, and observations. The Day & projects view filters request review dates in UTC, displays imported engineering evidence and offers copyable next-work drafts. It does not ingest live sessions or execute prompts. Records start empty. The Node HTTP server serves the client and a real SQLite-backed API. There are no bundled private records or operational fixtures.

Run Node 24 or newer. Install dependencies with `npm ci`, build with `npm run build`, then start with `npm start`. By default it listens on loopback port 4173 and stores an empty database in ignored `private-data/dashboard.sqlite`. The directory is created with owner-only mode and the file with mode 0600. Back up the database only through an authorized private process. The server uses a fixed asset allowlist and does not serve arbitrary filesystem paths.

The default UI reports an authentication blocker because every private API is denied until a real identity adapter is configured. This is deliberate. There is no demo login, static token, hardcoded user, trusted-header bypass, seeded operational dataset, or automatic connection.

## Server-side configuration

Set these in the operator's private runtime, not source control:

- PORT: loopback listening port, default 4173.
- DASHBOARD_DB_PATH: isolated SQLite path for one owner.
- DASHBOARD_PUBLIC_ORIGIN: exact browser-facing origin for mutation checks. Default is the local loopback origin. A production TLS reverse proxy must preserve the verified origin and enforce deployment access controls.
- DASHBOARD_OWNER_ID: verified stable identity expected from the authentication adapter. No default.
- DASHBOARD_AUTH_MODULE: absolute path to an operator-controlled server module exporting async authenticate(request). It must verify a real session with the chosen supported identity provider and return {id} only after verification, or null on failure. No provider implementation is bundled.
- DASHBOARD_SOURCE_ACCOUNT: trusted source account binding for Gmail correspondence imports. No default. This is an account-match constraint, not authentication.
- DASHBOARD_ALLOW_IMPORT: defaults to disabled; set true only after the authenticated owner import workflow and destination/source permissions are established.
- DASHBOARD_ALLOW_OPERATION_LOOKUP: defaults to disabled. With an existing owner-bound Python engineering store, enables [manual read-only receipt inspection](OPERATION_LOOKUP.md); it performs no migration or retry and adds no write permission.

The auth module is executable server configuration. Do not load an unreviewed module, use a client-supplied identity/header as authentication, return a constant owner, disable verification, or commit credentials to make the app appear usable. The identity provider, session expiry/revocation, CSRF and deployment proxy behavior must be verified independently before production use. No signup, OAuth grant, secret, paid service, or persistent external integration was created by this implementation.

## Implemented routes

- GET /api/work: authenticated owner's records, saved instructions, activity, decisions, timestamp and disconnected bridge status.
- POST /api/work: save an instruction or record a bounded decision. Requires owner authentication, exact configured Origin, JSON, and a size limit. Instructions remain saved_not_delivered. Decisions return executed:false.
- GET /api/history: authenticated history projection.
- POST /api/history: disabled-by-default, same-origin owner import with bounded JSON, schema validation and configured source-account matching. It is a manual evidence interface, not mailbox sync.
- GET /api/health: owner-authenticated application-storage status. It is not provider health.

The proposed /v1 APIs, richer event history, scheduler workers, generic source adapters, real session implementation, live correspondence/calendar sync, MCP connection, assistant routing, native iOS and external execution are not implemented. The existing single-owner schema is unsuitable for multiple owners in one database.

## What was actually verified

Fourteen isolated checks passed against actual SQLite persistence, validation, API contracts, bounded engineering snapshots and rendering; typechecking and client build passed. The filesystem persistence check closed and reopened the database before confirming the saved instruction. HTTP smoke checks started the actual server: assets returned 200; unauthenticated work/history/health returned 401 with no-store; filesystem-sensitive paths returned 404.

The isolated API tests use a controlled principal function and do not establish a real authentication integration. Browser access to the local endpoint was attempted but connection refused across the tool-session boundary, so no signed-in browser or responsive interaction success is claimed. Clean dependency installation remains unverified due unavailable cached registry packages; checks reused existing installed dependencies. No live provider, hosted deployment, concurrency audit, security certification, or external action acceptance test was performed.
