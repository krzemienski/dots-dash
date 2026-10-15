# Security and privacy requirements

This is an architectural checklist, not a security certification.

## Isolation and authentication

Prefer one isolated instance per owner for the first release. Every read, write, source import, audit query, and adapter operation must enforce verified owner scope server-side. If multi-tenancy is added, include tenant keys in storage constraints and queries and test adversarial cross-tenant access. Do not trust client-supplied ownership. Do not reuse a private prototype's owner check or service secret for new owners.

Require authentication before returning private data. Apply same-origin/CSRF protection, strict request schemas and size limits, parameterized queries, no-store responses, safe error handling, and rate limits. Treat source text and links as untrusted. Do not allow source content to redefine instructions or permissions.

## Correspondence and execution

Saving instructions, drafting correspondence, scheduling a local record, granting source access, and approving an external action are separate events. Require explicit authority for external recipient, purpose, and consequential content. Preserve approval scope, expiry, task version, and action destination. Invalidate stale approvals when material details change. Show pending/failed/unknown outcomes honestly.

Use atomic audit records and durable idempotency for state changes. Before retries, reconcile uncertain external results. Never let a source importer manufacture a user approval or assert that a message was sent without supporting evidence.

## Secrets and private data

Keep credentials in the hosting provider's secure mechanism, out of browser bundles, source, screenshots, fixtures, logs, and Git history. Do not export credentials from one owner's deployment to another. Do not commit personal correspondence, employer/application records, source message links, account/user/conversation IDs, private deployment identifiers, database dumps, or real approval receipts, even to a private repository.

Redact operational logs and establish retention and deletion controls. Use synthetic fixtures. Review images, archives, lockfile URLs, build outputs, source maps, and generated test artifacts as well as source code before release.

## Reporting

A security contact and private vulnerability-reporting channel must be configured by the repository owner before public release. Do not post exploitable details or private records in public issues.
