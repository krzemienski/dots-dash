'use client';
import {useEffect,useRef,useState} from 'react';
import {accessLabels,type AccessDisposition,type CoverageInterval,type InventoryState} from '../lib/work/source-inventory';
import type {SessionReview} from '../lib/work/engineering';
import SnapshotAssociations from './snapshot-associations';

const inputReference={pattern:'(export|artifact|skill|receipt):[A-Za-z0-9_.#:\\-]+',maxLength:180};
const inputId={pattern:'[A-Za-z0-9_-]+',maxLength:100};
const dateHint='ISO time with offset, e.g. 2026-01-01T12:00:00Z';
const value=(data:FormData,key:string)=>String(data.get(key)||'').trim();
function interval(data:FormData):CoverageInterval{
 const start=value(data,'start'),end=value(data,'end');
 if(!start&&!end)return null;
 if(!start||!end)throw new Error('Supply both interval endpoints, or leave both unknown.');
 return {start,end};
}
function IntervalFields({label}:{label:string}){
 return <fieldset><legend>{label} (optional; both blank means unknown)</legend>
  <label>Start, inclusive<input name="start" maxLength={40} placeholder={dateHint}/></label>
  <label>End, exclusive<input name="end" maxLength={40} placeholder={dateHint}/></label>
 </fieldset>;
}
const describeInterval=(range:CoverageInterval)=>range?`${range.start} inclusive to ${range.end} exclusive`:'Unknown; not all time';
type Pending={body:string;uncertain:boolean};
type BrowsingSelection={anchor:string;offset:number};
function browsingSelection(state:InventoryState|null):BrowsingSelection|undefined{
 const page=state?.page;
 return page?.anchor?{anchor:page.anchor,offset:page.offset}:undefined;
}

