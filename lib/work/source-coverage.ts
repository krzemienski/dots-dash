import type {SessionReview} from './engineering';

// Display-only projection of existing v1 metadata, not a persisted coverage contract.
type SourceAttribution = {
 sourceRef:string;
 basis:'owner_provided_export';
 originalReadCoverage:'unknown';
};
export type SourceCoverageEntry = SourceAttribution & (
 | {scope:'selected_export_only';capturedAt:string;eventCount:number}
 | {scope:'export_records_only';eventIds:string[]}
 | {scope:'inventory_only';skillIds:string[]}
);

function groupReferences(records:ReadonlyArray<{id:string;sourceRef:string}>):Map<string,string[]>{
 const groups=new Map<string,string[]>();
 for(const record of records){
  const ids=groups.get(record.sourceRef);
  if(ids)ids.push(record.id);
  else groups.set(record.sourceRef,[record.id]);
 }
 return groups;
}

export function projectSourceCoverage(source:SessionReview['export']):SourceCoverageEntry[]{
 const attribution=(sourceRef:string):SourceAttribution=>({sourceRef,basis:'owner_provided_export',originalReadCoverage:'unknown'});
 const entries:SourceCoverageEntry[]=[{
  ...attribution(source.sourceRef),scope:'selected_export_only',
  capturedAt:source.capturedAt,eventCount:source.events.length,
 }];
 // Keep roles separate even when references coincide. Superseded events still
 // belong to the selection; outcomes and later receipts never upgrade coverage.
 for(const [sourceRef,eventIds] of groupReferences(source.events)){
  entries.push({...attribution(sourceRef),scope:'export_records_only',eventIds});
 }
 for(const [sourceRef,skillIds] of groupReferences(source.skills)){
  entries.push({...attribution(sourceRef),scope:'inventory_only',skillIds});
 }
 return entries;
}
