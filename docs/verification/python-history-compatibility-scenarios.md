# Compatibility acceptance before implementation

> Historical design and implementation context. See [current scoped verification](source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Baseline: `cf2dff3481b629945a020ed4ee9e2ba6d1109470`. Continue the project-owned
session-intent-review skill using only synthetic exports and disposable storage.
The branch starts clean; this worker is the sole implementation writer.

## Source-backed gaps, ordered by user consequence

| Priority | Gap and visible consequence | Source evidence at baseline | Scope decision |
|---|---|---|---|
| High | Mixed snapshot timestamp formats can suppress newer evidence or accept older evidence in Node; Python rejects noncanonical batch/stored timestamps | `lib/work/history.ts:4` compares strings; `history-validation.mjs:3` accepts Date.parse forms; Python `history_rehearsal.py:55` requires canonical stored timestamps | Remains a cutover blocker; reproduce on synthetic storage, do not silently normalize historical hashes or change application writes |
| High | Query-bearing HTTPS evidence links block an entire Python batch accepted by Node | Node `history-validation.mjs:5` versus Python `history_validation.py:url` | Retain explicit source-link subset; redaction/URL policy needs a separate compatibility decision |
| Medium | Valid record/event timestamps with offsets or without milliseconds block schedule, correspondence and evidence imports | Node `date`/`verified` versus Python `stamp` reused for all timestamp fields | Resolve a strict timezone-bearing ISO subset for event fields while keeping snapshot ordering canonical |
| Medium | JSON numbers written as 1.0 or -0.0 block a batch; Node hashes these as 1 and 0 | Node `history.ts:2` JSON.stringify versus Python `canonical_json` rejecting all floats | Normalize finite integral floats within safe-integer bounds for hashing; keep arbitrary fractions/unsafe values rejected |
| Medium | Bad optional join links reject Python batches where Node stores null | Node `history-validation.mjs:17` versus Python schedule joinUrl guard | Retain explicit denial; do not silently discard evidence in this slice |
| Medium | Correspondence display changes while first audit event stays unchanged; cancelled direction may read Sent/Received | `history.ts:4` INSERT OR IGNORE and direction-based summary; Python mirrors it | Inherited product semantics, not a Python parity fix; remains a policy prerequisite |
| Lower | Broader Date.parse coercion, invalid calendar dates, unusual URL hosts, fractional JSON, duplicate keys and lone surrogates differ | Node validator/JSON parser versus Python strict helpers/CLI | Keep unsupported and document; do not claim universal parity |

## Observable acceptance

1. Record baseline Node/Python outcomes before editing implementation.
2. Import synthetic record verification, correspondence event, commitment request
   and timed schedule timestamps with explicit offsets, omitted milliseconds,
   and one/two/three fractional digits. Preserve original strings and source
   links exactly. Persisted Node/Python projections and batch hashes match.
3. Retry a batch with 1.0 versus 1, and -0.0 versus 0 in ignored metadata. Return
   the same marker/replayed outcome; no version or audit duplication. Changed
   numeric content remains a conflicting replay.
4. Timezone-less/invalid calendar event times, noncanonical batch times, unsafe
   or fractional numeric metadata and credential/query URLs still reject without
   writes. Canonical older/equal snapshots still cannot increment versions.
5. Reproduce mixed-format snapshot ordering on disposable Node storage to assess
   cutover readiness. Treat it as a blocker if chronological order differs.
6. Source hashes remain unchanged; scratch files are removed. Default Node imports
   remain disabled and the Python application worker rejects rehearsal mode.

Perform actual local CLI/API operations and persisted reads. No test files,
browser claims, credentials, private data, external calls or production writes.
Only proceed to cutover rehearsal if the remaining compatibility risks permit it.
