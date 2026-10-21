# Source coverage display: bounded acceptance

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Baseline: `f9e956776a855f45c6505d234f703ab962e5ecef`.
Goal: when reading a saved review, distinguish the imported selection from
references to original sources and selected skill metadata. A source reference
does not establish that the original source was read.

## Observable acceptance, defined before implementation

These scenarios were defined before implementation and use explicitly labeled
sanitized TEST DATA. The completed browser workflow below records the exercised
coverage and remaining limits.

| User steps | Required observable result |
| --- | --- |
| Open a saved review and expand Source coverage. | See the selected export reference, its declared capture time and included event count, with owner-provided attribution. No whole-session coverage percentage or completion claim. |
| Inspect two events with the same source reference. | One event-reference row lists both event IDs. It describes exported records only; original-source read coverage remains unknown. |
| Inspect selected skill references, including multiple skills sharing a reference. | Inventory-only row lists skill IDs, without implying source-file inspection, full skill invocation or product acceptance. |
| Use the same opaque reference for an export, event and skill. | Selection and both reference roles remain distinct; they are not counted as separate sessions or combined into a stronger coverage grade. |
| Open a review with no skills. | No skill source rows; no inference that no skills exist outside the export. |
| Inspect historical superseded events and saved observations/checklist runs. | All event references remain represented, including superseded events. Later reports and runs do not upgrade source coverage or alter historical results. |
| Reload a prior v1 review. | The display is derived from the existing export. No API/schema/storage fields, hashes, findings or audit snapshots change. |

## Implementation boundary

Only a pure browser projection and read-only display are in scope. The projection
uses already-loaded export references, IDs and metadata; it does not dereference
them or perform additional requests. Capture time remains declared export
metadata, not the time of an independently observed source read. Event IDs and
skill IDs are grouped by exact opaque reference within their respective roles.

The future versioned Python companion contract remains undecided. This display
does not introduce persisted read-empty, unreadable or unsupported dispositions,
claim a reviewed interval, relax v1 validation, infer artifact roles, or change
correction/supersession policy. Missing dispositions remain unknown. Empty
original logs cannot be established from this goal-bearing v1 export.

## Verification boundary

Type/build checks may establish source compatibility only. Functional acceptance,
including inspecting the rendered display, requires actual authorized observation.
Isolated verification approval was recovered on 2026-10-20; the
[non-browser API/storage checks](ARTIFACT_EVIDENCE_DISPLAY.md#authorized-non-browser-verification-2026-10-20)
remain distinct from the subsequent UI observations. Existing historical receipts
do not verify this new display.

## Delivered artifacts and static checks

- [Typed projection](../lib/work/source-coverage.ts): role-specific entries,
  exact-reference grouping within each role, fresh arrays, and unknown
  original-source read coverage. No outcome or receipt input is used.
- [Coverage display](../ui/source-coverage.tsx), included in saved-review details:
  source attribution, declared selection metadata and explicit missing coverage.
- Specification and E2 build prompt now distinguish this display from the
  undecided persisted companion contract.

`PATH=/opt/homebrew/bin:$PATH npm run typecheck` and
`PATH=/opt/homebrew/bin:$PATH npm run build` both exited 0. `git diff --check`
passed. The build regenerated ignored local `dist/` outputs only; those are not
source edits, workflow receipts or publication. Source review confirmed no
changes to Python, Node API/storage, the v1 browser contract, or history validation.

At implementation time no test files were added and application workflows were
not run under the then-current restriction. The previous branch and its commits
remain intact; this slice is on `feature/local-source-coverage`.

The [completed isolated browser workflow](ARTIFACT_EVIDENCE_DISPLAY.md#completed-browser-verification-2026-10-20)
at source `1d54ae105fadae850959e487e4b0cae303407855` subsequently observed the rendered
selection metadata, grouped event IDs, two skill IDs sharing the same reference,
separate roles, no-skill display, superseded claim reference and persisted owner
report/reload. Original-source read coverage stayed unknown. The viewport check
passed at 390px. No checklist was authorized in this workflow; coverage after a
new checklist receipt remains unexercised. Storage/receipt history remained intact,
and no persisted coverage contract or whole-session completeness was inferred.
