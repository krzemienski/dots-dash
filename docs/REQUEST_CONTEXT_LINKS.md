# Local request, repository task and review associations

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Local branch: `feature/local-request-context-links`. Static-checked source revision:
`d247d4b21298ed9bb6599edd79c0adcce9c07b21`.

Implementation is present, but **functional/browser acceptance is blocked**.
Typecheck, client build and Python syntax checks passed. No new browser/API
workflow or persisted association outcome is claimed. Earlier browser evidence
belongs to earlier slices and does not verify this change.

## Implemented scope, pending functional acceptance

The Session review workspace now has a request/task association section. It
reads canonical imported `commitment` metadata from the existing Node work
ledger: ID, bounded title, version and content hash. It never follows source URLs
or imports correspondence. The existing Day request card has a shortcut to its
association section. No fixture appears automatically.

An owner can create a local repository-task association to the selected session
review when the host explicitly enables `DASHBOARD_ALLOW_CONTEXT_LINKS=true`.
This new capability defaults false independently of session import and local
checklist execution. The task's repository reference is an opaque `artifact:`
name; its project and revision are pinned to declared review metadata. This is
not discovery of a repository, live HEAD verification or creation of a task in
an external system.

Associations live in new `context_links` and `context_link_audit` tables in the
existing separate owner-bound Python engineering database. The Python worker
remains their writer. Node remains the canonical work/history writer; its schema,
import rules, mutation semantics and compatibility policies are unchanged.
No canonical request or imported review is rewritten when a link is created.
The task row contains IDs/pins and owner-authored task metadata, not copied
correspondence or review content. An immutable audit snapshot and idempotency
response commit in the same SQLite transaction.

The UI provides request → task → selected review and review → task → request
navigation. Return links are derived from persisted associations; no transient
back stack is required. Reload may return to the existing workspace default;
reopening Session review reads the stored associations. These behaviors are
implemented but still await actual browser observation.

## API and permission boundaries

`GET /api/context-links` returns the first 50 canonical requests, coverage status,
up to 100 saved task associations and their current reference states. Node builds
the minimal request projection after authenticating the owner. Request bodies
cannot supply that trusted projection. No new filesystem or provider source is
opened. Runtime paths, credentials, messages and repository contents are absent.

`POST /api/context-links` accepts only `action=link`, an idempotency `requestId`,
`sourceRequestId`, `sourceRequestVersion`, `sourceRequestHash`, `reviewId`,
`reviewVersion`, `projectId`, `revision`, `repositoryRef` and `title`. It requires
owner authentication, same origin and the separate host-controlled link capability.
Unknown fields, including permission grants or source content, reject. Unknown
reference targets and mismatched request/review pins reject. Identical operation
replay returns its original association; changed payload conflicts. Capability
revocation is checked before replay. Links are immutable; retarget/delete endpoints
were not added. A new reviewed association preserves the old one as history.

Each read separately reports request and review state: current, stale, missing,
or (for a request absent from a truncated source projection) unknown. Missing
navigation is disabled; stale navigation is explicitly to the current target,
with original pins retained. Current means equality with this read's snapshots,
not a cross-database atomic snapshot, live subscription or continuing permission.
A request can change after the Node read; the next read detects changed pins.
There is no cross-database lock or distributed transaction.

Permission display is separate from reference freshness. It reports availability
of each owner-readable local target and explicitly `not_granted` for repository
access, execution and sending. These statements describe what the association
confers, not a global inventory of unrelated grants. No provider, execution or
send adapter is installed or invoked. Link creation does not enable a checklist,
save an instruction, approve an action or change any existing capabilities.
The existing owner boundary applies; granular per-request sharing is not added.

## Acceptance and current blocker

[Scenarios](verification/request-context-link-scenarios.md) preceded code and
cover both navigation directions, reload, stale/missing references, truncated
coverage, idempotency and permission denials. The supplied
[request fixture](../examples/request-context.synthetic.json) is labeled TEST DATA
and contains no correspondence. It can be paired with the existing
[session fixture](../examples/session-review.synthetic.json) in a new disposable
instance. No private or production sources were read.

The planned inline workflow would use an owned browser and fresh loopback
Node/Python/SQLite instance, import synthetic data through actual APIs/UI, update
the synthetic request, append an owner observation, and remove only owned fixture
rows to observe missing references. Removal is a verification perturbation, not
a shipped deletion API. It would inspect saved link/audit rows and confirm cleanup.
It has **not executed** and no successful workflow artifact exists for this slice.

