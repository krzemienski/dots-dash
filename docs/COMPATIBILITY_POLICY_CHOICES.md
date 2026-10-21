# Compatibility choices requiring product input

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Baseline: `5048380a202c82e6e3f96772e59c285fdd73f7d3`. These are explicit
boundaries, not implemented changes. Existing requirements establish preservation
of evidence, idempotency, denial on uncertainty and no external execution. They
do not fully specify the input/representation choices below. Dependent changes
stop here; no silent normalization, redaction or broader import permission occurs.

The separate instruction/decision race fix *is* supported by existing idempotency:
matching concurrent requests now return the original receipt and duplicate:true;
changed requests still conflict. Its actual before/after evidence is in the
supervision workflow (historical local artifact omitted from the public package).

| Choice | Current source and user consequence | Alternatives needing a decision |
|---|---|---|
| Query-bearing / unusual-host source URLs | [Node validator](../lib/work/history-validation.mjs) accepts more HTTPS forms than [Python](../python/dots_engineering/history_validation.py); Python can reject an otherwise usable batch | A: align both on a strict supported URL subset and reject unsupported fresh input. B: expand the shared validated subset with an explicit sanitized-source review contract. Do not silently remove query text or rewrite existing source links. |
| Invalid optional join URL | Node stores null, Python rejects the batch; evidence can be silently omitted in Node | A: reject the fresh batch with a safe validation finding. B: accept other fields and persist an explicit invalid-link finding with approved source provenance. Raw quarantine storage needs its own privacy/schema design. |
| Event date forms and precision | Node Date.parse is broader and can normalize impossible dates; Python accepts a documented strict subset | A: use the same strict calendar-valid grammar for fresh events. B: extend a shared parser for additional valid forms/precision with explicit semantics. Neither option should relabel an impossible date as verified. Preserve historical receipts. |
| Numbers, Unicode and payload hashes | Python deliberately rejects nonintegral/unsafe numbers and lone surrogates; [Node hashes JSON.stringify](../lib/work/history.ts) | A: align fresh imports on the existing bounded domain. B: define and verify a wider versioned serialization contract, preserving old hashes and replay identities. Do not rehash old markers in place. |
| Correspondence audit corrections | Both history writers preserve the first event by ID; newer snapshot status and direction-based cancelled labels can differ from that event | A: keep original audit immutable and define how current snapshot status is separately presented. B: append source-linked correction/revision events. Both retain original evidence; a UI/counting contract is needed. |
| Missing receipt after confirmed owned-worker exit | [Reconciliation](../python/dots_engineering/handoff_rehearsal.py) stays unresolved even when local rollback was observed | A: retain the current blocked state pending explicit review. B: define a safe-abort/retry policy requiring owned-process exit, epoch revocation and operation-specific evidence of no committed effects. Absence alone is never retry authority. |

These alternatives affect user-visible acceptance or stored evidence semantics,
so this package does not choose for the product. No user input was needed for
the completed supervisor/replay slice; input is required before these dependent
contract changes or any broader migration claim.

Process-handle loss is a separate authority boundary. A new supervisor may not
adopt a numeric PID or infer ownership from a recorded label. If the supervisor
that created the worker loses its handles, durable running/launching state stays
blocked. A future recovery design needs provable process identity and ownership;
the current tool neither searches for processes nor signals an unowned PID.

Noncanonical decision expiry, hosted D1 adapters, network-filesystem locking,
Windows, production identity, browser behavior and load remain separate technical
verification gaps. None was resolved by API-only or synthetic-process evidence.
