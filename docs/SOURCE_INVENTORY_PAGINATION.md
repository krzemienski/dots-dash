# Read-only inventory pagination

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Baseline: `3f62db63392a0b3252dc6c2ab8b3a207b7115f26`.
Applies the project session-intent-review skill. This extends the earlier
[inventory implementation](SOURCE_INVENTORY.md); its original evidence is
historical and does not verify pagination.

## Observable acceptance, defined before code changes

All scenarios are **unperformed**. Do not execute them while database/API/browser
acceptance remains held.

For a future authorized disposable owner store containing exactly 51 labeled
TEST DATA inventories, each with a distinguishable project/selection reference:

1. Load the inventory with writes disabled. See entries 1–50 of a bounded
   51-inventory browsing selection, newest first, with Older available and Newer
   unavailable. Counts must describe saved inventories, not reviewed transcripts.
2. Choose Older. See entry 51 of 51, select the oldest inventory and inspect its
   original project, requested interval and retained source/access records.
   Older is now unavailable and Newer is available.
3. Refresh that page and select the same inventory. Page and selected content
   remain consistent; then use Newer to recover entries 1–50.
4. The union of both index pages contains exactly 51 distinct inventory IDs,
   with no omitted or repeated ID. Page navigation, refresh and selection leave
   inventory versions, records, observations, snapshots, operations and audit
   rows byte-identical.
5. Use the controls by keyboard and at a narrow viewport. Page/selection labels
   remain readable; the selected record is clearly distinguished from index scope.

Additional prospective cases: empty and 50-entry stores; malformed/duplicate
page queries; wrong-owner reads; unavailable storage/page; and a new inventory
added by a separately authorized writer while browsing. New entries must not
shift the existing selection's pages. Latest inventories explicitly starts a
new browsing selection. A selected inventory outside the index page remains
labeled outside that page, never counted as another page entry.

## Bounded design

Use a fixed 50-entry page within the existing 100-inventory retention limit.
Pin the browsing selection to the newest inventory ID seen on first load;
resolve it to its insertion row inside the authenticated owner store. Subsequent
pages include only rows up to that anchor. This fixes membership against later
appends; it does not freeze record versions or prove original-source coverage.

GET accepts optional `inventoryId`, `anchor` and `offset` (0 or 50). Offset 50
requires an anchor. Duplicate/unknown query keys and invalid boundaries reject.
POST accepts no paging parameters. Read queries remain in the existing read-only
transaction; no schema, records, access grants or default capability change.

Return page range, browsing-selection total, current store total and next/previous
availability. Keep existing response fields for older clients; pagination is an
additive read projection. Snapshot→review links and processing semantics remain
out of scope.

## Implementation evidence and limits

[The Python read projection](../python/dots_engineering/source_inventory.py)
resolves the anchor, count and bounded page inside the existing read transaction.
[The API](../server/api.ts) validates paging parameters before forwarding them.
[The UI](../ui/source-inventory.tsx) offers Older, Newer and Latest controls
independently of the write capability. Refresh and selection preserve the current
anchor/offset; successful writes to the selected inventory preserve that page.
A newly created inventory starts a fresh browsing selection. Page controls are
disabled during an uncertain save; the existing frozen write envelope is retained.

Page metadata is optional in the browser type for compatibility with older
responses. Without it the UI reports pagination unavailable, not complete.
Read failures clear displayed state and show unavailable; they do not become
empty-page success. Loading again then starts a fresh browsing selection.
Reloading the entire application does not persist the browsing
anchor or selected page. This is read navigation, not a processing checkpoint.

Typecheck, client build, Python AST/compile, source-diff checks and documentation
checks passed. AST comparison confirms migration DDL, normalization, owner checks
and mutation/replay functions are unchanged. No SQLite connection, migration,
API request, server, browser or application test suite ran. These checks do not
prove the 51-inventory workflow or persisted-data equality.

The existing implementation ledger (historical local artifact omitted from the public package)
retains the initial evidence and adds a separately scoped pagination update.
The write capability remains default-off; no configuration was changed.

Next: once specifically permitted, execute the five-step 51-inventory workflow
and the concurrent-append/error cases on isolated labeled data, compare stored
records, and inspect keyboard/narrow-screen behavior. V301, other functional
acceptance and publication holds remain unchanged.