export default function SourceInventory({review,onOpenReview}:{review?:SessionReview;onOpenReview:(id:string)=>Promise<void>}){
 const [state,setState]=useState<InventoryState|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const [pending,setPending]=useState<Pending|null>(null),[saving,setSaving]=useState(false);
 const [disposition,setDisposition]=useState<AccessDisposition>('unknown');
 const pendingRef=useRef<Pending|null>(null),savingRef=useRef(false),loadingRef=useRef(false);
 const hasSnapshot=disposition==='read_empty'||disposition==='read_nonempty';
 async function load(id?:string,selection?:BrowsingSelection){
  if(loadingRef.current)return;
  loadingRef.current=true;setBusy(true);setError('');
  try{
   const query=new URLSearchParams();
   if(id)query.set('inventoryId',id);
   if(selection){query.set('anchor',selection.anchor);query.set('offset',String(selection.offset));}
   const response=await fetch('/api/source-coverage'+(query.size?'?'+query.toString():''),{credentials:'same-origin'});
   if(!response.ok)throw new Error('Source inventory could not be read. No empty-inventory or source-access conclusion can be drawn.');
   const next=await response.json() as InventoryState;
   if(next.format!=='dots-source-coverage'||next.schemaVersion!==1)throw new Error('Unsupported source inventory response.');
   setState(next);
  }catch(e){setState(null);setError((e as Error).message)}
  finally{loadingRef.current=false;setBusy(false)}
 }
 async function save(fields?:Record<string,unknown>){
  if(savingRef.current||loadingRef.current)return;
  let attempt=pendingRef.current;
  if(!attempt){
   if(!fields||!state?.capabilities.write)return;
   attempt={body:JSON.stringify({format:'dots-source-coverage',schemaVersion:1,requestId:crypto.randomUUID(),...fields}),uncertain:false};
   pendingRef.current=attempt;setPending(attempt);
  }
  savingRef.current=true;setSaving(true);setError('');setNotice('');
  try{
   const response=await fetch('/api/source-coverage',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:attempt.body});
   const result=await response.json() as {ok?:boolean;error?:string;inventoryId?:string;executed?:boolean;sourceRead?:boolean;externalExecution?:boolean};
   if(!response.ok){
    if(!attempt.uncertain&&[400,401,403,404,409,413,415].includes(response.status)){
     pendingRef.current=null;setPending(null);throw new Error(result.error||'Coverage record rejected. Refresh before editing and retrying.');
    }
    throw new Error('Coverage save is unconfirmed.');
   }
   if(result.ok!==true||!/^inventory-[a-f0-9]{32}$/.test(result.inventoryId||'')||result.executed!==false||result.sourceRead!==false||result.externalExecution!==false)throw new Error('Coverage save response is unconfirmed.');
   // Confirmation clears the pending operation before a separately fallible read.
   pendingRef.current=null;setPending(null);
   setNotice('Owner-reported metadata saved. No source was opened or processed by this action.');
   await load(result.inventoryId,state?.inventory?.id===result.inventoryId?browsingSelection(state):undefined);
  }catch(e){
   if(pendingRef.current){attempt.uncertain=true;setPending({...attempt});setError('Save outcome is unconfirmed. Retry the pending save to reconcile the identical operation. Keep this view open; new writes are blocked.');}
   else setError((e as Error).message);
  }finally{savingRef.current=false;setSaving(false)}
 }
 useEffect(()=>{
  if(!pending)return;
  const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
  window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
 },[!!pending]);
 function submit(event:React.FormEvent<HTMLFormElement>,action:string){
  event.preventDefault();
  if(pendingRef.current||savingRef.current||loadingRef.current)return;
  const data=new FormData(event.currentTarget),inventory=state?.inventory;
  try{
   let fields:Record<string,unknown>;
   if(action==='create_inventory')fields={action,projectId:value(data,'projectId'),selectionRef:value(data,'selectionRef'),requestedInterval:interval(data)};
   else{
    if(!inventory)return;
    const pins={action,inventoryId:inventory.id,version:inventory.version};
    fields=action==='add_source'?{...pins,sourceRef:value(data,'sourceRef'),toolLabel:value(data,'toolLabel')||null,sessionRef:value(data,'sessionRef')||null,declaredAt:value(data,'declaredAt'),declaredInterval:interval(data)}:
     {...pins,sourceId:value(data,'sourceId'),disposition,observedAt:value(data,'observedAt'),evidenceRef:value(data,'evidenceRef'),snapshot:hasSnapshot?{
      contentHash:value(data,'contentHash'),selectionRef:value(data,'selectionRef'),itemCount:disposition==='read_empty'?0:Number(value(data,'itemCount')),selectedInterval:interval(data),
     }:null};
   }
   void save(fields);
  }catch(e){setError((e as Error).message)}
 }
 const locked=busy||saving||!!pending||!state?.capabilities.write;
 const inventory=state?.inventory;
 const page=state?.page;
 async function openSnapshot(inventoryId:string,snapshotId:string){
  await load(inventoryId);
  requestAnimationFrame(()=>{const node=document.getElementById('inventory-snapshot-'+snapshotId);node?.focus({preventScroll:true});node?.scrollIntoView({block:'start'});});
 }
 return <section className="source-inventory" aria-label="Source inventory and access history">
  <h3>Source inventory and access history</h3>
  <p>Record selected tool/project/time metadata and owner-reported access outcomes. No source is opened here. This inventory does not establish that all sessions or transcripts were reviewed.</p>
  <button disabled={busy||saving} onClick={()=>void load(inventory?.id,browsingSelection(state))}>Load or refresh source inventory</button>
  {!state&&!busy&&!error&&<p>Inventory has not been loaded. Coverage is unknown.</p>}
  {busy&&<p role="status">Reading saved inventory…</p>}
  {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
  {pending&&<p role="status">Pending save retained only while this view stays mounted. Leaving or reloading can lose the retry payload. <button disabled={saving||busy} onClick={()=>void save()}>Retry pending coverage save</button></p>}
  {state&&<>
   <p>Coverage writes: {state.capabilities.write?'enabled by host':'disabled'}. Source reads and processing checkpoints: unavailable.</p>
   <p>{state.totalInventories} inventories currently saved for this owner. Counts describe selected metadata, not reviewed transcripts.</p>
   {page?<><p role="status">{page.total?`Index entries ${page.start}–${page.end} of ${page.total} inventories in this browsing selection.`:'No entries in this browsing selection.'} Newest first; up to 50 per page.</p>
    <p>The browsing selection excludes inventories added after it began. Record versions are read now; this is not a frozen snapshot of record contents. Latest inventories starts a new selection.</p>
    {state.totalInventories>page.total&&<p>{state.totalInventories-page.total} newer inventories are outside this selection.</p>}
    <div className="review-navigation" role="group" aria-label="Inventory pages">
     <button disabled={busy||saving||!!pending||!page.hasNewer||!page.anchor} onClick={()=>void load(undefined,{anchor:page.anchor!,offset:page.offset-50})}>Newer inventories</button>
     <button disabled={busy||saving||!!pending||!page.hasOlder||!page.anchor} onClick={()=>void load(undefined,{anchor:page.anchor!,offset:page.offset+50})}>Older inventories</button>
     <button disabled={busy||saving||!!pending} onClick={()=>void load()}>Latest inventories</button>
    </div></>:<p>Page navigation is unavailable in this response. {state.inventoryIndex.length} inventory entries are listed; list completeness is not established.</p>}
   {state.indexTruncated&&<p>This index page does not contain every saved inventory. Entries outside it are not proven missing sources.</p>}
   {!state.initialized&&<p>Companion storage has not been initialized. Loading it performs no migration.</p>}
   {!state.totalInventories&&<p>No inventories saved in this owner storage. This does not establish that no sessions or work exist.</p>}
   {!!state.inventoryIndex.length&&<label>Saved inventory on this index page<select value={inventory?.id||''} disabled={busy||saving||!!pending} onChange={e=>void load(e.target.value,browsingSelection(state))}>
    {inventory&&!state.inventoryIndex.some(item=>item.id===inventory.id)&&<option value={inventory.id}>{inventory.projectId} · selected inventory outside this index page</option>}
    {state.inventoryIndex.map(item=><option key={item.id} value={item.id}>{item.projectId} · {item.selectionRef} · v{item.version}</option>)}
   </select></label>}
   <details><summary>Create a selected inventory</summary>
    <form key={state.totalInventories} onSubmit={event=>submit(event,'create_inventory')}><fieldset disabled={locked}>
     <label>Project ID<input name="projectId" required {...inputId}/></label>
     <label>Selection reference<input name="selectionRef" required {...inputReference}/></label>
     <IntervalFields label="Requested interval"/>
     <button>Create inventory</button>
    </fieldset></form>
   </details>
   {inventory&&<>
    <h4>Selected project: {inventory.projectId}</h4><p>Inventory {inventory.id} · version {inventory.version}. Selection: {inventory.selectionRef}.</p>
    {!state.inventoryIndex.some(item=>item.id===inventory.id)&&<p>This selected inventory is outside the current index page; its details below are separate from the page entry count.</p>}
    <p>Requested interval: {describeInterval(inventory.requestedInterval)}. This request is not proven source coverage.</p>
    <p>{state.sources.length} source entries and {state.observations.length} access reports in this inventory. All retained entries for this selected inventory are displayed; original-source completeness remains unknown.</p>
    <details><summary>Add source metadata</summary><form key={inventory.id+':'+inventory.version} onSubmit={event=>submit(event,'add_source')}><fieldset disabled={locked}>
     <label>Source reference<input name="sourceRef" required {...inputReference}/></label>
     <label>Tool label (optional, owner-reported)<input name="toolLabel" maxLength={80}/></label>
     <label>Session reference (optional)<input name="sessionRef" {...inputReference}/></label>
     <label>Declared at<input name="declaredAt" required maxLength={40} placeholder={dateHint}/></label>
     <IntervalFields label="Declared source interval"/>
     <button>Save source metadata</button>
    </fieldset></form></details>
    <details><summary>Record an access observation</summary><p>Record only an actual observation. A reference or hash supplied here is an owner assertion; the application does not fetch or verify it.</p>
     <form key={inventory.id+':'+inventory.version} onSubmit={event=>submit(event,'observe_access')}><fieldset disabled={locked||!state.sources.length}>
      <label>Source<select name="sourceId" required>{state.sources.map(source=><option key={source.id} value={source.id}>{source.toolLabel||'Unknown tool'} · {source.sourceRef} · {source.id}</option>)}</select></label>
      <label>Reported outcome<select value={disposition} onChange={event=>setDisposition(event.target.value as AccessDisposition)}>{Object.entries(accessLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
      <label>Observed at<input name="observedAt" required maxLength={40} placeholder={dateHint}/></label>
      <label>Evidence reference<input name="evidenceRef" required {...inputReference}/></label>
      {hasSnapshot&&<>
       <label>Supplied selection SHA-256 (owner-reported)<input name="contentHash" required pattern="[a-f0-9]{64}" maxLength={64}/></label>
       <label>Supplied selection reference<input name="selectionRef" required {...inputReference}/></label>
       {disposition==='read_empty'?<p>Reported item count: 0. No goals or invented events are required.</p>:<label>Reported visible event count<input name="itemCount" type="number" required min={1} max={1000000} step={1}/></label>}
       <IntervalFields label="Supplied selection interval"/>
      </>}
      <button>Save owner-reported access observation</button>
     </fieldset></form>
    </details>
    {state.sources.map(source=>{
     const observations=state.observations.filter(item=>item.sourceId===source.id);
     return <section className="bubble" key={source.id}>
      <h4>{source.toolLabel||'Unknown tool'} · {source.sourceRef}</h4>
      <p>Source {source.id} · {source.basis} · session reference: {source.sessionRef||'Unknown'}.</p>
      <p>Declared interval: {describeInterval(source.declaredInterval)}. Declared {source.declaredAt}; recorded {source.recordedAt}.</p>
      {!observations.length&&<p>Access not observed. This entry is inventory only, not denied, read-empty or processed.</p>}
      {observations.map(observation=>{
       const snapshot=state.snapshots.find(item=>item.id===observation.snapshotId);
       return <div key={observation.id} id={snapshot?'inventory-snapshot-'+snapshot.id:undefined} tabIndex={snapshot?-1:undefined}>
        <p><strong>Owner-reported: {accessLabels[observation.disposition]}</strong></p>
        <p>Observed {observation.observedAt}; recorded {observation.recordedAt}. Evidence: {observation.evidenceRef}.</p>
        {snapshot?<><p>Supplied snapshot {snapshot.id}: {snapshot.itemCount} reported visible event records. {snapshot.itemCount===0?'Read-empty selection; no items to process. This does not prove no work occurred.':'A nonempty read report does not establish processing or remediation.'}</p>
         <p>Selection: {snapshot.selectionRef}; interval: {describeInterval(snapshot.selectedInterval)}. Owner-reported hash: <code>{snapshot.contentHash}</code>.</p></>:observation.snapshotId?<p>Referenced snapshot metadata is unavailable; coverage is unknown.</p>:<p>No snapshot asserted by this attempt. Earlier read reports remain history.</p>}
       </div>;
      })}
      <p>Original transcript read coverage: unknown. Processing checkpoint: unavailable; partial or processed snapshot status cannot be established.</p>
     </section>;
    })}
    <p>History is retained in recording order. A later failed attempt does not erase earlier reports or prove current availability. Checklist receipts, review versions and owner acceptance reports do not advance processing.</p>
   </>}
  </>}
  <SnapshotAssociations snapshots={state?.snapshots||[]} review={review} onOpenSnapshot={openSnapshot} onOpenReview={onOpenReview}/>
 </section>;
}
