# Overview acceptance, defined before implementation

Outcome: from existing stored records, find recent correspondence, the next
eligible personal event and an explicit Needs you request, then inspect their
source/context without implying live sync, delivery, scheduler or execution.

Use isolated synthetic TEST DATA through the real owner-gated API, rendered UI
and disposable SQLite. No new provider, production identity or private records.

1. Empty store: show separate empty/unknown states, no invented work or live
   counters. Database read time must not be labeled source freshness.
2. Import dated and unknown-time correspondence through the existing enabled
   importer. Preview newest known instants in chronological order (including
   differing offsets); retain unknown/date-only ambiguity and source links.
   Sent never becomes delivered/read and missing actor remains unknown.
3. Personal event selection excludes subscriptions, inferred deadlines, past
   events, canceled/declined and unknown statuses. Retain an ongoing timed event
   with a known end. Date-only all-day events require valid source-zone day
   comparison; show them separately rather than inventing a timed ordering.
   Record status/participation/source zone and UTC display explicitly.
4. An explicit needsUser commitment opens that exact request and focuses it.
   Pending work without that flag is not promoted to a required decision.
   Existing paused/completed status remains visible; navigation grants no action.
5. Reload: previews match persisted records. Read navigation/refresh does not
   modify work, instruction, decision or audit rows. Source review timestamps
   and supplied coverage statements remain distinct from the database read.
6. Save an instruction through the existing UI, reload and inspect storage:
   saved-not-delivered, with no external execution or new bridge claim.
7. Failed refresh preserves visible stale snapshot with an error. Wrong-owner
   or unauthorized read clears private display. Disabled import still rejects.
8. Use keyboard, linked-request return navigation and 320/375px layout with long
   text. Focus and content remain visible. This is not screen-reader certification
   or measured ten-second acceptance with an actual owner.

Results belong in the final source-bound overview ledger, not in this acceptance
definition. Proposed mockups and previous workflow evidence do not satisfy it.

## Bounded calendar-date follow-up

Outcome defined before the correction: impossible timed dates must not rank as
confirmed upcoming events, while original source text remains intact. Reproduce
the impossible February 30 case via import, SQLite and the built UI first. Then
verify invalid non-leap February 29, valid leap February 29, offsets crossing UTC
day boundaries, impossible ends and an all-invalid selection. Confirm ongoing
events and separate all-day dates still render, malformed correspondence time
stays unknown, and reload/read refresh leaves stored strings and versions intact.
Recheck disabled imports, wrong-owner reads and unknown source coverage. This is
read-projection acceptance, not a claim that legacy imports reject malformed dates.
