'use client';
import {useEffect,useRef,useState} from 'react';
import type {SessionReview} from '../lib/work/engineering';
import type {InventorySnapshot} from '../lib/work/source-inventory';
import type {AssociationState,AssociationProvenance} from '../lib/work/snapshot-associations';

type Props={snapshots:InventorySnapshot[];review?:SessionReview;onOpenSnapshot:(inventoryId:string,snapshotId:string)=>Promise<void>;onOpenReview:(id:string)=>Promise<void>};
type Pending={body:string;uncertain:boolean};
type Correction={id:string;version:number;projectId:string};
const relevanceLabels={metadata_matches:'Stored metadata pins match. Original-source freshness remains unknown.',version_changed:'Metadata version changed; material pins match. No source-change or processing inference.',needs_review:'Material or scope pins differ. Review the historical assertion; no automatic relink.',missing_target:'A target is absent from a complete authorized lookup. Historical pins remain recorded.'};

function Provenance({data}:{data:AssociationProvenance}){
 return <div><p>Snapshot basis: {data.snapshotBasis}; selection {data.snapshotSelectionRef}; evidence {data.snapshotEvidenceRef}; reported visible events {data.snapshotItemCount}.</p>
  <p>Owner-reported content hash (not measured here): <code>{data.claimedContentHash}</code>.</p>
  <p>Review basis: {data.reviewBasis}; source {data.reviewSourceRef}.</p></div>;
}

