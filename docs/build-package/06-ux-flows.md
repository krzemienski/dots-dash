# User journeys and screen behavior

## Primary navigation
Desktop: Overview, Correspondence, Schedule, Requests, Opportunities, Projects, Activity, Sources. Needs you remains a persistent attention destination. Mobile: Overview, Correspondence, Schedule, Needs you, More. Detail screens have stable authenticated deep links and predictable Back behavior. Search and filters survive opening a detail and returning.

## Correspondence first check in
1. Open Overview: show latest meaningful correspondence, upcoming personal schedule and needs-user items, with coverage and snapshot age.
2. Open a thread: show source account, participants, actual message events, direction, timestamps and verified source link.
3. Inspect linked request or opportunity: show asked-for outcome, next step and evidence-backed history.
4. If a reply is needed, show why and whether this is explicit or inferred. A draft is not sent. A send button only exists when its real sending adapter and authorization path are implemented.
5. Saving an instruction confirms durable save only. Unconfigured delivery offers copy/manual use without claiming it reached the assistant.

## Schedule and itinerary check in
Show upcoming personal commitments in owner-local time. Allow calendar/week/list navigation and a bounded past range. Clearly separate all-day events, tentative invitations and inferred deadlines. Organization subscriptions are off by default and never treated as attendance. Opening an event shows original source zone, participation, location/join link when verified, source freshness and linked correspondence.

A rescheduled event retains its revision history and shows the new time with a meaningful change indicator. A canceled event leaves an audit entry and no longer counts as upcoming. Itinerary segments are grouped by trip only when their association is verified or explicitly owner-confirmed. No missing segment is silently fabricated.

The Scheduled work tab shows real provider schedules, enabled state, last check, observed runs and next-run basis. It is visually distinct from the calendar. Changing a displayed schedule does not claim the provider changed until a receipt and readback establish it.

## Request accountability
Request detail presents five plain sections: Requested, Done, Still pending, Next step, Needs you. Each Done entry opens the action attempt and evidence. Waiting and Blocked include the dependency and its owner. A request with no accepted assistant delivery stays saved-not-delivered, not in progress. A completed sub-action does not complete the whole request.

If evidence conflicts, display a verification-needed notice and both supported observations. Corrections preserve prior values in History. Do not silently promote a favorable opportunity state over an unresolved task.

## Decision and secure handoff
Needs you opens an exact bounded request. Show recipient/destination, data to share, proposed action, cost/commitment if any, expiry, and what remains blocked. Approve/decline disables while saving, preserves the draft on failure, and handles repeated clicks idempotently. A version conflict forces refresh and review of the changed payload. A local recorded decision clearly says that no external execution has occurred.

Secure login and actions requiring user takeover use the supported handoff. Never ask for credentials in a text field or put them into task history. Declining or dismissing a handoff does not mark the prerequisite complete.

## Source onboarding and gaps
Show verified account identity, requested capabilities and purpose before connecting. Verify a simple authorized read after connection, then display measured coverage. Provider consent and assistant bridge installation remain distinct. When disconnected, retain last-known records and age labels; do not erase the history or advertise current coverage.

## Interaction states
Loading uses empty skeleton structure without fake operational text. Empty means no records in this view, with filter reset when needed. Partial failure keeps independently loaded sections visible. Offline shows last snapshot and disables consequential actions; reconnect does not submit stale approval clicks. Unknown results show a reconciliation path instead of optimistic success. Live updates announce availability without stealing focus or changing a row beneath an active click.

## Accessibility acceptance
Verify keyboard order, visible focus, meaningful button names, announced validation errors, headings and landmarks, touch targets, text zoom, reduced motion and screen-reader status. Test 320, 390, 768 and 1440 pixel widths. Check long subjects, long names, unknown dates, hundreds of events, empty views, and rejected permissions without horizontal overflow.

## Engineering context review
From a correspondence request, open Linked engineering to see the actual project, authorized session sources, repository revision/diff, runs, tests and completion evidence. Keep source and execution permissions visible. Return to the original thread without copying full conversation history into another tool. “Draft reply with result” remains a draft.

Engineering details offer Sessions, Changes, Runs, Configuration and Evidence. Session cards label product, permitted export/API source, observation date and coverage. Configuration shows selected user-owned project files with redaction and revision; it does not expose assistant internals. Unavailable adapters remain visibly unavailable.

Host/terminal view starts read-only, shows exact approved workspace and observation age, and marks output gaps/redactions. Run actions show command/script, scope, expected revision, network/resource boundaries and approval state before starting. Child runs display actual receipts and parent dependencies. Cancel changes to Cancellation requested until termination evidence arrives.

Completion review separates Claims from Verified results. Daily summary shows completed, pending, failed and needs-user with evidence. Next-work prompt has Review and Copy; a separate authorized run flow is required to execute it. New integration controls must remain disabled or absent until their real paths work.
