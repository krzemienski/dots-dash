# Daily evidence check-in — bounded V312 foundation

## Outcome and baseline

The owner can inspect stored correspondence for a chosen calendar day, evidence
and leads reviewed that day, current pending input, calendar context and source
freshness statements, then review a bounded next-work draft. This is a read-only
check-in, not a complete log of verified work or completion of V312.

[FR19](build-package/02-prd-v2.md), the
[bounded event projection requirement](build-package/03-functional-technical-spec.md),
and [daily summary semantics](build-package/13-engineering-contexts-and-execution.md)
require date, evidence and coverage distinctions. At baseline
`116e50235f3c08acde9a6d8a0628cd8ca6ab5a80`, the Day view grouped only request
snapshots by review time in UTC. An isolated import demonstrated that stored mail,
lead, engineering and schedule records had no corresponding daily projection.

The [new projection](../ui/daily-evidence.tsx) uses the existing authenticated
`/api/work` record snapshot through [Day workspace](../ui/day-workspace.tsx).
No backend, migration, capability, production setting, source reader, scheduler,
sending path or persistent preference was added.

## Temporal and evidence contract

| Section | Selection basis | What it does not establish |
|---|---|---|
| Message events | Strict valid `occurredAt`, formatted into the chosen day/zone | Sent is not delivered/read; actor unknown; date-only/invalid records are unplaced |
| Work evidence and leads | Strict valid `verifiedAt` review timestamp, selected day/zone | Not action time, lead discovery, current independent verification or completion |
| Pending input | Current stored requests explicitly flagged `needsUser` | Not historical pending state on the selected day; not all provider decisions |
| Timed calendar | Starts on selected day/zone; declared kind/status/scope retained | No attendance, booking confirmation, recurrence expansion or earlier-starting ongoing event coverage |
| All-day calendar | Matching source-date labels, exclusive end date, source zone shown | Not converted to the selected zone or ranked with timed events |
| Scheduled task count | Current records whose state is `scheduled` | Plans, not calendar bookings, scheduler configuration or observed runs; no day inferred |
| Source freshness | All supplied coverage statements and their review timestamps | Not measured health or last successful provider check; absent statements mean unknown |

UTC is the explicit initial display zone. The owner can apply a valid IANA zone;
invalid input leaves the previously applied scope intact. Calendar-day comparison
does not assume a fixed 24-hour duration. Date/zone choices are mounted UI state
only. Date-only, missing and malformed exact timestamps are not normalized into
invented instants. Their unplaced counts remain visible. Original strings persist.

Each displayed group shows its stored count and up to 20 records, with canonical
record IDs and routes to the existing domain views. The draft cites up to 20
message, evidence-review and pending-input records per group and states this limit.
It is reviewable text; its Copy action uses the existing explicit clipboard helper,
not an assistant transport or execution request. Imported next steps remain supplied
text, never authority. The current snapshot cannot reconstruct historical revisions
or corrections; no historical-as-of or all-source completeness claim is made.

## Observable acceptance actually performed

The [appended evidence ledger](verification/request-evidence.json) binds seven
final observations to the final source/build. Existing labeled fixtures were
adapted inline into disposable TEST DATA; a planned task was explicitly seeded
in that owned SQLite store because the history importer does not import task rows.
All other fixture records used the supported history API. No private work records
were copied or fabricated as real data.

| Case | Observed through rendered UI/API/persistence |
|---|---|
| D1 | UTC occurrence-day matching; date-only and impossible-date messages remain unplaced; sent does not become delivery |
| D2 | America/New_York moves an offset-boundary message to the previous day; both distinct repeated-hour fall-DST instants remain on November 1 |
| D3 | Invalid zone retains prior scope; reviewed lead/historical work and recorded failure remain visible, separate from current pending input |
| D4 | Recorded event, inferred deadline, all-day source zone and scheduled task plan remain distinct; old partial coverage remains a supplied statement |
| D5 | Draft cites canonical records and permission limits; keyboard request navigation reaches exact ID; reload leaves SQLite bytes unchanged and resets transient scope |
| D6 | Keyboard date control and 320/375-pixel layouts; no document overflow |
| D7 | Empty date blocks draft display/copy; a day with no events does not claim no activity; current pending context remains visible; database bytes unchanged |

The final narrow screenshot was inspected. All 14 existing tests, typecheck and
build passed. The existing empty-view test was updated for selectable day/zone and
unknown coverage; no new test files were added. An initial fixture-ID rejection,
draft-label lookup issue and old-label test failure are recorded. A browser run
after the failed chained build used the prior bundle and is not final-source proof.
The final seven-case run followed a successful build and matching source hashes.

Clipboard delivery, actual screen-reader use, maximum preview boundary, spring-DST,
all calendar/provider behaviors, real-owner V301 and real-event full V312 were not
performed. Empty coverage was checked by the existing render test, not a separate
browser fixture. No external requests, shared Chrome use or production writes occurred.

## Next implementation-ready remediation

Full V312 needs actual event evidence rather than reinterpreted snapshot fields.
Prioritize a **read-only summary input contract** before further aggregation:

> Define one owner/store-bound event interval in an explicitly selected zone.
> For each supported source, return event identity/version, occurrence versus
> recorded/review time, actor basis, exact evidence/receipt references and explicit
> correction relationships. Expose bounded page/interval coverage and unknowns.
> Keep current pending snapshots separate. A producer receipt attests its own
> workflow, not whole-request completion. Do not infer new-lead timestamps,
> verified work, delivery or booking from status/review dates. Begin with one
> existing local event/receipt producer; use existing permissions and no migration
> or retention change without a concrete reviewed need. Verify period boundaries,
> correction history, source gaps and an owner-chosen real event before claiming
> V312. No scheduling, provider activation, sending or execution follows.

This is a prioritized remaining task, not a new implemented event model or permission
grant. Local publication holds and the earlier unpublished documentation commit
remain intact.
