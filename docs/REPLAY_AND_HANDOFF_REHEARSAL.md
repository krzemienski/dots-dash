# Concurrent replay and disposable history handoff

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Historical slice: the later [fenced restart extension](FENCED_RESTART_REHEARSAL.md)
adds the other mutation families and bounded process-crash recovery. Observations
below remain scoped to this slice's baseline; no production cutover is implied.

Baseline: `c77d1203954eda57b7781641ee959711d43b7794`. The
[compatibility inventory and acceptance scenarios](verification/replay-handoff-scenarios.md)
were written first using the project-owned session-intent-review workflow. The
supported history subset permits this isolated rehearsal. Broader compatibility
decisions remain explicit; no production configuration or data is changed.

## Concurrent replay behavior

Node previously looked up an import receipt before starting its batch. Two
requests could both see no receipt; the loser then returned 503 after the unique
marker insertion failed. The importer now reconciles a failed transaction with
the durable marker. An identical hash returns `replayed:true`; changed content
returns 400. Without a marker it rethrows the original failure. It never turns
an absent receipt or failed audit into success.

This relies on the store's atomic batch rollback: the losing attempt's partial
effects cannot survive. An adapter with non-atomic batches is unsupported.
Existing fail-closed authentication, import-default-off and response projections
remain unchanged. This is a local source fix, not an external deployment.

## Disposable controller and protocol

[`HandoffRehearsal`](../python/dots_engineering/handoff_rehearsal.py) creates a
fresh private copy through the existing read-only-source snapshot lifecycle.
Only that copy receives a `rehearsal_handoff` control table. It starts with Node
as writer at epoch 1; there is no supported existing-write-target attachment.

The controller exposes `dispatch`, `status`, `transfer`, `reconcile`, inherited
readback and normal cleanup. It is a local filesystem-authority utility, not an
identity provider. Owner values are expected bindings. Node 24+ must be on PATH.
The controller's fixed internal Node transport invokes the actual history API
with a controlled principal only after a read-only check of the disposable
control table. It is never registered with the application server.

```python
from dots_engineering.handoff_rehearsal import HandoffRehearsal

with HandoffRehearsal(source, scratch_root, owner, owner) as rehearsal:
    rehearsal.dispatch(owner, "node", 1, selected_sanitized_batch)
    handoff = rehearsal.transfer(owner, "node", 1, "python")
    # Future dispatches must use writer="python", epoch=handoff["epoch"].
```

All paths must be explicitly authorized; use synthetic inputs for shareable
reports. Outputs and checkpoints from private sources must remain private.
No source discovery, credential acquisition, network call or automatic redaction
is implemented. Normal close deletes the copy. Forced termination may leave
scratch files; process-restart attachment/recovery is not implemented.

Before dispatch, the controller durably records the batch ID/hash as unresolved.
The Node batch guard and Python transaction guard check current writer, epoch,
owner and pending hash inside the immediate SQLite mutation transaction. Stale
leases cannot mutate. The Node store's optional guard is synchronous and defaults
to absent in the normal application; it is enabled only by this local transport.
It covers API mutation batches, not arbitrary trusted `prepare().run()` callers
or raw filesystem/SQL access. This is protocol fencing, not an OS sandbox.

Transfer checks the current lease and absence of unresolved work, records counts
and a data hash as a checkpoint, changes writer and increments epoch atomically.
The checkpoint is an attestation, not a restorable old copy. Returning ownership
to Node uses the current database, preserving Python's post-transfer writes.

An intentionally discarded completed response leaves durable unresolved state.
Handoff and new dispatches then fail. Reconciliation clears it only after finding
a matching committed receipt. Missing/mismatched receipts remain unresolved and
provide no retry authority. Storage failures retain that conservative state.
There is no force-clear or automatic retry interface. Known validated responses
below 500 clear the controller's pending state; exceptions and unknown process
outcomes retain it. This slice demonstrates lost-response reconciliation after
completed operations, not real process-kill recovery.

## Actual observations

Saved evidence (historical local artifact omitted from the public package) uses explicitly
synthetic data and actual API/SQLite operations, not simulated success.

| Workflow | Observed persisted result |
|---|---|
| Barrier forces two Node requests past receipt lookup | Baseline identical/conflicting statuses both `[200,503]` |
| Same races after fix | Identical `[200,200]`, one replay; conflicting `[200,400]` |
| Both race cases | One marker, one audit event, version 1 per imported row |
| Node epoch 1 → Python epoch 2 | Domain data unchanged by transfer; old Node lease denied |
| Python write with discarded completed response | Actual record saved; new operations/handoff blocked until receipt reconciliation |
| Return to Node epoch 3 | Python evidence retained; Node continued to version 3 with three receipts |
| Node response discarded after completed write | Matching receipt resolved the uncertainty |
| Missing or deliberately mismatched receipt | Still unresolved; handoff denied |
| Real guarded audit failures in both runtimes | Full rollback, no receipt, no false replay success |
| Stale lease at actual mutation boundary | Node API 400, Python 409; no domain rows/events |
| Wrong owner or source-store misuse | Denied; original source bytes unchanged |

The checkpoint hashes and final domain readback are saved with observations.
Source SHA-256 remained unchanged and scratch storage was empty after close.
No browser was used. Synthetic principals do not establish live identity-provider
behavior. No test files, private sessions, credentials, outside agents, external
calls, publication, production data writes or cutover were performed.

## Readiness and stopping boundary

**Verified:** bounded history replay; local epoch fencing; transfer in both
directions without stale restoration; recovery of discarded completed responses;
fail-closed uncertainty and atomic rollback.

**Not ready for production migration:** only the common history subset is
dispatched. Instruction/decision cutover, full-process crash/restart recovery,
supervision of in-flight processes, hosted storage, production authentication,
browser behavior and load are unverified. The application's Python worker has
no new writer mode. Node remains the live writer with imports disabled by default.

The remaining product-policy gaps are query/unusual-host source links, optional
join-link handling, broader event dates, numeric/Unicode payloads and inherited
audit meaning. This package neither silently broadens those policies nor rewrites
legacy records. A missing/mismatched receipt remains a concrete recovery boundary:
safe abort/retry requires proven process completion and reconciliation beyond the
matching-receipt path, rather than a force-clear decision in this utility.
Next extend the protocol to the other mutation families and design disposable
crash/restart/unknown-outcome recovery before considering any production cutover.
