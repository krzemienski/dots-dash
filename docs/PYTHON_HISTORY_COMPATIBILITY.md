# Bounded history compatibility follow-up

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Historical assessment: the later [shared instant-ordering change](HISTORY_INSTANT_ORDERING.md)
resolves the demonstrated snapshot defect for supported forms. The evidence and
remaining gaps below retain their original revision scope.

Baseline: `cf2dff3481b629945a020ed4ee9e2ba6d1109470`. The
[source-backed gap inventory and acceptance scenarios](verification/python-history-compatibility-scenarios.md)
were written before implementation. This slice changes only the Python
disposable rehearsal validator. Node remains the application writer; application
imports remain disabled by default. No cutover or fencing mechanism is enabled.

## Resolved gaps

Record verification, correspondence event, commitment request and timed schedule
fields now accept strict ISO timestamps with seconds and an explicit `Z` or
`±HH:MM` timezone. Milliseconds may be absent or contain one, two or three digits.
Original strings are persisted unchanged, preserving the supplied source's
timezone representation. Invalid calendar days, timezone-less timestamps and
out-of-range timezone hours/minutes still reject the batch.

This separates event timestamps from **snapshot ordering timestamps**. Batch
`verifiedAt` and affected stored `snapshotReviewedAt` still require canonical
UTC milliseconds. Broader event forms never enter the lexical upsert comparison.

Finite integral JSON floats inside JavaScript's safe-integer range now serialize
as integers for batch hashing. Thus `1.0` and `1`, and `-0.0` and `0`, replay the
same batch as they do with Node's JSON.stringify. Changed numeric content still
conflicts. Nonintegral floats, unsafe integers and nonfinite values remain
unsupported. No stored historical hash or source payload is rewritten.

## Observed results and limits

Before/after observations (historical local artifact omitted from the public package)
record 21 actual import cases through Python and Node on separate disposable
SQLite copies, plus a numeric-spelling CLI workflow and four edge checks.
The five newly supported timestamp forms changed from Python 400/Node 200 to
matching 200, batch hashes and selected persisted records. Each newer canonical
snapshot increased record versions once; the saved event strings remained exact.
Source links, pre-redacted summaries and `delivery: not_established` survived.

The numeric CLI sequence changed from `[200,400,400]` to `[200,200,400]` for an
original batch, equivalent integral-float replay and conflicting changed value.
Negative-zero replay also matched. The maximum safe integral float matched
Node's actual SHA-256 hash; the next integer and malformed timezone offsets
were denied. Rejected Python requests left persisted data unchanged.

This sequence intentionally also submits unsupported cases. After Node accepts
an invalid calendar date that Python rejects, subsequent full selected-record
comparisons differ because their histories have diverged; those false comparison
results remain in the evidence. Matching later batch hashes or replay responses
do not establish full-store parity. The separately observed numerical replay
and timestamp successes must not be read as universal compatibility.

Source SHA-256 remained unchanged and scratch directories were empty after
completion. The Node default import route returned 403 and the Python worker
rejected history-rehearsal mode with 400. These are API/CLI/storage observations;
no browser, live identity-provider, production data or migration verification
was performed. No test files, credentials, outside agents or external calls
were used.

## Concrete cutover boundary

The highest-impact remaining gap is chronological ordering. Node's
[`importHistory`](../lib/work/history.ts) compares `snapshotReviewedAt` strings,
while its [date validator](../lib/work/history-validation.mjs) accepts timezone
offsets. Actual synthetic persisted results were:

| Incoming snapshot | UTC instant | Node result |
|---|---|---|
| `2026-01-02T10:00:00.000Z` | 10:00 | Original row at version 1 |
| `2026-01-02T06:00:00.000-05:00` | 11:00, newer | Row unchanged at version 1 |
| `2026-01-02T12:00:00.000+03:00` | 09:00, older | Replaced row at version 2 |

Python's existing canonical-batch guard rejected both offset batches. Matching
Node's lexical behavior for mixed formats would preserve a visible evidence
regression; silently normalizing historical inputs would alter batch identities
and replay assumptions. Consequently this slice does **not** proceed to writer
fencing, cutover or recovery rehearsal.

The next bounded prerequisite is an explicit shared snapshot-ordering policy
and disposable reconciliation rehearsal. Define comparison by instant, equal
instant behavior, malformed existing timestamps, unchanged historical hashes,
replay outcomes and an auditable normalization/migration boundary. Do not rewrite
production records to obtain parity. Query-bearing links, optional invalid join
links, broader date/number forms and inherited correspondence audit semantics
also remain unresolved as listed in the gap inventory. Fencing, post-cutover
write recovery, actual identity-provider/browser evidence and load behavior
remain later gates. Full migration is incomplete.
