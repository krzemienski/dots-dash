# Source review: scoped publication verification

On 2026-10-21, the implemented source-review workflows were exercised against
fresh isolated Node/Python/SQLite storage and a fresh owned browser context.
Every imported record was labeled **TEST DATA**. Authentication used a synthetic
host principal. No private session content, production identity, provider API or
live deployment was involved.

The [observation ledger](source-review-publication.json) binds the tested runtime
files and build outputs by SHA-256. It records individual observations and two
discarded measurements: a count sampled before commit, and a no-correction check
using an export that actually contained an explicit correction. Corrected checks
passed. Raw browser/storage artifacts are intentionally excluded from publication.
This summary is recorded evidence, not an independently signed verification receipt.

## Observed outcomes

| Workflow | Performed outcome and boundary |
| --- | --- |
| Selected export → review | Browser import persisted source-linked goals, claims, findings and remediation. Selected-export coverage remained explicit. No original transcript access was inferred. |
| Request → task → review | Browser creation, forward/return focus and reload retained immutable pins. API updates made both targets stale. Missing disposable targets remained visible with disabled navigation. Invalid titles, unknown targets, injected authority and disabled capability rejected. |
| Uncertain context save | Dropped a response after commit. Editing remained disabled; revoking capability retained uncertainty. Restoring it allowed retry to reconcile one saved link. |
| Inventory and access | Browser creation and empty-read metadata persisted. Denied, unreadable, unsupported and unknown reports preserved earlier snapshots. Fifty-one inventories required two pages; refresh and navigation did not mutate stored coverage rows. |
| Association attribution | Empty snapshot and independently hashed review could be linked as owner-asserted context. Navigation reached both targets, including a snapshot outside the latest page. No read/parse/completion certificate appeared. |
| Association integrity | Owner/origin/project/capability and stale-pin rejection; exact replay; conflict rejection; version-only versus material relevance; replacement of both targets; predecessor/successor navigation after reload; revocation and new-identity reassertion. Concurrent corrections yielded one winner. Injected audit failure rolled back the operation. |
| Association uncertainty | Lost post-commit replacement response retried the same envelope, producing one event set. Unavailable target schemas returned unavailable/unknown; successfully queried missing rows returned missing. |
| Correction context | Explicit edges retained negative originals. Goal set order/duplicates were ignored; unknown dimensions stayed incomplete; equal metadata did not certify a fix. Missing legacy targets remained unresolved. Keyboard focus, reload and 390-pixel layout were exercised. An export without explicit edges produced no inferred correction. |
| Skill → runner → verification | API selection recorded no invocation. Default-disabled execution rejected. Temporarily enabling the local checklist produced a pinned, replayable declarative receipt, retained acceptance gaps and marked the task reviewed, not remediated. Provider adapters remained unavailable. |
| Cleanup | Owned server stopped listening, browser disconnected and retained browser process exited with code 0. Disposable databases were closed. No unrelated process was stopped. |

These observations cover the principal paths in the [association design](../SNAPSHOT_REVIEW_ASSOCIATIONS.md),
[context scenarios](request-context-link-scenarios.md),
[correction specification](../CORRECTION_CONTEXT_DISPLAY.md) and
[51-inventory scenario](../SOURCE_INVENTORY_PAGINATION.md). They are not a claim
that every fault/permutation in those documents was executed.

## Checks, changes and remaining work

All 14 existing tests, TypeScript typecheck and client build passed. Two initial
test failures came from the custom in-memory SQLite helper lacking the production
`history_snapshot_ms` function; the existing helper now registers that same
function. No new test files were added. Python parsing, local document links, JSON and diff whitespace checks also passed.
A clean dependency install in this checkout passed using an isolated temporary
cache after an offline attempt lacked cached packages. All 14 tests, typecheck
and build then passed here; its generated bundle hashes equal the tested bundle.
These checks are separate from runtime acceptance.

The clean feature branch starts at public main
`0a9611f9441f18810210da54dfc4d3974c61e5e0`; it does not include the original local
development ancestry. Historical design documents remain context and point here
for current verification. One explicitly labeled synthetic fixture stays under
`output/playwright/evidence-relevance/` because the owned-browser adapter loads
it as a fixed input; historical run outputs and screenshots are omitted.

Actual-user V301 remains unverified. Source-admission A1–A8 in the
[coverage specification](../build-package/16-source-coverage-checkpoints.md)
remain design-only. No original-source reader, ingestion permission, live provider
runner or contiguous processing checkpoint is supplied. Before-commit response
loss, post-success list-refresh failure, durable recovery after unmount/reload,
screen-reader operation and all multi-process race permutations remain untested.
Existing default-off capabilities and fail-closed authentication remain intact.
No production migration, merge or deployment was performed. Migration of existing
owner databases requires separate backup and compatibility acceptance.

Next bounded implementation: define an owner-scoped source-admission evidence
contract separating documented route, scoped authorization, observed bytes,
sanitized selection, snapshot binding and contiguous processed coverage. Reject
scope changes and retain non-contiguous intervals without advancing a contiguous
checkpoint. Preserve existing hashes and never infer source access from an
association or checklist receipt. First define observable acceptance; do not
add a live reader or provider by implication.
