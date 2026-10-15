# Functional verification plan

## Evidence policy
Test actual implemented functionality with controlled records explicitly labeled as tests in a separate private account. Obtain required permission before sending messages, creating invitations, granting access or modifying external services. Record actual provider receipts and readbacks in a private evidence store. Never commit those personal/runtime records to the reusable repository.

Unit and isolated validation tests may catch defects but cannot replace a live functional gate. Existing historical isolated tests must be reported accurately. No mocked success, invented receipt, decorative integration toggle or unexecuted test may be called passed. When an external action is not authorized, report its functional gate as not run and continue read-only checks.

Each report records revision, environment, time, exact steps/commands, expected and actual outcomes, pass/fail/not-run, sanitized evidence reference and limitations. Re-run affected tests after code changes. Screenshots alone do not prove persistence or server authorization.

## Test cases
| ID | Functional procedure | Required result |
|---|---|---|
| F01 | Clean install and empty database, authenticate owner, reload | No seeded operational records; session and storage work |
| F02 | Anonymous, wrong owner and revoked session call every read/write/stream | No private data or existence leak; denied server-side |
| F03 | Import controlled real inbound and outbound messages from approved account | Correct source thread, direction/time, unknown delivery/read; source links verified |
| F04 | Import same page twice and concurrently; reuse ID with changed payload | One logical event; changed-content conflict; no partial batch corruption |
| F05 | Open thread, filter/search, inspect linked request, Back/Forward | Correct record and preserved list state; no stale selection |
| F06 | Process real event create/reschedule/cancel after authorization | UI and history match provider revision; canceled event removed from upcoming |
| F07 | Exercise all-day, DST, original/owner time zones and recurrence exception | No day shift, duplicate occurrence, or false attendance |
| F08 | Read real scheduler definition and observed run | Correct provider ID/status; unknown next run remains unknown |
| F09 | Trace authorized request through actual action and receipt | Requested/Done/Pending/Next/Needs you agree with evidence |
| F10 | Record approval, repeat click, change payload version, expire/revoke | Idempotent decision; stale/expired decisions rejected; no automatic external execution |
| F11 | Save instruction with bridge absent | Persists as saved-not-delivered after reload; no fabricated reply |
| F12 | If bridge approved/supported, deliver controlled instruction and revoke | Correct owner/destination receipt and acceptance; revoked transport fails closed |
| F13 | Interrupt source read and resume; simulate connection loss by controlled failure | Last-success time unchanged on failure; visible stale state; complete recovery |
| F14 | Disconnect client during actual committed changes, replay or expire cursor | State matches server snapshot with no duplicates or missing interval |
| F15 | Submit conflicting evidence and later correction | No silent overwrite; current claim and preserved history explain resolution |
| F16 | Edit unrelated task while importing history | Import preserves tasks, decisions, instructions and owner scope |
| F17 | Test unsafe URLs, HTML-like source content, oversized payload and unauthorized source | Escaped/rejected safely; no source instruction execution or arbitrary fetch |
| F18 | Inspect app build, source maps, logs, archives and Git history | No personal runtime records, tokens, private binding IDs or sensitive telemetry |
| F19 | Actual mobile and keyboard/screen-reader check-in flows | No overflow, focus loss, inaccessible controls, or misleading status |
| F20 | Export, backup, restore to isolated instance, revoke connector | History preserved; revoked credentials not reactivated; no cross-owner data |
| F21 | Create second authorized independent owner instance | Empty private setup without first-owner identity, credentials or records |
| F22 | Measure 100 instrumented updates in connected foreground client | At least 95 visible within 5 seconds of commit; publish actual conditions/results |
| F23 | Verify repository/CI/deployment when authorized | Exact remote commit and visibility match; CI and deployed revision checked separately |

## Priority test order
Before user-visible release: F01-F07, F09-F11, F13-F19. F08 applies when real scheduler integration is advertised. F12 is mandatory before claiming assistant delivery. F20-F21 are required before independent-owner general release. F22 gates latency claims; do not imply those targets are already met. F23 gates repository/deployment completion claims. Native iOS adds actual device tests for secure storage, revoked auth, offline queue safety and deep links.

## Current check commands
The extracted core currently declares npm test, npm run typecheck and npm run build. These commands do not cover a hosted authenticated application. Run npm ci in a permitted clean environment with the reviewed lockfile; if dependency access is blocked, state that clean installation remains unverified. Add application/API/integration/browser commands as functionality is implemented and document them exactly, not as imaginary existing scripts.

## Release blockers
Any privacy leak, cross-owner access, forged approval, fabricated outcome, duplicate external effect, falsely healthy disconnected source or lost history blocks release. Unsupported optional integration may remain visibly unconfigured; it must not be marketed as working. A failed required functional gate cannot be waived by a passing compile or isolated test.

## Version 3 engineering acceptance
Add V301-V315 from the Python migration plan to the applicable release suite. Named session providers require independent permitted-route verification. Actual subagent runs, process cancellation, writer fencing and terminal streaming cannot be validated solely by parser/unit tests. Use controlled authorized project work and private test accounts, not fabricated operational records.

Test owner/source-context isolation, denied-path refusal without reading contents, config redaction, hostile terminal control sequences, concurrent stale writer rejection, lost-host unknown outcomes, parent/child cancellation, exact-revision test relevance, daily-summary accuracy and draft-only next work. Python parity tests must exercise real SQLite instances and preserve historical permission/decision semantics. Clean dependency installation and production auth remain separate gates from syntax checks of proposed contracts.
