'use client';
import {useEffect,useRef,useState} from 'react';

type Receipt={format:'dots-operation-lookup';schemaVersion:1;operationId:string;readOnly:true;storeScope:'engineering_shared';state:'receipt_found'|'unknown';action:'unknown';binding:'legacy_namespace_not_recorded';payloadDigest?:string;digestMatch:boolean|null;storedExecutedFlag?:boolean;result:{kind:'review_snapshot'|'context_link';reviewId:string;reviewVersion:number;taskId?:string;sourceRequestId?:string}|null};

export default function OperationLookup({enabled,onOpenReview}:{enabled:boolean;onOpenReview:(id:string)=>Promise<void>}){
 const [operationId,setOperationId]=useState(''),[digest,setDigest]=useState(''),[receipt,setReceipt]=useState<Receipt|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const generation=useRef(0),gate=useRef(false),resultRef=useRef<HTMLElement>(null);
 useEffect(()=>{generation.current++;setReceipt(null);setError('');setBusy(false);gate.current=false;return()=>{generation.current++}},[enabled]);
 async function lookup(){
  if(!enabled||gate.current)return;
  gate.current=true;setBusy(true);setError('');setReceipt(null);const version=++generation.current;
  try{
   const response=await fetch('/api/operation-lookup',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({operationId,...(digest?{expectedDigest:digest}:{})})});
   const value=await response.json() as Receipt&{error?:string};
   if(!response.ok)throw Error(value.error||'Receipt lookup unavailable. No outcome established.');
   if(value.format!=='dots-operation-lookup'||value.schemaVersion!==1||value.operationId!==operationId||value.readOnly!==true||!['receipt_found','unknown'].includes(value.state))throw Error('Receipt response could not be confirmed.');
   if(version!==generation.current)return;setReceipt(value);
   requestAnimationFrame(()=>{if(version===generation.current){resultRef.current?.focus();resultRef.current?.scrollIntoView({block:'start'});}});
  }catch(e){if(version===generation.current)setError((e as Error).message)}finally{if(version===generation.current){setBusy(false);gate.current=false}}
 }
 return <section aria-label="Read-only operation lookup"><h3>Inspect a saved operation</h3>
  <p>Look up a known Session review or request-context operation ID after reloading. This reads a minimal historical receipt; it never retries a save or resolves another pending form. Retained-review reports and action claims use their own lookup controls.</p>
  <p>Operation IDs and optional digests stay in this mounted form only. No browser storage, automatic discovery or durable registration is provided.</p>
  {!enabled&&<p>Operation lookup is disabled by this host.</p>}
  <form onSubmit={event=>{event.preventDefault();void lookup()}}><label>Operation ID<input required maxLength={100} pattern="[A-Za-z0-9_\-]+" value={operationId} disabled={!enabled||busy} onChange={e=>{setOperationId(e.target.value);setReceipt(null);setError('')}}/></label>
   <label>Expected stored payload digest (optional)<input maxLength={64} pattern="[a-f0-9]{64}" value={digest} disabled={!enabled||busy} onChange={e=>{setDigest(e.target.value);setReceipt(null);setError('')}}/></label>
   <button disabled={!enabled||busy}>{busy?'Looking up receipt…':'Look up saved operation'}</button>
  </form>
  {error&&<p role="alert">{error} No retry or replacement operation was submitted.</p>}
  {receipt&&<section ref={resultRef} tabIndex={-1} aria-label="Operation lookup result"><p role="status">{receipt.state==='unknown'?'Operation outcome unknown. No receipt found in this owner’s shared engineering store.':'Saved receipt found. This establishes a stored result, not product completion.'}</p>
   <p>Operation {receipt.operationId}. Read-only lookup. Legacy action and namespace binding are unknown.</p>
   {receipt.state==='unknown'?<p>Absence does not prove rejection, non-execution or safe retry. Check the original operation reference and store scope; do not create a replacement based on this lookup.</p>:<>
    <p>Payload digest: <code>{receipt.payloadDigest}</code></p><p>{receipt.digestMatch===true?'Expected digest matches the stored digest; this does not establish action identity or execution permission.':receipt.digestMatch===false?'Digest mismatch. This receipt cannot confirm the expected payload.':'No expected digest supplied; payload identity has not been compared.'}</p>
    <p>{receipt.storedExecutedFlag?'The stored response reports a local checklist execution. This is not a provider-agent or product-verification certificate.':'The stored response does not report execution by that save. This is not proof that no other action occurred.'}</p>
    {receipt.result&&<><p>Stored result: {receipt.result.kind==='context_link'?'request/context association':'review snapshot'} · review {receipt.result.reviewId} · recorded version {receipt.result.reviewVersion}.</p>{receipt.result.taskId&&<p>Task {receipt.result.taskId} · Request {receipt.result.sourceRequestId}.</p>}<button disabled={busy} onClick={()=>void onOpenReview(receipt.result!.reviewId)}>Open current referenced review</button><p>Navigation reads the current review; it may differ from this historical receipt. Original negative evidence and owner-report labels remain authoritative.</p></>}
   </>}
  </section>}
 </section>;
}
