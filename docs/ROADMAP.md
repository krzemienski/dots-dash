# Roadmap and public-release gates

## 1. Private foundation

Create a private repository in the owner's account and verify its visibility. Add this sanitized core/preview package. Complete the missing authenticated application layer in a fresh history. This extraction used an explicit source allowlist and includes no original Git history. Remove all private seed/import payloads, identity bindings, deployment config, copied database files, private fixtures, and generated archives. Review source and dependency licensing before inclusion.

## 2. Correspondence and schedules

Prioritize authenticated source provenance, meaningful freshness indicators, real delivery receipts, real provider schedule IDs and statuses, timezone correctness, and clear blocked/unknown states. Verify live integrations using controlled, authorized functional records in a separate private test account before advertising them. Synthetic fixtures and mocks cannot establish integration success. Keep external sending and schedule changes behind explicit authorization.

## 3. Independent owner setup

Ship empty-instance setup, secure owner bootstrap, a provider-neutral adapter interface, documented connection scopes, revocation, synthetic fixtures, and isolation tests. Validate a second independent owner without shared secrets or data. Keep unsupported assistant adapters visibly unconfigured.

## 4. Release audit

- Select a software license explicitly with the owner; retain required third-party notices.
- Review all history, tags, releases, Actions logs, artifacts, screenshots, examples, fixtures, source maps, and configuration for sensitive material.
- Run secret scanning and targeted personal-data checks; inspect results manually. A clean regex scan alone is not a guarantee.
- Confirm all production/runtime data remains outside the repository.
- Complete security, dependency, accessibility, setup, backup, and revocation checks. Production integration acceptance requires controlled real functional tests with independently observed receipts; isolated tests are complementary only.
- Document known gaps, supported providers, exact versions, and reproducible test commands.
- Configure a security contact and contribution process.
- Obtain explicit approval before changing visibility to public.

Private repository creation does not authorize public release. Open-source availability and hosted-service access are separate decisions.
