# Browser receipt dashboard acceptance

> Historical design and implementation context. See [current scoped verification](source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Defined before implementation. Baseline:
`535042b16fe6e8e41f34a51c63c95bfea788bd0b`.

Use fresh runs of the fixed owned browser adapter, a dedicated viewer browser,
copied synthetic application storage and the coordinator's actual receipt ledger.
The ledger projection is read-only. The coordinator remains its sole writer.
No production routes are configured, no application tabs are touched, no test
files or credentials are added, and no historical import is reclassified.

1. Success: open Session review and find a completed adapter-produced run, its
   result, source revision, measured input/environment hashes and artifact hashes.
   Navigate from the selected review's evidence to the corresponding run. Show
   the review's role/version and limit the pass to the fixed synthetic workflow.
   The owner run ledger must also be visible before any review is imported.
2. Unknown/interrupted: produce a real interrupted run after its first persisted
   import. Show unknown/gap and partial-history association, never completed,
   canceled or retry-authorized. Keep owner reports and imports explicitly separate.
3. Missing receipt: hold a fresh owned run at its supported checkpoint. Show its
   pending identity and state with no finalized receipt, not a fabricated result.
   An unconfigured/unavailable reader must not imply an empty successful ledger.
4. Duplicate collection: collect a completed receipt again through the actual
   coordinator, refresh the dashboard, and retain one row with identical receipt
   identity/content. No UI action starts, retries, finalizes or edits a run.
5. Stale measured inputs: begin with matching actual files, then alter only a
   disposable measured copy. Refresh must visibly report stale measured inputs,
   retaining the original outcome and hashes. Missing measurement is unknown.
   This is an explicit read-time comparison, not live monitoring.
6. Persisted readback: add a labeled owner report about steps actually performed,
   reload and compare stored history/receipts. The owner report stays owner-reported;
   the earlier receipt remains bound to its observed review version. Original
   adapter application storage, compatibility policies and older branches remain
   unchanged. Verify read-only/owner boundaries and inspect narrow-view layout.

Use the project session-intent-review and existing user-owned Playwright workflow.
Retain only sanitized actual observations and clearly labeled synthetic content.
