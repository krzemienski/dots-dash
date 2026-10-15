# Own-instance setup plan

The reusable local application and tests are runnable; real production authentication and provider integration remain incomplete. See [application setup](APPLICATION_SETUP.md) for the implemented server. No supported one-click assistant connection has been verified.

## Local preview

Use Node 24+, install with `npm ci`, then run `npm test`, `npm run typecheck`, and `npm run build`. Run `npm start` to serve the client and owner-gated APIs. No credentials or source records are included. The SQL migration in `db/0001_empty.sql` creates empty tables; tests and the generic server apply it to fresh SQLite storage. No database provisioning or deployment command is included.

## Prerequisites to establish before implementation release

1. Select a supported hosting/runtime target and document exact toolchain versions from the sanitized source.
2. Provision a separate private instance and database for its owner. Never copy a prototype owner's database, service credentials, account identifiers, or imported work.
3. Configure authentication using the provider's supported secure flow. The owner must authorize persistent grants. Do not paste credentials into chat, examples, source files, browser bundles, or logs.
4. Bootstrap ownership from a verified identity using a controlled server-side operation. Do not derive authority from an arbitrary email or user ID supplied by the browser.
5. Apply reviewed schema migrations, starting with empty data. Seed only explicitly fictional, optional examples.
6. Run the documented checks and authentication/isolation tests before importing real data.

## Connection onboarding

For each source, show the destination, scope, information categories, and whether access is read-only or permits actions. Require the owner to approve the applicable grant. Connect the owner's accounts only. Record revocation and failure states visibly.

For an assistant connection, first discover a supported authenticated endpoint or private Sites MCP mechanism. Verify the intended owner and assistant identity, least-privilege capabilities, revocation, and a test receipt with synthetic data. Keep the feature visibly unavailable if these checks cannot be completed. A manual copy-and-paste instruction can be labeled as manual; do not mark it delivered automatically.

## First real-data import

Import only source evidence the owner authorized for this instance. Validate bounded schemas and provenance; reject cross-owner input. Preserve source timestamps and use idempotency to prevent duplicate entries. Do not perform external actions during import.

## Recovery and uninstall

Before production use, implement private backup/restore, retention, export, connection revocation, and deletion workflows. Document which actions are recoverable and require the appropriate confirmation for irreversible deletion. Removing a dashboard record must not silently cancel a real external schedule or delete source correspondence.
