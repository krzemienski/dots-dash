# Session review implementation evidence

> Historical design and implementation context. See [current scoped verification](source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Local feature branch: `feature/local-session-intent-python`.
Verified remote main baseline: `0a9611f9441f18810210da54dfc4d3974c61e5e0`.
No repository `AGENTS.md` or `.agents/skills` existed at that baseline.
The new project skill contains reusable workflow guidance only.

## Acceptance discovery and actual user workflow

Acceptance was defined before implementation in
[session-review-scenarios.md](session-review-scenarios.md), using the available
user-owned `ak:scenario` workflow. Relevant dimensions: authorization, inputs,
timing, state, integrity, integration, privacy and observable business behavior.
The user's later instruction to perform end-user verification took precedence
over the initial request to add/run tests. No test files were created or run.

An ephemeral loopback HTTP application used a controlled synthetic principal,
real Node APIs, the fixed Python worker and actual temporary SQLite files.
The local session credential existed only in the verification process. This is
not an actual identity-provider sign-in or a production authentication claim.
The server was stopped and its temporary storage removed after verification.
The initial HTTP workflow used no browser. The first restricted bind returned EPERM; the approved
loopback retry completed successfully.

The user workflow actually performed was:

1. Open the empty review workspace through authenticated HTTP.
2. Import the labeled synthetic export and inspect its linked intent, explicit
   supersession, completion claim, negative outcome and provenance findings.
3. Repeat import, then submit conflicting content. Replay succeeded once;
   changed content returned 409.
4. Select a skill. No run existed after selection.
5. Attempt an altered revision, then authorize the pinned local checklist.
   The altered revision returned 409; the authorized operation produced an
   actual receipt with a missing-observation gap. Replay did not create a run.
6. Perform the example's observable behavior: save an instruction using
   `/api/work`, then read it back. Exactly one instruction was returned as
   `saved_not_delivered`, and the bridge remained disconnected.
7. Record those performed steps as an owner-reported observation; run the
   checklist again. The receipt acknowledged the observation while retaining
   `not_independently_verified` and the unverified completion-claim gap.
8. Read through a fresh Python process. SQLite returned review version 5,
   two run receipts and one observation.

The machine-readable observation log (historical local artifact omitted from the public package)
contains the actual statuses, timestamps, hashes and receipts. All example
identities and content are synthetic. The synthetic `aaaaaaa` revision is
fixture provenance, not a claim that these changes have that Git revision.
Implementation file hashes are recorded separately in
the source manifest (historical local artifact omitted from the public package).

Observed negative paths: anonymous 401; wrong Origin 403; conflicting request
409; stale code/review pins 409; hidden field 400; wrong export owner 403;
disabled import/runner 403; absent Python adapter 503. A nonsecret redaction
canary and ANSI controls were removed before the retained projection. Existing
history readback still reported one preserved instruction and zero imported
history records. A superseded old blocker did not reopen as a current finding;
a release-scoped failure survived beside an older targeted pass.

## Build evidence

- Pinned dependency install completed with lifecycle scripts disabled.
- `npm run typecheck`: passed.
- `npm run build`: passed; no runtime records bundled.
- `git diff --check`: passed.
- Actual verification environment: Node 26.11.1, Python 3.15.0, SQLite from the
  installed runtimes. Python targets 3.11+, but that lower bound was not run.
- Existing automated test files: deliberately not run under the latest user
  instruction. Build/typecheck are compilation checks, not end-user proof.

## Remaining gates

The subsequently allocated isolated browser workflow is described below.
Production identity-provider verification, actual mobile-device interaction,
full keyboard/screen-reader coverage, real provider session exports and provider
SDK execution remain unverified. No private live dashboard was touched.

Only a generic curated export and bounded declarative checklist are supported.
No full skill instructions, arbitrary commands, model calls or child agents
execute. The phrase “40-agent SDK runner” remains unresolved; official SDK
research is documented separately. No global configuration was changed.

Python legacy API parity, data migration, cutover/rollback, remote cancellation,
writer fencing and unknown external-effect reconciliation remain future work.
The local pure checklist uses an atomic SQLite transaction and has no external
effect to reconcile. Rule analysis cannot infer original intent from missing
turns or establish independent claim truth.

V302/V304/V310/V312 have only bounded local foundation evidence, not full real
provider acceptance. V301, V303 filesystem-negative paths (no file-reading
adapter exists), V305-V309, V311 terminal-stream coverage, V313 live revocation,
V314 migration and V315 independent-owner release are not claimed complete.

Publication was subsequently authorized after end-user verification, and the
isolated local browser workflow is now complete. Publication status must be
verified against the remote commit and draft PR separately. No merge or
deployment is authorized. Parent retains ownership of live dashboard writes.


## Subsequent isolated browser verification — 2026-10-16

A separate named Playwright Chrome process was launched with an isolated
in-memory context. It did not attach to, navigate or inspect existing browser
windows. The temporary loopback harness used a generated password, scrypt
verification and an expiring HttpOnly/SameSite session. Sign-in occurred through
its actual HTML form; no constant-principal bypass or cookie injection was
used. Credentials, harness code, databases and browser session files are not
included in the repository. This proves the local auth interface workflow,
not a production identity-provider integration.

Performed through rendered UI controls: observe anonymous denial; sign in;
open Session review; paste/import the labeled synthetic export; inspect goals,
supersession, findings and remediation; follow a source; select a checklist;
authorize it; save an instruction through the composer; reload and reopen the
composer; inspect saved/not-delivered state; record performed steps and the
observed result; rerun the checklist; reload and inspect the complete review.
Read-only SQLite inspection corroborated version 5, two actual run receipts,
one observation, one instruction and five atomic audit transitions.

Two defects were found and repaired through this workflow:

- Source anchors changed the dashboard hash route and left Session review.
  They now keep `#day`, scroll to the cited event and transfer keyboard focus.
  The repaired route and focused event were observed in the browser.
- The evidence field's HTML pattern was invalid under the browser's Unicode
  sets syntax. Escaping its hyphen restored native validation; the final
  browser reported a valid evidence reference with zero console errors.

The persisted completion claim still has a gap after the owner-reported pass;
actual checklist success does not establish independent product verification.
The old superseded blocker remains historical, while the release failure and
stale provenance finding remain visible.

Screenshots were inspected visually and contain only synthetic content:

- Instruction after reload (historical local artifact omitted from the public package)
- Complete desktop review (historical local artifact omitted from the public package)
- Narrow viewport review (historical local artifact omitted from the public package)
- Persisted checklist receipt (historical local artifact omitted from the public package)

At 390 and 320 CSS pixels, document width equaled viewport width. This is a
responsive browser check, not real-device or comprehensive accessibility proof.
The final page console reported zero errors and warnings. Build/typecheck were
rerun successfully after the fixes. No test files were created or executed.
Browser workflow and SQLite readback (historical local artifact omitted from the public package)
records the actual receipts, observations and audit transition sequence.
