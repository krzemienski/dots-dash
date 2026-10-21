# Serialize disposable lifecycle operations

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Follow-up: [lock disruption and startup checks](LOCK_DISRUPTION_AND_STARTUP.md)
reproduced and fixed replacement-lock acquisition; bounded startup failures
retained ownership. The next recommendation is user-facing UI integration.

Baseline: `b518ce4adb572f5d2e92220189966a8ca3bc1fcc`. Checkout was clean,
with one worktree and no Git index lock before editing. This is a local-only
follow-up using the project session-intent-review workflow. Prior branches remain.

## Reproduced defect and user impact

Cleanup checked for uncertain workers, released its SQLite connection, then
deleted the directory. A concurrent supervisor could launch after that check.
An actual scheduling barrier reproduced cleanup reporting completion and deleting
the disposable database while the new owned Node worker was still alive. The
worker was stopped and waited through its original retained Popen handle.

The corrected workflow rejects that concurrent launch with 409 before any child
starts. If launch owns the lifecycle first, cleanup rejects, and the worker's
storage remains. Operators no longer receive a successful cleanup result across
this launch race. This affects local rehearsal tools, not live dashboard behavior.

## Change and boundaries

A private per-session `lifecycle.lock` serializes cooperating launch, dispatch,
external preparation, controller resume, reconciliation, handoff, parking and
cleanup. Acquisition is nonblocking: contention returns 409. The lock covers
the check and its associated action, including directory rename/deletion.
Supervisor launch revalidates its envelope after acquisition.

The lock uses POSIX flock, rejects symlinks/nonregular files, requires private
permissions and a single link, and verifies the opened file identity against
the current path after acquisition. A contender cannot use a stale opened lock
after cleanup deletes its path. Existing marked sessions acquire the lock lazily;
the application database schema and session manifest version do not change.

The process-local operation guard is retained. Lifecycle locking is distinct
from the long-lived controller lock, SQLite transaction locks, epoch fencing and
durable exit evidence. It supplies no process ownership, exit confirmation,
recovery or retry authority. Node workers still check the lease inside actual
mutation transactions. Releasing a lifecycle lock does not clear uncertainty.

This is advisory coordination among these local tools, not protection against
privileged filesystem tampering, direct SQL writers or callers bypassing public
operator methods. No claim is made for network filesystems or non-POSIX systems.

## Performed workflows

[Acceptance scenarios](verification/lifecycle-race-scenarios.md) preceded changes.
Saved observations (historical local artifact omitted from the public package) use only synthetic
data, disposable SQLite and owned processes. Barriers controlled timing; domain
operations used the actual Python operator and Node API/storage implementations.

| Workflow | Observed outcome |
|---|---|
| Cleanup pauses after its check; launch competes | Baseline deleted storage with a live worker. After the fix launch returns 409, no child starts, and cleanup completes. |
| Separate owned supervisor holds launch's lifecycle lock | Competing launch, dispatch, preparation, reconciliation, handoff, parking, cleanup and resume all return 409. Only the original launch creates a worker. |
| Launched worker pauses before dispatch | Cleanup rejects and storage remains. |
| A separately owned lifecycle-lock holder exits | Its OS lock releases, but the live worker's durable unconfirmed state still blocks cleanup. |
| Original supervisor confirms child exit with no receipt | Supervision settles; missing receipt still blocks handoff. No instruction was saved. |
| Successful save and owned exit | One instruction/audit; reconciliation, transfer to Python, parking, resume at epoch 3 and cleanup succeed. |
| Controller dies while its supervised worker is paused | Resume advances epoch to 2; stale Node dispatch returns 400, saves nothing, and leaves the missing receipt unresolved. Original supervisor confirms child exit. |
| Normal direct dispatch | Node and Python each save one instruction through the serialized controller interface. |

Original database hashes remained unchanged and all owned fixture storage was
removed after worker exit. Typecheck/build and Python syntax/diff checks are
separate from these observed outcomes. No test files/runners, private sessions,
credentials, unrelated process access, browser or external writes were used.

## Remaining work

This closes the reproduced cooperating launch/cleanup race and verifies bounded
cross-process exclusion. It is not an exhaustive scheduling proof or load test.
Supervisor loss with a live unmanaged orphan remains outside the evidence; no
recovery mechanism was introduced. The next independent bounded task is to
exercise lock-path replacement/removal and launch-startup failure while retaining
original process handles, ensuring each failure leaves durable uncertainty and
cannot create an untracked worker. Do not create an unmanaged orphan to do so.

Fresh-import compatibility choices remain unanswered and unchanged. Node stays
the live writer; no production migration, publication or browser claim follows.