Automatic approval review rejected the browser/API workflow twice. The first
rejection cited the original delegation's prohibition on browser/application
use. The second treated later delegated isolated-browser authorization as
untrusted and retained that prohibition. The same workflow was not attempted
through another tool or route. An explicit approval request is pending for a fresh
owned browser and local API/storage mutations only in disposable development
storage. The verification checkpoint (historical local artifact omitted from the public package)
records the static checks and unperformed acceptance cases.

## Limits

Even a future passing synthetic workflow would establish only local synthetic
linkage. It would not prove V301 against an actual authorized correspondence
request and repository task. Repository identity is declared metadata; real
source selection, provenance, production identity and independent-owner behavior
remain unverified. The 50-request projection and 100-association bounds are
explicit; search, paging and retargeting are not implemented. Existing historical
evidence and branches are preserved. No production write, external application
interaction, provider execution, credential, publication or test file was added.

## Static-review fixes — functional acceptance still pending

Source revision `75ca24616493cd6cb1e782bf21431504b7ff6486` addresses two findings
from read-only review of `ed9c509d`; neither finding was reproduced at runtime.

The association form now freezes one serialized payload and operation ID before
submitting. An in-flight guard prevents overlapping submissions. Network errors,
5xx responses and unconfirmed response bodies retain that attempt. Retry pending
save sends the identical envelope through the existing idempotent POST to
reconcile a committed-but-unseen response. Editing and a new association are
blocked while pending. A denial after uncertainty does not erase the operation
reference; revocation cannot establish whether an earlier save committed. A
recognized rejection of the first, previously certain attempt releases the draft
for correction. A validated success clears the pending attempt and form fields
before refreshing the list, so a failed list refresh does not turn a confirmed
save into an uncertain creation.

Retention is in the mounted form, not durable browser storage. A before-unload
warning is requested, but browser enforcement is not assumed. Reload, tab/workspace
unmount or a parent error that removes the form can lose the pending reference;
cross-reload recovery is not implemented. Keep an uncertain view open and do not
infer absence from a refreshed list. A continuing denial can leave the operation
unresolved. This bounded fix makes no general crash-recovery claim.

New association titles are revalidated after sanitization: the stored value must
contain non-whitespace text and its actual length must be at most 300 characters.
Control-only input cannot sanitize to an accepted empty title; padding cannot
bypass the persisted length bound. The check runs inside the creation callback,
after historical operation replay lookup. Existing normalization hashes and saved
records are unchanged; this does not retroactively clean old records or reject
an otherwise valid identical replay solely because its old stored title would
fail the new creation rule.

Typecheck, build, Python AST parsing and diff checks passed. No browser, API,
functional test or denied workflow was run. The existing explicit approval
request remains pending. See the static fix checkpoint (historical local artifact omitted from the public package).

## Source-only acceptance-readiness review

Reviewed `4b0cef33b9e3536ccbb2b033d43c13183a1524c1` without browser/API activity.
No additional concrete independent defect was found in the bounded retry/title
paths, and no runtime code changed. The readiness ledger (historical local artifact omitted from the public package)
records source references, hashes, exact static checks and unverified scenarios.

The trace confirmed one pending ID/body before fetch, an in-flight guard,
identical-envelope retries, uncertainty retained after later denial, and pending
state cleared only on recognized initial rejection or validated success. Success
is recorded before list refresh. New creation validates sanitized non-whitespace
titles and actual length; replay lookup precedes that callback, preserving prior
operation hashes and records. These are source conclusions, not runtime outcomes.

Source hashes matched the prior fix checkpoint and reviewed commit; tracked
runtime/build inputs were unchanged since `75ca246`. Python AST parsing of the
link handler, store and validator passed, as did diff checks. Prior typecheck/build
results remain historical and were not repeated. No application module was
imported for verification and no functional tests were run.

The next useful task remains the explicitly approved disposable workflow, with
lost-response retry and normalized-title rejection/replay first, then navigation,
reference freshness and authority checks. Approval is still unanswered. Mounted-
view retention and unresolved later denials remain documented limits, not claims
of crash recovery. No speculative implementation or alternate execution route
was added.
