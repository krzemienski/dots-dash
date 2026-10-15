# Verification and current limits

## This package

Sanitized extraction with a narrow source-file allowlist. No original Git history, production data, database dump, runtime secrets, private hosting configuration, seed records, service routes, or original QA fixtures were copied. Documentation was authored from architectural requirements.

Checks performed: eight synthetic tests passed (empty schema, trusted source-account matching, import/replay/conflicting-batch handling, preservation of unrelated tasks, unknown references, invalid evidence, instruction/decision/origin validation, unconfigured delivery, empty UI server rendering, and HTML escaping). Type checking passed. The empty static preview built successfully. Checks reused existing installed dependencies. Independent `npm ci --offline` was attempted and blocked by missing cached registry packages; a clean install is not verified. The lockfile contains only the required public-registry dependency closure, extracted from previously resolved dependency metadata, with exact versions and integrity hashes. No browser interaction, real D1 deployment, production authentication, isolation penetration test, concurrent import race test, or live-provider end-to-end test was performed.

The source importer is a single-owner library, not a network security boundary. Do not expose it without authenticated owner-scoped routing. The preview is deliberately empty and not a production-ready standalone dashboard.

Repository creation and remote publication are separate steps. Their success must be verified by reading repository metadata and checking the exact remote commit. A local directory or proposed URL is not proof that a repository exists.

## Before claiming implementation completion

Report each check as passed, failed, or not run against the exact source revision:

- Dependency installation using the reviewed lockfile.
- Lint, type checks, unit and integration tests, and production build.
- Authentication-required reads/writes and owner isolation.
- Schema validation, size bounds, unsafe links, CSRF/same-origin checks.
- Replay/idempotency, concurrent writes, stale approvals, expiry, and audit atomicity.
- Empty state and migration from a fresh database.
- Interrupted onboarding, repeated clicks, navigation/back, reconnect, and stale responses.
- Private-data absence in client bundles, source maps, fixtures, archives, and history.
- End-to-end source import with a synthetic event and authenticated delivery receipt if an adapter is implemented.
- Cross-device and mobile UI independently from compilation.
- Backup restoration and grant revocation.

## Known unverified capabilities

A general “connect your own dot” integration, private Sites MCP onboarding, live mailbox sync, real scheduler synchronization, external execution, real action-time approvals, stream/reconnect replay, native mobile support, and multi-owner production isolation are not established by this package. Verify any capability independently before moving it into the implemented list. Successful manual source ingestion is not an active monitor.

## Live acceptance requirement

An isolated test pass must never be substituted for functional integration acceptance. Before claiming that correspondence, scheduling, authentication, assistant delivery, or external execution works, use controlled authorized records in a separate private test account and verify the actual provider state and receipts. Keep that test data out of source control and public reports. Do not invent success or create unnecessary communications merely to make a test pass.

## Application extraction update

The package now includes the v6 commitment/observation views, complete generic dashboard client, actual SQLite storage, and a fail-closed generic HTTP API. Twelve isolated tests, typecheck, client build, and real unauthenticated HTTP smoke checks passed. See [application setup](APPLICATION_SETUP.md) for the exact implemented routes and remaining authentication/integration/browser limits. Earlier eight-test and empty-preview statements above describe the initial extraction, not the expanded application.

## Public source release and Day/Project update

The latest source release adds Day/Project views and bounded engineering evidence snapshots. Fourteen isolated tests, typecheck and build passed. See [release status](RELEASE_STATUS.md) for exact publication evidence and unresolved clean-install, real-authentication and live-integration gates.
