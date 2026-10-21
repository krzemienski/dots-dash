# Artifact roles in evidence: bounded acceptance

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Baseline: `7fa91417623e150805563f4e078b8864bb25a521`.
Goal: while inspecting drift evidence or a historical workflow receipt, distinguish
a recorded build-output change from evidence of an implementation edit.

## Observable acceptance, defined before implementation

These cases were defined before implementation. All six were exercised on
2026-10-20 with sanitized TEST DATA and owned disposable resources; see the
completed browser verification below.

| User steps | Required observable result |
| --- | --- |
| Inspect a receipt after changing only a disposable served bundle listed in its input manifest. | The changed entry is labeled recorded build output. Staleness remains, historical outcome stays intact, and no implementation-edit claim follows. |
| Inspect a changed or unavailable file listed in the receipt's recorded files. | Its manifest membership is shown, while its implementation role remains unknown. A recorded fixture, build manifest or configuration file is not automatically implementation evidence. |
| Inspect an old response without role metadata, or an ambiguous/unrecognized manifest membership. | The displayed file role is unknown; no role is inferred from its name, extension or hash. Existing responses remain usable. |
| Inspect imported evidence whose source kind says project artifact or execution receipt. | Artifact role remains unknown; owner attribution, revision comparison and original outcome remain separate from producer-bound evidence. |
| Inspect receipt screenshots and observation artifacts. | They are identified as workflow evidence outputs, not implementation edits or evidence that generated application bundles are correct. |
| Reload the same historical receipt. | Its stored content, hash, result and scope remain unchanged. Role annotations are derived on read from its existing manifest; no extra files are read and no rerun is authorized. |

## Implementation boundary

The optional `measurement.fileRoles` response field describes only names already
listed in the bounded changed/unavailable arrays. Exact membership in the owned
receipt's existing `inputs.bundles` identifies recorded build outputs; exact
membership in `inputs.files` identifies recorded files whose implementation role
is unknown. Conflicting or absent membership stays unknown. This describes the
historical manifest role, not the current file's producer or semantic impact.

No persisted contract or receipt changes. The Python export, storage, hashes,
staleness calculation, compatibility policy and correction semantics stay intact.
No new file discovery, provider call, execution, background scan or authority is
introduced. Generic imported events still lack a structured producer/role contract;
that compatibility decision remains pending.

Approval for isolated verification was recovered on 2026-10-20. After the parent
released browser allocation, the owned workflow completed. Browser resources are
closed and allocation has been released again. Static and API checks remain
separate from the actual UI observations below.

## Delivered change and static evidence

The [owned receipt reader](../server/browser-receipt-reader.mjs) derives bounded
role annotations after its existing integrity checks. The
[receipt view](../ui/browser-receipts.tsx) displays them with an unknown fallback
for older responses, and labels observation/screenshot artifacts as workflow
evidence outputs. [Imported evidence](../ui/session-review.tsx) explicitly retains
an unknown artifact role. The existing measurement status calculation and all
receipt fields remain unchanged; the only API addition is optional role metadata.

Static checks passed (exit 0): `npm run typecheck`, `npm run build` using
`PATH=/opt/homebrew/bin:$PATH`, and
`/opt/homebrew/bin/node --check server/browser-receipt-reader.mjs`.
`git diff --check` also passed. The build only regenerated ignored local `dist/`
outputs; it did not start the application or publish anything.

During implementation, no test files were added and no tests or end-user workflows
ran. No runtime data was opened. At that checkpoint all six rows were unperformed;
prior workflow receipts retain their original revision. The broader
producer/role contract for imported evidence still requires a compatibility decision.

## Authorized non-browser verification, 2026-10-20

The retained workflow (historical local artifact omitted from the public package)
exercised source revision `44d26427f284760d2dbb76e92352c6e70f94453f` through the real
in-process API handler, Python worker and disposable SQLite stores. It used a
fixed synthetic principal and a sanitized TEST DATA export (historical local artifact omitted from the public package).
This did not exercise an HTTP listener, production authentication or a browser.

All 18 recorded checks passed: authorization/origin rejection, import and replay,
conflicting replay rejection, preserved claim/evidence attribution, retained
superseded claim and skill metadata, disabled execution, no invented artifact
role or browser receipt, owner-reported gap, no-skill import, persisted reload,
unchanged storage bytes across reads and original audit snapshot preservation.
Three intended writes produced three operation records and three audit snapshots.
The report retains the actual sanitized readback, snapshots and source hashes.
Both stores were closed and disposable storage was removed.

No defect was observed in those API/storage checks. They did not verify the role
projection or rendered display; all six UI scenarios were still pending at that
checkpoint.

## Completed browser verification, 2026-10-20

Verified runtime source: `1d54ae105fadae850959e487e4b0cae303407855`.
The final workflow (historical local artifact omitted from the public package)
and hash-bound evidence index (historical local artifact omitted from the public package)
retain a fresh completed/pass fixed-runner receipt, actual viewer observations,
API readback, original audit snapshots, source hashes and closure results.

| Existing scenario | Observed result |
| --- | --- |
| Changed build output | `dist/main.js` in a disposable measurement copy became stale and displayed recorded build output; original pass/hash remained. Screenshot (historical local artifact omitted from the public package) |
| Changed/unavailable recorded file | Both states retained recorded-file membership and unknown implementation role. Restoring the copy restored matching file relevance. Changed (historical local artifact omitted from the public package), unavailable (historical local artifact omitted from the public package) |
| Older response without role metadata | The unmodified reader from `7fa9141` served the actual ledger without `fileRoles`; the current UI displayed unknown. No response stub or fabricated receipt. Screenshot (historical local artifact omitted from the public package) |
| Imported artifact/receipt source kinds | Both retained owner-export attribution and unknown artifact role. Screenshot (historical local artifact omitted from the public package) |
| Workflow evidence outputs | Actual producer screenshot/observations were labeled workflow outputs; their hashes matched. Screenshot (historical local artifact omitted from the public package) |
| Reload and history | The selected review and owner-reported gap persisted; original audit snapshot, producer database bytes, receipt hash and ledger bytes stayed unchanged. One producer run remained. Screenshot (historical local artifact omitted from the public package) |

The completed run recorded 36 passing observations/checks, no page errors and no
horizontal overflow at 390px. Related coverage checks observed separate selection,
event and skill roles sharing one reference, retained superseded event references,
and the no-skill case. The source coverage capture (historical local artifact omitted from the public package),
narrow receipt capture (historical local artifact omitted from the public package)
and accessibility readback (historical local artifact omitted from the public package)
were retained. A separate viewer used fresh application stores and changed only
disposable measurement copies; those changed files were not executed or served.

No application defect required a code change. Earlier attempts are retained:
attempt 1 stopped before UI readiness after sandboxed Chrome startup failed;
a separate startup diagnostic observed SIGABRT and EPERM. The scoped retry was
approved. Attempt 2 passed the artifact displays but its exact label lookup for
Result timed out; the captured accessibility tree identified a Result combobox.
Using that observed role allowed attempt 3 to finish. All attempts confirmed owned
cleanup; no unresolved browser, driver, server or storage resource remains.

Limits: fixed synthetic workflow and synthetic host identity, not production
authentication or full product acceptance. The older-response branch was observed;
ambiguous/unrecognized manifest membership was not fabricated or exercised.
Dependency/runtime coverage remains explicitly incomplete. No full skill/provider
invocation, private source inspection, imported producer contract or compatibility
migration was established. No test files, external publication, merge or deployment.
