# Deploy an isolated dashboard instance

This is an application foundation, not a turnkey live assistant connection. Publishing this source does not publish any user's runtime dashboard. Start with an empty private instance. No production identity provider, email/calendar sync, scheduler or assistant bridge is bundled.

## Local evaluation

1. Obtain the reviewed repository or source archive. Inspect its revision and release notes.
2. Install Node 24 or newer and npm from an approved distribution. From the repository root run `npm ci`, `npm test`, `npm run typecheck`, and `npm run build`.
3. Run `npm start`, then open `http://127.0.0.1:4173`. Static UI assets should load. Private API requests should return 401 until authentication is configured. That is the expected safe default, not a working sign-in flow.
4. Stop with Ctrl-C. Runtime SQLite files live in ignored `private-data/` by default. Never commit or attach them to public issues.

Use `node --test tests/core.test.mjs tests/api.test.mjs` for dependency-free core and actual SQLite API checks. Their controlled test principal is not a production authentication implementation.

## Private server deployment

Use a dedicated non-root operating-system account and a supported host with Node 24 and persistent local storage. Keep application source read-only to the service where practical, with a separate owner-only writable data directory. Do not place SQLite on ephemeral/serverless storage or assume a multi-process/network-filesystem deployment is supported. One instance/database serves one owner.

Build assets before starting the service. Configure an operating-system process supervisor to run `node server/start.mjs` from the repository directory. The process deliberately binds only to 127.0.0.1; use a reviewed TLS reverse proxy on the same host for remote access. Configure its browser-facing HTTPS origin exactly in DASHBOARD_PUBLIC_ORIGIN. Do not expose a development server, strip Origin checks, trust arbitrary identity headers or disable TLS to make deployment pass.

Provide DASHBOARD_DB_PATH as an absolute private database path, PORT as the internal loopback port, and DASHBOARD_OWNER_ID as the identity the verified server adapter expects. Supply DASHBOARD_AUTH_MODULE as an absolute path to a reviewed server-only module exporting `authenticate(request)`. The module must verify a real provider session and return `{id}` only after successful verification, or null otherwise. Implement expiry/revocation, secure cookies, session binding and applicable CSRF protections; do not use a constant principal. Secrets belong in the approved runtime secret mechanism, never tracked source or browser JavaScript.

No authentication provider or proxy integration has been certified here. Until its implementation and negative tests pass, keep the instance inaccessible to private data and other users. See [application configuration](APPLICATION_SETUP.md) for all settings and actual routes.

## Import and assistant connection

Leave DASHBOARD_ALLOW_IMPORT disabled until owner authentication and source/destination permission are verified. Correspondence import additionally requires DASHBOARD_SOURCE_ACCOUNT. Manual imports are evidence snapshots, not automatic mailbox synchronization. Never upload runtime imports to the source repository.

There is no general “connect my dot” setup yet. Do not insert credentials from another assistant session or assume an existing plugin grant authorizes this deployment. Implement and verify a supported, owner-approved adapter, receipt and revocation workflow first. Saved instructions remain saved_not_delivered; local approval decisions do not execute external actions.

## Operational acceptance and upgrades

Before adding real private records, verify anonymous, wrong-owner, expired/revoked-session and forged-origin requests fail; assets do not expose server secrets; private responses are no-store; source binding is enforced; and backups can be restored into an isolated private instance. Test the real browser sign-in and sign-out paths. Record exact revision and outcomes. Passing local unit checks does not meet these gates.

For each update, review the diff and dependency changes, install from the committed lockfile, run checks, build, back up through an approved private process, and perform a controlled restart. Preserve one authoritative database writer. Schema changes need an explicit migration and tested rollback plan; do not overwrite newer runtime records with an old backup. Keep the previous reviewed source revision for rollback. Do not enable automatic updates that bypass these checks.

Public source release does not certify production security or license the project. License selection remains pending; third-party dependencies retain their own license terms.
