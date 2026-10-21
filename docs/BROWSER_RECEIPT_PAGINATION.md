# Owned browser run history pagination

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Implemented locally on `feature/local-browser-receipt-pagination`. Actual browser
acceptance verified source revision `2f1cf9440e29851739777d114d14fde78b4ed2df`.
This follows [the read-only dashboard integration](BROWSER_RECEIPT_DASHBOARD.md).

## Behavior and boundaries

Session review now offers Older runs, Newer runs and Latest runs above and below
the owned run list. Each page contains at most 50 runs, newest first. The first
read anchors the run membership; cursors select older records by insertion order.
Newer revisits the previous page, and Latest starts a fresh browsing snapshot.
The UI reports both the snapshot range/count and the current ledger count.
Receipt states and permitted file comparisons are reread on every page; only
membership is anchored. Pending runs can acquire a receipt during browsing.

This follows the existing local selection and in-page focus conventions. Paging
preserves the selected review and focuses the run list. Evidence links cover the
loaded page explicitly, so missing links cannot imply absence across the ledger.
Failed navigation retains the previous page with a warning and retry controls.
An empty ledger and the end of history disable the appropriate controls.
Responses without the optional pagination projection remain displayable.

The owner-authenticated GET endpoint accepts one bounded, canonical cursor.
Malformed, oversized, unknown-anchor and invalid-boundary cursors return 400;
authentication still runs first. A cursor is a position, not a credential.
The reader uses a short read-only SQLite snapshot and releases it before file
hashing. The coordinator remains the sole receipt writer. No schema migration,
write endpoint, producer change, Python change or compatibility-policy change
was introduced. Outcome, attribution, input/receipt hashes and review role/version
coverage retain their existing meaning.

## Actual end-user acceptance

[Acceptance scenarios](verification/browser-receipt-pagination-scenarios.md) were
written before implementation. The workflow record (historical local artifact omitted from the public package)
and hash index (historical local artifact omitted from the public package) retain the
performed outcomes and exact source/artifact identities. All session content is
sanitized TEST DATA. The viewer observations are separate from producer receipts.

The existing coordinator produced 53 actual owned disposable browser runs:
one completed the fixed synthetic workflow, and 52 were explicitly interrupted
at its real browser checkpoint. Run 52 was initially held with no receipt; its
missing-receipt view was captured before interruption/finalization. No invented
receipt or placeholder was counted as execution. The generated-run list retains
that initial pending observation; `pendingFinalized` records its later unknown
outcome. A separate empty owned ledger exercised the empty state.

| Performed case | Observed result |
| --- | --- |
| Cross the 50-row boundary | Initial pages contained runs 1–50 and 51–52 of 52, with exact expected ordering and no overlap |
| Repeated Older/Newer navigation | Page IDs, receipt hashes and selected review stayed stable |
| Older completed receipt | Page-scoped evidence link opened the correct receipt; return focused adapter evidence |
| Missing and interrupted receipts | Missing remained explicitly unfinalized; interrupted remained unknown/gap |
| Add run 53 while browsing | Existing pages retained the 52-run membership and showed current total 53; Latest included the new run |
| Finalize pending run during browsing | Its unknown receipt was reread without changing identity or page membership |
| Reader failure during navigation | HTTP 503 retained the previous page with a warning; restoring the reader allowed retry |
| Invalid cursors | Malformed, oversized, nonexistent anchor and boundary newer than anchor each returned 400; duplicate cursor parameters also returned 400 |
| Authentication ordering | Direct API-handler unauthenticated malformed-cursor request returned 401 |
| Owner observation and reload | Saved report remained `owner_reported`/gap; review version 2 stayed distinct from receipt coverage at version 1; reload returned Latest and preserved stored review |
| Read-only readback | API/reader identity and receipt hashes matched; producer database bytes, completed receipt and all finalized receipt hashes stayed unchanged |
| Empty/end controls and mobile | Appropriate controls disabled; 390-pixel document at a 390-pixel viewport; no application JavaScript errors |

The unknown-anchor case used a nonexistent ID, establishing rejection of a cursor
that does not belong to this ledger; it did not attach another owner's ledger.
The dashboard integration's separate owner-binding evidence remains historical.

See first page (historical local artifact omitted from the public package),
missing receipt (historical local artifact omitted from the public package),
older evidence (historical local artifact omitted from the public package),
mobile last page (historical local artifact omitted from the public package)
and rendered readback (historical local artifact omitted from the public package).
Typecheck, production build, reader syntax and diff checks passed separately.
No test files or test runner were added. All owned coordinators and viewer
resources closed; disposable storage was removed. Production storage, application
tabs, credentials, global settings and external systems were not changed.

## Remaining limits

Pagination state is local to the mounted view, not bookmarked in the URL or tied
to browser Back/Forward. Reload starts at Latest. Page size is fixed at 50;
search/filtering and large-ledger performance benchmarking are outside this slice.
The 53-run acceptance demonstrates two-page behavior, not a production load bound.
The snapshot freezes membership, not every state/measurement in time. This adds
no live monitoring, lost-coordinator recovery, arbitrary execution, production
identity setup or broader V310 acceptance. The existing trust boundary, production
Node writer, prior branches, imports and immutable receipts are preserved.
