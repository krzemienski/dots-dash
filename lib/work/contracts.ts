/** Provider-neutral boundary. No AI provider credentials are configured. */
export interface InstructionEnvelope { id:string; taskId:string|null; body:string; ownerId:string; createdAt:string }
export interface DeliveryReceipt { instructionId:string; accepted:boolean; externalId?:string; error?:string }
export interface AgentAdapter { provider:string; deliver(instruction:InstructionEnvelope):Promise<DeliveryReceipt> }
export interface ReceiptEvent { provider:string; providerEventId:string; taskId:string; outcome:'received'|'rejected'|'interview'; occurredAt:string; sourceUrl:string; submittingActor?:string }
export class UnconfiguredAdapter implements AgentAdapter {
 provider='unconfigured';
 async deliver(instruction:InstructionEnvelope):Promise<DeliveryReceipt>{return {instructionId:instruction.id,accepted:false,error:'No authenticated delivery bridge configured. Instruction remains saved, not delivered.'};}
}
// Future source adapters must verify identity/signature, enforce allowed event types,
// deduplicate provider+event ID, and attach source evidence before ingestion.
// They must never infer who submitted an application from a receipt alone.
