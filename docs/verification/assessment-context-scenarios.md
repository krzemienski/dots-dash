# Historical assessment versus recorded observations

> Historical design and implementation context. See [current scoped verification](source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Baseline: `9be379f15b4789c1bc254fc71ea6e18e3f359a55`. Clean checkout and
absent Git index lock checked; preserve previous branches. Apply project
session-intent-review and user-owned Playwright guidance.

Explicit requirements: FR08 preserves history while current summaries project
it; FR21 separates performed observations from completion claims; FR22 preserves
provenance/negative outcomes; FR23 separates invocation scope. E2 connects these
records in one UI. No requirement authorizes owner reports to close V310.

Observed defect: persisted browser evidence shows an acceptance-gap card saying
no observation is recorded beside observation_recorded_not_independently_verified,
while the goal displays a saved owner report. The service retains initial critique
and draft correctly; the UI does not label their historical scope.

Priority inference: correcting that contradiction is the highest-impact bounded
display defect found in this review. It is not proof the underlying product
behavior or independent-verification gate is complete.

Acceptance:
1. Reproduce the contradiction in a new isolated development browser with
   synthetic data, an actual checklist receipt and a UI-saved owner observation.
2. Label assessment and remediation draft as recorded at import. Show reports
   for the same goal and revision separately, with result, time, source reference
   and owner attribution. Link to their existing goal section and return to the
   initiating card. Do not invent independent verification or close remediation.
3. Another goal without observations stays empty. Goal-less drift remains
   unresolved. Retain negative source evidence, initial critique/draft and the
   pre-observation receipt byte-for-byte through rendering and another report.
4. Save a second performed observation, reload, inspect both historical reports
   and the latest summary, and repeat link/return navigation. UI output must not
   promote pass/fail/gap to independent verification or erase earlier outcomes.
5. Record browser/build evidence and the larger source-backed acceptance gaps.
   No test files, production identity, external execution, provider credentials,
   application tabs, compatibility changes or publication. Stop after this fix.
