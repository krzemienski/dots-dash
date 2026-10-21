# Work dashboard build package

Version 3.0 | October 15, 2026 | Public-safe product and engineering specification

Build a private, evidence-backed dashboard that connects correspondence, schedules and engineering execution while keeping their permissions and evidence distinct. Every request links to actions, outcomes, remaining work and user decisions. This package describes the full product and a gated implementation path. It does not claim every component exists.

Read the [21 October product/completion audit](../PRODUCT_AUDIT.md) first for reconciled status and [proposed mockups](../mockups/product-review.html). Historical deltas below retain their original evidence boundaries; a later isolated check does not establish production acceptance.

## Read in this order
1. [Current implementation and gaps](01-current-state.md)
2. [Product requirements](02-prd-v2.md)
3. [Functional and technical specification](03-functional-technical-spec.md)
4. [Domain and event schema](04-domain-event-schema.md) and [proposed TypeScript contracts](contracts.proposed.ts)
5. [Proposed API](05-api-contract.md)
6. [User journeys](06-ux-flows.md)
7. [Source and assistant adapters](07-connectors-and-bridge.md)
8. [Permissions and threat model](08-security-privacy.md)
9. [Milestones and dependencies](09-build-plan.md)
10. [Master and phase execution prompts](10-build-prompts.md)
11. [Functional verification plan](11-verification-plan.md)
12. [Private first release roadmap](12-release-roadmap.md)
13. [Engineering contexts and execution](13-engineering-contexts-and-execution.md)
14. [Python migration and version 3 acceptance](14-python-migration-and-v3-acceptance.md)
15. [Proposed Python adapter contracts](contracts_v3_proposed.py)

## How to use the package
Start version 3 work with the engineering specification and Python migration plan; the proposed Python contracts supersede TypeScript-only backend design direction. Existing TypeScript contracts remain frontend compatibility references.

The implementation owner should select one ready milestone, use its phase prompt, and attach evidence to every completion claim. Keep a private deployment register containing actual identities, source bindings, receipts, deployment versions, and test artifacts. Public source control contains only generic code, empty migrations, documentation, and sanitized test tooling. Do not copy the private register into this package.

The reusable application now includes a generic SQLite/API foundation with authentication denied by default; see [implemented application setup](../APPLICATION_SETUP.md). It still differs from the hosted private prototype. Read the capability matrix before estimating work or promising functionality. Proposed contracts are design documents, not available endpoints. A successful build or local commit proves neither live integration nor remote publication.

## Scope and ownership
Product priorities: correspondence and schedules first, with linked engineering contexts, needs-user decisions and request accountability; broad projects, roles and consulting throughout. New backend and orchestration work is Python-first. The existing React/TypeScript frontend is an explicit compatibility boundary, not silently rewritten. Web comes first. An eventual iOS app uses the same backend and event model. React already underlies the available code. React Native or Expo remains an implementation option, not a settled requirement.

Repository ownership, final license, public visibility, hosting provider, new persistent integrations, external actions, and paid services require their own applicable decisions or approvals. This package grants none of them. License selection is pending; public-safe content is not equivalent to authorization to publish.
