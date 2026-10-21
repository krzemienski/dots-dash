'use client';
import {useEffect,useState} from 'react';
import type {EngineeringState,SessionReview,Goal,SessionEvent,BrowserReceiptState} from '../lib/work/engineering';
import ContextLinks from './context-links';
import SourceCoverage from './source-coverage';
import CorrectionContext from './correction-context';
import SourceInventory from './source-inventory';
import {BrowserEvidenceLinks,BrowserRunList,noBrowserReceipts,readBrowserReceipts,type BrowserHistoryPaging} from './browser-receipts';

async function request<T>(body?:Record<string,unknown>,reviewId?:string):Promise<T>{
 const response=await fetch('/api/engineering'+(reviewId?'?reviewId='+encodeURIComponent(reviewId):''),{method:body?'POST':'GET',credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});
 const data=await response.json() as {error?:string};
 if(!response.ok)throw new Error(data.error||'Session review unavailable');
 return data as T;
}

function ObservationForm({goal,review,busy,onSave}:{goal:Goal;review:SessionReview;busy:boolean;onSave:(body:Record<string,unknown>)=>Promise<void>}){
 const [steps,setSteps]=useState(''),[observed,setObserved]=useState(''),[source,setSource]=useState(''),[result,setResult]=useState('gap');
 return <form onSubmit={e=>{e.preventDefault();void onSave({action:'observe',reviewId:review.id,version:review.version,goalId:goal.id,revision:review.export.revision,performedSteps:steps.split('\n').filter(Boolean),observed,sourceRef:source,result})}}>
  <h4>Record a performed user workflow</h4><p>Record only steps actually performed. This is an owner-reported observation, not independent verification.</p>
  <label>Performed steps, one per line<textarea required maxLength={10000} value={steps} onChange={e=>setSteps(e.target.value)}/></label>
  <label>Observed behavior<textarea required maxLength={2000} value={observed} onChange={e=>setObserved(e.target.value)}/></label>
  <label>Evidence reference (artifact:… or receipt:…)<input required pattern="(artifact|receipt):[A-Za-z0-9_.#:\-]+" maxLength={180} value={source} onChange={e=>setSource(e.target.value)}/></label>
  <label>Result<select value={result} onChange={e=>setResult(e.target.value)}><option value="gap">Gap — not established</option><option value="fail">Fail — observed mismatch</option><option value="pass">Pass — observed expected behavior</option></select></label>
  <button disabled={busy} type="submit">Save observation at this revision</button>
 </form>;
}

function EvidenceRevision({event,reviewRevision}:{event:SessionEvent;reviewRevision:string}){
 const relevance=!event.codeRevision||!reviewRevision?'Revision unavailable — relevance cannot be established.':event.codeRevision===reviewRevision?'Matches the declared review revision.':'Stale for this review — the evidence revision differs.';
 return <div className="review-evidence-relevance">
  <p><strong>Revision relevance:</strong> {relevance}</p>
  <p>Evidence revision: <code>{event.codeRevision||'Missing'}</code><br/>Declared review revision: <code>{reviewRevision||'Missing'}</code></p>
  <p>{event.inputHashes.length?`${event.inputHashes.length} input/artifact hashes recorded in the export.`:'Input provenance is missing: no hashes were supplied.'}</p>
  <p><strong>Artifact role:</strong> unknown. This export does not bind artifacts to a build producer or classify implementation edits. A source kind, filename or hash alone cannot establish that distinction.</p>
  <p>This compares export metadata. The application has not validated the artifact, environment or live checkout. A matching revision does not independently verify the recorded outcome.</p>
 </div>;
}

