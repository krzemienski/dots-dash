# Supervisor-handle loss stays blocked

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Follow-up: [lifecycle serialization](LIFECYCLE_RACE_GUARDS.md) fixes a reproduced
concurrent launch/cleanup race without changing ownership or retry authority.

Baseline: `4af0008cbb730170eccf468c1cbf9a693ac056ab`. This independent local
follow-up preserves all fresh-import compatibility behavior while the owner
considers the proposed defaults. No recovery or retry authority is added.

## Change

Controller `status()` now returns a separate `supervision` summary:

```json
{"state":"exit_unconfirmed","workers":1,"exitUnconfirmed":1}
```

The existing `unresolved` field still describes the domain operation receipt.
It can be false while supervision remains exit_unconfirmed. A matching saved
instruction is evidence of that save, not evidence that its worker exited.
This status is local operator output, not an application/frontend API change.

A shared reader now guards controller dispatch, preparation, handoff, parking,
cleanup and supervisor launch. Durable launching/running labels remain
unconfirmed across restarts; they are not observations of current liveness.
Unknown states, owner mismatches and inconsistent terminal rows also block.
An exited row must carry an integer exit code; a not_started row must have no
exit code. Unreadable supervision evidence rejects with 409. A bare exited label
without an exit result no longer permits lifecycle progress.

The other summary states are no_workers (no recorded workers) and settled
(every recorded worker has consistent terminal evidence). These are evidence
summaries, not process ownership grants. Only the original supervisor's retained
Popen handle supplies process authority. The checks assume cooperating local
writers and do not protect against privileged database tampering.

The existing marked-directory retention and original-handle exit recording are
unchanged. No code adopts a PID, scans processes, clears uncertain rows, restores
a stale snapshot, or retries a missing operation.

## Performed verification

[Acceptance scenarios](verification/supervisor-loss-scenarios.md) preceded
implementation. Saved observations (historical local artifact omitted from the public package)
contain synthetic data from real disposable SQLite, Node API and owned processes.

An owned controller prepared a marked copy and exited. A separately owned
supervisor launched the fixed Node child, paused it before dispatch or after
commit, then terminated and waited for its own child. It exited abruptly with
code 23 before recording the child's confirmed exit in SQLite. This is an actual
supervisor-process failure at the exit-recording boundary; it intentionally
does not create a live unmanaged orphan.

Both cases preserved the durable running/null-exit row and marked storage.
A replacement supervisor rejected status, stop, proceed, wait and phase requests
for the old run with 404. Supplying the known creator PID as a string or the
running label also returned 404 without process lookup or signaling. Launch,
dispatch, external preparation, handoff, parking and cleanup returned 409.

The pre-dispatch case had no receipt. The post-commit case retained exactly one
instruction and audit event, and reconciled its receipt, while still reporting
exit_unconfirmed and denying cleanup. Instructions remained undelivered.

Seven explicitly injected inconsistent/uncertain SQLite states independently
denied dispatch, handoff and cleanup. These rows are fault fixtures, not claims
about actual processes. A normal owned-worker workflow confirmed exit through
its retained handle, changed status to settled, and allowed handoff and cleanup.
Source database hashes remained unchanged.

For teardown, the outer fixture owner waited for each supervisor after receiving
its original child's wait result. It then removed only its disposable fixture.
No blocked row was rewritten and no product cleanup bypass was introduced.
This teardown does not grant recovery authority to a replacement supervisor.

## Remaining boundary

Actual supervisor death while its child remains alive is not verified here.
The earlier independent-supervisor case verifies handle rejection while the
original owner remains available; neither case proves live-orphan recovery.
Do not create an unmanaged orphan merely to enlarge the evidence claim.

Safe further work can examine guard races and bounded failure handling using
retained ownership, or design a persistent guardian/ownership protocol. Such
work must preserve uncertainty until identity, authority and exit are proven.
It must not turn a PID, elapsed timeout, receipt or missing row into permission.
Live recovery, retry policy, full migration, production identity, hosted storage,
browser behavior and deployment remain outside this slice. Node stays the live
writer; imports, provider configuration and compatibility policy are unchanged.
