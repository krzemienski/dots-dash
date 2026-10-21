# Request claims, context and missing evidence

Requests now shows Requested, Done — recorded claim, Still pending, Next step
and Needs you with visible request-level sources and evidence gaps. This is a
read projection of existing commitment fields, not a new completion verifier.

## Why the projection changed

[FR04](build-package/02-prd-v2.md) requires accountability with evidence. Previously,
the Requests view described all imported records as verified snapshots, colored
completed status green and hid sources inside a disclosure. The current schema
supplies `completedSummary`, `sourceUrls`, `evidenceLevel`, a conversation
reference and related-record IDs. It does not map receipts to individual actions
or establish who performed them. The UI must not infer that missing relationship.

[Commitments](../ui/commitments.tsx) now labels status and completion summaries as
recorded claims. Missing source support is explicit; a supplied URL or evidence
note stays request context, not proof that an action occurred. HTTPS links without
embedded credentials can be opened deliberately; rendering never fetches them.
Unknown actor and source completeness remain visible with a source-coverage link.
Empty pending text does not establish completion; an unset Needs you flag does
not prove that no input is needed. Paused status and failed/pending text survive.

Related records remain navigation context. Existing opportunities open their
exact detail; task navigation uses the resolved canonical record ID. Project and
schedule buttons explicitly open their existing lists. Missing related IDs are
shown as unavailable in this snapshot instead of silently disappearing. No link
grants sending or execution permission. Exact request hash navigation, filters,
reported dates and the existing instruction flow remain in place.

## Observed result and limits

[Acceptance](verification/request-evidence-scenarios.md) was written before code.
The [source-bound ledger](verification/request-evidence.json) records 15 passing
observations through the built React UI, real Node API and isolated SQLite with
synthetic TEST DATA. It covers unsupported completed claims, partial evidence,
paused/unflagged requests, missing references, opportunity navigation and return,
keyboard disclosure and source focus, claim search, exact-ID reload, failed read
recovery, delayed-read navigation, 320/375px wrapping, unchanged durable records,
saved-not-delivered instructions, owner isolation and default-off imports.

The first driver stopped after 12 observations because it asserted a nonexistent
`instructions.delivery_state` column. The corrected fresh run inspected `status`
and passed; the earlier attempt is not counted as final acceptance. Owned resources
closed. No external browser requests or page errors occurred. All 14 existing tests,
typecheck, build, source/build hash checks, documentation links and diff checks passed.
No new test files, API, storage schema, migration or provider were introduced.

This does not establish actual-user V301, external source contents, production
identity, full screen-reader acceptance or the correctness of supplied claims.
The present-task modal and positive project/schedule list branches were inspected
in source, not exercised by this fixture. Prior reports keep their original source
bindings. FR04 remains partial.

Next model-level task: define an explicit versioned completed-action claim and
its evidence association, including receipt provenance, scope, uncertainty and
contrary evidence. Keep request-context links separate. Do not add certification
or change status until that contract and its observable acceptance are agreed.

The [proposed v1 action-claim contract](REQUEST_ACTION_EVIDENCE_CONTRACT.md) now
defines that first bounded owner-report slice and A1–A12 acceptance. It is design
only: no migration, API, binding persistence or completion certification has shipped.

Subsequently, the [owner-reported action claim companion](REQUEST_ACTION_CLAIMS.md)
implements that bounded contract with a separate default-off capability and explicit
migration. Its results are recorded separately; completion certification remains absent.
