# Fenced mutation families and restart acceptance before implementation

> Historical design and implementation context. See [current scoped verification](source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Baseline: `286c7ff4a391fd9560af111b5e689ac9b7f9ed51`. Clean tree, preserved prior
branches and sole implementation writer confirmed. Apply session-intent-review.

## Specific compatibility gaps retained

| Gap | Source evidence | Consequence / bounded treatment |
|---|---|---|
| Instruction race response flag | `server/api.ts` post-insert read versus Python instruction replay | Same saved row can lack Node duplicate:true after a race; no response-shape parity claim |
| Identical decision race | Node saved-new-ID lookup versus Python serialized replay lookup | Node may return 409 while Python replays; this package fences operations rather than changing that product response |
| Decision expiry coercions | Node Date guard versus Python `expiry_allows` | Use canonical valid expiry fixtures; malformed/legacy representations remain unverified |
| History URL/join/date/number/Unicode differences | Existing compatibility inventory and validators | Keep supported sanitized subset, reject unsupported payloads |
| Immutable audit / cancelled labels | Both history writers | Retain existing semantics; no silent evidence reinterpretation |
| Crash outcome without receipt | Existing handoff controller | Remains unresolved after restart; absent evidence never grants retry |
| Hosted/auth/browser/load | Local SQLite guards and controlled principal | Remain unverified and outside production cutover |

## Observable acceptance

1. Both Node and Python save fenced instructions and decisions on one disposable
   snapshot. Instructions stay saved_not_delivered; decisions stay executed:false;
   original IDs, normalized values, audit events and approval versions persist.
2. Transfer ownership between runtimes. Old epochs cannot mutate either family.
   Changed request IDs/content conflicts remain rejected; replay preserves receipts.
3. Discard completed instruction/decision responses. Reconcile against matching
   semantic receipts, owner binding and audit evidence; mismatch/missing evidence
   stays unresolved. Never pretend these legacy tables store full request hashes.
4. Mark every new rehearsal with local session metadata and a file identity.
   A controller holds an exclusive local file lock. A second controller cannot
   attach while it is alive. Resume only an explicitly selected marked snapshot
   directly inside the declared scratch root; reject ordinary stores, symlinks,
   owner mismatch, replaced files and unsupported session versions.
5. Kill only a process created for this rehearsal after a committed operation but
   before receipt reconciliation. A different controller resumes the persisted
   state, advances the epoch to revoke stale writers, and resolves the receipt
   without repeating the mutation or losing post-transfer data.
6. Kill an owned Python process during a real SQLite mutation before its audit
   insert. Restart performs SQLite recovery only on the marked disposable copy;
   no partial operation survives. Missing receipt remains unresolved and blocks
   handoff/retry. No automatic force-clear is introduced.
7. Source hashes stay unchanged; normal cleanup removes all owned scratch files.
   No unrelated processes are signaled. Default application imports stay disabled
   and the application worker gains no write or resume mode.

Use actual APIs, child processes and persisted SQLite readback; no test files,
credentials, private stores, outside agents, browser/tab use or external writes.
This is disposable protocol verification, not full migration or live authentication.
