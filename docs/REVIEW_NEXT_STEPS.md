# Next steps from a selected review

## Owner outcome and source-backed gap

The owner can answer “what remains for this goal?” without assembling the answer
from separate intent, remediation, skill, receipt and observation sections.
[Engineering next work](build-package/13-engineering-contexts-and-execution.md#completion-and-next-work)
requires reviewable, evidence-linked next steps without execution authority.
[FR19 and the product priorities](PRODUCT_AUDIT.md) remain broader than this slice.

At baseline `0587a232ca91cf8871b64fb6421cd2669c951988`, a rendered import saved
goals and remediation tasks, but had no consolidated next-steps view. This was a
missing composition, not evidence of broken persistence. The Day/Prompts tab
projects legacy engineering records; it does not aggregate Python session reviews.

The new [read-only summary](../ui/review-next-steps.tsx) is mounted in the
[selected review](../ui/session-review.tsx). It uses existing records only:

| Link in the journey | What the summary exposes | Evidence boundary |
|---|---|---|
| Selection → intent → expected behavior | One selected review/version/revision; each supplied goal and expected behavior | Declared revision and owner-supplied attribution, not observed source bytes or current checkout |
| Drift → remediation | Recorded rule finding count, negative history, links to existing drafts | No automatic reprioritization, closure or resolution of scoped corrections |
| Skill → runner | Selected skill/revision and links to historical local checklist receipts | Selection is not invocation; checklist execution is not a full skill, provider agent or remediation |
| Verification → next step | Latest same-revision owner report in stored order; missing/fail/gap/pass-specific review suggestion | No certified completion; earlier failures and historical receipt acceptance remain visible |
| Unresolved scope | Goal-less remediation appears separately | No inferred goal binding or authority |

Existing remediation links retain the context-preserving prompt, original draft,
corrections, source references and attribution uncertainty. This projection adds no
API, schema, migration, capability, persistence, clipboard transfer or automatic
execution. It does not reopen or close findings; it summarizes their recorded state.

## Observable acceptance and performed scope

Acceptance was stated before implementation. Seven final isolated observations used
the existing labeled selected-record and visible-export TEST DATA fixtures, a fresh
owned headless browser, the real localhost Node/Python API, and disposable SQLite.

| Case | Observable outcome actually checked |
|---|---|
| N1 | Import through UI; next steps show retained goal, no observation/no selected skill, supplied scope, and unknown attribution. Excluded goal stays absent |
| N2 | Keyboard and pointer navigation reach exact goal/task/evidence form; derived correction context remains available; unsaved observation survives in-view navigation; SQLite bytes and records unchanged |
| N3 | Save failing observation, select checklist, then run it through UI. Selection produces no run; actual bounded receipt succeeds with owner-reported acceptance **fail** and exact receipt navigation |
| N4 | Save a later owner pass. Earlier failure, historical failing receipt acceptance, original export/prompts and reviewed-not-remediated task status remain unchanged |
| N5 | Save gap and reload. Summary is rebuilt from persisted review; gap and receipt history remain; no additional operation/audit rows |
| N6 | At 320 and 375 pixels, keyboard navigation reaches exact goal and document has no horizontal overflow |
| N7 | Import another review, inspect its goal-less remediation, then return to the first. Reports do not bleed between reviews; unresolved scope stays explicit |

The final summary screenshot was inspected. No external requests or page errors
were observed. Owned handles were closed; shared authenticated browser resources
were untouched. The existing 14 tests, typecheck and build passed. Source/build
bindings and manual skill application are appended to the existing
[verification ledger](verification/session-save-recovery.json); older evidence is
historical and retains its original bindings.

## Remaining product gates

This is a single-review navigation and decision aid, not a daily summary, a work
priority algorithm or proof of completed remediation. Reads remain last-read
snapshots; later source changes are not monitored. Explicit review switching or
reload still loses unsaved forms/pending in-memory envelopes. Existing capability
gates and owner checks are unchanged; this pass did not repeat every prior denial
or uncertainty scenario. Actual screen-reader, real-owner V301, all-source V312,
source ingestion and provider execution remain unperformed/unavailable in this slice.

The next product-level acceptance is an owner-selected, deliberately sanitized
request → review → next-step journey: confirm whether the displayed goal and
suggested next step match that owner's intended outcome, then capture an actual
performed observation. Synthetic checks cannot settle that intent judgment.
Separately, durable recovery still needs the explicit retention and unresolved
stream decisions in [its proposal](DURABLE_OPERATION_RECONCILIATION.md); this
summary does not implement or approve them.
