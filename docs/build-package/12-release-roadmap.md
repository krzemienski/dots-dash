# Private first release and open source roadmap

## Separate product artifacts
Reusable code contains generic interfaces, validators, migrations, views, setup tooling and public-safe documentation. Private runtime contains owner identities, grants, source bindings, message and calendar content, receipts, histories and private URLs. The hosted private prototype is not automatically a safe public repository. Export selected source into fresh history rather than publishing the original workspace or its archives.

## Private repository first
Create the repository only through an authorized supported route. Verify actual owner, repository name and private visibility. Commit coherent implementation and documentation increments, then verify the exact remote commit. Keep user-facing progress precise: prepared files, local commit, remote push, CI success and deployed functionality are separate milestones.

Do not include dependency caches, build output, database dumps, authentication files, private initialization, runtime exports, test-account evidence, private screenshots, credential-bearing configuration or prior private Git history. Keep an explicit export allowlist, .gitignore and a manual review checklist. A pattern scan helps but is not a guarantee.

## Reproducible independent installation
Start with an empty database and owner-approved authentication setup. Discover available adapters, ask only for necessary access and verify a simple read. Unsupported providers stay unconfigured. Document scopes, revocation, quotas, costs, runtime versions and retention. Prove a second independent owner can install without shared credentials or copied account bindings.

## License decision pending
Do not add a license by inference. The owner must choose one after reviewing intended use and third-party dependency obligations. Audit copied starter/template code and dependencies, retain required notices, and document any constraints. Until an explicit license is selected and publication approved, this is a private development project rather than a generally licensed open-source release.

## Public release gates
1. All advertised functionality passes controlled live functional acceptance and independent setup.
2. Review complete Git history, branches, tags, releases, CI logs, build artifacts, screenshots and source maps for private data/secrets.
3. Confirm privacy-safe telemetry, secure defaults, owner isolation, export/restore/revoke and security reporting path.
4. Select and apply the approved license and third-party notices.
5. Obtain explicit approval for public visibility and verify the resulting visibility and exact remote revision.
6. Publish honest capability documentation: supported connectors, unsupported bridge directions, freshness limits, known gaps and test evidence categories.

The public source repository must never make personal hosted dashboards public. Repository visibility, hosted application audience and source-provider sharing are separate controls.

## Future extensions
After stable web operation: additional provider adapters, richer itinerary associations, explicit collaboration roles with sharing controls, and native iOS check-in. Evaluate each against real owner needs. No extension may weaken approval semantics, combine account coverage dishonestly, or replace evidence with generated activity.

## Operational maintenance
Assign an owner for dependencies, security reports, migration testing and adapter API changes. Review expired grants and unsupported providers. Test restoration periodically under an approved operating plan. Maintain a change log that states new verified capabilities and breaking contracts. Report deprecations and stopped source coverage prominently rather than silently serving stale data.

## Version 3 extension release controls
Ship engineering review independently from execution when useful: first permitted session imports/context links, then approved read-only host observation, then real bounded orchestration. Each target product has its own verified support statement. User-owned project configuration visibility never includes internal assistant instructions or secrets.

Python migration is a measured compatibility project with single-writer cutover and rollback evidence, not an unannounced rewrite. Public export audits now include session exports, terminal output, host bindings, configuration snapshots, agent prompts and orchestration evidence. Keep all personal runtime artifacts private. License, public visibility, new persistent integrations and production deployment remain separately gated.
