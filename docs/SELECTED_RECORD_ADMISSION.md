# Selected-record admission

Acceptance defined before implementation. The broad keyword filter that lost a
safe goal existed only in a private audit helper. Published v1 `sanitize()`
redacts recognized value patterns; it does not drop events on keyword presence.
This addition supplies missing attribution and selection context, not a fix to
an established published whole-message filtering defect.

The owner submits a curated `dots-selected-records` v1 envelope containing a
normal `dots-visible-session` v1 export plus record classifications, explicit
project binding and scoped correction assertions. No provider format, original
file path, raw log, hidden instruction or credential belongs at this ingress.
The existing import capability remains default off. Original v1 imports and
their normalization/hashes remain unchanged.

Record classifications are owner-supplied assertions, not authenticated human
identity. Generated metadata, tool results, system/developer content and records
explicitly marked sensitive/private are excluded before normalization; their
content is never retained. Unknown origin remains visible as unknown. Recognized
secret values and controls in retained text are redacted with field-level reasons;
ordinary words such as “password” do not discard a goal. This is defense in depth,
not a universal detector. Unknown fields reject rather than silently persist.

Directory and declared project IDs are labels, not discovery. Import requires an
explicit owner confirmation reference and confirmed project matching the export
and declared project. Disagreement with the directory label stays visible. An
unresolved binding rejects without creating a review; no directory-based fallback.

Every supplied supersession edge must have an explicit correction assertion and
nonempty goal scope shared by its decision and target. In this adapter corrections
are context only: both events remain active and visible, and the original v1
supersession list is cleared in the new normalized review. Original evidence and
negative findings are not erased. Excluded targets stay identified as excluded in
the admission report. Associations, observations and processing checkpoints are
not advanced. There is no execution authority in any imported text.

## Observable acceptance

1. Import a synthetic human goal mentioning a password reset: retain its safe
   goal, expected behavior and source link after reload.
2. Import a synthetic secret assignment beside safe text: redact only the value,
   show a field-level reason and find no canary in persisted review/audit/replay.
3. Supply metadata/tool/private-classified records: omit their text and dependent
   goals/skills while retaining safe exclusion IDs/reasons. Reject an empty
   remaining goal set without fabricating intent.
4. Supply unknown-origin text: retain explicit unknown attribution; do not label
   it proven human or independently verified. Unknown extra fields reject.
5. Supply differing directory/declared project IDs without confirmation: show a
   binding error and create no review. Confirm the declared project explicitly:
   import succeeds and discrepancy/confirmation remain visible after reload.
6. Supply a scoped correction: show its stated goal scope and both records;
   retain the earlier negative outcome. Reject missing/out-of-scope assertions.
7. Verify default-disabled import, owner mismatch, identical replay and changed
   operation conflicts. No provider call, source read, execution or processed
   coverage follows from import.

## Performed isolated verification

On 2026-10-21 the seven cases above were exercised through the real import/API
and rendered review against disposable owner storage and a fresh owned browser.
The [source-bound ledger](verification/selected-record-admission.json) records 28
individual observations. The two project-binding paths were exercised in the
browser; additional rejected variants and replay/capability cases used the actual
loopback API. SQLite review, audit and replay rows contained none of the synthetic
redaction/exclusion canaries. Reload, source navigation and 390-pixel layout were
checked. The original v1 fixture retained its existing review ID and no admission
annotation. All 14 existing tests, typecheck and build passed; no test files added.

The sample is [TEST DATA](../examples/selected-records.synthetic.json), not a
provider session. The [schema](build-package/selected-records.schema.json) is also
served by authenticated `GET /api/engineering/schema?format=selected-records`.
POST uses `{action: "import_selection", requestId, selection}` on the existing
engineering endpoint. Only normalized output and exclusion metadata are retained;
raw excluded content is neither stored nor hashed for replay. Changes confined
to excluded content therefore retain the same normalized operation meaning.
Successful selected-record import clears the submitted browser draft.

This is deliberately not a raw transcript reader or an arbitrary-secret detector.
Owners must remove private material before submission. Assistant/system/developer
and tool records are excluded by this selected-human-context adapter; ordinary
owner-curated v1 claim/evidence imports remain available. Record classifications
and project confirmation references are assertions, not proof of original authorship
or source access. Unknown origin can support an owner-curated goal but never
becomes independently established human intent. Scoped corrections do not globally
supersede earlier records, even when the owner requests a narrow change.

There is no database schema migration: admission metadata lives in the existing
versioned review JSON. Existing v1 hashes/records are unchanged; new selected-record
reviews include admission context in their identity. Original-source freshness,
source-byte verification, provider adapters, durable admission checkpoints,
contiguous processing, production identity and actual-user V301 remain outside
this slice. A1–A8 in the broader coverage design are not all implemented or verified.
