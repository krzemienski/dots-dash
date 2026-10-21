# Supervisor-handle loss: acceptance before implementation

> Historical design and implementation context. See [current scoped verification](source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Baseline: `4af0008cbb730170eccf468c1cbf9a693ac056ab`. Local-only follow-up;
reuse the repository's session-intent-review workflow. Compatibility policies
await the owner's decision and must remain unchanged.

1. Report durable worker uncertainty separately from domain receipt resolution.
   A stored running/launching label means exit unconfirmed, not proof of liveness.
   Unknown or inconsistent completion state must not authorize cleanup.
2. A replacement supervisor has no process authority from a stored run ID,
   numeric PID, label, receipt or observed elapsed time. Its handle operations
   reject without discovering or signaling processes.
3. Verify actual supervisor-process loss with disposable storage and an owned
   Node child. The creating supervisor first stops/waits for its own child, then
   exits abruptly before persisting exit confirmation. This safely leaves real
   durable uncertainty without an unmanaged live orphan.
4. Exercise both an absent receipt and a committed matching receipt. Reopening
   controller/supervisor objects must preserve uncertainty. New dispatch,
   external preparation, handoff, parking and cleanup must reject; the marked
   database and supervision row must remain. A receipt cannot confirm exit.
5. Verify that ordinary retained-handle exit recording still permits lifecycle
   progress. No new retry, recovery, force-clear or PID adoption API is allowed.
6. Record observations from actual local API/process/SQLite operations with
   synthetic data. Fixture teardown is separate: only after the original child
   creator reported its own wait result and the outer driver waited for that
   supervisor. Do not alter a blocked row to permit product cleanup.

No test files/runners, private sessions, credentials, external writes, unrelated
process access, browser, deployment or live-writer changes. Actual supervisor
death with a still-live orphan remains unverified and is not required to prove
these bounded fail-closed outcomes.
