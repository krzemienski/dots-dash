'use client';
import type {BrowserReceiptState,BrowserRuntimeRelevance,BrowserFileMeasurement,SessionReview} from '../lib/work/engineering';

function navigate(id:string){const node=document.getElementById(id);if(!node)return;node.focus({preventScroll:true});node.scrollIntoView({block:'start'});}
const roles={target:'Target review observed during this run',historical:'Historical input review',partial:'Partial observation of historical input'};
export const noBrowserReceipts:BrowserReceiptState={status:'unconfigured',total:0,runs:[]};
export type BrowserHistoryPaging={busy:boolean;canGoNewer:boolean;error:string;onNavigate:(direction:'older'|'newer'|'latest')=>void};
export async function readBrowserReceipts(cursor?:string):Promise<BrowserReceiptState>{
 try{const response=await fetch('/api/browser-receipts'+(cursor?'?cursor='+encodeURIComponent(cursor):''),{credentials:'same-origin'});if(!response.ok)throw new Error();return await response.json() as BrowserReceiptState;}
 catch{return {status:'unavailable',total:0,runs:[]};}
}
function unavailable(state:BrowserReceiptState){return state.status==='unconfigured'?'Owned browser receipt reader is not configured. No receipt coverage is established.':'Owned browser receipts are unavailable. Refresh to read again; no result is inferred.';}
export function BrowserEvidenceLinks({state,review}:{state:BrowserReceiptState;review:SessionReview}){
 const linked=state.runs.filter(run=>run.receipt&&run.relations.some(r=>r.reviewId===review.id));
 return <section id={'browser-evidence-'+review.id} tabIndex={-1} aria-label="Adapter-produced evidence"><h3>Adapter-produced evidence</h3>
  <p>These links cover only the loaded run-history page. Imported evidence and owner reports keep their original attribution.</p>
  {state.status!=='available'?<p>{unavailable(state)}</p>:linked.length?linked.map(run=><p key={run.runId}><button className="inline-link" onClick={()=>navigate('browser-run-'+run.runId)}>View adapter run {run.runId}</button> · {run.receipt!.state.replaceAll('_',' ')} · {run.receipt!.result}</p>):<p>No finalized adapter receipt on this page is linked to this review. Other pages may contain evidence; completion is not established.</p>}
  <button className="inline-link" onClick={()=>navigate('owned-browser-run-history')}>Browse owned run history</button>
 </section>;
}
function RuntimeRelevance({assessment}:{assessment?:BrowserRuntimeRelevance}){
 if(!assessment)return <p>Dependency and environment relevance: unknown — no assessment is available.</p>;
 return <section aria-label="Dependency and environment relevance">
  <p><strong>Dependency and environment relevance:</strong> {assessment.state==='stale'?'Stale — a measured input changed; the recorded outcome is historical.':assessment.state==='unknown'?'Unknown overall — some inputs cannot be measured.':'Allowlisted measured inputs match.'}</p>
  <p>Measured on demand · {assessment.measuredAt}. Refresh session reviews to measure again. No background monitoring or automatic rerun.</p>
  {([['Dependencies',assessment.dependencies],['Environment',assessment.environment]] as const).map(([label,group])=><div key={label}><p><strong>{label}:</strong> {group.state==='matches_measured_inputs'?'All measured inputs match.':group.state==='stale'?'Changed inputs detected.':'Coverage is incomplete.'}</p><details><summary>{label} input comparisons</summary><ul>{group.fields.map(field=><li key={field.input}><code>{field.input}</code> · {field.state==='matches'?'matches':field.state==='changed'?'changed':'unknown'}{field.reason?' · '+field.reason.replaceAll('_',' '):''}</li>)}</ul></details></div>)}
  <p>Matching bytes do not establish runtime versions or current browser settings. Historical pass, receipt identity and attribution are unchanged.</p>
 </section>;
}
function HistoryControls({state,paging,end=false}:{state:BrowserReceiptState;paging?:BrowserHistoryPaging;end?:boolean}){
 if(!paging)return null;
 return <div className="review-navigation" role="group" aria-label={end?'Owned run history pages at end':'Owned run history pages'}>
  <button className="inline-link" disabled={paging.busy||!paging.canGoNewer} onClick={()=>paging.onNavigate('newer')}>Newer runs</button>
  <button className="inline-link" disabled={paging.busy||!state.page?.nextCursor} onClick={()=>paging.onNavigate('older')}>Older runs</button>
  <button className="inline-link" disabled={paging.busy} onClick={()=>paging.onNavigate('latest')}>Latest runs</button>
 </div>;
}
function MeasuredFiles({measurement}:{measurement:BrowserFileMeasurement}){
 const roleLabel=(name:string)=>{
  const entry=measurement.fileRoles?.find(item=>item.name===name&&item.basis==='owned_receipt_input_manifest');
  return entry?.role==='recorded_build_output'?'Recorded build output (served bundle)':entry?.role==='recorded_file'?'Recorded input file — implementation role unknown':'Artifact role unknown';
 };
 return <div>
  <p>{measurement.checkedFiles} files checked · {measurement.measuredAt}</p>
  {([['Changed',measurement.changedFiles],['Unavailable',measurement.unavailableFiles]] as const).map(([label,names])=>names.length>0&&<div key={label}>
   <p><strong>{label} measured files</strong> · up to 10 names shown</p>
   <ul>{[...new Set(names)].map(name=><li key={name}><code>{name}</code> · {roleLabel(name)}</li>)}</ul>
  </div>)}
  <p>Roles describe the recorded input manifest. A changed build output can make a receipt stale without establishing an implementation edit. File names, hashes and matching bytes alone do not establish a fix or current acceptance.</p>
 </div>;
}
export function BrowserRunList({state,review,paging}:{state:BrowserReceiptState;review?:SessionReview;paging?:BrowserHistoryPaging}){
 return <section id="owned-browser-run-history" tabIndex={-1} aria-label="Owned browser workflow runs"><h4>Owned browser workflow runs</h4>
  <p>Read-only owner ledger. Recorded process states are not live liveness checks. A receipt does not complete remediation or authorize retry.</p>
  <HistoryControls state={state} paging={paging}/>{paging?.error&&<p role="alert">{paging.error}</p>}
  {state.status!=='available'?<p>{unavailable(state)}</p>:<>
   <p role="status">{state.page?`Runs ${state.page.start}–${state.page.end} of ${state.page.snapshotTotal} in this browsing snapshot; ${state.total} currently recorded.`:`${state.total} owned runs; showing ${state.runs.length}. Pagination is unavailable for this response.`}</p>
   <p>Newest first. Latest runs includes later additions. Receipt states and measured files are read again on each page; runs may concern other reviews.</p>
   {!state.runs.length&&<p>{state.total?'No runs on this page. Use Latest runs to return to current history.':'No owned browser runs are recorded in this ledger.'}</p>}
   {state.runs.map(run=>{const receipt=run.receipt,relations=review?run.relations.filter(r=>r.reviewId===review.id):[];return <section key={run.runId} className="bubble" id={'browser-run-'+run.runId} tabIndex={-1} aria-labelledby={'browser-heading-'+run.runId}>
    <h4 id={'browser-heading-'+run.runId}>Owned browser workflow · {receipt?receipt.result:'no receipt'}</h4><p>Run <code>{run.runId}</code> · {run.workflow}</p>
    {receipt?<>
     <p><strong>{receipt.state==='completed'?'Completed · '+receipt.result:receipt.state==='not_started'?'Workflow not started · gap':'Outcome unknown · gap'}</strong>{receipt.interrupted?' · Interrupted':''}</p>
     <p>Adapter-produced receipt · {receipt.basis}. Scope: named synthetic local browser workflow only.</p>
     <p>{receipt.recordedAt} · historical result retained. Imported completion claims and owner reports are not upgraded by this receipt.</p>
     <p>Owned resource closure: {receipt.resourcesConfirmed?'confirmed':'unconfirmed'}.{receipt.integrityIssue?' Integrity issue: '+receipt.integrityIssue+'.':''}</p>
     {relations.length&&review?relations.map((relation,i)=><p key={i}>{roles[relation.role]} · observed review version {relation.version}.{relation.version!==review.version?' Selected review has changed to version '+review.version+'; the receipt does not cover that change.':''}</p>):<p>{review?'This receipt is not linked to the selected review.':'No review is selected.'}</p>}
     <p><strong>Input relevance:</strong> {run.measurement?.state==='matches_measured_files'?'Measured files match the recorded hashes.':run.measurement?.state==='stale'?'Stale measured inputs — recorded outcome is historical.':'Unknown — measured files are unavailable or not configured.'}</p>
     <p>Compared configured source and served bundle files on this read. Dependency and environment coverage is reported separately below.</p>
     {run.measurement&&<MeasuredFiles measurement={run.measurement}/>}
     <RuntimeRelevance assessment={run.runtimeRelevance}/>
     <details><summary>Recorded evidence and hashes</summary><p>Revision <code>{receipt.revision}</code></p><p>Input manifest <code>{receipt.inputHash}</code></p><p>Environment fingerprint <code>{receipt.environmentFingerprint}</code></p><p>Receipt hash <code>{receipt.hash}</code></p>
      <p><strong>Workflow evidence outputs:</strong> recorded observations and screenshots document this workflow. Their availability and hashes do not identify implementation edits or verify generated application bundles.</p>
      {receipt.artifacts.length?<ul>{receipt.artifacts.map(artifact=><li key={artifact.name}>{artifact.name} · {artifact.availability.replaceAll('_',' ')} · {artifact.size} bytes<br/><code>{artifact.sha256}</code></li>)}</ul>:<p>No completed artifacts recorded.</p>}
     </details>
     {relations.length>0&&review&&<button className="inline-link" onClick={()=>navigate('browser-evidence-'+review.id)}>Back to adapter evidence</button>}
    </>:<><p><strong>No finalized receipt.</strong> Recorded state: {run.lastState.replaceAll('_',' ')}. Outcome not established; no retry is authorized.</p><p>Prepared {run.preparedAt} · revision <code>{run.revision}</code></p></>}
   </section>;})}
   <HistoryControls state={state} paging={paging} end/>
  </>}
 </section>;
}
