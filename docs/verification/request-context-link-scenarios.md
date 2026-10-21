# Local request → repository task → session review acceptance

> Historical design and implementation context. See [current scoped verification](source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Baseline `96f1296172b79cb4761151621a49f0d275856177`. Defined before code.

## User-visible contract

The canonical request is an existing owner-visible `commitment` in the Node
work ledger. Show a minimal read-only projection (ID, title, version and content
hash); do not duplicate correspondence or follow source URLs. A new local
repository-task association lives in the separate owner-bound Python engineering
ledger. It records task title, an opaque repository artifact reference, project,
request ID/version/hash, review ID/version/revision and recorded time. Repository
identity/revision is declared metadata, not discovery or proof of live HEAD.

A host-only opt-in enables association writes; it defaults off independently of
session import and checklist execution. Links do not grant source access,
repository access, execution or send authority. Unknown request/review targets
cannot be saved. Stale versions/hashes and mismatched projects/revisions reject.
Each creation is idempotent and audit-backed. The association is immutable;
later changes produce visible stale/missing read projections without rewriting
its recorded pins. References, not copied request/review content, are stored.

The Session review workspace displays the request projection and local task
associations. Request → task → review and review → task → request controls focus
the intended destination. Reverse links are derived from persisted associations,
not a transient navigation stack. Reload may return to the workspace default;
reopening Session review restores the links. Missing targets stay visible as
missing; stale targets are labeled before navigation to the current record.

The new endpoint receives canonical request metadata only from its authenticated
Node host. Body-supplied permission flags, source content or host bindings reject.
No source reference is fetched. Existing work/history/import semantics and Node
sole-writer ownership of that ledger are unchanged; Python owns only its separate
engineering association tables.

## Actual synthetic browser acceptance

1. Populate a new disposable work ledger through the existing import API with a
   labeled synthetic request (no correspondence). Import a synthetic session
   review through the rendered UI. Save a repository-task association.
2. Follow request → task → review and both return links repeatedly. Verify focus,
   IDs, selected review and a 390-pixel viewport. Navigate from an existing Day
   request to its link section, if that shortcut is available.
3. Reload and reopen the review workspace. Verify persisted association, reverse
   links, request/review pins and unchanged imported review/history content.
4. Update the synthetic request through the existing history API and append an
   owner observation to the review. Refresh: show both changed pins as stale,
   retain original association/audit and navigate explicitly to current records.
5. Remove only the owned disposable source records. Refresh: show missing request
   and review, retain association, disable unavailable destinations; no fallback
   to another source or silent retargeting.
6. Through the actual API, confirm unknown targets, stale creation pins,
   capability injection, disabled link capability, unauthenticated/cross-owner
   requests and wrong-origin writes reject. Identical creation replays once;
   conflicting request ID rejects. Linking does not enable checklist execution,
   invoke a provider, save/send an instruction or mutate canonical requests.
7. Read back persisted SQLite/API association and audit, inspect browser errors,
   and confirm owned browser/server/storage cleanup. No test files.

Even a passing synthetic workflow would establish only local synthetic acceptance.
Actual correspondence/repository
request linkage, remote access, production identity, provider agents, automatic
execution, publication and full V301 remain unproven and outside this slice.

## Static-review follow-up acceptance — not yet performed

- Drop the response after a committed save, retry through the visible pending-save
  control, and establish the same operation ID/body, one association and one audit
  snapshot. Also drop before commit and verify safe identical-envelope replay.
- Attempt rapid repeated submits and editing while pending; no second operation
  should start. An unrelated list refresh must not reset the pending attempt.
- Revoke creation after an uncertain save: denial retains the unresolved attempt.
  Restore capability and reconcile; changed source/review pins must not silently
  replace the frozen payload. Unknown outcomes remain unresolved.
- Confirm a definite first-attempt validation rejection permits draft correction.
  Confirm success followed by failed list refresh does not initiate another save.
- Submit control-only, whitespace-only and padded-over-300-character titles;
  new rows/audits must not be saved. Verify sanitized valid titles, unchanged
  historical records and exact historical replay hashes.
- Inspect the mounted-view retention boundary and before-unload warning without
  claiming durable recovery across reload or component unmount.

These are prospective outcomes only. No synthetic functional acceptance has run.
