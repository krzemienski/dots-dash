# Selected-review evidence history — local V312 slice

## Outcome and existing-model boundary

For one saved review, inspect which supplied source observations, saved reports
and local checklist receipts fall on a chosen day, with evidence references and
correction context. A later correction must not hide an earlier negative record;
a later passing report must not rewrite an older receipt's acceptance.

The [PRD](build-package/13-engineering-contexts-and-execution.md#completion-and-next-work)
requires bounded periods, cited evidence and preserved corrections. The
[daily snapshot check-in](DAILY_EVIDENCE.md) cannot supply verified-work history:
its imported review timestamps are not actual work occurrence times. The existing
[review model](../lib/work/engineering.ts), [store](../python/dots_engineering/store.py)
and [local producer](../python/dots_engineering/service.py) do retain enough evidence
for this smaller read-only view, without a migration or retention change.

At baseline `86dea069c00baa13542c7eb95ab736f0fad15209`, an isolated import retained
source timestamps and supersession, but the rendered review had no date-scoped
evidence-history view. The [new component](../ui/review-evidence-history.tsx) sits
inside the [existing selected review](../ui/session-review.tsx); it reads the
already authenticated response and navigates existing exact targets.

| Evidence group | Day basis | Explicit limit |
|---|---|---|
| Source observations | Supplied `observedAt` | Not independently observed event occurrence, ingestion or authorship |
| Owner reports | Server `recordedAt` | Save time, not performed-workflow occurrence time or human acceptance |
| Local checklist receipts | Receipt `recordedAt` | Bounded producer record, not remediation completion, full skill or agent execution |
| Supersession / scoped assertions | References attached to retained source rows | Context can cross the chosen day; links grant no access/authority or completed processing |

UTC is the initial zone. Invalid zones retain the previous applied scope. Server
microseconds are reduced only for day comparison; original timestamp strings,
record order, hashes and stored identities remain untouched. Missing or unsupported
timestamps are counted as unusable, not assigned invented dates. Up to 50 records
per group are shown with selected/retained counts; this is not pagination or a
whole-source denominator. Superseded source rows are included, and links to later
corrections outside the selected day remain visible. Unavailable retained endpoints
are labeled unavailable rather than fetched or reconstructed.

The view intentionally excludes other reviews, retained-item report/correction
streams and owned browser receipts. Their existing views remain separate. This
avoids inventing cross-store identity, a unified event model or new access. No
API, storage schema, producer, migration, persistence or capability was changed.

## Acceptance and observed results

Scenarios were defined before implementation. The final-source
[ledger entry](verification/request-evidence.json) records five completed isolated
headless UI → real Node/Python API → disposable SQLite cases using labeled TEST DATA:

| Case | Result and scope |
|---|---|
| H1 | Passed: a superseded blocked source row remains on its supplied day, with exact navigation to a later-day correction; read/navigation preserves database bytes |
| H2 | Passed: offset boundary changes membership in America/New_York; invalid zone retains previous scope; occurrence time is not inferred |
| H3 | Passed: actual server microsecond report/receipt timestamps group correctly; two owner reports retain fail/pass history, while the earlier successful checklist receipt still reports historical acceptance fail |
| H4 | Passed: keyboard report navigation reaches exact goal history; receipt navigation reaches exact receipt; records and bytes unchanged |
| H5 | Passed: reload preserves evidence; 320/375px keyboard/date/empty-day checks preserve unknown coverage and database bytes |
| H6 | **Unperformed:** separately imported selected-record scoped correction across a day boundary, with prior-review preservation |

The H6 driver attempt failed during module loading before browser launch, fixture
creation or any API/database operation. The previously used cached Playwright
module had disappeared. The remaining cached driver expected Chromium 1247, whose
executable was absent. No installation, shared-browser substitution or access
change was attempted. Its presence in source is not runtime acceptance of H6.

All 14 existing tests and typecheck passed; the successful build's input hashes
still match the five-case runtime source. The narrow screenshot was inspected as
a partial long-page capture, not proof of full visual/screen-reader acceptance.
Owned browser/server/database handles from completed runs were closed. No external
requests occurred. No unsolicited test files or private records were added.

## Remaining dependency and next task

First restore an already-authorized isolated driver/browser pairing, then execute
H6 against the unchanged source before broader history claims. Maximum-preview,
unusable-timestamp legacy data, excluded correction endpoints, screen-reader and
human-owner acceptance remain unperformed. No live source access, all-transcript
coverage, completed processing or full V312 is established.

For full verified-work history, define a separate owner/store-bound event input
contract with actual occurrence/save-time basis, exact producer receipts, immutable
correction links and bounded interval coverage. Do not backfill occurrence times
from `recordedAt`, classify imported evidence as an independent receipt, or join
retained-item corrections into source supersession. Any migration or retention
policy needed by that broader model must be reviewed explicitly. This slice adds
no such model. Existing local-only publication and production boundaries remain.
