/** DESIGN CONTRACT ONLY. No endpoints, validators or adapters are implemented by this file. */
export type ID = string;
export type Instant = string; // Runtime validator: RFC3339 timestamp with offset.
export type DateOnly = string; // Runtime validator: valid YYYY-MM-DD calendar date.
export type Verification = 'confirmed' | 'observed' | 'inferred' | 'unknown';
export interface Entity { id: ID; ownerId: ID; schemaVersion: 1; version: number; createdAt: Instant; updatedAt: Instant }
export type TaskState = 'planned' | 'in_progress' | 'waiting' | 'blocked' | 'completed' | 'canceled' | 'unknown';
export type DeliveryState = 'unconfigured' | 'pending' | 'delivered' | 'failed' | 'unknown';
export interface Attribution { kind: 'owner' | 'assistant' | 'other' | 'unknown'; identityRef: ID | null; evidenceIds: ID[] }
export type SourceTime = { kind:'instant'; occurredAt:Instant } | { kind:'date'; occurredDate:DateOnly } | { kind:'unknown' };
export interface Evidence extends Entity { accountId:ID; providerObjectId:string; providerRevision:string|null; sourceUrl:string|null; sourceTime:SourceTime; observedAt:Instant; ingestedAt:Instant; reconciledAt:Instant|null; claim:string; verification:Verification; summary:string }
export interface Task extends Entity { title:string; goal:string; state:TaskState; projectIds:ID[]; requestIds:ID[]; nextStep:string|null; nextStepOwner:'owner'|'assistant'|'external'|'unknown'; dependencyIds:ID[]; evidenceIds:ID[]; verifiedAt:Instant|null }
export interface InstructionEnvelope { schemaVersion:1; instructionId:ID; ownerBinding:ID; destinationBinding:ID; taskId:ID|null; requestId:ID; body:string; expectedTaskVersion:number|null; createdAt:Instant; idempotencyKey:string; authorizationRef:ID|null }
export interface DeliveryReceipt { instructionId:ID; state:DeliveryState; destinationBinding:ID; providerReceiptId:string|null; receivedAt:Instant|null; acceptedAt:Instant|null; errorCategory:string|null }
export interface AssistantCapabilities { provider:string; delivery:boolean; receiptLookup:boolean; revocation:boolean; existingConversation:boolean }
export interface AssistantAdapter { capabilities():Promise<AssistantCapabilities>; submit(envelope:InstructionEnvelope):Promise<DeliveryReceipt>; lookup(instructionId:ID):Promise<DeliveryReceipt> }
export type EventTime = { allDay:false; startAt:Instant; endAt:Instant|null; timeZone:string } | { allDay:true; startDate:DateOnly; endDateExclusive:DateOnly; timeZone:string };
export interface ScheduleItem extends Entity { type:'calendar'|'itinerary'|'deadline'; title:string; time:EventTime; scope:'personal'|'organization_subscription'; participation:'accepted'|'tentative'|'declined'|'unknown'; status:'confirmed'|'tentative'|'canceled'|'inferred'|'unknown'; recurrenceId:string|null; sourceRevision:string|null; evidenceIds:ID[] }
export interface SourceHealth { state:'unverified'|'connected'|'stale'|'disconnected'|'error'|'manual_only'; lastAttemptAt:Instant|null; lastSuccessAt:Instant|null; configuredIntervalSeconds:number|null; coverageStart:Instant|null; coverageEnd:Instant|null; errorCategory:string|null }
export interface SourceAdapter { provider:string; capabilities():Promise<string[]>; identity():Promise<{binding:ID; verified:boolean}>; readPage(cursor:string|null):Promise<{records:unknown[]; nextCursor:string|null; observedAt:Instant; coverageComplete:boolean}>; normalize(record:unknown):Promise<unknown> }
export interface DomainEvent { schemaVersion:1; eventId:ID; ownerId:ID; entityType:string; entityId:ID; entityVersion:number; eventType:string; correlationId:ID; causationId:ID|null; actor:Attribution; occurredAt:Instant|null; observedAt:Instant; committedAt:Instant; evidenceIds:ID[]; payload:Record<string,unknown> }
export interface ApiError { code:'UNAUTHENTICATED'|'FORBIDDEN'|'INVALID_INPUT'|'CONFLICT'|'UNCONFIGURED'|'RATE_LIMITED'|'UNAVAILABLE'|'OUTCOME_UNKNOWN'; message:string; correlationId:ID; retryAfterSeconds?:number }
