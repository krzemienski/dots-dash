# dot work dashboard

A private-first dashboard for understanding an assistant's correspondence, scheduled work, approvals, and outcomes. The long-term goal is for each person to deploy an isolated instance and connect their own assistant through an authenticated adapter.

**Status: reusable application foundation, with production integrations incomplete.** Includes the dashboard UI, history/import validation, empty schema, real SQLite persistence, owner-gated APIs, saved instructions, local approval records, and an unconfigured assistant adapter. Private APIs deny access until a real server-side authentication adapter is supplied. No private records, credentials, live source connection, scheduler, or assistant delivery are bundled.

[Public repository](https://github.com/krzemienski/dots-dash) · [Release status and verification](docs/RELEASE_STATUS.md)

## Local checks and application

Use Node 24 or newer. Run `npm ci`, `npm test`, `npm run typecheck`, `npm run build`, then `npm start`. Read [application setup and actual verification](docs/APPLICATION_SETUP.md) before configuring authentication or importing data. The default server runs on loopback and refuses private API access; it does not fabricate a demo identity. `node --test tests/core.test.mjs tests/api.test.mjs` runs dependency-free isolated core/API checks.

## Product priorities

1. Correspondence: show verified incoming/outgoing activity, its source, what needs a reply, and delivery receipts.
2. Scheduled tasks: distinguish a proposed schedule, a real configured schedule, a running task, and its observed result.
3. Work context: projects, opportunities, approvals, instructions, and an audit trail.

The dashboard should never imply that saving a draft sends it, approving a record executes an external action, or recording a task schedules it.

## Full product build package

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
