# Correction context display

> Status reconciliation, 21 October 2026: the later [isolated publication report](verification/source-review-publication.md) exercised the principal paths described here. “Unperformed” and holds below describe the original design/implementation baseline, not the later publication workflow. Not every fault permutation or real-owner/production scenario is verified. See the [product audit](PRODUCT_AUDIT.md) for current source bindings and remaining gaps.

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Implementation baseline: `b4d543db70fedb7afb278950c953e3e11f351483`.
The [journey checkpoint](JOURNEY_SOURCE_CHECKPOINT.md) defines the source-backed
gap and display semantics. Applied the repository
[session-intent-review skill](../.agents/skills/session-intent-review/SKILL.md).

## Observable acceptance, defined before implementation

All functional scenarios below are **unperformed**. Any future examples must be
explicitly labeled TEST DATA and use only separately authorized disposable
resources. This plan does not authorize browser/API execution.

| User action / supplied metadata | Required observation |
| --- | --- |
| Open a saved review where a goal-B targeted-check decision supersedes a failed goal-A release event. | Correction context shows goal and outcome-scope differences, both original outcomes/statuses and source references. Both event links reach their existing visible records, even without an active negative finding. |
| Compare equal nonempty goal sets in a different order or with duplicate IDs; change only requirement revision. | Only the requirement revision differs. Goal comparison uses set membership. |
| Compare equal known metadata. | No compared difference detected; the correction is not certified valid and no task is completed. |
| Inspect an edge with an empty goal set or unknown outcome scope. | Correction scope incomplete; an unknown dimension is not called a confirmed mismatch. Differences in other known dimensions remain visible. |
| Inspect several targets, a duplicate edge and a source decision later superseded. | One row per unique directed edge, all targets independently represented, later-superseded source still shown with its recorded status. |
| Inspect an old response whose referenced target is absent. | Target ID is unresolved; no invented outcome/reference, no target navigation link and no fetched content. The existing source link remains usable. |
| Inspect a review without explicit supersession. | No correction rows or inferred correction relationships. |
| Reload, use links by keyboard and inspect a narrow viewport. | The same projection and original negative outcomes remain readable; valid links focus the existing events. No viewing mutation changes exports, findings, drafts, observations, runs, version, audit or operation rows. |

## Implementation and verification boundaries

The projection compares existing exported metadata only. It does not change the
rules that suppress superseded records from analysis/checklists, or decide which
corrections are legitimate. Source references remain opaque displayed text.
The warning must remain distinct from saved findings and remediation statuses.

Permitted verification is source inspection, TypeScript checking and the local
client build. These checks cannot establish browser navigation, responsive
layout, persisted reload behavior or functional acceptance. No new test files
or application workflow are part of this change. V301 execution remains denied
and publication remains on hold.

Implemented in [the pure projection](../lib/work/correction-context.ts) and
[the display component](../ui/correction-context.tsx), integrated immediately
before the existing event history. A set of directed ID pairs deduplicates edges;
goal comparisons use sets; unknown scope and empty goals stay incomplete.
Both event summaries include original outcome, recorded status, source reference
and comparison metadata. Missing targets have explanatory text and no link.
Existing review navigation focuses the referenced event; long headings wrap.
No source references are fetched, and no save callback is passed to the display.

TypeScript checking and the client build passed. Inspection confirms the Python
contracts, analysis, service, store and runner, shared browser contract, server
routes and dependency manifests are byte-identical to the baseline. The build
writes ignored local `dist` output only; it starts no server. Historical receipt
files are unchanged, but earlier UI receipts cannot verify this changed source.
See the work ledger (historical local artifact omitted from the public package) for exact
source hashes, checks and the unperformed scenario list.
