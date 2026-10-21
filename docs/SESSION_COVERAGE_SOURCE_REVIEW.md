# Session coverage and correction: source-only review

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Historical report. The [2026-10-20 source checkpoint](JOURNEY_SOURCE_CHECKPOINT.md)
records subsequent coverage/artifact displays and specifies the remaining
correction-scope warning without changing this report's original evidence.

Reviewed revision: `f771049504364c3b2977e1963098e2e0e7f563d0`.
This is a bounded source inspection, not observed application behavior. No private
project data, session transcript, runtime log or external audit was imported.
Generated-output confusion and legitimate empty logs are generic audit concerns
here, not claims about another project's contents. Applied only the project
[session-intent-review workflow](../.agents/skills/session-intent-review/SKILL.md).

## What the current representation can distinguish

| Coverage/evidence situation | Current source support | Limit |
| --- | --- | --- |
| Inventory only | Skills & configuration explicitly says legacy inventory, imported metadata and no effective-run certification ([UI](../ui/day-workspace.tsx#L15)). | Legacy `coverage.state` is a free-form imported string, not a validated coverage grade ([validator](../lib/work/history-validation.mjs#L14)). No per-session inventory/read-state contract. |
| Selected-source review | Export pins owner, source/consent references, capture time, declared revision and event provenance ([schema](../python/dots_engineering/contracts.py#L45)); review coverage explicitly says only this owner-curated export ([analysis](../python/dots_engineering/review.py#L50)). | `coverage` is one fixed string. It does not encode a reviewed interval, readable/empty state, eligible-source denominator or degree of source selection. Review count is not overall session coverage. |
| Historical receipts | Imported evidence, local checklist runs and owned browser receipts have distinct attribution. Browser cards preserve historical outcome, scope and observed review version ([UI](../ui/browser-receipts.tsx#L49)). | An imported `execution_receipt` source kind is still assigned owner-provided-export basis; naming a receipt does not authenticate it ([normalizer](../python/dots_engineering/contracts.py#L134)). |
| Revision-matched acceptance | Export revision comparison explicitly disclaims independent verification ([UI](../ui/session-review.tsx#L26)); owner observations are revision-bound, with owner-reported acceptance ([runner](../python/dots_engineering/runner.py#L21)). The fixed owned browser adapter provides a separate revision/input/environment-bound result. | A matching declared revision, checklist success or matching file hash is not full current acceptance. The browser result covers only its named synthetic workflow, and runtime coverage retains unknown fields. No general per-goal current-acceptance certificate is shipped. |
| Unreadable or unsupported session | Provider capability names are explicitly unavailable ([service](../python/dots_engineering/service.py#L24)); unavailable reads and absent receipts do not infer an outcome ([UI](../ui/browser-receipts.tsx#L12)). | These are provider-wide or request-time states, not persisted per-source dispositions distinguishing unsupported format, unreadable selected source, valid empty source and unreviewed inventory. |

The existing UI repeatedly says an owner report or checklist does not complete
remediation. Analysis emits missing-evidence gaps, not successful product outcomes;
local checklist `succeeded` means the checklist ran, with separate acceptance and
`not_independently_verified` ([runner](../python/dots_engineering/runner.py#L36)).
These are useful safeguards in source, not a fresh proof that every display avoids
false completion. Free-form imported labels and incomplete coverage metadata
still require cautious interpretation.

## Concrete representation gaps

### 1. Empty, unreviewed and unreadable are not typed source dispositions

The v1 export requires at least one goal, each with at least one source event;
normalization requires those event IDs to exist ([schema](../python/dots_engineering/contracts.py#L61),
[validation](../python/dots_engineering/contracts.py#L152)). Consequently an export
with truly zero events cannot satisfy that contract, even though the event array
alone has minimum zero. This is a limitation of a goal-bearing review export,
not evidence that the underlying log failed. There is no log reader here whose
failure handling has been reproduced.

The empty-review UI correctly says no imported exports does not prove no work
happened ([UI](../ui/session-review.tsx#L110)). Nevertheless, it cannot retain a
structured observation that a specifically selected source was successfully read
and contained zero events. Inventory-only, valid-empty, unreadable and unsupported
can be described in prose, but cannot be reliably compared as typed coverage.
Do not work around this by fabricating an intention/action to make an empty log
importable or by treating a schema rejection as an execution failure.

### 2. Build provenance is separated internally, but audit evidence lacks artifact roles

The build manifest separates `inputs` and `outputs`
([build recipe](../scripts/build.mjs#L16)); the owned adapter separately records
source files, build inputs and bundles ([snapshot](../server/owned-browser-receipts.mjs#L41)).
The reader intentionally treats changes to either source or served bundles as
stale measured inputs ([reader](../server/browser-receipt-reader.mjs#L26)). That
is appropriate relevance invalidation, not proof someone edited implementation.

The general event schema has `sourceKind`, `outcomeScope` and opaque input hashes,
but no structured generated-output/source/dependency classification or producer
relationship ([schema](../python/dots_engineering/contracts.py#L51)). It trusts
owner-supplied descriptions and scopes; it does not implement a diff classifier.
Therefore source inspection does not establish that this product currently
misclassifies generated files. It establishes that the generic audit format
cannot enforce that distinction. A changed generated bundle may invalidate a
receipt while still being only derived output; no implementation-change or
completion claim should follow solely from that byte change.

### 3. Correction exists within one export, but its scope is only partly constrained

Events carry `supersedes`. Only a decision may supply it; referenced IDs must
exist; self-links, cycles and backward-time supersession reject
([normalizer](../python/dots_engineering/contracts.py#L127)). Original events stay
visible with recorded/superseded status and provenance
([UI](../ui/session-review.tsx#L64)). Historical review snapshots are also retained
in the audit ledger ([store](../python/dots_engineering/store.py#L44)).

There is no requirement that a superseding decision share the target event's
goal or outcome scope. Analysis excludes superseded events before generating
negative-outcome findings ([analysis](../python/dots_engineering/review.py#L21)).
An explicitly supplied but unrelated decision can therefore suppress an active
negative finding in source logic while the original event remains visible.
This is a scope-validation gap, not automatic deletion or independent proof of
completion. Whether a cross-scope correction is legitimate needs an explicit
policy; a passing targeted check must not silently close a release failure.

A newer export is a separate review. No validated cross-review correction link
is implemented. Owner observations are appended and retained, but have no
correction/supersession pointer; the checklist takes the latest matching
observation's result while keeping `owner_reported` attribution
([runner](../python/dots_engineering/runner.py#L40)). Do not describe that ordering
as a validated correction of an earlier report or as independent acceptance.

## Small acceptance-first remediation plan — not implementation authority

1. **Define a separate, bounded source-coverage record first.** For one explicitly
   selected sanitized source, propose typed dispositions: inventory-only,
   selected-reviewed, read-empty, unreadable and unsupported. Include opaque source
   identity, observation time, declared interval/selection scope and attribution.
   Keep coverage separate from outcome/verification basis; do not turn the states
   into a completion ladder. A read-empty record needs no invented goal/action.
   Preserve v1 exports unchanged; use an explicitly versioned companion contract
   rather than silently relaxing its required goal/source associations.
2. **Use existing provenance before adding inference.** Where an already-permitted
   manifest identifies inputs and generated outputs, preserve that role in an
   audit projection. Otherwise label role unknown; do not infer it from filename
   alone or discover additional files. Keep historical pass, changed-input
   relevance and implementation-change claims separate. No diff scanner, provider
   adapter or background monitor is proposed in this slice.
3. **Define correction acceptance before changing validators.** Initially show a
   scope mismatch as a reviewable warning with original event and negative outcome
   visible. Decide separately how a new version may validate same-goal/same-scope
   corrections or explicit scope-change decisions. Do not reject old stored
   exports retroactively, regenerate old findings, rewrite receipts or migrate
   hashes. Cross-review correction remains deferred rather than implied.

Prospective acceptance matrix (all unperformed):

| Sanitized hypothetical input | Required observable distinction |
| --- | --- |
| Inventory entry with no selected-source read | Inventory only; no reviewed-session or completion claim |
| Successful read of an empty selected event log | Read-empty with explicit coverage; neither failure nor proof of all work complete |
| Unreadable source versus unsupported format | Separate gap reasons, no fallback reads and no fake empty result |
| Generated bundle changes, source input bytes unchanged | Derived-output change; relevance may be stale, but no implementation-change count inferred |
| Unknown artifact role | Unknown classification, not presumed source or generated output |
| Historical pass with mismatched revision or unknown environment | Historical/unknown relevance preserved; no current acceptance claim |
| Matching revision plus owner-reported pass | Matching declared metadata and owner attribution, not independent product verification |
| Fixed adapter receipt | Exact named workflow, revision/input/environment and review-version scope; no broader completion |
| Same-scope correction, cycle, backward-time and cross-scope examples | Preserve old evidence; reject invalid graph under the applicable contract; surface scope mismatch without silently canceling unrelated failure |
| Reload/replay of old v1 exports and receipts | Historical hashes, attribution and prior outcomes unchanged |

The first useful implementation candidate is only the typed coverage record and
its conservative display, after agreeing the companion contract and acceptance
cases. Artifact-role projection and correction-policy changes are follow-ups,
not bundled redesign or permission to broaden access.

## Evidence and blockers

Only repository source/docs were read, using Git status/revision inspection and
line-numbered reads/searches. No build, test, app/API, browser, provider or external
agent ran. No runtime source changed. Prior browser evidence keeps its original
revision/synthetic scope and does not prove the proposed cases above. See the
source review ledger (historical local artifact omitted from the public package).

Disposable browser/API acceptance approval remains unanswered, and the denied
workflow was not retried through any route. Future implementation and functional
acceptance for this plan have not occurred. Actual-session coverage, actual-request
V301, production behavior and full V310 remain unverified.
