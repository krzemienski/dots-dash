# Source release status

Current local consolidation: [release readiness at `53c78ca`](RELEASE_READINESS.md).
It preserves historical results and distinguishes source-matching isolated evidence
from actual-owner and production acceptance. The later 25 October update records
current-source N/W re-verification; earlier publication holds remain historical records.

The session/source-review feature update has [scoped isolated verification](verification/source-review-publication.md)
and a [source-bound observation ledger](verification/source-review-publication.json).
The historical main-release checks below apply only to that original revision.
Feature-branch publication and CI status must be read for the exact feature commit;
neither source publication nor passing CI certifies production readiness.

The sanitized reusable source was published to https://github.com/krzemienski/dots-dash on October 15, 2026. The first complete remote revision is `1651e397c8a3c1c6e9fd2c095e9bd0c5e6ec640d`. Its tree `1afe1bf3baffed108dfbb978e0928c329cc3f751` exactly matches reviewed local source revision `7a6eb7d6387a654c8c0ac0ecc6f73665e110a37a`.

This publication contains generic source and documentation only. No private deployment history, runtime records, credentials, user source exports or generated runtime database is included. Public source availability does not make a runtime dashboard public and does not establish production readiness. License selection remains pending.

## Release checks

- Fourteen isolated tests passed, exercising actual SQLite/API behavior, bounded engineering snapshot import and server-side React rendering.
- TypeScript typecheck and client build passed.
- Candidate source and generated build output passed targeted private-data/secret indicator checks. Human review covered the newly ported component and deployment instructions; automated pattern checks are not an independent security certification.
- GitHub main and its complete file tree were read back. The exact Git tree hash matched local source, verifying all 49 source files at the initial release revision.
- No GitHub Actions runs were configured for that revision. A CI badge or CI-passed claim would be incorrect.

Checks reused installed dependencies. Clean offline installation was attempted and failed because the scheduler package was not cached; clean-install verification remains open. Live identity-provider integration, signed-in browser interactions, email/calendar synchronization, scheduler execution and an own-assistant bridge remain unverified or unimplemented as detailed in the setup/specifications.

## Updating

Preserve existing remote work and use normal fast-forward commits. Review source, history, generated assets, logs and attachments for private data before publishing updates. Keep runtime databases and private deployment configuration outside Git. Record new verification against the exact updated revision; do not treat the initial release checks as evidence for later code changes.
