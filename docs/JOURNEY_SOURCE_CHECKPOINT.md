# Journey source checkpoint and correction warning prompt

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Reviewed source: `1c76022d7bfe606602f0f73d9a20350eef7f7c94`.
Date: 2026-10-20. This checkpoint records source inspection and reinspection
of saved, explicitly synthetic evidence. It reports no new application execution.
The checkout was clean, one worktree was registered, no Git index lock was
present, and the agent roster contained only this worker. These checks found no
competing writer; they do not provide a cross-process ownership lock.

Applied the repository [session-intent-review skill](../.agents/skills/session-intent-review/SKILL.md).
The concrete user goal is to follow a supplied session from intentions and
expected behavior through recorded actions, critique, remediation, selected
skills, bounded execution and verification without turning claims into proof.

## Coverage of the flow

| Stage | Source support at the reviewed revision | Evidence boundary or remaining gap |
| --- | --- | --- |
| Session → intent → expected behavior | `contracts.py` requires source-linked goals, expected behavior and user steps; `review.py` retains owner-export attribution. | Owner-curated, sanitized v1 exports only. No semantic intent extraction, named-provider session ingestion or independent original-source read proof. |
| Coverage of supplied sources | `projectSourceCoverage` separates selected export, event references and skill inventory, including superseded records. | Saved artifact workflow exercised those distinctions. Empty, unreadable and unsupported original sources still lack typed persisted dispositions. |
| Actions/claims → drift | `create_review` emits missing-action, unverified-completion, negative-outcome, provenance and unlinked-action findings as rule inference. | Supersession can remove an unrelated negative event from active findings. The event remains visible; this is not deletion or proven completion. |
| Drift → remediation prompt | Drafts cite source IDs and project/revision, with expected behavior and steps when a goal is linked. UI labels original assessments and drafts historically. | Drafts are not refreshed by later observations and carry no execution authority. The historical labeling has earlier, separately scoped saved browser evidence. |
| Remediation → skill | Applicable skill IDs derive from supplied goal associations; selection is stored independently and skill revision is pinned for a run. | Applicability is not a semantic recommendation engine, inspection of an original skill file, or invocation. |
| Skill → runner | Default unconfigured; the service permits only the bounded local checklist, with owner, capability, version, revision, authorization and request-id checks. SQLite mutation/replay and audit are atomic. | Checklist receipts prove only those declarative checks. No model, full-skill, arbitrary command or provider SDK execution. |
| Runner → verification | Owner reports, checklist receipts and fixed owned browser receipts have distinct bases. Saved artifact workflow records stale file relevance, role display and unchanged historical evidence. | Six synthetic artifact scenarios do not prove all product behavior, production identity, V301 or full V310. Runtime/dependency coverage remains incomplete. |

Sources: [contracts](../python/dots_engineering/contracts.py),
[analysis](../python/dots_engineering/review.py),
[service](../python/dots_engineering/service.py),
[store](../python/dots_engineering/store.py),
[runner](../python/dots_engineering/runner.py),
[review UI](../ui/session-review.tsx),
[coverage projection](../lib/work/source-coverage.ts).
The work ledger (historical local artifact omitted from the public package) records source
hashes and the exact saved evidence references.

The earlier [journey review](JOURNEY_ACCEPTANCE_REVIEW.md) and
[coverage review](SESSION_COVERAGE_SOURCE_REVIEW.md) remain historical reports.
Their next-task ordering predates the source-coverage and artifact-role displays.
The completed artifact workflow (historical local artifact omitted from the public package)
verified source `1d54ae105fadae850959e487e4b0cae303407855`; this checkpoint
checks its recorded source hashes and report hash without rerunning it.
It does not extend that evidence to correction-scope warnings.

## Selected gap: unrelated supersession can suppress a negative finding

`normalize_export` checks reference validity, decision kind, self-links, time
ordering and cycles (`contracts.py:127–151`). It does not compare goal sets,
outcome scopes or requirement revisions. `create_review` marks every referenced
target superseded (`review.py:7–9`), then skips superseded records when emitting
negative findings (`review.py:21–27`). The checklist also excludes superseded
events (`runner.py:21`). The UI displays every original event, but has no
dedicated correction-scope warning (`ui/session-review.tsx:67`).