export default function SnapshotAssociations({snapshots,review,onOpenSnapshot,onOpenReview}:Props){
 const [snapshotChoice,setSnapshotChoice]=useState(''),[state,setState]=useState<AssociationState|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false);
 const [pending,setPending]=useState<Pending|null>(null),[correction,setCorrection]=useState<Correction|null>(null),[reason,setReason]=useState('');
 const pendingRef=useRef<Pending|null>(null),savingRef=useRef(false),loadingRef=useRef(false);
 const snapshotId=snapshots.some(item=>item.id===snapshotChoice)?snapshotChoice:'';
 async function load(allHistory=false):Promise<AssociationState|null>{
  if(loadingRef.current)return null;
  loadingRef.current=true;setLoading(true);setError('');
  try{
   const query=new URLSearchParams();
   if(!allHistory){if(snapshotId)query.set('snapshotId',snapshotId);if(review)query.set('reviewId',review.id);}
   const response=await fetch('/api/snapshot-review-associations'+(query.size?'?'+query:''),{credentials:'same-origin'});
   if(!response.ok)throw new Error('Association context unavailable. Relevance is unknown; no missing-target or empty-history conclusion can be drawn.');
   const next=await response.json() as AssociationState;
   if(next.format!=='dots-snapshot-review-association'||next.schemaVersion!==1)throw new Error('Unsupported association response.');
   setState(next);
   return next;
  }catch(e){setState(null);setError((e as Error).message);return null;}
  finally{loadingRef.current=false;setLoading(false)}
 }
 async function save(fields?:Record<string,unknown>){
  if(savingRef.current||loadingRef.current)return;
  let attempt=pendingRef.current;
  if(!attempt){
   if(!fields||!state?.capabilities.write)return;
   attempt={body:JSON.stringify({format:'dots-snapshot-review-association',schemaVersion:1,requestId:crypto.randomUUID(),...fields}),uncertain:false};
   pendingRef.current=attempt;setPending(attempt);
  }
  savingRef.current=true;setSaving(true);setError('');setNotice('');
  try{
   const response=await fetch('/api/snapshot-review-associations',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:attempt.body});
   const result=await response.json() as {ok?:boolean;error?:string;associationId?:string;executed?:boolean;sourceRead?:boolean;processing?:boolean;externalExecution?:boolean};
   if(!response.ok){
    if(!attempt.uncertain&&[400,401,403,404,409,413,415].includes(response.status)){pendingRef.current=null;setPending(null);throw new Error(result.error||'Association rejected. Reload context before correcting the draft.');}
    throw new Error('Association outcome unconfirmed.');
   }
   if(result.ok!==true||!/^association-[a-f0-9]{32}$/.test(result.associationId||'')||result.executed!==false||result.sourceRead!==false||result.processing!==false||result.externalExecution!==false)throw new Error('Association response unconfirmed.');
   pendingRef.current=null;setPending(null);setCorrection(null);setReason('');
   setNotice('Relationship assertion recorded. No source was read, parsed or processed; no remediation was completed.');
   await load();
  }catch(e){
   if(pendingRef.current){attempt.uncertain=true;setPending({...attempt});setError('Outcome unconfirmed. Retry the identical pending operation; new writes are blocked. Keep this view open until reconciled.');}
   else setError((e as Error).message);
  }finally{savingRef.current=false;setSaving(false)}
 }
 useEffect(()=>{
  if(!pending)return;
  const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
  window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
 },[!!pending]);
 const navigating=loading||saving||!!pending;
 const locked=navigating||!state?.capabilities.write;
 const candidate=state?.candidate;
 const candidateMatches=!!candidate&&candidate.pins.snapshotId===snapshotId&&candidate.pins.reviewId===review?.id&&candidate.pins.reviewVersion===review?.version;
 const reasonValid=/^(export|artifact|skill|receipt):[A-Za-z0-9_.#:\-]+$/.test(reason)&&reason.length<=180;
 async function openReview(id:string){await onOpenReview(id);requestAnimationFrame(()=>{const node=document.getElementById('saved-session-review-'+id);node?.focus({preventScroll:true});node?.scrollIntoView({block:'start'});});}
 async function openAssociation(id:string){
  if(savingRef.current||pendingRef.current)return;
  const next=await load(true);
  if(!next||!next.storageAvailable)return;
  if(!next.associations.some(row=>row.id===id)){setError('Referenced association is absent from the complete retained owner history. The recorded relationship reference remains unchanged.');return;}
  requestAnimationFrame(()=>{const node=document.getElementById('snapshot-association-'+id);node?.focus({preventScroll:true});node?.scrollIntoView({block:'start'});});
 }
 return <section className="snapshot-associations" aria-label="Snapshot and review assertions">
  <h3>Snapshot and review assertions</h3>
  <p>An owner-asserted context association does not establish that a review was parsed or produced from a snapshot. It grants no source access and advances no processing checkpoint.</p>
  <label>Stored snapshot metadata from the selected inventory<select value={snapshotId} disabled={navigating} onChange={event=>setSnapshotChoice(event.target.value)}><option value="">No snapshot selected</option>{snapshots.map(item=><option key={item.id} value={item.id}>{item.selectionRef} · {item.id}</option>)}</select></label>
  <p>Selected saved review: {review?review.id+' · project '+review.export.projectId:'None; select a saved session review to associate it.'}</p>
  <div className="review-navigation"><button disabled={loading||saving} onClick={()=>void load()}>Load selected association context</button>
   <button disabled={loading||saving} onClick={()=>void load(true)}>Load all owner association history (up to 100)</button></div>
  {!state&&!loading&&!error&&<p>Association context has not been loaded; relevance is unknown.</p>}
  {loading&&<p role="status">Reading association metadata…</p>}{error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
  {pending&&<p role="status">Retry payload is retained only while this view stays mounted. Leaving or reloading can lose it. <button disabled={loading||saving} onClick={()=>void save()}>Retry pending association operation</button></p>}
  {state&&<>
   <p>Association writes: {state.capabilities.write?'enabled by host':'disabled'}. Source reading, parsing and processing remain unavailable.</p>
   <p>Loaded history scope: {state.scope.snapshotId||state.scope.reviewId?`snapshot ${state.scope.snapshotId||'not selected'} or review ${state.scope.reviewId||'not selected'}`:'all retained associations for this owner, across projects; up to 100 historical identities'}. This does not establish source or transcript completeness.</p>
   {state.storageAvailable&&<p>{state.associations.length} matching records of {state.totalAssociations} retained owner associations.</p>}
   {state.candidateIssue&&<p>{state.candidateIssue}</p>}
   {candidate&&<div><h4>Loaded candidate pins</h4><p>Snapshot {candidate.pins.snapshotId} → review {candidate.pins.reviewId}; project {candidate.pins.projectId}.</p>
    <p>Stored snapshot metadata digest: <code>{candidate.pins.snapshotMetadataDigest}</code>.</p><p>Stored normalized export digest: <code>{candidate.pins.reviewExportDigest}</code>. These digests are not compared as byte equality.</p>
    <Provenance data={candidate.provenance}/>
    {!candidateMatches&&<p>Target selection changed. Load context again before asserting this pair.</p>}
    <button disabled={locked||!candidateMatches||!!correction} onClick={()=>void save({action:'create',pins:candidate.pins})}>Save owner-asserted context association</button>
   </div>}
   {correction&&<div><h4>Correcting association {correction.id}</h4><p>Expected version {correction.version}; project {correction.projectId}. Replacement needs freshly loaded candidate pins in that same project. Revocation withdraws only this assertion.</p>
    <label>Reason reference<input value={reason} disabled={locked} maxLength={180} onChange={event=>setReason(event.target.value)} placeholder="artifact:owner-correction"/></label>
    <div className="review-navigation"><button disabled={locked||!candidateMatches||!candidate||candidate.pins.projectId!==correction.projectId||!reasonValid} onClick={()=>void save({action:'replace',associationId:correction.id,version:correction.version,reasonRef:reason,pins:candidate!.pins})}>Replace assertion, retaining history</button>
     <button disabled={locked||!reasonValid} onClick={()=>void save({action:'revoke',associationId:correction.id,version:correction.version,reasonRef:reason})}>Revoke assertion only</button>
     <button disabled={navigating} onClick={()=>{setCorrection(null);setReason('')}}>Cancel correction draft</button></div>
   </div>}
   {state.storageAvailable&&!state.associations.length&&<p>No associations in this loaded scope. This does not establish original-source or review coverage.</p>}
   {state.associations.map(row=><section className="bubble" key={row.id} id={'snapshot-association-'+row.id} tabIndex={-1}>
    <h4>Owner-asserted context association · {row.id}</h4><p>Relationship lifecycle: {row.lifecycle}; version {row.version}; recorded {row.recordedAt}.</p>
    <p>Project {row.pins.projectId} · snapshot {row.pins.snapshotId} · review {row.pins.reviewId}.</p>
    <p>{relevanceLabels[row.relevance.state]}</p>
    {!!row.relevance.missing.length&&<p>Missing targets: {row.relevance.missing.join(', ')}.</p>}
    {!!row.relevance.differentPins.length&&<p>Differing material/scope pins: {row.relevance.differentPins.join(', ')}.</p>}
    {!!row.relevance.differentVersions.length&&<p>Differing metadata versions: {row.relevance.differentVersions.join(', ')}.</p>}
    <Provenance data={row.provenance}/><details><summary>Original association pins</summary><pre className="review-prompt">{JSON.stringify(row.pins,null,2)}</pre></details>
    {row.replacesId&&<p>Replaces assertion {row.replacesId}. <button disabled={navigating} onClick={()=>void openAssociation(row.replacesId!)}>Open predecessor history</button></p>}
    <ul>{row.events.map(event=><li key={event.version}><p>{event.action} · {event.state} · version {event.version} · {event.recordedAt}. Reason: {event.reasonRef||'None recorded'}.{event.replacementId?' Replacement: '+event.replacementId:''}</p>
     {event.replacementId&&<button disabled={navigating} onClick={()=>void openAssociation(event.replacementId!)}>Open successor history</button>}</li>)}</ul>
    <div className="review-navigation"><button disabled={navigating||!row.canOpenSnapshot} onClick={()=>void onOpenSnapshot(row.pins.inventoryId,row.pins.snapshotId)}>Open stored snapshot metadata</button>
     <button disabled={navigating||!row.canOpenReview} onClick={()=>void openReview(row.pins.reviewId)}>Open associated saved review</button>
     <button disabled={locked||row.lifecycle!=='active'} onClick={()=>{setCorrection({id:row.id,version:row.version,projectId:row.pins.projectId});setReason('')}}>Select assertion to correct or revoke</button></div>
   </section>)}
  </>}
 </section>;
}
