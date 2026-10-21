# Owned browser receipts in the dashboard

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Implemented locally on `feature/local-browser-receipt-dashboard`. Verified source
revision: `0690126fd6b96eb5a2633a566a22b9404a47c710`.

Session review now links adapter-produced evidence to the existing run view.
Completed receipts, unknown/interrupted outcomes and runs without receipts remain
distinct. Imported events and owner reports retain their original attribution;
no receipt completes remediation or authorizes execution/retry.

## Read-only integration

`GET /api/browser-receipts` uses the existing owner-authentication boundary.
Other methods return 405. An unconfigured reader returns an explicit unconfigured
state; a failed read returns 503/unavailable without paths or exception details.
No start, collect, finish, retry, receipt import or artifact-content endpoint was
added. The Python export/runner contracts and mutation semantics are unchanged.

The [reader](../server/browser-receipt-reader.mjs) opens only a host-selected
ledger with SQLite read-only mode, validates its owner binding and file identity,
and checks pending/input/receipt/audit hashes before projection. It reads at most
50 recent runs and reports the total. A short consistent SQL snapshot is released
before filesystem hashing, preserving the coordinator's sole-writer role.
Projection omits raw observation bodies, source contents, machine paths and
browser-control endpoints. Artifact names/hashes and availability are displayed;
artifact contents are not served.

Trusted local hosts may supply `browserReceiptReader` to `createApi`, or explicitly
configure `DASHBOARD_BROWSER_RECEIPTS_PATH` in the existing local server. Optional
`DASHBOARD_BROWSER_MEASUREMENT_ROOT` selects permitted source/build files to compare
on a read. Neither is configured by default. No global settings or running
application were changed. The producer currently creates a `synthetic-owner`
ledger; this slice does not rebind it to a real account. A different configured
owner remains denied.

The [run/evidence components](../ui/browser-receipts.tsx) display the recorded
outcome separately from current file comparison. Links identify the selected
review's role: target, historical input or partial historical observation. The
observed review version stays visible; later owner reports change the review
version without extending the earlier receipt's coverage. Run cards remain
available even before a session review has been imported.

## Actual end-user acceptance

[Scenarios](verification/browser-receipt-dashboard-scenarios.md) preceded code.
Final workflow evidence (historical local artifact omitted from the public package)
contains fresh producer receipts, actual API readback, rendered card text and
the saved owner report. The verification index (historical local artifact omitted from the public package)
records source and artifact hashes. The receipt-producing workflow and the
separate dashboard-viewer observations are distinct: no viewer observation is
silently promoted to a producer receipt.

The isolated viewer used a new empty application database, imported the same
sanitized synthetic exports through rendered controls, and read the actual owned
ledger. A successful run, an interrupted run and a run held at its checkpoint
were freshly produced at the verified source revision.

| Performed case | Observed result |
| --- | --- |
| Empty review database | Three actual owned runs visible without a selected review |
| Completed run | Pass scoped to the named synthetic workflow; revision, input/environment/receipt hashes and retained artifact hashes visible |
| Evidence navigation | Evidence link focused the correct run; return focused that review's adapter-evidence section |
| Interrupted run | Unknown/gap, with partial historical association and confirmed resource closure; no completed/canceled/retry claim |
| Pending run | No finalized receipt; last recorded state displayed without inferring current liveness or result |
| Duplicate collection and refresh | Original receipt hash/content retained; one row and unchanged run count |
| Changed disposable measured source | `ui/styles.css` identified as changed; stale relevance displayed while original pass and hashes stayed intact |
| Owner report, reload | Report remained `owner_reported`; review version 2 visibly exceeded receipt coverage at version 1; persisted review unchanged by reload |
| Reader and measurement gaps | Unconfigured reader, unavailable ledger and unknown measurement distinguished from empty or successful coverage |
| Read-only/owner boundaries | Browser HTTP POST returned 405; direct API-handler unauthenticated call returned 401; direct wrong-owner reader call rejected |
| Narrow viewport | 390-pixel page width at a 390-pixel viewport; no horizontal overflow |

See success (historical local artifact omitted from the public package),
unknown (historical local artifact omitted from the public package),
missing receipt (historical local artifact omitted from the public package),
stale inputs (historical local artifact omitted from the public package) and
narrow viewport (historical local artifact omitted from the public package).

The original producer database bytes and successful receipt were unchanged.
The pending run was explicitly interrupted during cleanup, after its missing
receipt view was captured; its final outcome was unknown/gap with closure
confirmed. Dedicated browsers and servers closed, and disposable storage was
removed. No application JavaScript errors were observed. No production data,
application tabs, credentials, outside agents, external writes or test files
were used. Typecheck, build, JavaScript syntax and diff checks passed separately.

Two earlier viewer attempts stopped on verification-command mistakes: toggling
an already-open import form and calling browser `Response.status` as a method.
They required no application source changes; their reports and cleanup outcomes
are retained separately. The final workflow established all listed outcomes.

## Precise limits

This is read-time inspection of explicitly configured local source and served
bundle files. It does not watch a repository, inspect live HEAD, re-measure
dependencies/environment or perform semantic change-impact analysis. Matching
files do not extend the recorded workflow's acceptance scope. Missing measurement
is unknown, and a stale or interrupted receipt does not authorize retry.

Receipt trust remains the existing owned local producer and trusted host/storage
boundary, not remote attestation or protection against malicious same-user file
editing. Artifact hashes are checked, but no download/viewer for artifact contents
is exposed. Ledger pagination beyond the latest 50 runs, arbitrary workflow
selection, production identity/capability setup, live monitoring and lost-
coordinator recovery remain outside this slice. Full V310 is still not closed.
Compatibility decisions, old imports/receipts, prior branches and single-writer
ownership are preserved.

## Pagination follow-up

The subsequent [history pagination slice](BROWSER_RECEIPT_PAGINATION.md) closes
the latest-50 browsing limitation with anchored Older/Newer/Latest navigation
and actual isolated acceptance using 53 owned runs. The original evidence above
remains scoped to its recorded revision; other limits remain unchanged.

## Runtime relevance follow-up

The subsequent [on-demand runtime relevance slice](BROWSER_RUNTIME_RELEVANCE.md)
adds fixed recorded dependency and explicitly bound runtime comparisons. The
source-only scope above describes the original revision. Unmeasurable fields
remain unknown; no continuous monitoring or historical receipt rewrite was added.
