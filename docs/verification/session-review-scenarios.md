# Session review acceptance, defined before implementation

> Historical design and implementation context. See [current scoped verification](source-review-publication.md) for newly performed checks and remaining gaps. Historical runtime artifacts are not distributed; references to local artifacts below are not public evidence.

Scope: local isolated owner instance; synthetic data explicitly labeled TEST DATA.
Apply user-owned ak:scenario (scenario discovery only). No test-file execution.

| Goal / dimension | User steps | Observable acceptance | Severity |
|---|---|---|---|
| Understand intent / business logic | Import selected sanitized export; open session review | Goals, decisions, expected observable behavior and user steps retain source event references | High |
| Find gaps / business logic | Review a completion claim with no outcome receipt | Unverified claim, missing verification finding and linked remediation draft; never completed by transcript alone | High |
| Detect drift / business logic | Import action without a goal association; inspect critique | Evidence-scoped possible drift, not a claim of proven disobedience | High |
| Select skills / integration | Import selected owner skill metadata and checklist; select for remediation | Applicability and selection are distinct from an actual bounded checklist invocation | High |
| Execute review / state | Authorize pinned local checklist; inspect receipt | Actual local checks, revision/hash/skill pin, task reference, result and evidence persist; external behavior stays gap | High |
| Verify behavior / integrity | Record steps actually performed with observed result and source reference; rerun review | Owner-reported observation distinct from independent verification; pass/fail/gap persists with history | High |
| Privacy / input | Submit hidden fields, credentials canary, control sequences | Unknown fields rejected; recognized secrets and controls removed before persistence; opaque sources only | Critical |
| Boundaries / authorization | Anonymous, wrong owner, wrong Origin, import disabled, runner disabled | Deny without revealing records or executing | Critical |
| Integrity / input | Wrong format, dangling goal, duplicate IDs, invalid dates | Reject atomically with generic error | High |
| Retry / timing | Repeat same request ID, then alter payload | One durable outcome; changed content conflicts | High |
| Pinning / timing | Change review version or selected skill after authorization | Stale request rejected, authorization cannot widen capability | Critical |
| Recovery / state | Reopen database; repeat uncertain request | Saved history and receipts survive; no blind external replay | High |
| Availability / error | Python unavailable, read fails, empty export | Honest disconnected/error/empty UI; no fabricated success | High |
| UI / environment | Signed-in user opens review and completes flow | Keyboard-readable controls, source anchors, persisted outcomes; browser proof pending allocation | High |
| Compatibility / integration | Read work/history; save instruction in existing app | Existing shapes and saved-not-delivered semantics remain | High |

Scale is bounded (100 events, 20 goals, 20 skills per export); unbounded archive ingestion is excluded. Billing/legal workflows do not apply. Mobile, screen-reader and production identity verification remain explicit gaps until performed.
