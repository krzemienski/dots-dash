# Engineering contexts and execution specification

> Historical design and implementation context. See [current scoped verification](../verification/source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Version 3 target design. None of the new provider session adapters, host controls, terminal streaming or subagent orchestration described here is established as shipped functionality.

An optional local Python slice now supports owner-curated v1 visible exports,
strict skill metadata/checklist inventory, evidence-gap analysis, source-linked
remediation, local checklist receipts and owner-reported end-user observations.
This does not establish named provider session compatibility, full skill
execution, host controls or subagent orchestration. See
[the implemented boundary](../SESSION_REVIEW.md).

## Link contexts without collapsing authority
A WorkContext has kind correspondence, engineering, planning or mixed, and links the same Request to relevant threads, project, repository and execution runs. Linking a correspondence request to an engineering task does not grant permission to read an entire mailbox from that execution environment. An engineering result can be attached to a reply draft; it does not authorize sending the reply. Each context retains source coverage, permitted audience and capability grants.

Engineering overview shows repository/worktree, base and current revision, uncommitted changes, active runs, machine availability, terminal observation state, evidence-backed results, completion claims and next work. Correspondence stays a first-class primary view. A split context view can show a thread and the relevant engineering ledger side by side without duplicating private content across providers.

## Provider session review
Oh My Pi, Cursor, Claude and Codex are requested adapter targets, not verified compatible APIs. For each target, establish the exact product/version, ownership, supported documented API or user-permitted export format, authorization, schema and export scope. If no supported route exists, display unavailable and offer an owner-supplied permitted export. Do not inspect denied session storage, hidden caches, credential stores or raw private assistant instruction state. A filesystem denial remains binding even when a different tool, copy or archive could reach the same content.

Accept only permitted user-visible session content: user requests, visible assistant responses, tool execution summaries exposed by that product, code changes, provided artifacts and verification receipts. Do not import hidden reasoning, system/developer instructions, internal assistant notes or secrets. Imported text is untrusted evidence, not a new instruction to the dashboard executor. A transcript saying “tests passed” is a claim until linked to actual run evidence.

Capabilities are discovered independently per installation: list permitted sessions, import export, read supported visible events, link repository revision, lookup action receipt, and optional execution. Review/read integration never implies execute permission. Read-only is the default, and export ingestion remains bounded by owner, project and time window.

The [proposed coverage companion](16-source-coverage-checkpoints.md) defines
persistent tool/project/time inventory, distinct access observations and
snapshot-bound processing checkpoints. It is design-only. Existing review
versions and development evidence ledgers are not transcript-processing progress.

A [bounded companion implementation](../SOURCE_INVENTORY.md) now records
owner-reported inventory/access metadata behind a default-off capability.
It does not implement processing checkpoints, verify original reads or close
the design's functional acceptance gates.

## User-owned project skills and configuration
Inventory only explicitly selected user-owned project files or documented project settings. Show file purpose, relative project path, revision/hash, provenance, inspection status and redaction status. Detect instructions as content for review; do not automatically load or execute them. Exclude credentials, environment values, private assistant instructions and unrelated global files. Repository symlinks and includes must resolve inside the authorized root before reading; blocked targets remain blocked.

Editing a project skill/configuration requires an explicit scoped change request, diff review and normal repository verification. Never treat a project configuration file as authority to expand host access, install software, create credentials or send data externally. Executable configuration must undergo code review before activation. The dashboard can explain settings without exposing their secrets.

## Host and workspace inventory
HostBinding identifies an owner-approved machine/environment using an opaque ID, display label, connection state, supported capabilities and last observed heartbeat. No private IP, hostname or machine path belongs in public artifacts. WorkspaceBinding identifies allowed repository roots, current worktree, sandbox, network policy and mount scope. Display connected, disconnected, stale and unknown distinctly. Never infer reachability from a cached host label.

A host adapter uses the officially supported environment route. Do not create SSH keys, tunnel services, agents, new persistent grants or security changes merely to make access work. Such changes require applicable approval and may be unsupported. Cross-host jobs transfer only explicitly authorized artifacts, not credentials or entire home directories.

## Terminal observation and commands
Terminal streams default to read-only observation of a specifically authorized process. Expose process identity, workspace, start time, sequence cursor, stream state, truncation and redaction status. Never implement an implicit arbitrary shell endpoint. Terminal output is untrusted; neutralize control sequences, HTML, clickable escape links and active content. Redact before storage and delivery; high-risk uncertain output can be withheld entirely. Do not expose environment dumps, secret prompts or raw credential input.

Use bounded sequenced output chunks with stream resume and gap markers, per-client backpressure and maximum retention. Disconnecting the viewer does not imply process cancellation. Output completeness is independent from process exit status. Read-only viewers cannot send stdin, paste, resize in ways with side effects, interrupt or signal a process.

Execution requests bind owner, host, workspace, command argv or reviewed script hash, working directory, allowed environment names, read/write paths, network policy, resource/time budget, expected repository revision and approval reference. Sensitive values are injected through an approved runtime secret mechanism, never copied into command records. Reject stale or altered requests. Show commands and effects before permission when required; imported session text cannot authorize them.

## Concurrency and subagents
Use a durable ExecutionPlan DAG with run IDs, dependencies, assigned scope and evidence gates. Every child gets only its bounded project/task context and permissions. Child capabilities cannot exceed the parent's grant. External agents require the applicable explicit communication authorization. No agent can approve its own expanded access or self-certify a consequential action.

Use isolated worktrees for parallel writers whenever supported. Otherwise enforce a single-writer lease keyed by owner, repository and overlapping path set. The lease uses monotonically increasing fencing tokens; all writes/merges must validate the current token at the executor boundary. A UI lock alone is insufficient. Lease expiry does not prove the old process stopped; quarantine uncertain writes and reconcile before reassignment. Read-only reviewers can run in parallel on a pinned snapshot.

Assign one integrator for branch merges. Recheck base revision and uncommitted state before applying changes, and preserve user edits. Never automatically reset, stash, force-push or delete work to resolve contention. A child produces artifact hashes, diff/base/head references and actual checks. The parent compares expected result to evidence and records unresolved gaps.

## Safe cancellation
Run states: queued, awaiting_approval, running, cancel_requested, stopping, canceled, succeeded, failed and unknown. Cancel intent is idempotent and scoped to the run tree. Stop scheduling children, request cooperative stop, and confirm process/child termination. Forced termination needs appropriate authority and must target only owned processes. External side effects already completed remain recorded; cancellation does not undo a sent message, push or payment.

Persist checkpoints and partial artifacts safely. On lost host contact, mark outcome unknown, not canceled. Do not resubmit an unknown command that could duplicate effects. Reconcile process status, repository revision and provider receipts before restarting. A cancel acknowledgement is not proof all descendants stopped.

## Completion and next work
A CompletionClaim names a concrete expected outcome and links code diff, revision, test execution, artifacts and deployment evidence where relevant. Distinguish code written, tests passed, committed, pushed, CI passed and deployed. Missing evidence leaves the claim unverified. Test result relevance expires when tested files, dependencies or environment assumptions materially change.

The bounded local [runtime relevance implementation](../BROWSER_RUNTIME_RELEVANCE.md)
compares only recorded allowlisted dependencies and explicit host-bound runtime
inputs on demand. Its assessment is separate from the immutable historical
outcome. Proven changes are stale; unavailable or unmeasurable fields are unknown,
with field-level matches retained as scoped evidence. No new execution or access
authority follows from the assessment. It does not implement continuous monitoring
or full environment equivalence.


Daily summaries cover the owner's chosen time zone and bounded period, identify coverage gaps, and separate requested work, actual changes, verified outcomes, pending decisions, failures and next steps. Summaries cite underlying event/evidence IDs and preserve corrections. A daily summary schedule requires a real configured scheduler and opt-in notification destination; it is not implied by this specification.

Next-work prompts are reviewable drafts scoped to project, current revision, unresolved request and safe available capabilities. They must exclude secrets and internal instructions, cite evidence and known blockers, and never authorize execution or new access. One click to copy is distinct from approve-and-run. Any execution handoff must create a separately bounded authorized run.

## Bounded local context-link implementation

The [request association slice](../REQUEST_CONTEXT_LINKS.md) references an existing
canonical imported commitment from a local repository-task association, then pins
a session review by ID/version/project/revision. Opaque repository metadata grants
no filesystem access. The host supplies request metadata; clients cannot supply
permission state. Read projections distinguish stale and missing targets, and
request coverage truncation remains unknown. The implementation is source-checked;
actual synthetic browser acceptance is blocked, so no functional V301 claim follows.
