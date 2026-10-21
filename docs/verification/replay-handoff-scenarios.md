# Replay and disposable handoff acceptance before implementation

> Historical design and implementation context. See [current scoped verification](source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Baseline: `c77d1203954eda57b7781641ee959711d43b7794`. Clean tree and sole checkout
writer confirmed. Continue the project-owned session-intent-review workflow.

## Unresolved compatibility inventory and scope

| Gap | Source | Consequence / disposition |
|---|---|---|
| Concurrent Node history replay can fail after a winning identical batch | `lib/work/history.ts`, lookup before transaction and unique marker insert | Fix by reconciling a failed transaction against the durable matching receipt; changed content remains 400 |
| Query-bearing/unusual-host links and invalid optional join links | Node history validator versus Python `history_validation.py:url` and schedule branch | Documented subset remains; no product policy change or silent sanitization |
| Broader event-date coercions and invalid calendar dates | Node Date.parse versus Python strict helpers | Unsupported forms remain outside rehearsal inputs |
| Nonintegral/unsafe numbers, duplicate keys and lone surrogates | Node JSON versus Python canonical serializer/CLI | Historical payload parity is incomplete; retain rejections |
| Immutable correspondence audit and direction-based cancelled labels | Both history writers | Shared inherited behavior; changing meaning requires separate product decision |
| Decision expiry coercion / malformed task references | Node validation versus Python decision rehearsal | Existing bounded decision parity only; not included in this handoff |
| Hosted D1 and auth/browser/load behavior | SQLite comparison function, synthetic principals | Unverified; no production or hosted cutover claim |

The common supported history subset permits a **history-only disposable handoff**
rehearsal independently of these broader gates. Use the real Node history API
and Python history writer against the same disposable copy, with a persisted
writer/epoch guard in the same transaction as mutations. This is not a complete
application handoff and does not authorize any production writer configuration.

## Observable outcomes

1. Force two actual Node imports past their initial receipt reads. Identical
   requests return one import and one replay; altered-content races return one
   success and one 400. One marker, one version update and one audit event persist.
2. A transaction failure without a matching durable receipt must remain failure;
   never fabricate replay success. Verify rollback and persisted counts.
3. The disposable controller starts with Node writer/epoch 1. Its Node history
   import persists evidence. Transfer under an immediate transaction produces a
   checkpoint and Python/epoch 2. Old-epoch mutations fail without data changes.
4. Python writes newer history on the same copy. Transfer back increments epoch
   again and preserves all post-transfer records and receipts; never restore a
   stale checkpoint file. Node can continue from that current state.
5. Deliberately discard a completed import response. Persist an unresolved
   operation, block handoff/new operations, and reconcile its actual matching
   receipt before continuing. An absent/mismatched receipt remains unresolved;
   it is not retry authority. No real process-kill recovery claim is made.
6. Writer guard is checked inside the SQLite mutation transaction, with stale
   lease denial and audit rollback evidence. Handoff cannot cross an unresolved
   operation. Owner mismatch and source-store misuse remain denied.
7. Source hashes remain unchanged, normal close deletes scratch storage, default
   app imports remain off, and the application Python worker remains read-only
   for legacy routes. No browser evidence is implied.

Use actual API/CLI/storage operations and synthetic fixtures only. No test files,
private sessions, credentials, outside agents, production writes or publication.
Stop at a product/authority boundary; explicitly report remaining migration gates.
