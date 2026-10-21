# Disposable Python history-import rehearsal

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

This local operator utility implements bounded history-import parity using the
existing disposable SQLite snapshot lifecycle. Node remains the application
writer; its default import capability remains disabled. No Python import route,
writer setting, credentials, session discovery or external action is added.

## Use and authority

```sh
python3 -B python/rehearse_history.py \
  --source /absolute/authorized/synthetic.sqlite \
  --scratch-root /absolute/private/scratch \
  --owner synthetic-owner \
  --source-account synthetic@example.invalid < selected-sanitized-batches.json
```

Input is a JSON list of 1–20 history batches, with a total CLI input limit of
900,000 bytes. Each batch has `batchId`, canonical `verifiedAt`, and at least one
of `opportunities`, `correspondence`, `coverage`, `projects`, `artifacts`,
`schedule`, `commitments`, `observations` or `engineering`. Each group permits
at most 200 rows; each batch permits at most 350 rows. Existing field schemas
are mirrored in `python/dots_engineering/history_validation.py`.

The CLI opens the selected source read-only and backs it up into a new private
temporary directory. The supported interface cannot select an existing write
destination. Normal exit removes the snapshot before reporting readback.
Forced termination may leave scratch files; crash cleanup is not claimed.

`--owner` and `--source-account` are expected bindings, not identity verification
or consent. The utility relies on local filesystem authority and must not be
exposed as an authenticated service. Only explicitly selected, authorized,
already-sanitized exports belong here. Input/output can contain private data;
only synthetic observations are checked into this repository.

## Import behavior

Validation completes before writes. Correspondence requires the configured
source account, a matching Gmail thread/message identity and an opportunity
either in the batch or already in storage. Records preserve source links and
references, classification basis, verification timestamps and evidence labels.
Correspondence always has `delivery: not_established`; importing a sent status
does not establish delivery or execute a send.

A SHA-256 hash of the supported `JSON.stringify` representation binds each
batch ID. Identical replay returns `replayed:true` without new rows, versions
or audit events. Altered content under the same batch ID returns 400, matching
the existing Node API. Object property order remains part of batch identity;
reordered nonnumeric properties are not treated as identical payloads.

Each accepted new batch has a marker with its record count, even if every row
is stale. A row updates only when the incoming snapshot review timestamp is
strictly newer, increasing its version once. Equal/older snapshots leave data,
version and update time intact. Tasks and saved instructions remain unchanged.
Record effects, correspondence audit entries and the marker share one immediate
SQLite transaction. Python additionally serializes replay lookup within that
transaction; identical concurrent batches return one import plus one replay.

Legacy correspondence audit entries are immutable by record ID. Newer imports
can change the displayed correspondence while its first audit event remains
unchanged. An older import can create a missing audit event even when its record
update is skipped. The existing Node prefix also says `Sent:`/`Received:` based
on direction for cancelled records. These are inherited semantics, not proof
of delivery, a refreshed audit projection or permission to perform an action.

## Bounded compatibility and privacy

This is canonical-input parity, not a drop-in migration for every legacy value:

- Snapshot and event timestamps accept seconds with an explicit timezone and
  zero to three fractional digits. Date-only fields require real calendar dates.
  Snapshot comparisons now use actual instants inside the SQLite write while
  retaining raw source strings. Affected existing rows with invalid or missing
  timestamps reject the batch. See [shared ordering](HISTORY_INSTANT_ORDERING.md).
- JSON supports strings, booleans, null, arrays, objects and safe integral numbers,
  with nesting at most 30. Integral floats serialize as integers for hashing.
  Nonintegral floats, unsafe integers, lone surrogates, duplicate
  JSON keys and nonfinite constants are rejected. Integer-like object keys
  follow JavaScript ordering for hash compatibility.
- Links require query-free HTTPS, ASCII DNS hosts and no embedded username or
  password, whitespace or backslash. Gmail thread links retain their supported
  fragment. Noncanonical host forms, query-bearing links and malformed optional
  join links are rejected; Node accepts some of these or replaces them with null.
- Unsupported fields are not copied into record projections. They still affect
  the batch hash and request size. Pre-redacted strings are preserved verbatim.
  There is no free-text secret detector, redaction guarantee or URL fetch.
  Secrets could exist in text, URL paths or fragments; supply sanitized inputs.

The separate session-export sanitizer is not silently applied to legacy history
payloads. Converting private exports and approving their redactions remain an
explicit adapter/review concern outside this rehearsal.

## Performed verification

[Acceptance scenarios](verification/python-history-rehearsal-scenarios.md) were
written first using the project-owned session-intent-review skill. An inline
operator workflow created synthetic SQLite storage from the repository schema,
seeded one task and saved instruction, invoked the actual Python CLI, and sent
actual Requests through the Node API on a separate synthetic copy. Node used a
controlled synthetic principal and enabled imports only in that disposable
harness. No application configuration changed.

Recorded observations (historical local artifact omitted from the public package)
show 19 matching status outcomes and matching final semantic storage, including
batch hashes and all nine history groups. Generated timestamps were excluded
from cross-writer comparison. The workflow also observed:

- Original batch replay, conflicting replay and older/equal/newer snapshots.
- Invalid IDs, duplicate IDs, malformed lists, missing fields, excessive group
  size, bad source-account/thread/direction bindings and unsafe source links.
- Preserved source references, redacted strings, instruction/task counts and
  correspondence delivery state; unknown fields absent from readback.
- Actual audit-insert failures rolling back new rows and existing-row updates,
  then successful recovery; existing-opportunity references accepted.
- Concurrent identical imports yielding one replay; conflicting imports yielding
  one 200 and one 400, with one marker and one audit entry.
- Wrong principal 401, closed rehearsal 409, mixed owner 403; unsupported
  canonical inputs and malformed JSON 400; oversized requests 413.
- Unchanged source SHA-256 and empty scratch storage after completion; default
  Node imports still 403 and application worker rehearsal mode still 400.

These are API/CLI/SQLite observations, not browser interaction, live provider
identity proof or production migration evidence. No test files, test runners,
private sessions, credentials, external calls or publication were used.
TypeScript typechecking, the production client build and `git diff --check`
also passed; source hashes are recorded with the observations.

## Remaining migration prerequisites

Instruction, decision and history mutation families now have bounded disposable
rehearsals. Full migration remains incomplete. Resolve unsupported legacy
representations and inherited audit semantics before claiming full parity.
The next bounded prerequisite is a documented and disposable rehearsal of
single-writer cutover: writer fencing, checkpoints, in-flight request handling,
post-cutover writes, crash/unknown-outcome reconciliation and rollback without
discarding newer data. Real identity-provider, browser and load evidence remain
separate gates. This document authorizes no cutover or production writes.

The subsequent [compatibility assessment](PYTHON_HISTORY_COMPATIBILITY.md)
resolved event timestamp and integral-number gaps but reproduced a mixed-format
snapshot-ordering blocker. The later [shared ordering fix](HISTORY_INSTANT_ORDERING.md)
resolves that demonstrated case for supported inputs. Other compatibility and
cutover prerequisites remain; earlier observations retain their original scope.
