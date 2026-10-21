'use client';
import {useEffect,useRef,useState} from 'react';
import type {SessionReview} from '../lib/work/engineering';
type PendingLinkSave={body:string;uncertain:boolean};
type Source={id:string;title:string;version:number;hash:string};
type ContextTask={id:string;title:string;repositoryRef:string;projectId:string;revision:string;reviewId:string;reviewVersion:number;sourceRequestId:string;sourceRequestVersion:number;sourceRequestHash:string;recordedAt:string;basis:string;requestState:string;reviewState:string;currentRequest:Source|null;currentReview:{id:string;version:number;revision:string;projectId:string}|null;permissions:{requestRead:string;reviewRead:string;repositoryAccess:string;execution:string;send:string}};
type ContextState={schemaVersion:1;capabilities:{link:boolean;externalExecution:false;send:false};requests:Source[];requestCoverageComplete:boolean;tasks:ContextTask[]};
export function focusContext(id:string){requestAnimationFrame(()=>{const node=document.getElementById(id);node?.focus({preventScroll:true});node?.scrollIntoView({block:'start'});});}
export default function ContextLinks({review,onOpenReview,initialRequestId}:{review?:SessionReview;onOpenReview:(id:string)=>Promise<void>;initialRequestId?:string}){
 const [state,setState]=useState<ContextState|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[requestId,setRequestId]=useState(initialRequestId||''),[title,setTitle]=useState(''),[repositoryRef,setRepositoryRef]=useState('');
 const pendingRef=useRef<PendingLinkSave|null>(null),savingRef=useRef(false);
 const [pendingSave,setPendingSave]=useState<PendingLinkSave|null>(null),[saving,setSaving]=useState(false);
 async function load(){setBusy(true);setError('');try{const response=await fetch('/api/context-links',{credentials:'same-origin'});if(!response.ok)throw new Error('Request links are unavailable. No missing-target conclusion can be drawn.');const next=await response.json() as ContextState;setState(next);setRequestId(current=>next.requests.some(r=>r.id===current)?current:next.requests[0]?.id||'');}catch(e){setState(null);setError((e as Error).message)}finally{setBusy(false)}}
 useEffect(()=>{void load()},[review?.id,review?.version]);
 useEffect(()=>{if(initialRequestId&&state?.requests.some(r=>r.id===initialRequestId))focusContext('context-request-'+initialRequestId)},[initialRequestId,!!state]);
 async function save(){
  if(savingRef.current)return;
  let attempt=pendingRef.current;
  if(!attempt){
   const source=state?.requests.find(r=>r.id===requestId);if(!source||!review||!state?.capabilities.link)return;
   attempt={body:JSON.stringify({action:'link',requestId:crypto.randomUUID(),sourceRequestId:source.id,sourceRequestVersion:source.version,sourceRequestHash:source.hash,reviewId:review.id,reviewVersion:review.version,projectId:review.export.projectId,revision:review.export.revision,repositoryRef,title}),uncertain:false};
   pendingRef.current=attempt;setPendingSave(attempt);
  }
  savingRef.current=true;setSaving(true);setError('');setNotice('');
  try{
   // Replaying this exact envelope reconciles a committed-but-unseen result.
   const response=await fetch('/api/context-links',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:attempt.body});
   const result=await response.json() as {ok?:boolean;error?:string;task?:{id?:string};executed?:boolean;sent?:boolean;externalExecution?:boolean};
   if(!response.ok){
    // A later denial cannot resolve an earlier uncertain attempt (e.g. revocation).
    if(!attempt.uncertain&&[400,401,403,404,409,413,415].includes(response.status)){pendingRef.current=null;setPendingSave(null);throw new Error(result.error||'Association rejected. Correct the draft before saving again.');}
    throw new Error('Association outcome is still unconfirmed.');
   }
   if(result.ok!==true||typeof result.task?.id!=='string'||!/^context-[a-f0-9]{32}$/.test(result.task.id)||result.executed!==false||result.sent!==false||result.externalExecution!==false)throw new Error('Association response could not be confirmed.');
   const savedId=result.task.id;pendingRef.current=null;setPendingSave(null);setTitle('');setRepositoryRef('');
   await load();setNotice('Association saved. No execution or send authority granted.');focusContext('context-task-'+savedId);
  }catch(e){
   if(pendingRef.current){attempt.uncertain=true;setPendingSave({...attempt});setError('Save outcome is unconfirmed. Retry the pending save to reconcile the same operation; a new association is blocked. Keep this view open until resolved.');}
   else setError((e as Error).message);
  }finally{savingRef.current=false;setSaving(false);}
 }
 useEffect(()=>{
  if(!pendingSave)return;
  const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
  window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
 },[!!pendingSave]);
 async function openReview(id:string){await onOpenReview(id);focusContext('linked-session-review-'+id)}
 return <section aria-label="Request and repository links"><h3>Request and repository links</h3><p>Links connect saved metadata. They do not grant repository access, execution or send authority. Repository references are opaque names and are never opened. Current means matching the snapshots read now, not a live subscription.</p>
  <button disabled={busy||saving} onClick={()=>void load()}>Refresh request links</button>{pendingSave&&<p role="status">Pending association save. The original payload and operation ID are retained in this view. <button disabled={saving} onClick={()=>void save()}>Retry pending save</button></p>}{error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
  {state&&<><p>Link creation: {state.capabilities.link?'enabled by this host':'disabled'}. Execution: not granted by links. Sending: not granted by links.</p>{!state.requestCoverageComplete&&<p>Only the first 50 permitted request records are listed. An absent request outside this projection is unknown, not proven missing.</p>}
   <h4>Saved requests</h4>{!state.requests.length&&<p>No requests in this permitted projection.</p>}{state.requests.map(source=><section className="bubble" id={'context-request-'+source.id} tabIndex={-1} key={source.id} aria-label={'Request '+source.id}><h4>{source.title}</h4><p>Canonical request {source.id} · current version {source.version}</p><p>No correspondence content is copied here.</p>{state.tasks.filter(t=>t.sourceRequestId===source.id).map(task=><p key={task.id}><button className="inline-link" onClick={()=>focusContext('context-task-'+task.id)}>Open repository task: {task.title}</button></p>)}{!state.tasks.some(t=>t.sourceRequestId===source.id)&&<p>No repository task association saved.</p>}</section>)}
   <details><summary>Link a repository task to this review</summary><p>Create an immutable association using the selected review's declared project and revision. Changed targets require a new reviewed association; earlier links remain history.</p>
    {!review?<p>Select or import a session review first.</p>:<form onSubmit={e=>{e.preventDefault();void save()}}><label>Saved request<select value={requestId} disabled={busy||saving||!!pendingSave||!state.capabilities.link} onChange={e=>setRequestId(e.target.value)}><option value="">Choose a request</option>{state.requests.map(r=><option key={r.id} value={r.id}>{r.title}</option>)}</select></label><label>Repository task title<input disabled={saving||!!pendingSave} required maxLength={300} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Repository reference (artifact:…)<input disabled={saving||!!pendingSave} required maxLength={180} pattern="artifact:[A-Za-z0-9_.#:\-]+" value={repositoryRef} onChange={e=>setRepositoryRef(e.target.value)}/></label><p>Review {review.id} · version {review.version} · project {review.export.projectId} · declared revision {review.export.revision}</p><button disabled={busy||saving||!!pendingSave||!state.capabilities.link||!requestId}>Save repository task link</button></form>}
   </details>
   <h4>Repository task associations</h4>{!state.tasks.length&&<p>No repository task associations saved.</p>}{state.tasks.map(task=><section className="bubble" key={task.id} id={'context-task-'+task.id} tabIndex={-1} aria-label={'Repository task '+task.id}><h4>{task.title}</h4><p>{task.basis} · {task.recordedAt}</p><p>Repository {task.repositoryRef} · project {task.projectId} · declared revision {task.revision}. No live repository inspection.</p><p>Request link: <strong>{task.requestState}</strong> · recorded version {task.sourceRequestVersion}{task.currentRequest?' · current version '+task.currentRequest.version:''}</p><p>Review link: <strong>{task.reviewState}</strong> · recorded version {task.reviewVersion}{task.currentReview?' · current version '+task.currentReview.version:''}</p>{(task.requestState==='stale'||task.reviewState==='stale')&&<p>Targets changed after linking. Navigation opens the current record; the original pins remain historical.</p>}{(task.requestState==='missing'||task.reviewState==='missing')&&<p>A linked target is missing. The association is retained; no replacement is inferred.</p>}
    <p>Request read: {task.permissions.requestRead}. Review read: {task.permissions.reviewRead}. Repository access: {task.permissions.repositoryAccess.replaceAll('_',' ')}. Execution: {task.permissions.execution.replaceAll('_',' ')}. Sending: {task.permissions.send.replaceAll('_',' ')}.</p>
    <details><summary>Recorded link pins</summary><p>Request {task.sourceRequestId} · hash <code>{task.sourceRequestHash}</code></p><p>Review {task.reviewId} · version {task.reviewVersion}</p></details><div className="review-navigation"><button className="inline-link" disabled={!task.currentRequest} onClick={()=>focusContext('context-request-'+task.sourceRequestId)}>Back to linked request</button><button className="inline-link" disabled={!task.currentReview||busy} onClick={()=>void openReview(task.reviewId)}>Open linked session review</button></div>
   </section>)}
   {review&&<section id={'linked-session-review-'+review.id} tabIndex={-1} aria-label="Session review return links"><h4>Return from selected session review</h4><p>Session {review.export.sessionId} · project {review.export.projectId} · version {review.version}. Full review follows below.</p>{state.tasks.filter(task=>task.reviewId===review.id).map(task=><p key={task.id}><button className="inline-link" onClick={()=>focusContext('context-task-'+task.id)}>Back to repository task: {task.title}</button></p>)}{!state.tasks.some(task=>task.reviewId===review.id)&&<p>No request/task association is saved for this review.</p>}</section>}
  </>}
 </section>;
}
