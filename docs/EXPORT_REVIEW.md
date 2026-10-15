# Sanitized extraction review

## Included source allowlist

The initial extraction used seven original files as source inputs:

- History import library, with personal attribution replaced by unknown-actor wording.
- History validation library, with hardcoded source account replaced by required trusted adapter configuration.
- Instruction/approval/origin validation library, containing no seed data.
- Provider-neutral contracts, with deployment-specific provider references removed.
- Schema-only SQL migration, containing no inserts or imported rows.
- History-view React component, with personal findings removed and UTC display used.
- Standalone CSS, containing no remote assets, account references, or imported data.

The later application extraction additionally reviewed and ported the dashboard shell, commitment component, observation component, and updated CSS/validator shapes. All personal shell/schedule content and private account bindings were removed. Generic server/store code was authored independently. All other source-tree files were excluded. This includes original Git history, seed and fixed reconciliation code, API routes, auth/owner logic, deployment IDs/configuration, test fixtures, database files, archives, screenshots, build scripts, source maps, generated code, and private datasets. No runtime data directories were copied.

The preview entry point, build script, package configuration, synthetic tests, and documentation were created independently. The dependency lockfile was reduced to the required public npm registry dependency closure. No local-path or workspace-link dependencies are included.

## Checks

The exported file inventory, included text source, SQL, documentation, dependency URLs, and generated preview output were reviewed. Targeted scans checked personal names/account references known from the prototype, private source-message URLs, hosting identifiers, credential-shaped strings, and key material. Relative documentation links and archive contents were checked. The export contains synthetic `example.test` addresses and clearly fictional Gmail thread IDs only in tests.

No original Git repository history, live database, credentials, personal records, or private deployment configuration is included. Preview build outputs and dependency directories are excluded from the source archive; consumers generate their own preview build.

## Limits and release gate

This is a narrow extraction and targeted review, not an exhaustive third-party security or secret-scanning certification. No commercial secret scanner, full dependency vulnerability audit, legal/license audit, real deployment, or second-owner end-to-end setup was performed. Existing dependency licenses still apply. A software license for this project's original code remains undecided.

Keep the repository private when created. Public publication requires an independent final privacy/security/license review and explicit owner approval. Do not represent this artifact as a finished multi-tenant application or an operational connection to an assistant.
