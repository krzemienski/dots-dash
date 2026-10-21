# Bounded disruption and startup acceptance

> Historical design and implementation context. See [current scoped verification](source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Baseline: `b26e21c0d53764584248d3051f74c60a6bcc32ba`. Clean checkout and
absent Git index lock checked; prior branch preserved. Use session-intent-review.

1. While a lifecycle lock is held, remove or replace its path. A competing public
   controller operation must reject, not treat a new file as the original lock.
   Persist the baseline before changing code. Never confer recovery authority
   merely by creating a replacement file.
2. Symlinks and nonprivate lock files must reject without changing another file
   or the domain operation. All disruption targets are owned disposable files.
3. Before-child launch failure must report failure and leave the domain operation
   unresolved. After-child launch failure must retain the original Popen handle
   and block lifecycle progress until that owner confirms exit. Observe actual
   Node children; stop/wait only through their original handles.
4. Verify normal launch, receipt, exit, park/resume and cleanup remain functional.
   Source storage, compatibility input rules and live Node behavior stay unchanged.
5. Inspect source evidence for the original session-review user journey and
   identify one independent user-facing next outcome. No browser interaction or
   UI changes belong to this bounded slice.

No test files/runners, credentials/private sessions, unrelated processes, agents,
external writes or publication. Fault injection is confined to disposable SQLite,
owned lock paths and the locally launched child's lifecycle. Stop after this
slice; do not automatically broaden concurrency work.