export function ReviewDetails({review,capabilities,busy,onSave,browserReceipts=noBrowserReceipts,browserPaging}:{review:SessionReview;capabilities:EngineeringState['capabilities'];busy:boolean;onSave:(body:Record<string,unknown>)=>Promise<void>;browserReceipts?:BrowserReceiptState;browserPaging?:BrowserHistoryPaging}){
 const [returnTaskId,setReturnTaskId]=useState<string|null>(null);
 const returnTask=review.tasks.find(task=>task.id===returnTaskId);
 const anchor=(kind:string,id:string)=>`session-${review.id}-${kind}-${id}`;
 function navigate(kind:string,id:string,fromTask?:string){
  const target=document.getElementById(anchor(kind,id));
  if(!target)return;
  if(fromTask)setReturnTaskId(fromTask);
  if(target instanceof HTMLDetailsElement)target.open=true;
  const focusTarget=kind==='verification'?target.querySelector('textarea'):target;
  focusTarget?.focus({preventScroll:true});target.scrollIntoView({block:'start'});
 }
 function returnToTask(id:string){navigate('task',id);setReturnTaskId(null)}
 const followSource=(event:React.MouseEvent<HTMLAnchorElement>,id:string)=>{event.preventDefault();navigate('event',id)};
 return <article className="card commitment-card session-review" id={'saved-session-review-'+review.id} tabIndex={-1}>
  <span className="badge gray">{review.export.dataLabel}</span><h2>{review.export.projectId} / {review.export.sessionId}</h2>
  <p>{review.coverage}</p><p>Captured {review.export.capturedAt} · review version {review.version}</p><p>Revision <code>{review.export.revision}</code> · source {review.export.sourceRef}</p>
  <SourceCoverage source={review.export}/>
  <h3>Intent and observable acceptance</h3>
  {review.export.goals.map(goal=><section key={goal.id} className="bubble" id={anchor('goal',goal.id)} tabIndex={-1} aria-labelledby={anchor('goal-heading',goal.id)}><h4 id={anchor('goal-heading',goal.id)}>{goal.text}</h4>
   {returnTask?.goalId===goal.id&&<button type="button" className="inline-link" onClick={()=>returnToTask(returnTask.id)}>Back to remediation</button>}
   <p><strong>Expected behavior:</strong> {goal.expectedBehavior}</p><ol>{goal.userSteps.map((step,i)=><li key={i}>{step}</li>)}</ol><p>Intent sources: {goal.sourceEventIds.map(id=><a key={id} href={'#'+anchor('event',id)} onClick={event=>followSource(event,id)}>{id} </a>)}</p>
   {review.observations.filter(o=>o.goalId===goal.id).map(o=><div key={o.id}><p><strong>{o.result} · {o.basis}</strong> · {o.recordedAt}</p><p>{o.observed}</p><ol>{o.performedSteps.map((s,i)=><li key={i}>{s}</li>)}</ol><p>{o.sourceRef} · revision {o.revision}</p></div>)}
   <details id={anchor('verification',goal.id)}><summary>Record end-user evidence</summary><p><strong>Verification for:</strong> {goal.text}</p><ObservationForm goal={goal} review={review} busy={busy} onSave={onSave}/>
    {returnTask?.goalId===goal.id&&<button type="button" className="inline-link" onClick={()=>returnToTask(returnTask.id)}>Back to remediation after verification</button>}
   </details>
  </section>)}
  <BrowserEvidenceLinks state={browserReceipts} review={review}/>
  <CorrectionContext events={review.export.events} eventHref={id=>'#'+anchor('event',id)} onNavigate={id=>navigate('event',id)}/>
  <h3>Decisions, observed actions and claims</h3><p>These are export-attributed records. Evidence entries are not independently verified by this application.</p>
  {review.export.events.map(event=><section className="bubble" key={event.id} id={anchor('event',event.id)} tabIndex={-1}><h4>{event.kind} · {event.id} · {event.status}</h4><p>{event.text}</p><p>{event.sourceRef} · {event.sourceKind} · {event.basis}</p><p>Scope {event.outcomeScope} · outcome {event.outcome} · observed {event.observedAt}</p>{event.kind==='evidence'&&<EvidenceRevision event={event} reviewRevision={review.export.revision}/>}<details><summary>Revision and decision provenance</summary><p>Code {event.codeRevision} · requirement {event.requirementRevision}</p><p>Input hashes: {event.inputHashes.join(', ')||'Missing'}</p><p>Supersedes: {event.supersedes.join(', ')||'None recorded'}</p></details></section>)}
  <h3>Drift findings and remediation</h3>
  {review.findings.map(finding=>{const task=review.tasks.find(t=>t.findingId===finding.id)!;const selected=review.export.skills.find(s=>s.id===task.selectedSkillId);const goal=review.export.goals.find(g=>g.id===task.goalId);const runs=review.runs.filter(run=>run.taskId===task.id);const latestRun=runs.at(-1);const observations=review.observations.filter(o=>o.goalId===task.goalId&&o.revision===review.export.revision);const latestObservation=observations.at(-1);return <section className="bubble" key={finding.id} id={anchor('task',task.id)} tabIndex={-1} aria-labelledby={anchor('task-heading',task.id)}>
   <h4 id={anchor('task-heading',task.id)}>{finding.kind.replaceAll('_',' ')}</h4><p><strong>Assessment at import:</strong> {finding.critique}</p><p>{finding.basis} · {finding.status}</p><p>Sources: {finding.sourceEventIds.map(id=><a key={id} href={'#'+anchor('event',id)} onClick={event=>followSource(event,id)}>{id} </a>)}</p>
   {goal?<><p><strong>Goal:</strong> {goal.text}</p><div className="review-navigation" role="group" aria-label="Goal and verification"><button type="button" className="inline-link" onClick={()=>navigate('goal',goal.id,task.id)}>View goal</button><button type="button" className="inline-link" onClick={()=>navigate('verification',goal.id,task.id)}>Record verification</button></div></>:<p>Scope unresolved: no goal is linked to this remediation.</p>}
   {finding.kind==='acceptance_gap'&&goal&&<div className="review-observation-context">
    {latestObservation?<><p>{observations.length} owner-reported {observations.length===1?'observation':'observations'} for this goal at revision {review.export.revision}.</p><p><strong>Latest owner report:</strong> {latestObservation.result} · {latestObservation.recordedAt}</p><p>{latestObservation.sourceRef}</p><button type="button" className="inline-link" onClick={()=>navigate('goal',goal.id,task.id)}>View recorded observations</button><p>Owner reports do not independently verify product behavior or complete remediation. Earlier reports remain in the goal history.</p></>:<p>No owner-reported observation for this goal at revision {review.export.revision}.</p>}
   </div>}
   {latestRun?<div className="review-receipt-context"><p>{runs.length} saved checklist {runs.length===1?'receipt':'receipts'} for this remediation. Latest: {latestRun.state} · skill revision {latestRun.skillRevision}.</p><button type="button" className="inline-link" onClick={()=>navigate('run',latestRun.id,task.id)}>View latest checklist receipt</button></div>:<p>No checklist receipt for this remediation.</p>}
   <p className="section-note">Original remediation draft · recorded at import. Review against later evidence before reuse.</p><pre className="review-prompt">{task.prompt}</pre><p>Remediation: {task.status.replaceAll('_',' ')}</p>
   <label>Applicable skill checklist<select value={task.selectedSkillId||''} disabled={busy||!task.applicableSkillIds.length} onChange={e=>{if(e.target.value)void onSave({action:'select',reviewId:review.id,version:review.version,taskId:task.id,skillId:e.target.value})}}><option value="">Select a checklist</option>{task.applicableSkillIds.map(id=>{const skill=review.export.skills.find(s=>s.id===id)!;return <option key={id} value={id}>{skill.name}</option>})}</select></label>
   <p>Applicability and selection do not prove invocation. This runner executes only the selected declarative checks, not the original skill instructions or a model.</p>
   {selected&&<><p>Selected revision: {selected.revision}. Checks: {selected.checks.join(', ')}.</p><button disabled={busy||!capabilities.executeChecklist} onClick={()=>void onSave({action:'run',reviewId:review.id,version:review.version,taskId:task.id,skillId:selected.id,expectedRevision:review.export.revision,skillRevision:selected.revision,capability:'review_checklist',authorized:true})}>Authorize and run local checklist</button></>}
  </section>})}
  <h3>User-selected skill inventory</h3>{!review.export.skills.length&&<p>No skills supplied.</p>}{review.export.skills.map(skill=><div className="bubble" key={skill.id}><h4>{skill.name}</h4><p>{skill.summary}</p><p>{skill.sourceRef} · revision {skill.revision}</p><p>Invocation scope: {skill.invocationScope}</p></div>)}
  <h3>Actual review receipts</h3><BrowserRunList state={browserReceipts} review={review} paging={browserPaging}/><h4>Local checklist receipts</h4>{!review.runs.length&&<p>No checklist has run. Provider agents are unconfigured.</p>}
  {review.runs.map(run=><section className="bubble" key={run.id} id={anchor('run',run.id)} tabIndex={-1} aria-labelledby={anchor('run-heading',run.id)}><h4 id={anchor('run-heading',run.id)}>{run.state} · local checklist invocation</h4><button type="button" className="inline-link" onClick={()=>returnToTask(run.taskId)}>Back to remediation</button><p>{run.recordedAt} · {run.id}</p><p>Task {run.taskId} · skill {run.skillId} · {run.scope}</p><ul>{run.checks.map(check=><li key={check.check}>{check.check}: {check.result} · {check.sourceRefs.join(', ')||'No source receipt'}</li>)}</ul><p>Product acceptance: {run.acceptance} ({run.acceptanceBasis}). {run.productVerification.replaceAll('_',' ')}.</p><p>No external execution. Completing this review does not complete the remediation.</p><details><summary>Pinned execution evidence</summary><p>Revision {run.revision} · skill {run.skillRevision}</p><p>Input hash {run.inputHash}</p><p>Authorization hash {run.authorizationHash}</p></details></section>)}
 </article>;
}

