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

## Agent-performed project-copy walkthrough — 21 October 2026

At runtime revision `1f2728338cf62c31b374249197256b1adbbf6f68`, a further
walkthrough used the already authorized next-steps project outcome and its saved
verification evidence. The input was an explicitly labeled **TEST DATA / AGENT-CURATED
PUBLIC PROJECT COPY**, not an original user conversation or production record.
The copied requirement came from this document at that revision; the implementation
and historical verification came from `ui/review-next-steps.tsx` and the
`selected-review-next-steps` entry in `verification/session-save-recovery.json`.
Their exact hashes are retained in the [request ledger](verification/request-evidence.json).

Six observed cases passed through a fresh owned headless browser, real local
Node/Python API and disposable SQLite:

1. Import the copied request through the supported isolated history API; render
   its exact public source URL, pending status and need for human input.
2. Import three curated project-artifact events and one goal through Session
   review; create a repository task association in the UI with exact request,
   review, project and revision pins.
3. Navigate request → task → review → intent with exact target focus.
4. Inspect the imported historical completion claim and remediation; select the
   synthetic checklist without invocation, then run it explicitly. Its bounded
   receipt succeeds while acceptance remains gap/missing observation.
5. Save an explicitly agent-performed observation with result **gap** because
   human judgment was not performed. Request data/version and imported export
   remain unchanged. The link retains its original review-version pin and
   correctly becomes stale after new review activity.
6. Reload and return to the exact request. Association, observation and receipt
   persist, with no additional operation/audit rows or completion upgrade.

No functional defect was established in this bounded journey, so no runtime code
was changed. The first driver run had a non-discriminating source-link count
assertion; the final six-case run replaced it with an exact URL check. Only that
final run supports source-link acceptance. Both runs remain in the private ledger.

The server's existing `owner_reported` basis identifies evidence supplied through
the owner-bound application; it is not independent proof that a human authored the
observation. The saved text expressly identifies the agent and unperformed human
judgment. No real-owner acceptance is claimed. Original correspondence, private
production records and raw sessions were not accessed, and source scope is only
one copied request, three project-artifact events, one goal and one synthetic
checklist. No source-history denominator or processing progress follows.

**Remaining acceptance:** the human owner must judge whether the represented goal,
expected behavior and suggested next step match the intended request. That dependent
step stops here. Real-owner V301 and original-correspondence provenance remain open;
the agent cannot resolve them by marking another local check passed. Shared Chrome,
production state, provider access and deployment remain outside this walkthrough.

## Current-source re-verification — 25 October 2026

On runtime source `1f95ef052823c0f136971a61b93f521982ba1e5e`, N1–N7 and
W1–W6 were exercised again through rendered UI, real local Node/Python APIs and
disposable SQLite. The N cases completed together; W then completed in a separate
fresh store. These replace the previously missing current-source acceptance for
these two bounded workflows, not the original historical evidence or human gate.

N confirmed retained selection/unknown attribution, exact keyboard navigation and
unsaved draft preservation, selection versus a real local checklist, failure
surviving later pass/gap, persisted reload without added writes, narrow layouts,
and separate review/unresolved-goal scope. W confirmed a labeled public-project
request copy and exact URL, immutable association pins, request/task/review/intent
navigation, unverified historical claims, an explicit agent gap observation,
stale-link disclosure, and exact persisted return/reload without added writes.

Driver interruptions were not application regressions: nested-label exact matching,
hash navigation using a pre-import dashboard snapshot, and reimport of stored
server-derived fields. The last input was rejected by the strict contract; the
final driver used only original allowed fields. Earlier interruptions remain saved.
No application code change was needed. No external browser requests/page errors
occurred in completed scenarios, and owned resources were closed.

Fourteen existing tests, typecheck and build passed. Rebuilt output and listed
source hashes matched the workflow inputs. The narrow intent/history and review
summary screenshots were inspected. Evidence is appended under the current-source
reverification IDs in [session recovery](verification/session-save-recovery.json)
and [request evidence](verification/request-evidence.json). Actual human-owner
V301, original-source coverage, production identity/providers, full V312,
screen-reader use and durable recovery remain open. No private runtime artifacts
are included in publication.
