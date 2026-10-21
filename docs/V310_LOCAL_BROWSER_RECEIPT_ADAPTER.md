# Local browser receipt adapter specification

> Historical design and implementation context. See [current scoped verification](verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Status at design baseline: design only; no runtime adapter or new browser run. Inspection baseline:
`1a21e68d82990d2f06ae368341f6b8f0cfc6ee39`. The user has selected the existing
authorized isolated local browser workflow as the candidate producer. No new
credentials, source grants or user choice of technical design is required.

Implementation follow-up: [owned local browser receipts](OWNED_BROWSER_RECEIPTS.md)
now documents the bounded adapter and actual new-run evidence. The inspection
below remains the historical reason for its design, not the current capability
status. Historical browser reports were not retroactively authenticated.

## Finding: the unsupported link

The historical browser runs are useful actual observations, but the application
did not create a pending verification run before launching their producer or
receive results through a channel bound to an owned producer handle. It cannot
retrospectively establish that relationship from a JSON report, screenshot,
matching hash, CLI session name or an imported `sourceKind` value.

The missing edge is:

`application-owned pending run -> owned browser-workflow producer -> bounded
result/artifact channel -> application-authored immutable verification receipt`.

This is a technical integration gap, not a request for broader authorization.
It cannot be established using the currently supported receipt path alone.
Another manually driven browser run would produce more useful observations but
would not repair this edge. No such run was started during this inspection.

## Inspected evidence and source constraints

- Saved workflow (historical local artifact omitted from the public package): source hashes
  were compared again with Git blobs at
  `07767b1ac8fb166e2560af7e28ff6e816764fd12`; every listed artifact hash matched
  its current bytes. Its saved UI/API readback preserves two reviews, an unchanged
  historical evidence event and a rejected missing revision. This is content
  correspondence, not a newly authenticated execution result.
- Earlier browser workflow (historical local artifact omitted from the public package):
  synthetic identity, isolated Chrome, Node API/Python worker and SQLite; owner
  observations and checklist receipts remain separately attributed. Both reports
  record browser shutdown and removal of temporary storage/profile. The old
  live handles and disposable databases are not an available receipt authority.
- [Import normalization](../python/dots_engineering/contracts.py): every imported
  nonclaim event receives `owner_provided_export`, even when `sourceKind` says
  `execution_receipt`. Claims receive `export_claim`. Keep this invariant.
- [Service](../python/dots_engineering/service.py): only `LocalChecklistRunner`
  may execute through `run`; its receipt is generated in that service call.
  `observe` creates `owner_reported` observations. Neither action accepts a
  trusted browser result. [Runner](../python/dots_engineering/runner.py) explicitly
  reports `declarative_checklist_only` and `not_independently_verified`.
- [Node transport](../server/engineering.mjs) owns a fixed per-request Python
  child through pipes, with a ten-second timeout. It is not a retained browser
  supervisor. [Worker](../python/worker.py) exposes engineering and legacy-read
  modes only. Do not stretch an HTTP request or SQLite transaction around a
  browser workflow.
- [Owned rehearsal supervisor](../python/dots_engineering/rehearsal_supervisor.py)
  accepts only history/instruction/decision envelopes and launches the fixed
  `server/supervised-rehearsal.mjs`. Its handle registry cannot adopt another
  process. Its receipts attest domain operations and confirmed process exit,
  not browser behavior, environment or artifact production. Reuse its ownership
  and uncertainty rules as a design pattern; do not broaden its command input.
- [Proposed TestEvidence](build-package/contracts_v3_proposed.py) supplies useful
  fields, not an implemented ingress or producer-authentication mechanism.
  [V310](build-package/14-python-migration-and-v3-acceptance.md) still requires a
  real check tied to revision/environment/result with later relevance changes.

## Smallest prospective adapter

Name: `isolated_browser_workflow_v1`. One fixed workflow: the already authorized
session-review import, source navigation, rejected missing revision and persisted
reload journey, using labeled synthetic fixtures and disposable storage. It
does not run imported instructions, selectable shell commands or arbitrary URLs.
This is prospective production code for a bounded local adapter, not a test file
or an excuse to run an unrelated check.

1. **Prepare and pin.** A host-controlled local coordinator creates an opaque
   run ID and pending row before spawn. Pin owner, review/goal IDs, expected
   review version, explicit authorization scope, fixed workflow ID/version/hash,
   exact Git revision and an allowlisted input manifest. Include source bytes,
   served bundle bytes, lockfile and synthetic fixture hashes. Use an isolated
   source/build snapshot; if the served bundle cannot be bound to its source
   inputs, leave that binding unresolved. Never substitute HEAD or silently
   label a dirty tree as a clean revision. No automatic build/install commands.
2. **Own the producer.** Launch only the fixed driver with a retained child
   handle and inherited pipes, sanitized environment and per-run output root.
   The driver creates its own isolated browser/profile and loopback-only host;
   it must demonstrably own their lifecycles. A CLI returning after starting a
   detached daemon is insufficient unless a supported ownership/close protocol
   is established for that daemon. Never attach to existing tabs, adopt PIDs,
   scan processes or use a global browser session registry. If this prerequisite
   fails, do not launch the workflow or mark it verified.
3. **Measure the actual environment.** Record versions and executable/content
   identities for the actual browser, driver, Node and Python, plus platform,
   viewport, locale/timezone, dependency lock and served bundle/fixture hashes.
   Hash the canonical allowlisted environment manifest. Exclude host paths,
   credentials and arbitrary environment variables. A fingerprint identifies
   this environment; it does not establish production equivalence.
4. **Receive facts through the owned channel.** Accept only bounded, versioned
   step observations, actual persisted readback and artifact identifiers from
   that child's inherited pipe. The coordinator supplies run/revision/owner
   identity from its pending record, never from imported evidence. A run ID is
   correlation, not a bearer credential. No public finish endpoint, disk inbox,
   caller-supplied `trusted` flag or general receipt-import action.
5. **Finalize bounded artifacts.** Read only fixed relative output names beneath
   the owned run root; reject symlink/path replacement, unexpected file types,
   excessive counts/size and incomplete output. Copy/hash finalized bytes into
   owner-scoped receipt storage before cleanup; retain only sanitized snapshots,
   screenshots and structured observations from the synthetic local workflow.
   Recheck input identities before completion. An output hash by itself is not
   proof of observation; the owned channel supplies the production relationship.
6. **Persist without rewriting history.** Keep a separate append-only receipt
   ledger, linked to the pending run and review/goal, with transactional unique
   run/request identity and append-only transitions. Record `prepared`, `running`,
   `completed`, `not_started` or `outcome_unknown`; record the workflow's result
   separately as pass/fail/gap. A zero exit alone is never a pass. Persist the
   observed interval, actual process exit, manifest hashes and artifact hashes.
   Finalization is idempotent: same digest returns the original receipt; a
   conflicting digest rejects. No second dispatch on replay or lost response.
7. **Project limited authority.** Display `local_workflow_observed`, meaning
   emitted by this host-owned adapter for the named synthetic journey. It is
   independent of imported completion claims, not an external certification or
   production acceptance. Leave existing imports, owner reports, checklist runs
   and remediation statuses unchanged. A review edited during execution keeps
   the old receipt but cannot inherit a current pass. Compare pinned revision
   and actual input manifests for relevance; unknown comparisons stay unknown.

Use a separate host-internal service operation for finalization, unavailable to
the public action normalizer. The coordinator is the sole receipt writer; the
driver never writes that ledger. Keep the normal Node writer and existing
engineering ledger ownership unchanged. Default capability remains disabled.
No cryptographic credential is necessary for parent-owned pipes within this
local process boundary. This does not protect against a malicious same-user
process that can alter the host code, executable or SQLite files; it must not be
advertised as such.

## Required actual acceptance before shipping the adapter

Use the existing isolated browser journey, not fabricated pass payloads. A fresh
run must have a pending row created before launch, observed UI actions and reload,
confirmed owned-process completion, preserved artifacts and exactly one receipt.
Read it back alongside unchanged imported events, owner reports and old receipts.
Then compare a genuinely changed relevant revision/input: retain the earlier
outcome and show stale relevance. Missing required revision prevents launch.

Exercise the actual local result boundary with a conflicting replay, changed
artifact/input and interrupted owned producer: none may mint a successful receipt
or authorize automatic retry. Losing a process handle leaves outcome/exit
uncertain; do not infer cancellation, signal by PID or delete its storage. These
are acceptance scenarios for a future adapter, not outcomes established here.

## Next-work prompt

> Implement the fixed isolated_browser_workflow_v1 coordinator/driver boundary
> described here, reusing the existing authorization for the isolated local
> browser workflow. First establish retained ownership of its driver, browser
> and local host, a host-created pending record and inherited result channel.
> If supported tooling cannot establish those links, stop with the exact missing
> mechanism; do not fall back to trusted JSON import. Keep source/artifact reads
> within the already permitted workspace and owned disposable run root. Run only
> the named end-user workflow, preserving prior history, Node writer authority,
> compatibility choices and publication hold. No test files, arbitrary project
> commands, credentials, production access, existing tabs or outside agents.
> Verify actual receipts and failure/unknown outcomes before advertising V310.

No new user decision is needed for this design. A future request is warranted
only if implementation exposes a specific access or execution requirement beyond
the already authorized local workflow. This inspection added documentation only;
no runtime changes, new browser execution or independent verification claim.
