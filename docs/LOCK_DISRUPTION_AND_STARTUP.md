# Lock disruption and startup failure outcomes

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

The recommended UI follow-up is now implemented locally; see
[remediation navigation and browser evidence](REMEDIATION_NAVIGATION.md).

Baseline: `b26e21c0d53764584248d3051f74c60a6bcc32ba`. Clean checkout and
absent Git index lock checked before edits. Prior branch preserved. Acceptance
was recorded in [scenarios](verification/lock-startup-scenarios.md), following
the repository session-intent-review workflow.

## Reproduced defect and fix

Removing or replacing lifecycle.lock while its original descriptor was locked
allowed a competing public reconciliation call to acquire the replacement and
return 200. That violated lifecycle exclusion, although this observed call did
not resolve the missing domain receipt or delete storage. Symlink and nonprivate
file cases already rejected with 409.

The lock now binds its device/inode identity atomically to a private
rehearsal_lifecycle table inside the marked disposable snapshot. Later acquisition
must match that binding. Existing or empty bindings are never silently replaced.
First binding rechecks table existence inside a SQLite write transaction, so
competing first callers cannot independently establish different identities.
Database/binding errors fail closed with 409.

All four performed disruption cases now reject with 409 and retain the pending
operation and storage. A replaced lock is not a recovery mechanism. This changes
only disposable rehearsal metadata, not the application database schema, input
contracts, owner authentication or Node live writer. Existing idle marked copies
bind on first use by the updated tools; concurrent use by old tool versions is
not supported or verified. Privileged database tampering remains outside scope.

## Startup checks

Saved workflow evidence (historical local artifact omitted from the public package) records actual
local operator/SQLite/Node operations with explicitly labeled fault injection.

| Injected failure | Observed ownership and lifecycle outcome |
|---|---|
| Popen raises before creation | No child/handle, durable not_started, operation unresolved and handoff 409. |
| SQLite trigger rejects running-state update after Popen | Start raises IntegrityError; one live Node child remains in the original supervisor's retained handle map. Cleanup rejects with 409. Original supervisor close stops/waits for that child and records exit. |
| Original creator terminates/waits for the Node child before sending its envelope | Start raises BrokenPipeError; the retained handle remains available. Durable exit remains unconfirmed until the original supervisor records it during close. |

No failure reported a successful launch or saved a domain instruction/audit.
After owned exit recording, the missing receipt still prevented handoff. No
ownership escape was reproduced in these three windows, so startup behavior was
not changed. Callers must still close the original supervisor on startup errors;
the local API can raise the underlying SQLite/pipe exception. This is not proof
of cleanup after the supervisor itself dies or discards its handles.

A normal workflow saved one instruction, reconciled its receipt, confirmed owned
exit, transferred to Python, parked, resumed at epoch 3 and cleaned up. Source
hashes were unchanged and fixture storage was removed only after owned exits.
Typecheck/build and Python syntax/diff checks passed separately. No test files,
browser, private sessions, credentials, external agents or external writes were
used. Only the reproduced lock-identity defect was changed.

## Prioritized next user-facing outcome

**Connect each remediation card to its goal, actual checklist receipt and
performed-workflow evidence.** This is an independent UI navigation/context gap,
not an absent backend chain or a demonstrated browser failure.

The original journey already exists in the local slice:

- [Session review UI](../ui/session-review.tsx): import and saved-review selection
  at lines 51–63; goals and observations at 30–34; findings, prompts and skill
  selection/authorization at 37–44; actual run receipts at 46–47.
- [Existing relationships](../lib/work/engineering.ts): Remediation.goalId and
  findingId, ReviewRun.taskId, Observation.goalId and revision already connect
  these records (lines 5–9).
- [Service](../python/dots_engineering/service.py): selection, pinned run
  authorization and owner-reported observations already persist separately.
- [PRD FR21–FR23](build-package/02-prd-v2.md): preserve source-linked intent,
  remediation and the distinction between applicability, selection and invocation.

Currently a remediation card offers selection/run controls but no link to its
goal's verification form or its actual run receipt. Receipt cards show opaque
task IDs, while observations live earlier in a separate goal section. A user
must manually reconnect those parts, especially across multiple goals/tasks.

Recommended acceptance for the next slice: from one remediation card, navigate
to the correct goal/steps and observation form, inspect that task's receipt and
pinned skill revision, and return to the same task after saving owner-reported
evidence. Show unconfigured/no-receipt states honestly. For goal-less drift, show
unresolved scope instead of inventing a goal. Keep historical receipts immutable,
owner reports attributed, and remediation incomplete unless existing semantics
establish otherwise. Add no provider execution, input normalization, capability
enablement, or automatic retry.

That outcome can use existing contracts without deciding fresh-import policies
or lifting the publication hold. Browser acceptance still belongs to the owner;
this assessment is source inspection only. No UI change was made in this slice.
Further concurrency work is not automatically scheduled or started.
