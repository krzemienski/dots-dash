# Correspondence-first Overview

The Overview now puts stored correspondence, the next eligible personal event,
explicit Needs you requests and supplied coverage statements in one place.
Section-jump buttons focus the relevant heading, including on narrow screens.
This is a read projection over the existing `/api/work` response. It adds no
provider, schema migration, source grant, scheduler or external action.

## Selection and evidence rules

- Messages with exact timestamps sort by actual instants, including offsets.
  Date-only/unknown-time messages appear separately rather than gaining an
  invented timestamp. The preview shows at most three timed and two uncertain
  records, with access to the full stored correspondence view.
- Timed personal `confirmed_event` records are eligible only for the known
  recorded statuses `confirmed` or `tentative`, with neither declined nor
  canceled participation. A known future end can keep an ongoing event visible.
  Past, subscription, inferred-deadline, unknown-status and malformed-time
  records are not ranked as the next event. Unknown participation remains shown.
- All-day dates use their valid source time zone for day comparison. They remain
  separate from timed events and retain date-only presentation. This does not
  implement a complete recurrence, timezone or calendar-provider adapter.
- Event selection is relative to the latest successful **database read**, which
  is visible and explicitly not a source refresh. No ticking freshness or live
  source claim is added. Refresh again for a newer database-time comparison.
- Needs you uses the existing explicit `needsUser` flag only. Stored status,
  including paused, remains visible. Its link opens/focuses the exact request
  through `#requests/<encoded-id>`; unknown IDs show an unavailable message.
  Resolving a request does not authorize an external action.
- Coverage statements and source review times remain supplied records. Unknown
  timestamps remain unknown. Actor, delivery/read status and original source
  completeness are not inferred. Missing records do not imply empty sources.

Instruction save/copy remains the existing saved-not-delivered flow. Failed
refresh preserves the old snapshot beside an error; unauthorized read clears
private display through the existing dashboard boundary. Core APIs, persistence,
authentication and default-off import behavior are unchanged.

## Performed verification

[Acceptance was defined first](verification/overview-scenarios.md). The
[source-bound ledger](verification/overview.json) records 18 passing observations
through the built React UI, real Node API and disposable SQLite using explicitly
synthetic TEST DATA. It covers empty and populated states, ordering/exclusions,
exact request focus/reload, search focus, 320/375px long text, read-only persistence,
instruction save/reload, failed refresh, wrong owner and a newer cancellation.
The API readback contained 19 domain records plus an import receipt; the saved
instruction remained `saved_not_delivered`. No external request occurred.

Two earlier driver attempts stopped on incorrect selectors; neither is counted
as final acceptance. Their cleanup completed. The first used an older Node
wrapper; final checks and workflow explicitly used Node 26.11.1. Source review
also removed filter-dependent request refocusing, and the final workflow verified
that typing retains input focus. Screenshots were visually inspected; raw runtime
artifacts and synthetic databases remain ignored, not published.

All 14 existing tests, typecheck, build and diff checks passed on final runtime
source. No new test files were added. Owned browser, loopback server and storage
closed. This is not production identity/provider acceptance, real-owner timed
usability, screen-reader certification or full all-day/DST/recurrence testing.
The broader FR02/FR03/FR04 outcomes remain partial.
