// Companion metadata only. This does not alter the session-export contract.
export type CoverageInterval={start:string;end:string}|null;
export type Inventory={id:string;ownerId:string;projectId:string;selectionRef:string;requestedInterval:CoverageInterval;createdAt:string;version:number};
export type InventorySource={id:string;scopeId:string;sourceRef:string;toolLabel:string|null;sessionRef:string|null;declaredInterval:CoverageInterval;declaredAt:string;recordedAt:string;basis:'owner_reported'};
export type AccessDisposition='denied'|'unreadable'|'unsupported'|'unknown'|'read_empty'|'read_nonempty';
export type AccessObservation={id:string;sourceId:string;disposition:AccessDisposition;observedAt:string;recordedAt:string;evidenceRef:string;snapshotId:string|null;basis:'owner_reported'};
export type InventorySnapshot={id:string;sourceId:string;contentHash:string;selectionRef:string;itemCount:number;selectedInterval:CoverageInterval;materialKind:'supplied_export';itemUnit:'visible_event_record';recordedAt:string;basis:'owner_reported';evidenceRef:string};
export type InventoryPage={anchor:string|null;offset:number;limit:50;total:number;start:number;end:number;hasOlder:boolean;hasNewer:boolean};
export type InventoryState={format:'dots-source-coverage';schemaVersion:1;capabilities:{write:boolean;processing:false;sourceRead:false;externalExecution:false};initialized:boolean;totalInventories:number;inventoryIndex:Inventory[];indexTruncated:boolean;inventory:Inventory|null;sources:InventorySource[];observations:AccessObservation[];snapshots:InventorySnapshot[];page?:InventoryPage};

export const accessLabels:Record<AccessDisposition,string>={
 denied:'Denied — access refused',
 unreadable:'Unreadable — attempted read failed',
 unsupported:'Unsupported reader or format',
 unknown:'Unknown — attempt outcome unconfirmed',
 read_empty:'Read-empty — supplied selection contained zero events',
 read_nonempty:'Read-nonempty — supplied selection contained events',
};
