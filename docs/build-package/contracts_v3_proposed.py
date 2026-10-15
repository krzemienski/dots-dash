"""Proposed Python design contracts only; no implemented adapters or validators.

Runtime schema validation, authorization and durable persistence are release gates.
No secrets, private sessions, host paths or operational data belong in this module.
"""
from dataclasses import dataclass
from typing import Literal, Mapping, Protocol, Sequence

RunState = Literal['queued', 'awaiting_approval', 'running', 'cancel_requested', 'stopping', 'canceled', 'succeeded', 'failed', 'unknown']
SessionProvider = Literal['oh_my_pi', 'cursor', 'claude', 'codex', 'other']

@dataclass(frozen=True)
class Scope:
    owner_id: str
    project_id: str
    workspace_binding: str
    capability_grant_ref: str

@dataclass(frozen=True)
class SessionImport:
    provider: SessionProvider
    adapter_version: str
    export_format_version: str
    source_binding: str
    session_id: str
    permitted_export_ref: str
    content_hash: str
    observed_at: str
    consent_ref: str

@dataclass(frozen=True)
class ExecutionRequest:
    request_id: str
    scope: Scope
    host_binding: str
    argv: tuple[str, ...]
    working_directory_binding: str
    expected_revision: str
    payload_hash: str
    idempotency_key: str
    approval_ref: str | None
    write_scope_refs: tuple[str, ...]
    network_policy_ref: str
    budget_seconds: int
    environment_name_allowlist: tuple[str, ...]  # Values are never part of records.
    writer_fencing_token: int | None

@dataclass(frozen=True)
class ExecutionReceipt:
    run_id: str
    state: RunState
    host_binding: str
    process_ref: str | None
    evidence_refs: tuple[str, ...]
    observed_at: str
    external_outcome_unknown: bool

@dataclass(frozen=True)
class TerminalChunk:
    run_id: str
    stream_id: str
    sequence: int
    observed_at: str
    sanitized_text: str
    redaction_policy_version: str
    truncated: bool
    gap_before: bool

@dataclass(frozen=True)
class TestEvidence:
    evidence_id: str
    run_id: str
    revision: str
    environment_fingerprint: str
    command_hash: str
    result: Literal['passed', 'failed', 'not_run', 'unknown']
    exit_code: int | None
    sanitized_artifact_refs: tuple[str, ...]
    started_at: str | None
    completed_at: str | None

class SessionReviewAdapter(Protocol):
    async def capabilities(self, scope: Scope) -> Mapping[str, bool]: ...
    async def import_permitted_export(self, scope: Scope, source: SessionImport) -> Sequence[Mapping[str, object]]: ...

class ExecutionAdapter(Protocol):
    async def capabilities(self, scope: Scope) -> Mapping[str, bool]: ...
    async def submit(self, request: ExecutionRequest) -> ExecutionReceipt: ...
    async def status(self, scope: Scope, run_id: str) -> ExecutionReceipt: ...
    async def cancel(self, scope: Scope, run_id: str, idempotency_key: str) -> ExecutionReceipt: ...
    async def read_output(self, scope: Scope, run_id: str, after_sequence: int | None) -> Sequence[TerminalChunk]: ...
