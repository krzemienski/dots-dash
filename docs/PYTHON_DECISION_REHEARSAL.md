# Disposable Python decision-write rehearsal

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

This slice adds approval decisions to the existing disposable-snapshot
rehearsal boundary. It does not expose a Python write route or application
configuration flag. Node remains the application writer. Earlier commits,
branches and their verification evidence remain preserved.

## Local operator use

```sh
python3 -B python/rehearse_decisions.py \
  --source /absolute/authorized/synthetic.sqlite \
  --scratch-root /absolute/private/scratch \
  --owner synthetic-owner < selected-decision-operations.json
```

Input is a list of 1–20 operations, for example:

```json
[{"action":"decision","requestId":"synthetic_decision_001","approvalId":"synthetic-approval","decision":"approve","version":1}]
```

The selected source is opened read-only and copied with SQLite backup into a
new private disposable directory. Only that snapshot receives mutations. Normal
exit removes it. Forced termination can leave scratch files; automatic cleanup
after a process kill is not claimed. No existing write destination can be
selected through the supported interface.

This is an operator CLI using existing filesystem authority. `--owner` is an
expected owner binding, not authentication. Never expose it as an identity
adapter or application endpoint. Inputs/output can contain owner data; use only
explicitly authorized sources and keep non-synthetic reports private. It does
not read session stores, discover paths, obtain credentials or contact providers.

## Decision semantics

- `approve` and `decline` are the only choices. Requests require a valid request
  ID, approval ID and integral version. Compact JSON has the existing 12 KB
  request limit. Versions are bounded to JavaScript's safe-integer range.
- A fresh choice requires a pending approval at the requested version, unexpired
  authorization, and truthy destination/scope/cost fields as in the Node guard.
- Success inserts the owner decision, changes state to approved/declined,
  increments version exactly once and appends the local audit event in one
  immediate SQLite transaction. Every successful response has `executed:false`.
- Identical replay returns the original decision before rechecking the now
  changed approval state. Changing choice, approval or payload version under
  the same request ID returns 409.
- Separate requests competing for one approval cannot both win. A preexisting
  unique approval decision also prevents a second write, even if legacy state
  inconsistently still says pending.
- Audit failure rolls back decision insertion and the approval state/version.
  No sending, delivery, model execution or other external action exists.

Supported expiry representations are absent/null/empty, ISO dates, and ISO
timestamps with seconds and an explicit timezone. Invalid or unsupported
nonempty expiry representations are rejected. JavaScript's broader legacy Date
coercions and unsafe numeric versions are intentionally not guessed; this is
bounded canonical parity rather than universal malformed-input compatibility.

`DecisionRehearsal` reuses the instruction snapshot lifecycle and replaces its
mutation method. The instruction CLI's default behavior is retained. The
application worker continues to reject decision-rehearsal mode, so these local
utilities cannot enable application writes through the existing API.

## Actual performed workflows

[Acceptance scenarios](verification/python-decision-rehearsal-scenarios.md)
were defined first using the project-owned session-intent-review workflow.
Approval/task rows were explicitly labeled synthetic setup because the current
application has no approval-creation endpoint. Verification performed real CLI
saves and Node API calls against separate actual SQLite snapshots, followed by
persisted readback. No test files, new credentials, browser sessions, application
tabs, outside agents or external calls were used.

The Python CLI performed 20 operations; the 19 supported decision cases were
also sent through the existing Node API. All 19 statuses and semantic persisted
projections matched. The remaining operation verified that the decision-only
tool rejects instruction saves. Generated UUIDs/timestamps differ across
independent executions and are excluded from cross-writer semantic comparison;
replay returned the identical original ID within each writer.

Observed results included:

- Approve and decline each changed state and version from 1 to 2, with one
  decision and one audit entry. Successful responses and replay never executed.
- Conflicting replay, expired/invalid expiry, incomplete/already-decided/stale
  approvals and a preexisting decision returned 409. Missing or non-approval
  targets returned 404; malformed inputs 400; oversized JSON 413.
- After the scratch approval changed to version 2, an old-version request
  returned 409. A current-version choice succeeded and produced version 3.
- Concurrent identical calls returned one original ID, with one duplicate.
  Concurrent competing choices produced statuses 200 and 409, one decision
  and one version increment.
- A deliberately installed scratch audit trigger rejected the actual insert.
  Readback retained pending/version 1 and no decision; the complete semantic
  projection was unchanged. Removing the scratch trigger and retrying produced
  approved/version 2 and one decision. This trigger is verification setup,
  not a product option.
- Wrong principal returned 401; closed rehearsal 409; mixed-owner source 403
  before snapshot creation. The application worker rejected rehearsal mode.
- Source SHA-256 was unchanged after rehearsal and scratch storage was empty.
  The existing instruction CLI still saved `saved_not_delivered` and removed
  its scratch storage after the shared-dispatch change.

Actual workflow observations (historical local artifact omitted from the public package)
contain the statuses, semantic projections, concurrency/rollback outcomes and
source hashes. Node calls used a controlled synthetic principal only inside
the local verification harness. This is API/CLI/storage evidence, not browser
interaction or production identity-provider verification. Earlier browser
evidence remains tied to its earlier source revision.

TypeScript typechecking, the production client build and `git diff --check`
also passed. No test files or test runners were used for this slice.

## Remaining gates and next prerequisite

Full migration remains incomplete. Python application mutations are still
disabled; there is no writer cutover, data migration or production rollback
claim. Unsupported expiry encodings, arbitrary malformed JSON/Unicode, forced
termination recovery, production concurrency/load and actual identity-provider
behavior need their own evidence before changing writer ownership.

The next useful bounded prerequisite is legacy history-import rehearsal on
disposable snapshots: strict runtime validation, source-account constraints,
batch replay/conflict, monotonic snapshot updates, preserved counts and atomic
audit effects. After all mutation families are covered, define a single-writer
cutover protocol with checkpoints and post-cutover rollback rules. Publication
remains blocked; no PR, push, merge or deployment is part of this slice.
