# Shared ordering policy and acceptance before implementation

> Historical design and implementation context. See [current scoped verification](source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Baseline: `f375f1ff1484c4ff17c5e88b07fee318f140af20`. The clean checkout remains
owned by this implementation worker. All performed imports use synthetic data
and disposable SQLite storage; Node remains the application writer.

## Policy derived from explicit requirements

- Compare actual instants, not source strings. The supported snapshot format is
  a real Gregorian date in years 0001–9999, `T`, hours/minutes/seconds, optional
  one-to-three fractional digits, and `Z` or an explicit `±HH:MM` offset. Reject
  unsupported precision, leap seconds, 24:00, timezone-less and invalid dates.
- Preserve the original timestamp strings, record evidence and batch hashes.
  Parsing supplies a comparison value only; no database backfill or rewrite.
- A strictly newer instant updates the record and increments its version once.
  An older or equal instant keeps the existing record and version, regardless
  of alternate timezone spelling or changed content. First accepted evidence
  wins ties; a distinct accepted batch still receives its existing marker.
- Identical batch/hash replay remains read-only even if a historic timestamp
  no longer meets current validation. Changed content under that ID conflicts.
  This preserves legacy receipts without authorizing a fresh invalid import.
- A fresh batch touching an existing row with missing/invalid/ambiguous snapshot
  time rejects atomically. Do not assign a timestamp, infer order or overwrite.
  Unrelated legacy rows need not block a batch. Return generic errors without
  private values. Existing rows/evidence remain available for explicit review.
- Compare within each SQLite mutation, so a concurrent newer write cannot be
  overwritten using a pre-read decision. Invalid concurrent data aborts the
  batch, including earlier row effects, audit entries and its marker.
- Preserve existing correspondence audit and batch-count semantics; changing
  those is a separate product policy. No claim of live data loss follows from
  the synthetic defect reproduction.

## Compatibility consequences

Node newly accepts no timestamp forms; it tightens fresh snapshot validation
relative to Date.parse, while preserving identical historic replay. Python
expands fresh snapshots from UTC milliseconds to the shared bounded ISO forms.
The current Node/Python SQLite adapters must both register the same deterministic
instant-comparison function. A storage adapter without that capability must fail
closed rather than silently fall back to lexical ordering. Hosted D1 mutation
support is not claimed by this local Node/SQLite slice.

## Observable acceptance scenarios

1. Record baseline imports at 10:00Z, newer 06:00-05:00 (11:00Z), and older
   12:00+03:00 (09:00Z). After the fix both writers retain the 11:00Z evidence at
   version 2, with its original offset string and source link intact.
2. Equal instants with different offset/millisecond spellings and changed content
   do not alter records/versions; one-millisecond newer values update exactly once.
3. Identical replay returns the original marker/hash without another event;
   altered replay conflicts. Legacy invalid-date receipts replay without writes
   but the same payload under a fresh batch ID is rejected.
4. Invalid incoming dates, missing zones, precision beyond milliseconds, invalid
   offsets, and missing/invalid existing timestamps reject with no batch effects.
   An unrelated invalid row is preserved and does not block a valid import.
5. Force an audit failure and a concurrent timestamp change between planning and
   mutation. Verify atomic rollback and that comparison uses the committed row.
6. Compare Node/Python persisted records, versions, raw timestamps, hashes, counts
   and source references. Inspect actual CLI/API outcomes and SQLite readback.
7. Verify unchanged source hashes, removed scratch storage, default imports still
   denied, and Python application worker still refusing rehearsal mode.

No test files, browser verification, private session discovery, credentials,
publication, production record rewriting or cutover is authorized by this policy.
