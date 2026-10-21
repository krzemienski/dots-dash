# Local session intent and drift slice

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

The Day workspace's **Session review** tab connects permitted export evidence
to goals and decisions, scoped findings, remediation drafts, skill selection,
bounded execution receipts and end-user observations. SQLite retains each
version and its audit snapshot. Existing work/history routes remain on Node;
this is a Python extension, not a completed backend migration.

## Supported input and privacy

The original supported adapter is `dots-visible-session` version 1: an explicitly
selected, owner-curated, already sanitized JSON export. Its canonical Python
schema is `python/dots_engineering/contracts.py`; a generated JSON Schema is
included in the build package and returned by authenticated
`GET /api/engineering/schema`. The example under `examples/` is **TEST DATA**.
It is not a captured session or evidence of any external integration.

The optional [selected-record admission envelope](SELECTED_RECORD_ADMISSION.md)
adds supplied attribution, field-level exclusion reasons, explicit project
confirmation and scoped correction context around that curated export. It reads
no original files and does not add a provider adapter. Both paths use the same
default-disabled import capability; existing v1 hashes remain unchanged.

The adapter accepts visible-turn summaries or selected project artifacts with
explicit provenance. It never reads local paths, follows source references,
discovers installed skills, parses private provider stores or executes imported
instructions. Source references are opaque `export:`, `artifact:`, `skill:` or
`receipt:` names. Unknown fields are rejected. Recognizable secrets, terminal
controls and bidi controls are removed before persistence; this is defense in
depth, not a universal secret detector. The owner must sanitize the input first.

Oh My Pi, Cursor, Claude and Codex adapters are explicitly unavailable. A CLI
name, session metadata or an artifact quoting an earlier request is not proof
of a supported visible transcript export. Skills are selected metadata plus a
small declarative checklist. Their original instructions are never loaded.

## Operator setup

Use Node 24+ and Python 3.11+. Python uses only the standard library. Preserve
the existing server-only authentication adapter and isolated owner database.
No development login or trusted-header bypass is shipped.

Process-local configuration, in addition to the existing authentication setup:

```sh
DASHBOARD_ENGINEERING_PYTHON=/absolute/path/to/python3
DASHBOARD_ENGINEERING_DB_PATH=/private/owner-storage/engineering.sqlite
DASHBOARD_ALLOW_SESSION_IMPORT=true
DASHBOARD_ALLOW_LOCAL_CHECKLIST=true
```

These are example settings, not global configuration changes. Without an
interpreter, the extension returns unconfigured. Both import and runner flags
default false. Changing either flag requires restarting the host. The separate
engineering database is permanently owner-bound on first initialization;
changing the configured owner does not grant access to its previous contents.
Do not point it at a legacy database or share one database across owners.

Node verifies owner authentication and same-origin POST before launching a
fixed Python script with a bounded JSON envelope. The body cannot choose an
executable, arguments, paths, environment, owner or capabilities. The worker
receives no inherited credential environment. It has no HTTP listener, shell
tools, provider SDK client or external side effects. It has a ten-second host
timeout and bounded input/output. A timeout reports an unconfirmed operation;
keep Session review open and use **Reconcile exact pending save**. The UI resends
the original request ID, serialized payload and version pins. This may finish a
previously uncommitted operation; server authorization and capability checks
still apply. New session saves and review switching stay blocked until the
operation is confirmed. A read-only refresh alone does not clear uncertainty.

A confirmed POST followed by a failed GET is shown as **Saved, but refresh
failed**. **Refresh confirmed save** only reads persisted records; it never
submits another operation. A first definitive rejection is reported separately.
A rejection during reconciliation keeps the original uncertain envelope, because
it cannot disprove a prior commit.

Recovery is in memory only. Leaving Session review or reloading discards the
envelope; no payload is written to browser storage and no replay happens on
remount. Inspect persisted records before any new save after leaving. Durable
cross-navigation recovery and a read-only operation lookup are not implemented
for this endpoint. The separate retained-record report workflow has its own
recovery contract. See the [isolated recovery evidence](verification/session-save-recovery.json).

## User flow

1. Open Day workspace → Session review. If unavailable, configure the operator
   boundary above; no imported examples appear automatically.
2. Open Import sanitized owner export, inspect the schema and paste a selected
   sanitized export whose `ownerId` matches the authenticated owner.
3. Inspect goals, expected behavior and user steps. Source anchors lead to the
   visible event record. Review decisions, timestamps and provenance.
   Correction context separately compares explicit supersession links and
   retains original outcomes, including failures omitted from active findings.
   Metadata differences require review; they do not validate or reject a
   correction. See [display scope and pending acceptance](CORRECTION_CONTEXT_DISPLAY.md).
4. Inspect drift findings and their remediation prompts. Missing associations
   are possible drift, not proof of disobedience. Claims remain unverified.
5. Select an applicable skill checklist. Selection saves a review version but
   does not invoke anything. Review the pinned skill and code revisions.
6. Authorize the local checklist if enabled. Its receipt records actual
   deterministic checks, task, input and authorization hashes, code/skill
   revisions, timestamps and Python version. The original skill is not run.
7. Perform the intended user steps in the authorized environment. Record the
   observed result, performed steps and evidence reference. These observations
   are labeled owner-reported. Rerunning a checklist can acknowledge that an
   observation exists; it cannot independently certify product behavior.

Remediation cards provide View goal and Record verification shortcuts with
return navigation to the initiating card. View latest checklist receipt opens
only that task's actual saved receipt; missing receipts remain explicit. See
[the navigation implementation and isolated browser evidence](REMEDIATION_NAVIGATION.md).

