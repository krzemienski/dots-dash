# Owned local browser receipts

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Follow-up: [dashboard receipt integration](BROWSER_RECEIPT_DASHBOARD.md) adds an
optional read-only projection. The implementation and verification below describe
the original producer slice; its historical receipts and scope remain unchanged.

Implemented on the local `feature/local-owned-browser-receipts` branch. Runtime
source revision for the final workflow:
`0274624672f0c22e97724f0f6000a04c7f86dfce`.

The adapter closes the previously missing producer-to-receipt link for **one
fixed synthetic local browser journey**. It does not authenticate old reports,
promote owner claims, configure a provider, mount a production API or switch the
live writer. The normal engineering runner remains unconfigured by default.

## Ownership and evidence path

[OwnedBrowserReceipts](../server/owned-browser-receipts.mjs) is an opt-in,
host-internal coordinator. Before browser launch it writes a pending run with
authorization/request identity, exact Git revision, source/build/fixture hashes
and measured runtime identities. It copies pinned application files and bundles
into that run's private disposable directory. Missing revisions and differences
from the pinned source reject before dispatch.

The installed Playwright API supplies `chromium.launchServer()`,
`BrowserServer.process()` and close/kill methods that wait for termination. The
coordinator retains that browser handle itself. It also retains the child handle
for the [fixed driver](../server/browser-workflow-driver.mjs). The new browser's
loopback endpoint and run configuration travel only through the inherited pipe;
they are not persisted as credentials or exposed to the page. No existing browser
session, tab, daemon or numeric PID is adopted.

The driver creates its disposable Node API/Python/SQLite host and a fresh browser
context. It performs the existing session-review import/navigation/reload
journey, blocks page requests outside its own loopback origin, and emits bounded
results plus artifact hashes through its stdout pipe. It cannot supply the
coordinator's revision/authorization identity and does not write receipts. The coordinator
checks snapshot/runtime identities and artifact bytes against the owned result,
confirms driver/browser exit and host shutdown, then finalizes the receipt.

[Storage](../server/browser-receipt-storage.mjs) is separate from application
records. Pending runs, transitions and receipts are append-only; finalization is
transactional and rejects conflicting content. Repeated or concurrent collection
returns the same receipt; request replay cannot dispatch another child in that
ledger. An observed workflow result and process exit are separate facts. A zero
exit is insufficient for pass. Incomplete execution or invalid integrity records
an unknown/gap result and preserves the pending history and partial observations.

The [build script](../scripts/build.mjs) now hashes bytes consumed by esbuild,
checks that every bundled input was measured, and records recipe/lockfile,
builder versions and output hashes in ignored `dist/build-manifest.json`.
The adapter validates that manifest and current bytes; it never builds, installs
packages or runs caller-selected commands. This trusts the local build script
and host files, not an imported session's assertion of build provenance.

## Actual acceptance evidence

[Scenarios](verification/owned-browser-receipt-scenarios.md) were defined before
implementation. The final workflow report (historical local artifact omitted from the public package)
contains actual receipts, transition history and persisted readback. The
verification index (historical local artifact omitted from the public package) binds the
retained reports and artifacts to their hashes and the verified source. The
observations (historical local artifact omitted from the public package)
and browser screenshot (historical local artifact omitted from the public package)
are bound by SHA-256 inside the successful receipt. Earlier candidate reports
remain retained with their own source revisions; they are not evidence for
unperformed checks on later source.

| Performed case | Observed result |
| --- | --- |
| Default-disabled adapter; missing or changed source revision | Rejected before dispatch |
| Actual UI import, source link, old-review return, invalid import and reload | Seven acceptance observations passed; both reviews/history retained; claims and imports kept their original attribution |
| Concurrent/repeated receipt collection and request replay | Same receipt, one browser-ready transition, no second dispatch |
| Conflicting request or receipt; attempted receipt update | Rejected; original receipt unchanged |
| Interrupt after first actual UI import | `outcome_unknown/gap`; one persisted review retained byte-for-byte in the partial observation; no automatic retry |
| Change copied input after browser start | `outcome_unknown/gap`, `input_or_runtime_changed` |
| Change artifact after owned output/exit, before finalization | `outcome_unknown/gap`, `artifact_binding_invalid` |
| Close coordinator while browser launch is pending | Browser exit confirmed; no driver dispatch or UI journey; `not_started/gap` |
| Compare explicit changed revision/input or absent revision | Stale or unknown relevance; historical outcome unchanged |

The four main runs produced exactly four pending records and four receipts. The
launch-interruption case used a separate disposable coordinator. Owned browser
exits were confirmed from retained handles; all run storage was removed only
after evidence was copied and closure confirmed. The normal UI/API received only
synthetic imports. No checklist or provider was authorized, no test files were
created, and no application tabs or private sessions were accessed.

Measured environment: Node 26.11.1, Python 3.15.0, installed Playwright
1.59.0-alpha-1771104257000, Chrome 155.0.8059.85, macOS/arm64; fixed en-US/UTC,
1000-by-850 viewport. Receipts retain runtime executable/library hashes and the
environment fingerprint. Typecheck, client build, JavaScript syntax and diff
checks passed separately; they do not establish the browser outcomes above.

## Host-only use and remaining limits

The coordinator requires explicit trusted-host configuration for the repository,
installed Playwright module, browser executable and Python executable, plus
`enabled: true`. There is no installer, environment discovery, HTTP start/finish
endpoint or general command parameter. A start request supplies only request ID,
exact revision and explicit authorization for this fixed synthetic workflow.
`waitReady` exposes the checkpoint after the first import; `proceed` continues
the fixed journey, `interrupt` stops it, and `collect` persists the owned outcome.
`close` confirms resources and releases its guard but retains the receipt files;
it refuses to declare cleanup safe when ownership remains unconfirmed.

This is a local host trust boundary, not cryptographic remote attestation or a
defense against a malicious same-user process that can edit code, dependencies
or SQLite. The build manifest is generated by the trusted local build script;
the adapter does not authenticate an independent compiler. Environment measures
identify the exercised runtime and launcher, not every OS/shared-library byte.
Page routing is restricted; no OS-wide network sandbox was added.

Receipts currently remain in the dedicated local ledger/report, not the dashboard
API or normal `review.runs`. `local_workflow_observed` means the named synthetic
journey was observed by this owned adapter, not that an imported completion claim
or a production feature is verified. Results are not automatically applied to
remediation status. Relevance compares explicitly supplied revision/input hashes;
there is no background repository watcher or implicit current-HEAD acceptance.

Coordinator death, lost live handles, host restart and adoption/recovery of old
jobs are not established. Idempotency is scoped to one retained coordinator's
ledger; no cross-coordinator retry authority exists. Unknown ownership retains
storage and blocks that coordinator. No crash/orphan recovery or forced cleanup
was exercised. A corrupt build manifest and malformed pipe stream are guarded in
code but were not separately injected in the final browser workflow. V310 is
therefore only satisfied for this bounded local journey; the broader product
gate, production identity, receipt UI integration and compatibility choices stay
open. No new user decision is needed for the implemented scope.
