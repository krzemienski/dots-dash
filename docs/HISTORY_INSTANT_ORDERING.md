# Shared snapshot ordering and bounded reconciliation

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Baseline: `f375f1ff1484c4ff17c5e88b07fee318f140af20`. The
[policy and acceptance scenarios](verification/history-instant-ordering-scenarios.md)
were recorded before implementation using the project session-intent-review
workflow. Explicit requirements support instant comparison, evidence preservation,
rejection of ambiguity and deterministic ties/replay. No conflict was found for
this bounded snapshot policy.

## Policy and implementation

Both writers now compare exact millisecond instants. Supported strings have a
real Gregorian date in years 0001–9999, `T`, hours/minutes/seconds, zero to three
fractional digits, and `Z` or `±HH:MM`. Missing zones, invalid dates, offset hours
above 23/minutes above 59, 24:00, leap seconds, trailing text and higher precision
are rejected. No interpretation is invented.

| Incoming evidence | Persisted outcome |
|---|---|
| No existing row | Insert raw timestamp/evidence at version 1 |
| Strictly newer instant | Update source data; increment version once |
| Older or equal instant, even with changed spelling/content | Keep existing data/version/update time |
| Invalid/missing/ambiguous time on an affected stored row | Reject fresh batch atomically |
| Unrelated invalid row | Preserve it; allow other valid imports |
| Existing batch ID with identical hash | Return original read-only receipt |
| Existing batch ID with changed content | Reject with 400 |

Raw strings, source links and hashes are preserved. Replay precedes fresh-input
validation, allowing old invalid-date receipts to remain readable without fresh
invalid writes. Python's bounded numeric/Unicode hashing support still applies.
No historical value is normalized or backfilled. Marker counts still mean supplied
records, not updates; an all-stale/equal batch can have a marker. Correspondence
audit immutability, direction labels and missing-audit behavior are unchanged.

[`snapshotInstant`](../lib/work/history-time.mjs) and
[`snapshot_instant`](../python/dots_engineering/history_time.py) implement the
same parser. Each local SQLite connection registers deterministic
`history_snapshot_ms`. The upsert compares the committed row inside the write
transaction; invalid times abort all batch effects. Node also validates affected
times before planning, while Python validates under its immediate transaction.
No schema column, persistent function, trigger, backfill or production setting
is installed. Future adapters need equivalent transactional semantics; hosted
D1 mutation support is not claimed. There is no lexical fallback.

## Observations

Saved results (historical local artifact omitted from the public package) contain only
synthetic data from actual Node API and Python imports on disposable SQLite.
Before the fix, after 10:00Z Node ignored 06:00-05:00 (11:00Z) and accepted
12:00+03:00 (09:00Z); Python rejected both offsets. Afterward both retain 11:00Z
at version 2 with its original offset string. This local reproduction does not
establish that any live record was affected; no live data was inspected.

Twenty reconciliation cases matched statuses and full semantic persisted
projections, including strings, links, hashes, counts and versions. Generated
write times were excluded. Initial/newer/older/equal/millisecond-newer/equal-offset/
replay/conflicting-replay versions were `1,2,2,2,3,3,3,3`. Invalid requests left
storage unchanged. Historical invalid-date receipts replayed unchanged; fresh
invalid-date imports failed. The CLI returned seven 200s and one 400 conflict.

- A synthetic 13:00Z write committed between Node validation and mutation;
  the incoming 12:00Z snapshot could not overwrite it.
- A committed ambiguous timestamp caused 400. The import's earlier insert and
  marker rolled back; the separate concurrent edit remained for reconciliation.
- Actual scratch audit failures rolled back both writers' batch effects.
  Recovery saved one audit event. Node returned its existing generic 503.
- Concurrent Python imports both completed and retained the newer instant.
- Additional direct parser checks matched epoch, pre-epoch, leap days and year
  boundaries. Python 3.15's 24:00 normalization was caught and explicitly rejected.
- Source hashes stayed unchanged and scratch storage was removed. Default Node
  import remained 403; Python rejected rehearsal worker mode with 400.

These are API/CLI/storage observations, not browser, production identity or load
proof. No test files, credentials, private sessions, outside agents, external
calls, publication or production writes were used. Typecheck, build and diff
checks also passed and are recorded separately.

## Remaining prerequisites

The demonstrated chronology defect is fixed for supported forms in local source.
No live records were rewritten and no cutover occurred. Node remains the
application writer, imports default off, and Python writes remain disposable.
URL, join-link, event-date, numeric/Unicode and audit-semantic gaps remain in the
[compatibility inventory](verification/python-history-compatibility-scenarios.md).
Ambiguous legacy times require explicit review and evidence-backed correction.
The later [replay/handoff package](REPLAY_AND_HANDOFF_REHEARSAL.md) resolves
concurrent history replay and adds bounded disposable fencing/recovery evidence.
Migration also needs fencing, checkpoints, in-flight reconciliation, post-cutover
writes and recovery without losing newer data, rehearsed on disposable storage.
Browser, actual identity-provider, hosted-adapter and load verification remain
separate gates. Full migration is incomplete.
