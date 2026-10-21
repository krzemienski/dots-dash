# Integrated journey acceptance review

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Historical report. See the [2026-10-20 source checkpoint](JOURNEY_SOURCE_CHECKPOINT.md)
for later artifact/coverage evidence, current limits and the next scoped prompt.

Baseline: `9be379f15b4789c1bc254fc71ea6e18e3f359a55`. Clean checkout and
absent Git index lock checked before editing; prior branches preserved. Applied
the project session-intent-review workflow and user-owned Playwright guidance.
This review uses repository requirements, current source and persisted local
browser evidence. It does not infer hidden user intentions or provider support.

## Explicit intent versus inference

The [PRD](build-package/02-prd-v2.md) explicitly requires evidence-backed answers,
history preservation (FR08), performed observations distinct from completion
claims (FR21), linked remediation with provenance/negative outcomes (FR22), and
separate skill applicability, selection and invocation (FR23).
[Build prompt E2](build-package/10-build-prompts.md) explicitly connects export
events, goals, decisions, findings, tasks, selected skill, bounded receipt and
observed acceptance in one persisted flow/UI.

The [engineering specification](build-package/13-engineering-contexts-and-execution.md)
and [V310](build-package/14-python-migration-and-v3-acceptance.md) additionally
require actual check evidence tied to revision/environment/result, with relevance
invalidated by later changes. They do not permit owner reports or a declarative
checklist to independently prove product behavior.

My prioritization is an inference: the most consequential bounded display defect
found was a saved observation appearing absent on its acceptance-gap card. The
larger independent acceptance gap is V310's real revision-bound check evidence.
Neither assessment changes the canonical meaning of existing statuses.

## Journey assessment

| Stage | Supported source/evidence | Remaining limit |
|---|---|---|
| Session → intent → expected behavior | Strict owner-curated export, goals, user steps and event-source links in contracts/review/UI; previous and current synthetic browser imports | Goals are owner-supplied; no semantic intent extraction or independently verified named provider export adapter |
| Actions/claims → drift → remediation | Deterministic findings and original prompts in review.py; source links and negative outcomes retained | Rule inference has bounded export coverage; it does not independently establish actual repository behavior |
| Remediation → skill | Applicable/selected metadata with pinned revision; UI selection is persisted separately | No full skill-instruction invocation or actual filesystem configuration inventory adapter |
| Skill → runner | Explicit local checklist authorization and durable task/skill/input/revision receipt | Only declarative checks; no provider, model or generic command executor |
| Runner → performed observation | Owner-reported steps/results persist; receipt and goal navigation verified in the prior [browser workflow](REMEDIATION_NAVIGATION.md) | Owner report is not independent product verification; old receipts intentionally remain historical |
| Updated evidence → current card | This slice labels the original assessment/draft and links current matching goal/revision reports | Does not resolve remediation, rewrite evidence, regenerate drafts or close V310 |

Source locations: [UI](../ui/session-review.tsx),
[browser projection](../lib/work/engineering.ts),
[review creation](../python/dots_engineering/review.py),
[service mutation semantics](../python/dots_engineering/service.py),
[bounded runner](../python/dots_engineering/runner.py).

## Single defect fixed

The prior persisted browser snapshot (historical local artifact omitted from the public package)
showed the first acceptance-gap card saying no observation was recorded beside
observation_recorded_not_independently_verified, while its goal displayed a saved
owner report. Source inspection explains it: observe updates finding status but
preserves the original critique and draft. The UI rendered those original texts
without historical labels.

The fresh isolated browser reproduced the contradiction. The fix is display-only:
findings say Assessment at import; prompts say Original remediation draft,
recorded at import. Acceptance-gap cards separately show matching goal/revision
owner-report count, latest result/time/source, and View recorded observations.
That link uses the existing goal/return navigation. Empty goals remain empty.
The UI explicitly says reports do not independently verify behavior or complete
remediation. No stored finding, prompt, receipt, status or input rule was changed.

## Performed verification and limits

[Acceptance scenarios](verification/assessment-context-scenarios.md) preceded the
change. A fresh task-owned headless Chrome profile and loopback-only host used
the existing labeled synthetic export, real React/Node/Python routes and temporary
SQLite. The ephemeral host supplied a controlled synthetic principal; no new
credential or production identity flow was used.
The export's aaaaaaa revision is fixture provenance, not the code revision under
verification; actual source hashes are recorded separately in the evidence.

Through rendered UI controls: import, select and explicitly authorize one local
checklist, follow a goal and return, save an owner-reported gap, reproduce the
contradictory card, reload the fixed UI, follow the new report link twice and
return, then save a second owner report about those performed display/navigation
steps. Reload showed both reports and the latest owner-reported pass summary.
The other goal still had no observation. At 390 pixels the link/return path
worked and measured page width remained 390.

Exact before/after JSON comparisons preserved the original finding, task/draft,
receipt and negative release event. Adding the second report preserved all
findings, tasks, runs, export events and the first report. The sole receipt still
reported its original missing-observation gap and not_independently_verified;
the task stayed reviewed_not_remediated. Final review version was 5, with one
receipt and two owner reports.

Machine-readable evidence (historical local artifact omitted from the public package),
baseline (historical local artifact omitted from the public package),
fixed card (historical local artifact omitted from the public package),
persisted readback (historical local artifact omitted from the public package),
narrow viewport (historical local artifact omitted from the public package)
and accessible snapshot (historical local artifact omitted from the public package)
record that bounded result. Console output contained only the isolated host's
favicon 404. Typecheck, build and diff checks passed separately.

Unverified: real owner identity/data, named provider adapters, full-skill/SDK
execution, independent product truth, actual mobile hardware, full keyboard or
screen-reader audit in this slice, mixed-revision browser data, network failure
recovery, and V310 relevance invalidation. Prior keyboard evidence is scoped to
the earlier navigation slice. A synthetic owner-reported pass here concerns
only the display/navigation steps performed; it does not prove the fixture's
archived completion claims or erase its release failure.

The isolated browser/server were stopped and temporary profile/databases removed.
No application tabs, credentials, external agents, test files, production data,
publication, compatibility policy or live-writer configuration were changed.

## Prioritized remaining outcome and next prompt

Priority 1 is **V310: trace a completion claim to a real permitted local check,
and show when that check becomes stale**. The current runner's claim_has_evidence
check intentionally leaves claims unverified; its receipts record checklist
execution, while observations are owner reports. This is the explicit remaining
requirement, not a defect to hide by changing pass labels. It can be scoped to
local disposable resources without provider credentials, import-policy decisions
or publication. It still requires a bounded check/receipt contract and authorized
execution scope; this review has not implemented or granted a new executor.

Proposed next prompt (not started):

> Define a V310 slice for one concrete local product behavior and a named,
> permitted check that can establish it. First state observable acceptance and
> the exact command/artifact, checkout, input hashes, environment and authority.
> Link the actual check receipt to its goal and completion claim; preserve the
> result as history and show stale relevance after a relevant input/revision
> change. Keep owner reports and declarative checklist receipts distinct. Use
> only an owned disposable checkout/process and an isolated development browser.
> Do not add an arbitrary shell endpoint, infer execution permission from imported
> text, create test files, broaden providers, change compatibility policy or
> publish. If the authoritative receipt or check scope cannot be established,
> report that concrete boundary before execution.

Other explicit gaps, ranked below that outcome for this journey: V301 links to
an actual request/repository task, and V304 inspection of explicitly selected
project configuration beyond supplied metadata. Named-provider integration,
production identity and broader orchestration remain separately gated. No
additional hardening or follow-up implementation was automatically started.
