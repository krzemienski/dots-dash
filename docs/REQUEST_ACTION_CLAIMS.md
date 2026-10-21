# Owner-reported Request action claims

The Requests view can now retain one owner-reported action claim with zero or one
explicitly selected normalized review event. Source links remain request context;
neither a claim nor its evidence binding certifies an action or completes a Request.
This implements the bounded [v1 contract](REQUEST_ACTION_EVIDENCE_CONTRACT.md),
not the broader trusted producer/result model. Actual-user V301 remains open.

## Setup and storage boundary

The host must already configure the owner-bound Python engineering extension.
`DASHBOARD_ALLOW_REQUEST_ACTION_CLAIMS` defaults false independently of import,
checklist and other companion capabilities. Reads still work when writes are
disabled. Enabling the flag does not migrate a database.

On an independently authorized, existing engineering database only:

```sh
python3 -B python/migrate_request_claims.py --database /chosen/engineering.sqlite --owner chosen-owner
```

The explicit migration adds five `rc_` companion tables and update/delete guards.
It checks the physical owner binding and rejects incomplete/unsupported schemas.
It does not rewrite Requests, reviews, existing hashes or prior receipts. No HTTP
request runs it. Roll back availability by disabling writes and retaining history;
no destructive downgrade is provided. Back up authorized storage before any real
migration. Only disposable synthetic databases were migrated during verification.

## Owner workflow

1. Open an exact Request, or use its **Review action claims** control. The panel
   shows current reports, withdrawn records, history scope and recent operations.
2. Enter a bounded action summary, expected result and explicitly asserted project.
   Performance, result and time remain owner reports; actor stays unknown.
3. Optionally enter the exact existing review/event IDs and inspect the returned
   event. V1 accepts retained action/claim/evidence events only. It has no search,
   source discovery or automatic extraction. The project must match the review.
4. Save with independent request version/raw-data hash and review/event pins.
   The original event outcome, scope, basis and attribution stay visible—even
   when a reported pass is linked to a failed event. Imported receipt-like events
   remain owner-provided evidence.
5. Correct explicitly with a reason and reselect evidence, or withdraw the report.
   Corrections append complete snapshots; withdrawal is terminal. Original evidence
   remains inspectable. Request identity/project cannot change in-place.
6. Open claim history and the exact bound event revision, then return to the Request.
   A current-event read is separate from the immutable stored snapshot. Missing and
   unavailable targets remain distinct; version-only changes are stale too.

Unknown POST outcomes retain the exact immutable envelope while mounted. New writes
are blocked until exact replay or read-only operation lookup reconciles it. A
confirmed save followed by failed GET uses read-only refresh. Leaving/reloading
loses that in-memory envelope; the panel discloses this and shows the latest 50
request operations for inspection. An unknown operation lookup is not proof of no
commit. No private browser storage is used.

## API and integrity

`/api/request-action-claims` authenticates the owner and requires same-origin POST.
The Node host supplies exact canonical Request metadata; caller-provided provenance
cannot replace it. Python owns companion writes and checks the physically isolated
owner, strict schema, capability, project and independent pins. Cross-database
freshness is observed, not atomic: later changes make historical pins stale rather
than rewriting them. No link grants source access, execution or sending permission.

GET accepts `sourceRequestId` and optional `claimId`, exact history `revision`,
opaque `cursor`, `operationId`, or a selected `reviewId`/`eventId` pair. Pages have
at most 50 entries and a signed owner/request/scope-bound sequence ceiling. Current
heads derive from the complete bounded stream, not the visible page. Limits are
1,000 claims per request and 1,000 revisions per claim; further mutation conflicts.
Recent-operation scope is explicitly latest 50; older known IDs remain queryable.

POST supports create/correct/withdraw, exact payload replay, CAS revision checks
and atomic revision/operation/audit commit. Auth/capability checks precede replay;
replay precedes current-target checks. Identical replay after a source change
returns the historical response, not refreshed proof. Invalid/missing/conflicting
and unavailable states remain distinct. No new URL field is accepted; rendered
text is escaped and existing request links are not fetched automatically.

## Verification and remaining gaps

The [ledger](verification/request-action-claims.json) maps actual isolated results
to A1–A12 and exact source/build hashes. Verification used the rendered React UI,
real Node/Python worker transport and disposable SQLite with synthetic TEST DATA.
Read-only navigation preserved original Node records and Python reviews/audit;
only companion mutations were created. No provider or shared browser was used.

Retention-bound tests seeded clearly synthetic rows in owned storage before checking
API rejection; they do not claim a 1,000-entry end-user journey. Pagination was
exercised through actual API writes and rendered 50-entry pages. Narrow layouts
and keyboard basics are not screen-reader certification. Prior interrupted drivers
and their corrections are recorded separately from final results.

Remaining gaps: trusted producer-to-action verification, external action receipts,
whole-request acceptance, actual-user V301, live identity/providers, durable client
recovery, event selection search and full accessibility. The feature does not
advance source-processing checkpoints, infer original-source coverage or change
the saved-not-delivered instruction boundary.