export default function SessionReviewWorkspace({initialRequestId}:{initialRequestId?:string}={}){
 const [state,setState]=useState<EngineeringState|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[payload,setPayload]=useState('');
 const [browserReceipts,setBrowserReceipts]=useState<BrowserReceiptState>(noBrowserReceipts);
 const [browserCursors,setBrowserCursors]=useState<string[]>([]),[browserPageError,setBrowserPageError]=useState('');
 const pageFailure='Run history could not be read. Showing the previously loaded page; retry navigation or use Latest runs.';
 async function readState(reviewId?:string){const [reviewState,receipts]=await Promise.all([request<EngineeringState>(undefined,reviewId),readBrowserReceipts(browserReceipts.page?.cursor||undefined)]);setState(reviewState);if(receipts.status==='unavailable'&&browserReceipts.status==='available'){setBrowserPageError(pageFailure);}else{setBrowserReceipts(receipts);setBrowserPageError('');if(!receipts.page?.cursor)setBrowserCursors([]);}}
 async function navigateRuns(direction:'older'|'newer'|'latest'){
  const cursor=direction==='older'?browserReceipts.page?.nextCursor:direction==='newer'?browserCursors.at(-1):undefined;
  if(direction!=='latest'&&!cursor)return;
  setBusy(true);setBrowserPageError('');
  try{const next=await readBrowserReceipts(cursor||undefined);if(next.status!=='available'){if(browserReceipts.status==='available')setBrowserPageError(pageFailure);else{setBrowserReceipts(next);setBrowserCursors([]);}return;}
   setBrowserReceipts(next);setBrowserCursors(direction==='latest'?[]:direction==='newer'?browserCursors.slice(0,-1):[...browserCursors,browserReceipts.page!.cursor!]);
   requestAnimationFrame(()=>{const target=document.getElementById('owned-browser-run-history');target?.focus({preventScroll:true});target?.scrollIntoView({block:'start'});});
  }finally{setBusy(false);}
 }
 const browserPaging:BrowserHistoryPaging={busy,canGoNewer:browserCursors.length>0,error:browserPageError,onNavigate:direction=>{void navigateRuns(direction);}};
 async function load(reviewId?:string){setBusy(true);setError('');try{await readState(reviewId)}catch(e){setState(null);setError(e instanceof Error?e.message:'Review unavailable')}finally{setBusy(false)}}
 useEffect(()=>{void load()},[]);
 async function save(body:Record<string,unknown>){setBusy(true);setError('');setNotice('');try{const result=await request<{review:SessionReview;executed:boolean}>({...body,requestId:crypto.randomUUID()});await readState(result.review.id);setNotice(result.executed?'Local checklist receipt saved. Product behavior still requires end-user evidence.':'Saved locally. No execution requested.')}catch(e){setState(null);setError((e instanceof Error?e.message:'Operation not confirmed')+'. Refresh records before retrying.')}finally{setBusy(false)}}
 return <section className="session-review"><h2>Session intent and drift review</h2><p>Import a selected, sanitized visible export. Review source-linked goals, scope decisions and behavior gaps before authorizing a bounded checklist.</p>
  <button onClick={()=>void load()} disabled={busy}>Refresh session reviews</button>{busy&&<p role="status">Working…</p>}{error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
  <SourceInventory review={state?.reviews[0]} onOpenReview={load}/>
  {state&&<><p>Runner: {state.capabilities.runner}. External execution disabled. Named provider session adapters unavailable.</p>
   <p>{state.totalReviews} saved reviews; index shows the latest {state.reviewIndex.length}. One full review is loaded at a time.</p>
   {!!state.reviewIndex.length&&<label>Saved session review<select disabled={busy} value={state.reviews[0]?.id||''} onChange={e=>void load(e.target.value)}>{state.reviewIndex.map(item=><option key={item.id} value={item.id}>{item.projectId} / {item.sessionId} · v{item.version}</option>)}</select></label>}
   <details><summary>Import sanitized owner export</summary><p>Use the dots-visible-session v1 contract. Source references are opaque names, not file paths or fetchable URLs. Do not paste raw transcripts, secrets or hidden instructions.</p><a href="/api/engineering/schema" target="_blank" rel="noreferrer">View export schema</a>
    <form onSubmit={e=>{e.preventDefault();try{const value=JSON.parse(payload);void save({action:'import',export:value})}catch{setError('Export must be valid JSON')}}}><label>Sanitized export JSON<textarea required maxLength={240000} value={payload} onChange={e=>setPayload(e.target.value)}/></label><button disabled={busy||!state.capabilities.import}>Import and analyze</button></form>{!state.capabilities.import&&<p>Owner session import is disabled.</p>}
   </details><ContextLinks review={state.reviews[0]} onOpenReview={load} initialRequestId={initialRequestId}/>{!state.reviews.length&&<><p>No session exports imported. Empty coverage does not establish no work happened.</p><article className="card commitment-card"><h3>Actual review receipts</h3><BrowserRunList state={browserReceipts} paging={browserPaging}/></article></>}{state.reviews.map(review=><ReviewDetails key={review.id} review={review} capabilities={state.capabilities} busy={busy} onSave={save} browserReceipts={browserReceipts} browserPaging={browserPaging}/>)}</>}
 </section>;
}
