# Fenced mutation families and disposable restart recovery

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Subsequent scope: [owned-process supervision](OWNED_PROCESS_SUPERVISION.md) covers
workers whose supervisor retains their handles. Supervisor-handle loss and the
documented compatibility choices remain unresolved; this slice's evidence keeps
its original revision scope.

Baseline: `286c7ff4a391fd9560af111b5e689ac9b7f9ed51`. The
[acceptance scenarios and specific gap inventory](verification/fenced-restart-scenarios.md)
were recorded before implementation using the project session-intent-review
workflow. This extends the disposable controller to instructions, decisions and
history. Node remains the live application writer. Nothing enables a production
Python write route or changes production configuration.

## Fencing and receipts

`dispatch` identifies instruction/decision requests by `action`; requests without
an action use history import. The Node transport calls the actual `/api/work` or
`/api/history` implementation. All three Python writers now enter through the
same overridable transaction boundary. The controller verifies writer, epoch,
owner and pending request hash inside that boundary. Stale leases cannot mutate.
The Node guard also verifies the selected operation kind and rehearsal version.

Instructions remain `saved_not_delivered`, and decisions remain `executed:false`.
Reconciliation now distinguishes three evidence types:

| Operation | Required persisted evidence |
|---|---|
| History | Matching batch marker and original payload hash |
| Instruction | Matching request ID, owner, normalized body/task, saved status and matching audit event |
| Decision | Matching request ID, owner, approval/choice/version, matching audit event and compatible approval state/version |

Instruction and decision tables do not store full original request hashes.
Their recovery proof is normalized semantic data plus audit evidence. The
pending hash binds dispatch; it is not mislabeled as a stored receipt hash.
Missing audit, mismatched fields or missing receipt leave pending state intact.
No missing outcome is automatically cleared, retried or declared successful.

## Marked-session restart

New sessions carry a version-2 SQLite session row and private `rehearsal.json`
manifest, in the newly created disposable directory. The manifest binds expected
owner, session ID, database device/inode and controller-lock device/inode. Its
`sourceHash` is the initial clone hash; original-source byte preservation is
measured separately by the verification workflows. No original source path or
credential is stored in the manifest.

A controller holds an exclusive POSIX advisory file lock. Local operation locks
also prevent parking or cleanup during an active dispatch. Normal close deletes
owned scratch storage. `park(owner)` preserves the marked copy and releases the
controller for a later restart. A process killed without cleanup also leaves a
marked copy that can be explicitly selected for recovery.

```python
from dots_engineering.handoff_rehearsal import HandoffRehearsal

# selected_directory must be a previously created marked rehearsal directory.
with HandoffRehearsal.resume(selected_directory, scratch_root, owner, owner) as r:
    state = r.status(owner)
    result = r.reconcile(owner)
    # Continue only when result["resolved"] is true, using the new state epoch.
```

Resume requires an explicit directory directly inside the declared scratch root.
It rejects ordinary stores, symlink directories/files, mismatched file identity,
wrong owner, unsupported metadata and an already active controller. The file
lock identity is checked again after lock acquisition. Metadata and permissions
are validated before a writable connection is opened. SQLite may then recover a
hot journal on this designated disposable copy. The database session row and
owner/schema are checked, and the epoch increments before reconciliation.
Source strings, operation receipts and post-transfer writes are preserved.

Owner labels and manifests are local filesystem bindings, not authentication
credentials. Advisory locks and epoch checks protect cooperating protocol
participants, not arbitrary privileged filesystem/SQL writers. This implementation
requires POSIX `flock`; Windows and network-filesystem locking are not verified.
It never searches for processes or signals one during resume.

## Actual verification

Saved observations (historical local artifact omitted from the public package) contain only
explicitly synthetic data. The package performed real Node API calls, Python
writes, SQLite readback and process termination using owned `Popen` handles.
No test files or test runner were created or used.

- Both runtimes saved fenced instructions and decisions, reconciled discarded
  responses, replayed original IDs and rejected changed requests with 409.
  Two instructions, two decisions and four audit events persisted; both approval
  versions were 2. Instructions stayed undelivered and decisions did not execute.
- Transfer and park/resume retained data. Resume advanced the epoch, and stale
  leases were denied. Separate checks exercised the real mutation transaction
  guards for both instruction and decision paths: Node 400, Python 409, no writes.
- History dispatch/reconciliation remained functional through Node, Python and
  resume, retaining version 2 after its newer snapshot.
- Two controller processes were killed after committed operations and before
  reconciliation: Node instruction and Python decision. A different controller
  resumed, revoked old epochs and matched durable receipts. Replay left one
  audit event, with no duplicate mutation.
- Python instruction and decision processes were killed during real SQLite
  transactions immediately before their audit inserts. Recovery removed partial
  effects; approvals remained pending/version 1, with no receipt or audit. The
  absent outcome remained unresolved and blocked handoff.
- Actual Node instruction and decision writer processes were also killed at the
  pre-audit boundary. After their confirmed exit, the controller parked/resumed.
  SQLite recovery likewise retained no partial receipt, approval update or audit.
- Resume denial checks covered active controller, wrong principal/owner, symlink
  directory/database, replaced database/lock, unsupported manifest version and
  an ordinary store without session metadata. Denials did not delete the session.
- Deliberately removed audits and mismatched instruction/decision fields could
  not clear unresolved state; a decision audit pointing to another task also
  failed reconciliation. Source hashes stayed unchanged and all owned
  scratch directories were removed after normal cleanup.

The six recorded crash scenarios used SIGKILL only on rehearsal processes
created through explicit handles; no unrelated worker was discovered or stopped.
Controlled trace callbacks/temporary triggers paused the actual writes at known
boundaries; these are inline verification fixtures, not product failure switches.
The Node transaction-kill cases resumed after the owned writer exited; they do
not claim supervision of an unknown surviving process. This is process-crash
evidence, not host power-loss, disk-corruption or distributed-recovery proof.

No browser, live identity provider, credentials, private session stores, external
agents, external writes, deployment or production cutover were involved. Default
application imports and the Python application worker remain fail-closed.
Typechecking, the production client build, Node transport syntax and diff checks
passed. Their results are separate from the performed workflow observations.

## Readiness, remaining gaps and input boundary

**Locally verified:** all three mutation families use the disposable fence;
instruction/decision receipts require semantic and audit evidence; marked restart
revokes stale epochs; committed operations reconcile without duplication; killed
transactions recover without partial effects.

**Still incomplete:** full application migration, live authentication/browser/load,
hosted adapters, Windows/network storage, power-loss recovery and supervision of
surviving orphan writers. Missing/mismatched receipts stay blocked even after
rollback is observed; no automatic safe-abort/retry policy is implemented.

The inventory retains source-derived response differences in concurrent
instruction/decision replay, noncanonical decision expiry and history URL, join
link, date, numeric/Unicode and audit semantics. Those broader contracts were not
silently changed or counted as passing. Resolving whether to preserve Node's
permissive inputs versus tighten both writers, and how audit corrections should
appear, requires explicit product policy before full parity can be claimed.

No additional user input was needed to complete this isolated package. Further
automatic retry/release of unresolved work requires a separately reviewed recovery
policy and proof about in-flight processes. Node remains the live writer; no
production rollout is authorized by these results.
