# Owner-reported retained-selection review

Acceptance baseline: [R1–R10](build-package/16-source-coverage-checkpoints.md#acceptance-required-before-implementation-claims), specified before implementation in local design commit ff4f578c9b440a67701a09a4969b1889a2b76c64. This slice concerns reports of reviewing retained normalized records, never certified source processing or verified authorship.

The separate `/api/owner-review-reports` read/write endpoint is owner-scoped and
same-origin. `DASHBOARD_ALLOW_OWNER_REVIEW_REPORTS` defaults off. Enabling it does
not migrate storage. An operator must explicitly run the companion migration
against an existing, owner-bound engineering database:

```sh
python3 -B python/migrate_owner_reviews.py --database /chosen/engineering.sqlite --owner chosen-owner
```

Use only an independently authorized database. The migration adds immutable
companion tables and triggers; it does not rewrite exports or existing history.
HTTP reads and writes never apply it. No production migration is part of this
implementation verification.

A manifest pins the stored normalized export digest, ordered retained event IDs
and event digests. Excluded dispositions and unknown authorship remain visible
separately. Explicit per-item reviewed/unresolved assertions have evidence
references, observation time and owner-reported basis. Corrections and withdrawals
append events; current prefix can retreat without rewriting earlier checkpoints.
Current totals use the full stream; history pages contain at most 50 checkpoints.
The supported processor definition is owner-record-review version 1 only. Other
versions reject; future processor definitions and adapters remain unimplemented.

The UI retains an uncertain request while mounted and blocks new writes. Explicit
identical replay or read-only operation lookup reconciles it. Not-found stays
unconfirmed. Leaving/reloading the view loses the pending envelope; durable client
recovery is not supplied. Owner reports never update admission processing flags,
source inventories, remediation completion or checklist outcomes.

## Isolated validation, 2026-10-21

The [source-bound report](verification/owner-review-reports.json) records 52 scoped
observations and two additional physical-owner storage checks. The rendered UI
imported the existing TEST DATA selection, created a manifest, recorded items
1, 2, 4, 5 (reviewed 4 / prefix 2), filled the gap (5 / 5), corrected an item
to unresolved, withdrew another, and re-reported it. Prefix retreated without
rewriting earlier evidence. A simulated transport loss after commit left new
writes blocked until read-only lookup reconciled the original operation.

API checks separately exercised replay/conflict, changed material/order, owner
and project isolation, stale predecessors and one-winner concurrent correction.
The UI navigated 53 checkpoints across 50-entry pages while retaining full-stream
counts. Disposable database copies supplied stale/unavailable/missing-target
conditions; direct SQLite checks rejected history updates/deletes. No production
or shared database was migrated. Owned browser/server handles were closed.

R1–R4 and R6–R10 were exercised within these stated boundaries. R5's current
boundaries passed, including rejecting an unsupported processor version. A new
allowlisted processor definition is not shipped, so creating that future stream
remains unperformed. The full 1,000-event retention boundary was not exercised.
Existing tests (14), final typecheck, build and Python AST parsing passed; these
static checks do not substitute for owner acceptance. Prior reports remain
historical to their recorded hashes. Actual-user V301, original transcript
coverage, verified authorship and production acceptance remain unestablished.
