# Owned-process supervision and compatibility acceptance first

> Historical design and implementation context. See [current scoped verification](source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Baseline: `5048380a202c82e6e3f96772e59c285fdd73f7d3`. Clean checkout and sole
writer confirmed. Reuse session-intent-review; all data/processes are disposable.

## Supported changes and policy boundaries

- Existing idempotency requirements support making concurrent identical Node
  instruction/decision requests return their original receipt with duplicate:true.
  Altered-content races must remain conflicts; no action executes externally.
- A surviving Node transport may be supervised only through a retained Popen
  handle created by this local supervisor. No PID adoption, process discovery,
  global signal, or stopping another worker is permitted. If the supervisor
  itself loses its handles, do not guess ownership.
- Existing requirements do not decide between strict versus permissive query URL,
  optional invalid join-link, broader date/number/Unicode, or revisioned audit
  policies. Document alternatives and stop those dependent changes. Do not
  silently strip evidence, reinterpret historical claims or loosen privacy rules.

## Observable acceptance

1. Force identical and conflicting instruction/decision requests to race after
   initial receipt lookup. Matching requests return 200/200, one duplicate,
   one saved receipt/audit; conflicts return one 409. Decisions remain executed:false.
   Final review also exposed the timing between receipt lookup and approval read;
   reproduce that gap before correcting it, preserving the same acceptance.
2. A dedicated supervisor launches only the fixed local Node rehearsal transport.
   It reports phases, permits progress, confirms exit and can stop only handles
   it created. Unknown handles reject without signaling any PID.
3. A controller process dies while an owned writer survives before dispatch.
   Restart advances the epoch; releasing the stale writer yields no mutation.
   Receipt absence remains unresolved and does not authorize retry.
4. A writer survives with a real SQLite mutation in flight. Restart cannot claim
   ownership while the transaction holds the database lock. Stop only that owned
   writer, confirm its exit, then recover the marked copy. Partial effects roll
   back and missing receipts remain blocked.
5. A writer survives after commit but before response delivery. Restart revokes
   its lease and reconciles the actual receipt. Completing/stopping the owned
   transport causes no duplicate write or audit. Preserve saved_not_delivered
   and executed:false semantics.
6. No controller cleanup/parking is performed while its external worker remains
   alive. The supervisor must finish or stop its children before snapshot cleanup.
   Controller failure leaves the marked copy for explicit restart; it is not
   replaced with a stale checkpoint.
7. Verify source hashes, cleanup, default import denial and unsupported application
   worker modes. Report actual API/process/storage evidence separately from browser
   evidence, which is not performed.

No test files, credentials, private sessions, unrelated processes, outside agents,
application tabs, production writes or publication. Full migration remains incomplete.
