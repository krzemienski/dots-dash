'use client';
import {useEffect,useRef,useState} from 'react';
const endpoint='/api/request-action-claims';
type Data=Record<string,any>;
type Pending={body:string;digest:string;phase:'unconfirmed'|'saved'};
const canonical=(v:any):any=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
async function hash(body:Data){const {operationId,...semantic}=body;const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(canonical(semantic))));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')}
export default function RequestActionClaims({requestId}:{requestId:string}){
 const [state,setState]=useState<Data|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[pending,setPending]=useState<Pending|null>(null);
 const [candidate,setCandidate]=useState<Data|null>(null),[editing,setEditing]=useState<Data|null>(null),[inspect,setInspect]=useState<Data|null>(null),[route,setRoute]=useState(()=>location.hash);
 const gate=useRef(false),pendingRef=useRef<Pending|null>(null),sequence=useRef(0);
 const parts=route.slice(1).split('/'),claimId=parts[2]==='claims'?parts[3]:undefined,eventView=parts[4]==='event',eventRevision=eventView?parts[5]:undefined;
 function retain(p:Pending|null){pendingRef.current=p;setPending(p)}
 function navigate(id?:string,event=false,revision?:number){location.hash='requests/'+encodeURIComponent(requestId.slice(11))+(id?'/claims/'+id+(event?'/event/'+revision:''):'')}
 async function read(q:Data={}){const response=await fetch(endpoint+'?'+new URLSearchParams({sourceRequestId:requestId,...q}),{credentials:'same-origin',cache:'no-store'});const data=await response.json() as Data;if(!response.ok)throw Error(data.error||'Action claim read unavailable');return data}
 async function load(cursor?:string){const id=++sequence.current;try{const data=await read({...claimId?{claimId}:{},...eventRevision?{revision:eventRevision}:{},...cursor?{cursor}:{}});if(id===sequence.current)setState(data)}catch(e){if(id===sequence.current)setState(null);throw e}}
 async function refresh(cursor?:string){if(gate.current)return;gate.current=true;setBusy(true);setError('');try{await load(cursor);if(pendingRef.current?.phase==='saved'){retain(null);setNotice('Confirmed save refreshed. Owner report only.')}}catch(e){setError((e as Error).message)}finally{gate.current=false;setBusy(false)}}
 useEffect(()=>{const fn=()=>setRoute(location.hash);window.addEventListener('hashchange',fn);return()=>window.removeEventListener('hashchange',fn)},[]);
 useEffect(()=>{let active=true;setCandidate(null);setInspect(null);setEditing(null);setState(null);setBusy(true);setError('');void load().catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setBusy(false)});return()=>{active=false;sequence.current++}},[requestId,claimId,eventRevision]);
 useEffect(()=>{if(!pending)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue=''};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[!!pending]);
 async function save(fields?:Data,lookup=false){
  if(gate.current)return;gate.current=true;setBusy(true);setError('');setNotice('');
  let attempt=pendingRef.current;
  try{
   if(!attempt){if(!fields||!state?.writeEnabled)return;const envelope={format:'dots-request-action-claim',schemaVersion:1,operationId:crypto.randomUUID(),...fields};attempt={body:JSON.stringify(envelope),digest:await hash(envelope),phase:'unconfirmed'};retain(attempt)}
   if(attempt.phase==='saved'){await load();retain(null);setNotice('Confirmed save refreshed. Owner report only.');return}
   const envelope=JSON.parse(attempt.body);let result:Data;
   if(lookup){const response=await read({operationId:envelope.operationId});if(response.operation?.state!=='committed'||response.operation.payloadDigest!==attempt.digest)throw Error('Operation remains unknown');result=response.operation.response}
   else{const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:attempt.body});result=await response.json();if(!response.ok){
    if(fields&&[400,401,403,404,409,413,415].includes(response.status)){retain(null);throw Error(result.error||'Claim rejected; refresh before another write')}
    throw Error('Original operation remains unconfirmed');}}
   if(result.ok!==true||result.executed!==false||result.basis!=='owner_reported'||result.sourceRequestId!==requestId||result.operationId!==envelope.operationId||result.payloadDigest!==attempt.digest)throw Error('Response could not be confirmed');
   retain({...attempt,phase:'saved'});setNotice('Owner report saved. No action or verified completion established.');setEditing(null);
   try{await load();retain(null)}catch{throw Error('Saved, but refresh failed. Refresh confirmed save; do not submit another operation.')}
  }catch(e){setError(pendingRef.current?.phase==='unconfirmed'?'Outcome unconfirmed. New writes blocked; reconcile the exact operation.':(e as Error).message)}finally{gate.current=false;setBusy(false)}
 }
 async function selectEvidence(form:HTMLFormElement){if(gate.current||pending)return;gate.current=true;setBusy(true);setError('');setCandidate(null);try{const values=new FormData(form);setCandidate((await read({reviewId:String(values.get('reviewId')),eventId:String(values.get('eventId'))})).candidate)}catch(e){setError((e as Error).message)}finally{gate.current=false;setBusy(false)}}
 function submit(form:HTMLFormElement){if(!state?.request?.request)return;const data=new FormData(form),v=(k:string)=>String(data.get(k)||'');const request=state.request.request;
  void save({action:editing?'correct':'create',...(editing?{claimId:editing.claimId,expectedRevision:editing.revision,reason:v('reason')}:{}),sourceRequestId:requestId,sourceRequestVersion:request.version,sourceRequestHash:request.hash,requestHashAlgorithm:'node-stored-json-sha256-v1',projectId:v('projectId'),actionSummary:v('actionSummary'),expectedResult:v('expectedResult'),performance:v('performance'),reportedResult:v('reportedResult'),reportedAt:v('reportedAt')||null,evidence:candidate?{...candidate.pins,relation:v('relation')}:null});
 }
 const locked=busy||!!pending||!state?.writeEnabled,selectedRevision=state?.records?.[0];
 return <section className="request-claims" aria-label="Owner-reported action claims">
  <h4>Owner-reported action claims</h4><p>No completion certification. Imported evidence, source links and owner reports do not establish authorship, execution or original-source coverage.</p>
  <p>Pending recovery stays in memory only. Leaving or reloading loses the envelope; inspect recent operations before creating a replacement.</p>
  <button disabled={busy} onClick={()=>void refresh()}>Refresh action claims</button>
  {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
  {pending&&<section aria-label="Action claim recovery"><p>{pending.phase==='saved'?'Save confirmed; refresh pending':'Unconfirmed action claim'} · {JSON.parse(pending.body).operationId}</p><button disabled={busy} onClick={()=>void save()}>{pending.phase==='saved'?'Refresh confirmed claim save':'Reconcile exact claim save'}</button>{pending.phase==='unconfirmed'&&<button disabled={busy} onClick={()=>void save(undefined,true)}>Look up pending claim operation</button>}</section>}
  {state&&<>
   {!state.writeEnabled&&<p>Action claim writes are disabled. Existing reports remain readable.</p>}
   <p>Request target: {state.request?.state||'unavailable'}. Request/project association is owner asserted.</p>
   {claimId&&<><button disabled={busy||!!pending} onClick={()=>navigate()}>Back to request claims</button><p>History is read-only. Return to request claims and refresh to inspect the current claim before correcting or withdrawing it.</p></>}
   {eventView?<><button disabled={busy||!!pending} onClick={()=>navigate(claimId)}>Back to claim history</button>{selectedRevision?.evidence?<><h4>Exact retained review event</h4><p>Review {selectedRevision.evidence.reviewId} · event {selectedRevision.evidence.eventId}</p><pre>{JSON.stringify(selectedRevision.evidenceSnapshot,null,2)}</pre><button disabled={busy} onClick={()=>{setInspect(null);void read({reviewId:selectedRevision.evidence.reviewId,eventId:selectedRevision.evidence.eventId}).then(d=>setInspect(d.candidate)).catch(e=>setError(e.message))}}>Read current exact event</button>{inspect&&<pre>{JSON.stringify(inspect,null,2)}</pre>}</>:<p>No event bound.</p>}</>:<>
   <p>Showing {state.records.length} of {state.page.total} {claimId?'revisions':'claims'} at sequence ceiling {state.page.ceiling}; offset {state.page.offset}. Withdrawn history remains visible.</p>
   {!state.records.length&&<p>No owner-reported action claims in this selection. No completion inferred.</p>}
   {state.records.map((r:Data)=><article className="bubble" key={r.claimId+':'+r.revision}>
    <h4>{r.actionSummary}</h4><p>{r.claimId} · revision {r.revision} · {r.lifecycle} · Owner-reported action claim</p><p>{r.performance==='reported_performed'?'Owner reports performed':'Performance unknown'} · Reported result: {r.reportedResult}. Actor: unknown.</p><p>Expected: {r.expectedResult}</p><p>Reported time: {r.reportedAt||'unknown'} · Recorded: {r.recordedAt}</p>
    <p>Request: {r.requestState.state} {r.requestState.mismatches.join(', ')} · Evidence: {r.evidenceState.state} {r.evidenceState.mismatches.join(', ')}</p>
    {r.evidence?<><p>Asserted relation: {r.evidence.relation}. Original event result: {r.evidenceSnapshot.event.outcome}; scope: {r.evidenceSnapshot.event.outcomeScope}; basis: {r.evidenceSnapshot.basis}; attribution: {r.evidenceSnapshot.attribution}.</p><p>{r.evidenceSnapshot.event.text}</p><button disabled={busy||!!pending} onClick={()=>navigate(r.claimId,true,r.revision)}>Inspect bound event {r.evidence.eventId}</button></>:<p>Evidence not bound. No verified result.</p>}
    {r.reason&&<p>Revision reason: {r.reason}</p>}
    <details><summary>Historical pins and operation</summary><pre>{JSON.stringify({requestVersion:r.sourceRequestVersion,requestHash:r.sourceRequestHash,projectId:r.projectId,evidence:r.evidence,operationId:r.operationId},null,2)}</pre></details>
    {!claimId&&<button disabled={busy||!!pending} onClick={()=>navigate(r.claimId)}>Open claim history</button>}
    {r.lifecycle==='active'&&!claimId&&<><button disabled={locked} onClick={()=>{setEditing(r);setCandidate(null)}}>Correct claim revision {r.revision}</button><form onSubmit={e=>{e.preventDefault();void save({action:'withdraw',claimId:r.claimId,expectedRevision:r.revision,reason:String(new FormData(e.currentTarget).get('reason'))})}}><fieldset disabled={locked}><label>Withdrawal reason<input name="reason" required maxLength={500}/></label><button>Withdraw claim revision {r.revision}</button></fieldset></form></>}
   </article>)}
   {state.page.next&&<button disabled={busy||!!pending} onClick={()=>void refresh(state.page.next)}>Next 50 {claimId?'revisions':'claims'}</button>}
   <details><summary>Recent claim operations</summary><p>{state.operationScope}</p>{state.recentOperations.map((op:Data)=><p key={op.operationId}>{op.operationId} · {op.claimId} revision {op.revision} · saved owner report</p>)}</details>
   <h4>{editing?'Correct owner report':'New owner report'}</h4>{editing&&<p>Correcting {editing.claimId} revision {editing.revision}. Reselect evidence explicitly; leaving it unbound removes the current binding only in the new revision.</p>}
   <form onSubmit={e=>{e.preventDefault();void selectEvidence(e.currentTarget)}}><fieldset disabled={locked}><legend>Optional retained evidence selection</legend><label>Review ID<input name="reviewId" required maxLength={100}/></label><label>Event ID<input name="eventId" required maxLength={100}/></label><button>Inspect selected evidence</button></fieldset></form>
   {candidate&&<div className="bubble"><p>Selected {candidate.pins.reviewId}/{candidate.pins.eventId} · project {candidate.projectId} · outcome {candidate.event.outcome} · {candidate.basis} · attribution {candidate.attribution}</p><p>{candidate.event.text}</p><button disabled={locked} onClick={()=>setCandidate(null)}>Clear selected evidence</button></div>}
   <form key={editing?editing.claimId+':'+editing.revision:'new'} onSubmit={e=>{e.preventDefault();submit(e.currentTarget)}}><fieldset disabled={locked||state.request?.state!=='available'}>
    <label>Asserted project ID<input aria-label="Asserted project ID" name="projectId" required maxLength={100} defaultValue={editing?.projectId||''} readOnly={!!editing}/></label>
    <label>Action summary<textarea aria-label="Action summary" name="actionSummary" required maxLength={2000} defaultValue={editing?.actionSummary||''}/></label><label>Expected result<textarea aria-label="Expected result" name="expectedResult" required maxLength={2000} defaultValue={editing?.expectedResult||''}/></label>
    <label>Performance<select aria-label="Performance" name="performance" defaultValue={editing?.performance||'unknown'}><option value="unknown">Performance unknown</option><option value="reported_performed">Owner reports performed</option></select></label>
    <label>Reported result<select aria-label="Reported result" name="reportedResult" defaultValue={editing?.reportedResult||'unknown'}>{['unknown','pass','fail','gap','blocked'].map(v=><option key={v}>{v}</option>)}</select></label>
    <label>Reported time (optional ISO offset)<input aria-label="Reported time (optional ISO offset)" name="reportedAt" maxLength={40} defaultValue={editing?.reportedAt||''}/></label>
    <label>Asserted evidence relation<select aria-label="Asserted evidence relation" name="relation"><option>context</option><option>supports</option><option>contradicts</option></select></label>
    {editing&&<label>Correction reason<input name="reason" required maxLength={500}/></label>}<button>{editing?'Save corrected claim':'Save owner claim'}</button>
   </fieldset></form>{editing&&<button disabled={busy||!!pending} onClick={()=>{setEditing(null);setCandidate(null)}}>Cancel correction</button>}
   </>}
  </>}
 </section>;
}
