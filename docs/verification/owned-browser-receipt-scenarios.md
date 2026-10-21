# Owned browser receipt acceptance — defined before implementation

> Historical design and implementation context. See [current scoped verification](source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Baseline: `2c4c8a31366280bf0b9a25c83891ad28e743e99f`.
Scope: the existing isolated session-review browser journey, synthetic identity,
disposable storage, local source only. No test files, application tabs, credentials,
external writes, provider execution, broad command interface or writer cutover.

1. A missing/incorrect revision or unbound build must reject before browser
   launch. The coordinator records a pending run and pinned input manifest before
   starting its fixed child. That child creates the local host and browser;
   ownership comes from retained handles and an inherited channel, not PID lookup.
2. Through the actual UI, import historical evidence, read its attribution,
   import a new review at the pinned revision, follow its stale evidence source,
   return to the older review, reject an export with missing revision, and reload.
   Read back both unchanged reviews and zero newly authorized checklist runs.
   Save actual screenshot and structured readback. Historical imports remain
   owner-provided; the new receipt attests only this new synthetic local journey.
3. Confirm browser and host closure and owned driver exit. Finalize exactly one
   immutable receipt with actual observations, environment, source/bundle/fixture
   and artifact hashes. The driver cannot write the receipt ledger. Zero exit or
   a supplied pass field alone cannot establish a successful workflow.
4. Collect the completed owned result twice and replay the same start identity:
   return the original receipt with no second dispatch. A conflicting request or
   receipt must reject rather than overwrite the prior record. Inspect SQLite
   counts and immutable receipt bytes through the actual local coordinator.
5. Interrupt a separately authorized run after its real browser/host start,
   before workflow completion. Confirm owned cleanup where supported; record
   unknown/gap rather than success or implied cancellation of effects. No retry
   follows automatically. Lost ownership must block cleanup and new dispatch.
6. Verify changed source/input or artifact content cannot yield a fresh success;
   preserve old receipt outcomes and expose stale/unknown relevance separately.
   Retain original histories and branch evidence unchanged. Compile separately
   from these actual behavior observations. Record exact limits and cleanup.

Implementation ownership refinement: installed Playwright exposes
`BrowserServer.process()`. The coordinator retains that browser handle itself;
the fixed driver creates the local host and connects only to that new browser
through an endpoint delivered on its inherited pipe. This is stronger than
delegating browser lifecycle to a detachable driver and preserves the original
acceptance outcome. No existing browser or daemon is adopted.
