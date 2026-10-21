# Declared-review evidence relevance

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

This local slice exposes evidence revision relevance without changing stored
outcomes or trust. An evidence card displays its code revision beside the
declared review revision and explicitly marks a mismatch as stale for that review.
Matching metadata does not establish independent verification or live-checkout
relevance. Hash counts and missing input provenance are visible.

Implementation is limited to `ui/session-review.tsx`. Existing Python v1 required
revision validation, owner attribution, findings, receipts, compatibility choices
and Node live-writer authority are unchanged. Imports and execution keep their
production denial defaults. No provider or command adapter was added.

## Actual workflow and retained evidence

[Acceptance scenarios](verification/evidence-relevance-scenarios.md) preceded the
implementation. The workflow record (historical local artifact omitted from the public package)
contains actual UI/API readback, source hashes and artifact hashes. Browser-tested
source revision: `07767b1ac8fb166e2560af7e28ff6e816764fd12`.

The earlier assessment-context browser report is real verification evidence from
a synthetic local workflow. Its recorded verified source hashes were compared to
Git blobs at `4f40741f79a7c5227f8b54e10f7dbc6f05cdc43d`; all recorded artifacts
matched their SHA-256 values. This inspection binds the report to those source
contents, not every environmental input or production behavior. The new export
wrappers are explicitly TEST DATA. Their opaque artifact reference and hashes
refer to that report; the application does not itself authenticate that binding.

The actual rendered import workflow established:

- Matching declared revision: HTTP 200; visible matching label, exact revisions,
  historical scope/result and `owner_provided_export` attribution.
- Changed revision: HTTP 200; visible stale label against the genuinely changed
  local source revision. The earlier evidence event, hashes and pass outcome were
  unchanged. The finding's source link focused that evidence card.
- Returning to the older review preserved its entire stored value. Refresh and
  reload also preserved both reviews, with no check runs or owner observations
  created. Completion claims retained `export_claim` attribution.
- Missing evidence `codeRevision`: HTTP 400 and visible rejection. Refresh and
  reload retained exactly two reviews; no partial review or invented revision.
- At 390 pixels, the persisted stale card remained readable with no horizontal
  overflow. The only console errors were favicon 404 and the expected HTTP 400.

See the matching card (historical local artifact omitted from the public package),
stale card (historical local artifact omitted from the public package),
rejection (historical local artifact omitted from the public package) and
persisted mobile view (historical local artifact omitted from the public package).
The dedicated browser was closed, the owned server exited successfully and
disposable storage/profile were removed. No application tabs or private data were
used. Typecheck and client build passed; these are compilation checks, not the
behavioral evidence above. No test files or arbitrary project checks were added.

## Exact remaining boundary

[V310](build-package/14-python-migration-and-v3-acceptance.md) remains open. The
application has no trusted check-issuer/artifact-validation adapter, validated
environment fingerprint or live relevant-input invalidation. The proposed
`TestEvidence` type in `build-package/contracts_v3_proposed.py` is not an
implemented ingress authority. An imported artifact cannot silently become an
authenticated execution receipt. The current v1 missing-revision rejection is
preserved; accepting unknown-revision evidence would require a separate contract
decision. No compatibility choice is resolved by this slice.

Useful next prompt, requiring a concrete authority decision before execution:

> Define the permitted issuer and local artifact access for one existing real
> product verification workflow under V310 and the proposed TestEvidence model.
> Specify who can attest run identity, exact source/input hashes, environment,
> result and artifact integrity, and which changes invalidate relevance. Preserve
> owner reports and imported evidence at their original trust level. Implement
> only the authorized bounded adapter; do not invent project commands, run a
> provider, reinterpret missing revisions, enable production execution or change
> compatibility policies. Retain failed/stale evidence and prove the behavior
> through the existing UI and disposable persisted storage.