For a hypothetical, explicitly labeled TEST DATA export, a later decision about
a passing targeted check for goal B may supersede an earlier failed release
event for goal A. Under the inspected logic, the original failure is retained
but its negative finding is omitted. This is a static consequence of those
branches, not a newly performed import or reproduced UI result.

Priority within the currently permitted source-only work is a precise warning
specification. Changing import validation, persisted findings or replay hashes
would require a correction-policy and compatibility decision. No such runtime
change is made here.

## Next implementation prompt — draft, not execution authorization

> At reviewed source `1c76022d7bfe606602f0f73d9a20350eef7f7c94`, add a
> read-only correction-context projection beside the saved review's event history.
> Reuse `.agents/skills/session-intent-review/SKILL.md` at that revision.
> For each explicit supersedes edge, compare the source decision and target
> record using their existing IDs, goal IDs, outcome scopes and requirement
> revisions. Show both source references, original outcomes and recorded statuses,
> and navigable links to both events. Never execute or fetch referenced content.
>
> Flag unequal nonempty goal sets as “Goal associations differ”, unequal known
> outcome scopes as “Outcome scopes differ”, and unequal requirement revisions
> as “Requirement revisions differ”. Compare goal sets without order or duplicate
> sensitivity. If either goal set is empty or either scope is unknown, also show
> “Correction scope incomplete”; unknown must not be called a confirmed mismatch.
> Show every applicable reason, with one context row per unique directed edge.
> Include edges from decisions later superseded; preserve their recorded status.
> Missing referenced records in a legacy response must remain unresolved, without
> inventing a target or an active navigation link.
>
> Present these as metadata differences needing review, not invalid corrections,
> reopened failures or proof of successful remediation. Equal metadata only means
> no difference was detected; it does not validate the correction. A warning must
> explicitly retain the original negative outcome even when no active finding
> exists. Do not modify v1 import validation, finding/task generation, statuses,
> stored exports, observations, receipts, operation hashes, API payloads or
> correction policy. Keep this separate from request-context V301 execution.
>
> Plan the observable acceptance below before coding. Functional acceptance is
> pending separately authorized execution; do not retry the denied V301 workflow
> or use another route to perform it. No new test files, provider calls, private
> stores, publication, deployment or live-dashboard writes are authorized by
> this prompt.

Prospective acceptance, **all unperformed**:

| Scenario / user action | Required visible and persisted result |
| --- | --- |
| Open a review containing the goal-B targeted decision over goal-A release failure described above. | Warning shows both differences, original failure and both source links; opening either link reaches that event. No completion claim. |
| Same goal and scope, different requirement revision; reverse goal-list order or duplicate an ID. | Revision difference appears; order/duplicates alone do not produce a goal mismatch. |
| Equal known metadata; unknown scope; empty goal associations. | Equal metadata is not certified valid; unknown/empty metadata is incomplete, not assumed compatible. |
| One decision has multiple targets, a duplicate edge, or is itself superseded. | Unique edges remain inspectable independently, with original outcomes and recorded statuses retained. |
| Legacy response lacks a referenced target. | Unresolved target is explicit and no broken target link is offered. No synthetic event is inserted. |
| Reload and inspect the same review on a narrow viewport and by keyboard. | Warning and both valid links remain usable; export, findings, drafts, observations, runs, review version and persisted audit/operation rows are unchanged. Viewing creates no mutation. |

## Holds and next decision

V301 browser/API execution remains denied and was not retried. The clean-publication
proposal remains on approval hold; no push, PR, merge or deployment occurred.
The prior publication review covered the tree before this documentation change;
its eventual candidate needs a delta review. No private commit identity is
included in these artifacts.

The exact SDK meant by “40-agent SDK runner” remains unresolved. The
[saved official-doc research](build-package/15-runner-research.md) is historical
research, not a new SDK compatibility check. SDK choice or concurrency cannot
be inferred from that phrase.

Next task: implement only the warning projection after accepting the display
semantics above, then obtain permitted functional evidence for that distinct
slice. Broader correction policy, actual-source coverage, named providers and
full V310 remain separate work. This checkpoint advances the specification and
evidence accounting only.
