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
The original 11-observation run did not exercise oversized receipts. The follow-up
below closes that specific gap. Synthetic schema/owner failures used owned
disposable fixture copies only.

### Follow-up: response size and malformed receipts

Eight additional isolated observations used unchanged runtime source
`e49d4cb0477c99d57fb8713cb89a4bf828c421fa`, the actual owner lookup form/API and
six directly seeded synthetic receipt rows. These rows are TEST DATA, not evidence
that naturally generated review histories reach this size. No limit was changed.

| Stored response | Observed API/UI result |
|---|---|
| Exactly 2,000,000 UTF-8 bytes, supported result shape | HTTP 200; minimal historical summary only |
| 2,000,001 ASCII bytes | HTTP 503; cannot safely summarize; no prior result or write-retry control |
| 2,000,001 UTF-8 bytes, 1,999,001 characters | HTTP 503; confirms byte limit rather than character limit |
| Malformed JSON (63 bytes) | HTTP 503; bounded unavailable message, no raw content |
| Unsupported result shape (boolean review version) | HTTP 503; unavailable rather than found/unknown |
| Invalid stored digest | HTTP 503; no digest or raw response disclosure |

Subsequent unknown-ID lookup remained explicitly unknown; returning to the exact-limit
receipt succeeded without changing it. Every network response was under 1,200 bytes,
and the synthetic raw-content canary/extra field appeared in neither network response
nor rendered page. Error responses contained only an error field. Both Node and
engineering SQLite files remained byte-for-byte identical before/after every case;
all six fixture rows remained and no mutation audit entry was added.

The final unavailable-state screenshot was inspected. No external browser requests
or page errors occurred; owned browser/server/SQLite resources closed. One initial
orchestration syntax error executed no command; the corrected fresh workflow passed
all eight observations. Source/build hash comparison, ledger JSON, documentation
links and diff checks passed. No application code, schema, migration, persistence
policy, runtime limit or capability changed. This adds boundary evidence only, not
durable-recovery, production-authentication or general security certification.

### Follow-up: known receipt after same-store server restart

On runtime `6efe4568e238441b05ed746b51c8fcb433b51f9a`, four new isolated
observations exercised the existing lookup through rendered UI, actual Node/Python
APIs and fresh disposable SQLite. This is verification-only, not a new durable
recovery implementation. The [daily check-in](DAILY_EVIDENCE.md) is a read-only
projection and has no daily record create/update workflow.

1. Import a labeled synthetic session through the UI: one review at version 1,
   one operation and one audit entry.
2. Save a deliberately failing TEST DATA observation. The fixture transport drops
   the response only after the real API commits. The UI displays unconfirmed save
   and blocks conflicting saves. The store has one review at version 2, two
   operations, two audits, one observation and zero checklist runs.
3. Close only the owned server/browser, start a new process on the same port with
   the same databases, and open a fresh browser. Manually enter the known operation
   ID. The receipt references the same review/version with stored executed=false;
   opening it preserves the exact review JSON and visible owner-reported failure.
4. An unknown ID remains unknown with no retry control. Further reload and reads
   preserve all record IDs/history/counts and both database files byte-for-byte.
   Local/session storage, IndexedDB and cookies remain empty.

The final history screenshot was inspected; no page errors or external requests
were observed. Two prior driver interruptions (an exact-label mismatch and an
acknowledgement timing race) are retained in the ledger; neither proves an
application defect. The latter's uncertain write was inspected, not retried. All
owned resources closed; no unowned worker was stopped.

The [appended evidence](verification/session-save-recovery.json) binds source and
build hashes and distinguishes this **known-ID, graceful same-store restart** from
the [proposed durable protocol](DURABLE_OPERATION_RECONCILIATION.md). Loss of the ID,
automatic discovery, precommit crashes, replay after reload, owner/store changes,
backup restore and D1–D12 remain outside this result. Retention, unresolved-stream
sealing and restore-generation decisions are still prerequisites to registration.
Human-owner acceptance and full V312 remain open. No runtime, migration, capability
or browser-persistence change was made.
