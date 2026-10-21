# Bounded V310 revision relevance acceptance

> Historical design and implementation context. See [current scoped verification](source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Baseline: `4f40741f79a7c5227f8b54e10f7dbc6f05cdc43d`. Clean checkout,
absent index lock and original source/artifact hashes checked before edits.
Use the project session-intent-review and user-owned Playwright workflows.

Explicit intent: bind real check evidence to its relevant revision and visibly
identify stale relevance, retaining history and keeping owner reports separate
from independent verification. No arbitrary project checks or test files may be
run to manufacture evidence.

Minimal safe slice: display relevance of existing supported evidence entries
against the declared review revision. Use the actual prior assessment-context
browser report and artifacts; verify their source hashes against the recorded
Git revision before import. The application still treats the imported artifact
as owner-provided export evidence, not an authenticated independent verifier.
No new receipt trust model, runtime command adapter or input-policy change.

1. Import a labeled synthetic wrapper referencing that actual browser artifact,
   its source/artifact hashes and its exact relevant Git revision. The card must
   say its revision matches the declared review revision, with attribution/scope
   visible; it must not say verified against live HEAD or independently passed.
2. Import a new review against a genuinely changed local Git revision, retaining
   the original evidence revision/hash/result. Its evidence must be visibly stale
   for the new review. Return to the older review and prove its data is unchanged.
3. Omit the evidence codeRevision and submit through the actual UI. Existing v1
   validation must reject it; refresh must show no new partial review or invented
   revision. Do not relax the required-field contract or backfill unknown data.
4. Preserve claims as claims, owner reports as owner-reported, original evidence
   outcomes as historical, and provider execution as unavailable. Run no new
   checklist merely to obtain a pass. Actual UI navigation/import/readback is the
   verification workflow for this change.
5. Persist actual isolated-browser observations, source/artifact hashes and
   exact limits. Full V310 remains open because application-side artifact/run
   authentication, environment validation and live relevant-input invalidation
   are not implemented. This is declared-review relevance, not automatic live
   repository monitoring or independent product verification.

No production data, credentials, application tabs, outside agents, publication,
fresh-import compatibility policy changes or further concurrency work.
