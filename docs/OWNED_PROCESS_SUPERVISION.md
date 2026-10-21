# Surviving owned rehearsal workers

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Follow-up: [supervisor-handle-loss safeguards](SUPERVISOR_HANDLE_LOSS.md) add
explicit uncertainty status and verify loss before durable exit recording.
That evidence does not establish recovery of a live orphan.

Baseline: `5048380a202c82e6e3f96772e59c285fdd73f7d3`. The
[acceptance scenarios](verification/owned-supervision-scenarios.md) preceded code.
This local package adds retained-handle supervision across controller restart
and fixes concurrent instruction/decision replay. Production remains untouched;
Node stays the live writer and application imports remain off by default.

## Supported replay fix

Actual barrier-controlled Node requests reproduced two gaps: identical instruction
races returned the same saved ID without a duplicate flag, while identical
decision races produced 200/409. Now both produce 200/200 with one duplicate and
the original receipt. Conflicting races still produce 200/409. In all four
performed cases there is one receipt and one audit event; decisions increment
approval version once and retain executed:false. Instructions stay undelivered.

A second decision timing was reproduced separately: another request commits
after the initial receipt lookup but before the approval read. Its matching
case changed from 200/409 to 200/200 with one duplicate; conflicting content
still returns 200/409. Both retain one receipt/audit and approval version 2.

## Ownership and lifecycle

[`OwnedRehearsalSupervisor`](../python/dots_engineering/rehearsal_supervisor.py)
launches only the fixed local Node rehearsal transport. It accepts no arbitrary
command or PID. Each run ID maps to a Popen handle created by that supervisor.
Unknown IDs, including another supervisor's IDs, reject with 404 without signaling
any process. There is no process discovery, PID adoption or global signal path.

Keep the supervisor alive independently of the controller. A controller prepares
one durable pending operation via `prepare_external`; the supervisor starts it
using the returned envelope. Preparation retains the marked disposable directory
under manual cleanup ownership before any external child starts. Garbage
collection of that controller cannot delete a surviving child's database.

The supervisor validates the selected scratch root, manifest/database identity,
owner, pending request hash, operation kind and current lease before launch. A
private `rehearsal_supervision` table records launching/running/exited state.
Only a confirmed exit from the retained handle can record exit. Domain receipts
remain separate evidence: exit code zero does not prove a mutation succeeded.

The protocol can pause the fixed worker before dispatch, before an actual audit
insert, or after API dispatch. These phases are local rehearsal controls, not
application API parameters. Inputs are bounded to 1 MB, phase output to 4 MB and
the supervisor to four live owned workers. Node 24+ must be on PATH. No provider,
browser, credential or shell execution is exposed by the protocol.

`status`, `next_event`, `proceed`, `wait_exit` and `stop` operate only on owned
handles. Stop requests SIGTERM, confirms exit, and can escalate to SIGKILL only
for that same owned handle if the bounded wait expires. The performed stop
exited on SIGTERM; escalation was not needed or claimed as exercised.

Controller restart still advances the epoch, fencing old writers. Transfer,
new dispatch, parking and cleanup reject while any supervised worker's exit is
unconfirmed, even when a matching receipt is already visible. Confirm/stop owned
workers before cleaning their snapshot. A lost supervisor leaves durable active
state blocked; there is no force-clear or numeric-PID recovery shortcut.

Advisory locks and epoch checks apply to cooperating local participants, not
arbitrary privileged filesystem/SQL writers. The existing synchronous transport
still works; independently surviving workers should use the explicitly retained
supervisor. This is not a production process manager or migration cutover.

## Actual surviving-worker outcomes

Saved observations (historical local artifact omitted from the public package) contain only
synthetic data from actual API, SQLite and owned-process operations. A parent
supervisor launched the fixed Node worker; a separately created controller
process was then killed through its own Popen handle. The worker remained alive.

| Surviving phase | Actual recovery outcome |
|---|---|
| Before instruction dispatch | Restart advanced epoch to 2; continuing the old worker returned 400 with no instruction. Missing receipt still blocked handoff. |
| Decision transaction before audit insert | Restart was blocked by the real SQLite write lock. The supervisor stopped its own worker and confirmed exit -15. Recovery left approval pending/version 1 and no decision/audit; missing receipt stayed unresolved. |
| After instruction commit, before response delivery | Restart found the matching receipt. Transfer, parking and cleanup still returned 409 while the worker lived. After confirmed exit, transfer to Python epoch 3 retained one instruction and one audit. |

A second supervisor instance could not adopt the first instance's run ID; the
original paused process remained alive until its actual owner stopped it. This
checks the lost-handle boundary without deliberately creating an unmanageable
orphan. It is not evidence of recovery after the supervisor process itself dies.

Source hashes remained unchanged; all owned scratch storage was cleaned after
confirmed exits. The normal Node transport still imported history successfully.
Typecheck, build, syntax and diff checks are recorded separately from these
performed outcomes. No test files, private sessions, credentials, unrelated
processes, outside agents, application tabs or external writes were used.

## Readiness and stopping boundary

Verified locally: retained-handle supervision of surviving Node transports,
stale-epoch denial, lock-aware restart, confirmed owned-worker termination,
receipt-based completion, and cleanup/handoff denial until worker exit. The
prior package covers Python in-process writer crashes; this package does not
introduce independent Python child writers.

The [compatibility policy choices](COMPATIBILITY_POLICY_CHOICES.md) remain
explicitly undecided. Their dependent changes stop here. No source URL, malformed
date, unsupported number/Unicode or audit meaning was silently transformed.
Missing receipts still do not authorize retry, and lost process handles still
do not authorize signaling a PID.

Full migration remains incomplete: supervisor-loss recovery, an approved
missing-receipt policy, broader compatibility, hosted storage, non-POSIX systems,
live identity, browser and load evidence remain open. These are API/process/storage
results, not browser verification or authority for production cutover.
