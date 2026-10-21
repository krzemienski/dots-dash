# Owned run history pagination acceptance

> Historical design and implementation context. See [current scoped verification](source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Defined before implementation. Baseline:
`26e5467479e71cb7e31f486b3dfbc3697f559d87`.

Existing Session review uses local selection state, explicit refresh and focused
in-page links; no reusable deployed pagination component exists. Keep its
50-row response bound and add Older/Newer/Latest controls. Use an immutable run
membership anchor and keyset cursors, not offsets that drift after insertion.
This fixes browsing membership, not receipt state or file measurement time.

1. Produce more than 50 actual owned disposable runs, clearly labeled TEST DATA.
   Include a completed run, actual interrupted/unknown receipts and a run held
   at its checkpoint with no receipt. Do not fabricate authenticated receipts
   or count placeholders as execution. Use the existing fixed producer only.
2. In the actual isolated dashboard, read page one and navigate beyond row 50.
   Verify exact coverage counts, non-overlapping ordered IDs, end-of-history
   controls and receipt attribution across the boundary. The older completed
   receipt must be accessible from that page's evidence links and back again.
3. Navigate Newer/Older repeatedly. Preserve selected review, original receipt
   hashes, owner/import attribution and page membership. A page with no matching
   evidence must explicitly limit that statement to the loaded page.
4. Add a real run after the first page is read. Older/Newer must keep the initial
   membership boundary; Latest must include the new run. A pending run finalized
   during browsing may change its recorded state, but not its identity or order.
5. Reject malformed, oversized, wrong-ledger or invalid-boundary cursors without
   broadening owner access or silently resetting to a misleading page. Navigation
   failures must retain/identify the previous page and offer explicit recovery.
6. Refresh/reload and inspect persisted records. Page navigation performs reads
   only; immutable receipts and original producer/application records stay intact.
   Verify empty/end states, focus, disabled controls and a narrow viewport.

Use project session-intent-review and the established owned Playwright workflow.
No test files, provider execution, application tabs, credentials, external writes,
production changes, monitoring, recovery or compatibility-policy changes.
Browser reload may return to the latest page, consistent with existing local
review selection; Older/Newer are the pagination back/forward controls.
