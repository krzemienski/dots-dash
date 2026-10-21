'use client';
import {useEffect,useRef,useState} from 'react';
import type {SessionReview} from '../lib/work/engineering';

type Item={position:number;itemId:string;eventDigest:string;sourceRef:string;attribution:string};
type Manifest={id:string;manifestDigest:string;selectionDigest:string;reviewId:string;reviewVersion:number;projectId:string;analysisVersion:string;itemCount:number;items:Item[];excludedCount:number;unknownAttributionCount:number;recordedAt:string};
type Report={id:string;itemId:string;result:string;observedAt:string;evidenceRefs:string[];basis:string};
type Checkpoint={id:string;previousCheckpointId:string|null;prefixCount:number;reviewedCount:number;recordedAt:string;events:{id:string;action:string;itemId?:string;targetReportId?:string;reasonRef?:string;report?:Report}[]};
type State={initialized:boolean;writeEnabled:boolean;candidate:Manifest|null;candidateStatus:string;manifest:Manifest|null;manifests:Manifest[];processorId:string;processorVersion:string;relevance:string;stream:null|{head:string|null;prefixCount:number;reviewedCount:number;activeReports:Record<string,Report>};history?:Checkpoint[];page?:{ceiling:number;offset:number;total:number;start:number;end:number;hasOlder:boolean}};
type Pending={body:string;uncertain:boolean};
type Reply={ok?:boolean;error?:string;executed?:boolean;basis?:string;manifestId?:string;reviewId?:string;operation?:{state:string;payloadDigest?:string;response?:Reply}};
const endpoint='/api/owner-review-reports';
const canonical=(value:unknown):unknown=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>[k,canonical(v)])):value;
async function payloadDigest(body:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(canonical(JSON.parse(body)))));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}

