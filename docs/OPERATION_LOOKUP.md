# Read-only saved-operation inspection

Session review now includes **Inspect a saved operation**. An authenticated owner
can enter a known operation ID after reload and inspect a minimal historical
receipt from the shared engineering store. This is manual receipt discovery, not
durable recovery: the ID must already be known, inputs disappear on unmount, and
no save is retried or pending form automatically resolved.

The independently controlled `DASHBOARD_ALLOW_OPERATION_LOOKUP` capability defaults
false. The host must already have its authentication adapter and owner-bound
engineering database. The lookup applies no migration, creates no database/schema,
changes no retention policy and enables no write capability. It remains usable
when import, local-checklist and context-link writes are disabled, provided owner
authentication and this separate read capability remain valid.

## User flow and meaning

1. Retain the operation ID shown in an uncertain Session review save or pending
   context-link save before leaving. No payload is copied to browser storage.
2. Reopen Session review, enter that ID in **Inspect a saved operation**, and
   optionally enter an independently known stored payload digest. Submit the
   read-only lookup. It sends no identifier in a URL/query string.
3. **Saved receipt found** establishes a stored result under that ID in the
   authenticated owner's shared engineering store. A matching expected digest
   compares payload hashes only. No digest means payload identity was not compared;
   a mismatch cannot confirm the expected payload.
4. Legacy shared receipts lack action/namespace metadata. That binding remains
   unknown. A stored `executed` flag is reported as such: true describes the local
   checklist flag, not a provider agent or verified product result; false is not
   proof that no other action occurred. Nothing certifies authorship or completion.
5. **Open current referenced review** uses the existing authenticated exact-ID
   reader. Its current version can differ from the historical receipt. Negative
   observations remain negative and owner-reported. A missing/unavailable current
   review does not erase the stored receipt.
6. **Operation outcome unknown** means no matching receipt was found in this
   inspected store/scope. It is not a rejection/non-execution certificate and offers
   no retry. Retained-review reports and action claims use separate operation stores
   and their existing lookup controls; this endpoint does not search those stores.

The existing in-memory reconciliation form retains its own exact envelope and
authorization checks. Inspecting a found receipt does not clear that form. Recovery
after loss of an unknown ID, pre-submission registration, cross-device discovery,
backup-restore certainty and durable replay remain unimplemented; see the
[separate proposal](DURABLE_OPERATION_RECONCILIATION.md).

## Transport and read boundary

`POST /api/operation-lookup` is deliberately read-only. JSON accepts only
`operationId` (1–100 ASCII letters/digits/underscore/hyphen) and optional
`expectedDigest` (64 lowercase hex characters). Body limit is 2,000 bytes. Unknown
fields, query parameters, invalid IDs/digests, other methods and cross-origin
requests reject. Owner authentication precedes lookup; disabled capability denies.

The fixed Python worker opens the configured existing file with SQLite `mode=ro`
and `query_only`, checks required tables and exact owner binding, and performs one
parameterized ID lookup. Missing file/schema is unavailable, never initialized.
Wrong binding denies. Response materialization is capped at 2,000,000 bytes;
oversized, malformed or unsupported stored responses are unavailable, not unknown.
No raw stored response is returned.

The response contains a fixed format/version, operation ID, shared-store scope,
read-only marker, unknown legacy action/binding, and either `unknown` or
`receipt_found`. Found receipts expose only the stored digest/comparison, stored
execution boolean, result kind and validated review ID/version; context results
also include task and canonical Request IDs. Titles, summaries, exports,
observations, prompts, evidence bodies and URLs are excluded. IDs/digests remain
owner-private metadata, not anonymization or bearer credentials. Responses retain
private/no-store headers. No public/runtime paths or secrets are bundled.

## Scoped verification

Eleven fresh isolated observations used actual rendered React, an owned loopback
API, the fixed Python worker and disposable SQLite with synthetic TEST DATA:

- Committed import response loss, lookup while the original pending form remained,
  reload, manual-ID lookup, focus and empty browser storage.
- Matching/mismatching digest and unknown operation without retry controls.
- Real bounded local-checklist and failing owner-observation receipts; minimal
  response fields exclude their underlying content.
- Context-link receipt and current-review navigation preserve negative observation;
  canonical SQLite bytes unchanged by lookup and navigation.
- Read permission after write disablement, lookup disablement, wrong principal and
  wrong physical owner binding.
- Missing file/schema and malformed receipt fail without initialization/disclosure;
  invalid body/query/method/origin reject.
- Interrupted lookup/remount, keyboard submission, result focus and 320/375px
  horizontal-overflow checks. Canonical database bytes remained unchanged.

No external browser requests or page errors occurred. Owned browser/server/database
handles closed. Final existing tests (14), typecheck, build, Python syntax and source
binding/document/diff checks passed. An initial driver syntax error executed no
workflow; an intermediate run stopped after four checks on a fixture field lookup
(`review.goals` rather than `review.export.goals`). The final fresh run passed all
11 observations. These are not application defects or extra acceptance passes.

See the appended [implementation evidence](verification/session-save-recovery.json)
for exact source hashes. This does not pass the proposal's D1–D12 durable protocol
suite, real-owner V301, production identity, full accessibility or backup/restore.
The oversized receipt boundary is enforced in source but was not exercised by this
UI run. Synthetic schema/owner failures used owned disposable fixture copies only.
