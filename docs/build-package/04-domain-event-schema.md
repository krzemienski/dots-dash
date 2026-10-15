# Domain and event schema

Status: proposed target contract. Existing interfaces remain narrower. The adjacent TypeScript file is a design artifact until runtime validation, persistence migration and compatibility tests are implemented.

## Entity relationships
Owner owns Projects, Requests, Tasks, SourceAccounts and preferences. Request links to zero or more Tasks; Task links to Actions, NeedsUser items, Threads, Opportunities and ScheduleItems. Action has Attempts and zero or more Outcomes. Outcomes cite Evidence. Evidence belongs to a SourceAccount and identifies the exact supported claim. All associations are owner scoped.

Every persistent entity has opaque id, ownerId, schemaVersion, version, createdAt and updatedAt. Dates are explicit ISO instants or date-only values; never ambiguous strings. Runtime schemas must reject unknown properties in action/approval payloads. Informational adapter extensions may be namespaced and bounded.

## Additional fields
| Entity | Required domain fields and constraints |
|---|---|
| Request | body, requestedOutcome, origin, acceptanceState, taskIds, authorizationRef nullable; body is not an external-action permission by itself |
| Task | title, goal, state, projectIds, requestIds, nextStep, nextStepOwner, due nullable, dependencyIds, evidenceIds, verifiedAt nullable |
| Action | type, targetRef, boundedPayloadHash, payloadVersion, taskIds, authorizationRef nullable, state |
| Attempt | actionId, attemptNumber, idempotencyKey, startedAt, finishedAt nullable, result, providerReceiptRef nullable, safeError nullable |
| Outcome | actionId nullable, taskIds, claim, evidenceIds nonempty for confirmed claims, verification, actorAttribution |
| NeedsUser | reason enum, prompt, blockingIds, approvalId nullable, state, dueAt nullable |
| Thread | accountId, providerThreadId, subject, participantRefs, messageIds, associations, replyState, replyBasis |
| Message | threadId, providerMessageId, direction, status, sourceTime, observedAt, summary, evidenceIds, actorAttribution |
| Opportunity | category role/consulting/project_advice/unknown, classificationBasis, organization, title, lifecycle, nextStep, threadIds |
| ScheduleItem | type calendar/itinerary/deadline, timed or all-day shape, participation, scope, sourceRevision, status, evidenceIds |
| Scheduler | providerScheduleId, accountId, recurrence, timeZone, enabled, lastObservedAt, nextRunAt nullable, nextRunBasis |
| SchedulerRun | schedulerId, providerRunId, state, startedAt nullable, completedAt nullable, evidenceIds |
| SourceAccount | opaque identity binding, provider, capabilities, coverage interval, connection state, configured interval nullable, lastAttemptAt, lastSuccessAt, cursor reference |
| Approval | actionId, payloadVersion and hash, authenticated decision identity, requestedAt, expiresAt nullable, decision, decisionAt nullable |

## Evidence and time
Use occurredAt for source event time, observedAt for retrieval, ingestedAt for durable commit, reconciledAt for last consistency check, and verifiedAt for claim verification. These are not interchangeable. Date-only source time stays date-only. Null means unknown; do not fill with ingestion time.

Evidence stores source account and object IDs, optional verified HTTPS URL, source revision, claim, verification level and safe summary. Restricted content remains in an access-controlled store; links alone confer no access. Attribution requires its own evidence: an application receipt or sent message alone does not identify the acting agent.

## Event envelope
Event IDs and sequence cursors are independent of provider IDs. Envelope fields: schemaVersion, eventId, ownerId, entityType, entityId, entityVersion, eventType, correlationId, causationId nullable, actor, occurredAt nullable, observedAt, committedAt, evidenceIds and a bounded typed payload. Browser projections omit secrets and restricted bodies.

Event types include request.saved, request.delivered, request.accepted, task.changed, action.proposed, action.attempted, action.outcome_confirmed, action.outcome_unknown, approval.requested, approval.decided, correspondence.observed, schedule.changed, scheduler.run_observed, source.checked, source.failed, evidence.corrected and record.tombstoned.

## Version and migration rules
Additive optional fields may increment minor contract version; semantic changes require a new major parser and explicit migration. Preserve raw provider revision separately. Import legacy records as snapshot evidence with known provenance, not invented historical events. Reconcile conflicting legacy task/opportunity records explicitly and preserve both sources in the correction event. Existing saved-not-delivered instructions stay undelivered throughout migration.

## Version 3 engineering entities
ContextLink: source/target entity IDs, relationship, scope and evidence. ProviderSession: provider and adapter/export versions, owner binding, permitted export reference/hash, visible event coverage, observedAt and consent reference. ProjectConfig: project-relative path, revision/hash, type, ownership basis and redaction state; secret values excluded.

HostBinding: opaque host ID, label, capability set, connection state and last observed time. WorkspaceBinding: host, repository binding, allowed roots/policy references and sandbox. RepositorySnapshot: repository ID, worktree binding, base/head revision, dirty-state evidence and observed time. ExecutionPlan: request, DAG nodes/dependencies, budget, policy and version. ExecutionRun: plan/node/parent IDs, state, scope, argv/script hash, approval, idempotency and receipt references. WriterLease: owner/repository/path-set key, holder run, monotonic fencing token, expiry and reconciliation status.

TerminalChunk: run/stream/sequence, observed time, sanitized content reference, redaction policy version, truncation and gap flags. TestEvidence: command hash, run, exact revision, environment fingerprint, exit/result, start/end time and sanitized artifact references. CompletionClaim: expected outcome, claimed state, supporting evidence, verification state and supersession reason. DailySummary: owner-local interval, source/event cursor range, coverage, claims/evidence and revision. NextWorkPrompt: project/revision, request links, proposed scope, dependencies, sanitized draft and execution-request reference nullable.

New events: context.linked, session.imported, config.reviewed, repository.observed, execution.requested, execution.started, execution.cancel_requested, execution.termination_confirmed, execution.outcome_unknown, writer.lease_acquired, writer.lease_revoked, terminal.chunk_observed, test.completed, completion.claimed, completion.verified, summary.generated and next_work.drafted. A claimed event never substitutes for a verified event.

The Python design contracts are additive proposals. Runtime validators must enforce safe sizes, scope, time formats, run transitions, fencing and approved capabilities before these records become executable.