export default function OwnerReviewReports({review,onOpenEvent}:{review:SessionReview;onOpenEvent:(id:string)=>void}){
 const [state,setState]=useState<State|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[pending,setPending]=useState<Pending|null>(null);
 const gate=useRef(false),pendingRef=useRef<Pending|null>(null);
 async function load(manifestId?:string,offset=0,ceiling?:number){
  const q=new URLSearchParams({reviewId:review.id});if(manifestId)q.set('manifestId',manifestId);if(offset)q.set('offset',String(offset));if(ceiling!==undefined)q.set('ceiling',String(ceiling));
  try{const r=await fetch(endpoint+'?'+q,{credentials:'same-origin'});if(!r.ok)throw new Error();const next=await r.json() as State;setState(next);}
  catch{setState(null);throw new Error('Owner review history unavailable. No empty or completed coverage conclusion can be drawn.');}
 }
 async function refresh(manifestId?:string,offset=0,ceiling?:number){if(gate.current)return;gate.current=true;setBusy(true);setError('');try{await load(manifestId,offset,ceiling)}catch(e){setError((e as Error).message)}finally{gate.current=false;setBusy(false)}}
 useEffect(()=>{void refresh()},[review.id,review.version]);
 async function save(fields?:Record<string,unknown>,lookup=false){
  if(gate.current)return;
  let attempt=pendingRef.current;
  if(!attempt){if(!fields||!state?.writeEnabled||!state.initialized)return;attempt={body:JSON.stringify({format:'dots-retained-record-review',schemaVersion:1,requestId:crypto.randomUUID(),...fields}),uncertain:false};pendingRef.current=attempt;setPending(attempt);}
  gate.current=true;setBusy(true);setError('');setNotice('');
  try{
   const envelope=JSON.parse(attempt.body);
   const r=await fetch(lookup?endpoint+'?operationId='+encodeURIComponent(envelope.requestId):endpoint,lookup?{credentials:'same-origin'}:{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:attempt.body});
   let result=await r.json() as Reply;
   if(!r.ok){if(!attempt.uncertain&&[400,401,403,404,409,413,415].includes(r.status)){pendingRef.current=null;setPending(null);throw new Error(result.error||'Report rejected. Refresh before another write.')}throw new Error('Unconfirmed');}
   if(lookup){if(result.operation?.state!=='committed'||result.operation.payloadDigest!==await payloadDigest(attempt.body)||!result.operation.response)throw new Error('Unconfirmed');result=result.operation.response;}
   if(result.ok!==true||result.executed!==false||result.basis!=='owner_reported'||typeof result.manifestId!=='string'||result.reviewId!==review.id)throw new Error('Unconfirmed');
   pendingRef.current=null;setPending(null);setNotice('Owner assertion saved. No source processing or verified authorship is established.');await load(result.manifestId);
  }catch(e){if(pendingRef.current){attempt.uncertain=true;setPending({...attempt});setError('Save outcome unconfirmed. Keep this view open; new writes are blocked. Reconcile the original operation. Pending recovery does not survive leaving this view.');}else setError((e as Error).message);}
  finally{gate.current=false;setBusy(false)}
 }
 const m=state?.manifest,s=state?.stream;
 const locked=busy||!!pending||!state?.writeEnabled||!state.initialized;
 const reportLocked=locked||!['pins_match','pins_match_version_changed'].includes(state?.relevance||'');
 const pins=()=>({manifestId:m!.id,manifestDigest:m!.manifestDigest,projectId:m!.projectId,processorId:state!.processorId,processorVersion:state!.processorVersion,expectedHead:s!.head});
 function submit(event:React.FormEvent<HTMLFormElement>,action:string){event.preventDefault();if(!m||!s)return;const data=new FormData(event.currentTarget);const value=(name:string)=>String(data.get(name)||'');
  const report=(itemId:string)=>({itemId,result:value('result'),observedAt:value('observedAt'),evidenceRefs:value('evidenceRefs').split('\n').filter(Boolean)});
  if(action==='append_reports'){void save({...pins(),action,reports:data.getAll('itemId').map(id=>report(String(id)))});}
  else{const target=Object.values(s.activeReports).find(r=>r.id===value('reportId'));if(target)void save({...pins(),action,reportId:target.id,reasonRef:value('reasonRef'),...(action==='correct_report'?{replacement:report(target.itemId)}:{})});}
 }
 const inputs=<><label>Review result<select name="result"><option value="reviewed">Reviewed — owner report</option><option value="unresolved">Unresolved</option></select></label><label>Review observed at<input name="observedAt" required maxLength={40} placeholder="ISO time with offset"/></label><label>Review evidence references, one per line<textarea name="evidenceRefs" required maxLength={1809} placeholder="receipt:… or artifact:…"/></label></>;
 return <section aria-label="Owner retained-record review" className="bubble">
  <h3>Owner-reported review of retained normalized records</h3><p>Original transcript denominator and time coverage: unknown. Authorship is supplied, never verified. Import, checklist receipts and product observations do not advance these reports.</p>
  <button type="button" disabled={busy} onClick={()=>void refresh(m?.id)}>Refresh owner review reports</button>
  {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
  {pending&&<><p>Pending operation: {JSON.parse(pending.body).requestId}</p><button disabled={busy||!state?.writeEnabled} onClick={()=>void save()}>Reconcile identical report save</button><button disabled={busy} onClick={()=>void save(undefined,true)}>Look up pending report operation</button></>}
  {state&&<>
   {!state.initialized&&<p>Report storage is not initialized. An explicit operator migration is required; this view does not migrate storage.</p>}
   {!state.writeEnabled&&<p>Owner review report writes are disabled.</p>}
   <p>Processor: {state.processorId} version {state.processorVersion}. Owner-reported inspection only; no adapter receipt or certified processing.</p>
   {state.candidate?<><p>Eligible selection: {state.candidate.itemCount} retained normalized records. {state.candidate.excludedCount} excluded dispositions remain separate.</p><button disabled={locked} onClick={()=>void save({action:'create_manifest',reviewId:review.id,reviewVersion:state.candidate!.reviewVersion,projectId:state.candidate!.projectId,reviewExportDigest:state.candidate!.selectionDigest,analysisVersion:state.candidate!.analysisVersion})}>Create retained-selection manifest</button></>:<p>Manifest eligibility: {state.candidateStatus.replaceAll('_',' ')}. No review checkpoint is inferred.</p>}
   {!!state.manifests.length&&<label>Retained selection manifest<select value={m?.id||''} disabled={busy||!!pending} onChange={e=>void refresh(e.target.value)}>{state.manifests.map(row=><option key={row.id} value={row.id}>{row.id}</option>)}</select></label>}
   {m&&s&&<>
    <p>Manifest {m.id}; {state.relevance.replaceAll('_',' ')}. Creation review version {m.reviewVersion}.</p><details><summary>Immutable selection pins</summary><p>Selection digest (stored normalized export): {m.selectionDigest}</p><p>Manifest digest: {m.manifestDigest}. Order: retained export array, version 1.</p></details>
    <p>{s.head?`${s.reviewedCount} of ${m.itemCount} retained records reported reviewed; contiguous prefix ${s.prefixCount} of ${m.itemCount}`:'No owner review checkpoint. Import and manifest creation establish no reported review.'}</p>
    {s.head&&s.prefixCount===m.itemCount&&<p>Owner reports reviewing all {m.itemCount} records in this retained selection. Original transcript coverage remains unknown.</p>}
    <p>{m.excludedCount} excluded dispositions; {m.unknownAttributionCount} retained records with unknown attribution. Excluded content is not included.</p>
    <ol>{m.items.map(item=>{const report=s.activeReports[item.itemId];return <li key={item.itemId}>{item.itemId} · {item.attribution.replaceAll('_',' ')} · {report?report.result+' / owner_reported':'missing report'} · <a href={`#session-${review.id}-event-${item.itemId}`} onClick={event=>{event.preventDefault();onOpenEvent(item.itemId)}}>{item.sourceRef}</a>{report&&<p>{report.id} · {report.observedAt} · {report.evidenceRefs.join(', ')}</p>}</li>})}</ol>
    <details><summary>Report reviewed items</summary><form onSubmit={e=>submit(e,'append_reports')}><fieldset disabled={reportLocked}>
     {m.items.map(item=><label key={item.itemId}><input type="checkbox" name="itemId" value={item.itemId} disabled={!!s.activeReports[item.itemId]}/>Item {item.position}: {item.itemId}</label>)}{inputs}<button>Save item review reports</button>
    </fieldset></form></details>
    <details><summary>Correct or withdraw an active report</summary><form onSubmit={e=>{const submitter=(e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement;submit(e,submitter.value)}}><fieldset disabled={reportLocked||!Object.keys(s.activeReports).length}>
     <label>Active report<select name="reportId">{Object.values(s.activeReports).map(r=><option key={r.id} value={r.id}>{r.itemId} · {r.result} · {r.id}</option>)}</select></label>
     <label>Correction or withdrawal reason reference<input name="reasonRef" required maxLength={180}/></label>{inputs}
     <button value="correct_report">Correct active report</button><button value="withdraw_report" formNoValidate>Withdraw active report</button>
    </fieldset></form></details>
    <h4>Immutable owner-report history</h4><p>Loaded {state.page?.start}–{state.page?.end} of {state.page?.total} checkpoints in this page snapshot. Current counts use the complete stream.</p>
    <button disabled={busy||!!pending||!state.page?.offset} onClick={()=>void refresh(m.id,Math.max(0,state.page!.offset-50),state.page!.ceiling)}>Newer report history</button>
    <button disabled={busy||!!pending||!state.page?.hasOlder} onClick={()=>void refresh(m.id,state.page!.offset+50,state.page!.ceiling)}>Older report history</button>
    {state.history?.map(cp=><details key={cp.id}><summary>{cp.id} · historical prefix {cp.prefixCount}/{m.itemCount} · {cp.recordedAt}</summary><p>owner_reported · predecessor {cp.previousCheckpointId||'none'}</p>{cp.events.map(e=><p key={e.id}>{e.action} · {e.report?.itemId||e.itemId} · {e.report?.result||'withdrawn'} · {e.report?.evidenceRefs.join(', ')} {e.reasonRef} · {e.targetReportId}</p>)}</details>)}
   </>}
  </>}
 </section>;
}
