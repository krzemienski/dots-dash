# Request evidence projection acceptance

Outcome: inspect Requested, Done as a recorded claim, Still pending, Next step
and Needs you together with the available request-level evidence and its gaps.
FR04 remains partial: the current schema cannot bind evidence to each completed
action, establish the actor or certify an outcome.

Before implementation, use synthetic TEST DATA with the existing enabled import
API, disposable owner SQLite and built React UI. No private sources or provider.

1. A completed status with a completion summary but no references shows the
   original claim and explicit missing support, never a verified-completion label.
2. A partial request with source URLs and supplied evidence notes displays them
   next to the completion claim, preserving pending/failed work and unknown actor.
   Request-context links do not certify an individual completed action.
3. A request with no completion summary says none is recorded. Needs you false
   remains distinct from proof that no input is needed; paused stays paused.
4. Existing linked records are navigable; missing related IDs remain visible as
   unavailable in this snapshot. No invented target or inferred evidence mapping.
5. Exact request navigation from Overview, keyboard evidence disclosure/link
   focus, return navigation and reload retain the intended request. Search keeps
   focus; a missing exact ID reports unavailable.
6. At 320/375px, long summaries and references wrap without horizontal overflow.
   Labels and evidence remain readable; this is not full accessibility certification.
7. Failed refresh retains the prior snapshot with an error. Interrupted loading
   does not mutate records. Read/navigation/reload leaves durable records/audits
   unchanged; owner denial clears private display and disabled import rejects.
8. No source URL is fetched by rendering, no provider/execution is added, and
   instructions remain saved-not-delivered. Store source and outcome hashes in
   the result ledger; prior validation retains its historical bindings.