## API and storage

The separate [source inventory companion](SOURCE_INVENTORY.md) records bounded
tool/project/time metadata and owner-reported access history without requiring
goal-bearing exports. It has its own default-off write capability and no source
reader or processing checkpoint. Selected persistence/UI workflows now have
[isolated TEST DATA verification](verification/source-review-publication.md);
original-source access and processing remain unavailable.
The [read-only inventory pagination](SOURCE_INVENTORY_PAGINATION.md) exposes
older saved inventories with explicit browsing and selected-record scope.
The 51-inventory principal path was subsequently exercised in the
[isolated publication workflow](verification/source-review-publication.md);
that report remains historical to its pinned source files.
The [snapshot-to-review association design](SNAPSHOT_REVIEW_ASSOCIATIONS.md)
defines an owner assertion with separate identity/freshness pins and
append-only correction/revocation. The [bounded implementation](SNAPSHOT_REVIEW_IMPLEMENTATION.md)
adds a separate default-off contract and display. The subsequent
[isolated publication workflow](verification/source-review-publication.md) covers
the principal association scenarios, not every fault permutation. Association
supplies no read/processing certificate. See the [current product audit](PRODUCT_AUDIT.md)
for later evidence and remaining gates.

`GET /api/engineering` returns schema version, capability states, a metadata
index of the latest 50 reviews, the total count and one complete review.
`GET /api/engineering?reviewId=…` retrieves a specific saved review, including
older IDs outside that bounded index. `POST /api/engineering` supports:

| Action | Required scope | Outcome |
|---|---|---|
| import | requestId, export, server import capability | Strictly validated normalized review, findings and drafts |
| select | requestId, reviewId, version, taskId, skillId | Applicable skill selected; no invocation |
| run | selection fields, expectedRevision, skillRevision, capability=`review_checklist`, authorized=true, server runner capability | Actual local checklist receipt; externalExecution=false |
| observe | requestId, reviewId, version, goalId, revision, sourceRef, result, observed, performedSteps | Append owner-reported end-user observation |

All mutations use a request ID. Identical normalized payload replay returns
the saved response; changed payload conflicts. Revocation is checked before
replay. Version and revision pins prevent stale authorization. Mutations,
idempotency records and immutable audit snapshots commit in one immediate
SQLite transaction. The local runner is pure and bounded inside that
transaction, so interrupted writes roll back; no remote effect can be retried.
At most 100 runs and 100 observations are allowed per review; create a new
bounded export when that limit is reached. Input is limited to 240 KB, 100
events, 20 goals and 20 skills. Cross-review automatic merging is not shipped.

The adapter protocol is provider-neutral, but only `LocalChecklistRunner` is
accepted for execution today. A future SDK adapter needs its own persisted
queued/running/unknown states, host scopes, capability grants, approved tools,
budget enforcement, cancellation and reconciliation. Do not replace the local
adapter with a remote implementation inside the current transaction.

## Evidence limits

[Retained-selection review reports](OWNER_REVIEW_REPORTS.md) are a separate,
default-off owner assertion workflow with an explicit companion migration.
They pin retained normalized records and derive gaps from active per-item reports.
Neither imports nor skill/checklist/acceptance activity advances that history.
These counts do not establish original transcript processing or authorship.

Admitted selected-record reviews display a [context-preserving derived prompt](DERIVED_REMEDIATION_CONTEXT.md)
with scoped correction references, supplied attribution, project-binding basis
and same-revision owner observations. The original stored draft remains
available unchanged. This read-only projection grants no execution authority;
its [isolated observations](verification/derived-remediation-context.json)
include a failing owner report that remains fail after a successful checklist run.

Rule-based critique is not semantic intent extraction. Goals, associations,
decisions and skill applicability come from the owner-curated export. A newer
export is a separate review; historical evidence is retained, not silently
carried forward as current proof. Supersession is explicit and acyclic.
Negative outcomes preserve their scope even beside passing targeted checks.
No live repository inspection establishes whether the submitted revision is
the actual HEAD; the UI displays it as export provenance.

No provider agent, arbitrary command execution, terminal stream, subagent DAG,
full Python work/history migration, scheduler, automatic remediation or
independent external-outcome verifier ships in this slice. See the actual
[workflow evidence](verification/session-review-report.md), including browser
and identity-provider gaps.

A subsequent [source-only coverage review](SESSION_COVERAGE_SOURCE_REVIEW.md)
records which inventory, selected-source, historical and revision-matching labels
already exist, and the missing typed empty/unreadable/unsupported-source states.
It also distinguishes generated-output relevance from implementation change and
bounds existing correction/supersession support. Its acceptance-first companion
coverage contract is unimplemented; no new access or completion evidence follows.
A [bounded source-coverage display](SOURCE_COVERAGE_PROJECTION.md) now derives
selection, event-reference and inventory-only roles from existing v1 metadata.
Original-source read coverage stays unknown. This is a display-only projection,
not the proposed persisted companion contract. Its bounded browser observations
and remaining limits are recorded in that document.

The [artifact-evidence display](ARTIFACT_EVIDENCE_DISPLAY.md) separately annotates
changed/unavailable owned-receipt inputs using existing manifest membership.
Recorded build outputs are distinguished from recorded files with unknown
implementation roles. Imported artifact roles remain unknown. This optional
read-only response annotation changes no receipt or historical outcome. All six
defined artifact scenarios passed in the owned synthetic browser workflow at
`1d54ae105fadae850959e487e4b0cae303407855`; broader product acceptance remains open.
