'use client';
import {useEffect,useState} from 'react';
import {historyTime} from './history-views';
type R={id:string;kind:string;data:Record<string,any>};
const titles:Record<string,string>={completed:'Completed',partial:'Partly done',pending:'Pending',blocked:'Blocked',paused:'Paused',needs_user:'Needs you'};
const safeSource=(value:unknown)=>{try{if(typeof value!=='string')return null;const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url:null}catch{return null}};
export default function Commitments({records,compact=false,onTask,onNavigate}:{records:R[];compact?:boolean;onTask:(id:string)=>void;onNavigate:(id:string)=>void}){
 const [query,setQuery]=useState(''),[filter,setFilter]=useState('all');
 const all=records.filter(r=>r.kind==='commitment').map(r=>r.data),active=all.filter(r=>r.status!=='completed');
 const list=(compact?active.slice().sort((a,b)=>Number(b.needsUser)-Number(a.needsUser)||Number(a.owner==='counterparty')-Number(b.owner==='counterparty')).slice(0,5):all).filter(r=>(filter==='all'||filter==='waiting'&&r.owner==='counterparty'||filter==='needs_user'&&r.needsUser||filter===r.status)&&`${r.title} ${r.requestSummary} ${r.completedSummary} ${r.pendingSummary} ${r.nextStep}`.toLowerCase().includes(query.toLowerCase()));
 const [focusedId,setFocusedId]=useState<string|null>(null);
 useEffect(()=>{const select=()=>{let id:null|string=null;try{const parts=location.hash.slice(1).split('/');if(parts[0]==='requests'&&parts.length===2)id=decodeURIComponent(parts[1]);}catch{}setFocusedId(id);if(id){setQuery('');setFilter('all');}};select();window.addEventListener('hashchange',select);return()=>window.removeEventListener('hashchange',select)},[]);
 useEffect(()=>{if(focusedId&&!compact){const target=document.getElementById('request-'+focusedId);target?.focus();target?.scrollIntoView({block:'start'});}},[focusedId,compact]);
 const linked=(kind:string,id:string)=>records.find(r=>r.kind===kind&&(r.data.id===id||r.id===id));
 return <section className="commitments">
  <div className="section-head"><h2>{compact?'Your requests & next actions':'What you asked for'}</h2>{compact&&<button onClick={()=>onNavigate('requests')}>View all {all.length} →</button>}</div>
  <p className="section-note">{all.filter(r=>r.status==='completed').length} recorded completed · {active.length} recorded open ({all.filter(r=>r.owner==='counterparty').length} assigned to others) · {all.filter(r=>r.needsUser).length} flagged for your input. Status and summaries are supplied records, not independent completion proof. Waiting does not mean overdue or authorize another message.</p>
  {!compact&&<><p className="section-note">Actor and source completeness are not established here. <button className="inline-link" onClick={()=>onNavigate('sources')}>Inspect source coverage →</button></p><div className="history-filters"><input aria-label="Search requests" placeholder="Search requests, claims or next steps" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Filter request status" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All statuses</option><option value="waiting">Waiting on others</option>{Object.entries(titles).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div></>}
  {focusedId&&!all.some(r=>r.id===focusedId)&&<p role="status">Linked request is unavailable in this snapshot.</p>}
  {!list.length&&<p className="card">{all.length?'No requests match this filter.':'No request records are stored. Original sources may contain more.'}</p>}
  <div className="commitment-list">{list.map(r=>{
   const sources=Array.isArray(r.sourceUrls)?r.sourceUrls:[];
   const related=[['task','relatedTaskIds','Task'],['opportunity','relatedOpportunityIds','Opportunity'],['project','relatedProjectIds','Project'],['schedule','relatedScheduleIds','Schedule']].flatMap(([kind,key,label])=>(r[key]||[]).map((id:string)=>({kind,id,label,target:linked(kind,id)})));
   return <article className="card commitment-card" key={r.id} id={'request-'+r.id} tabIndex={-1}>
    <div className="mail-meta"><span className="badge gray">Recorded status: {r.status==='pending'&&r.owner==='counterparty'?'Waiting on reply':titles[r.status]||'Unknown'}</span>{r.needsUser&&<span className="badge">Needs your input</span>}<small>Reported review: {r.verifiedAt?historyTime(r.verifiedAt):'Unknown'}</small></div>
    <h3>{r.title}</h3><h4>Requested</h4><p>{r.requestSummary}</p>
    {!compact&&<>
     <div className="commitment-progress"><div><h4>Done — recorded claim</h4><p>{r.completedSummary||'No completed outcome is recorded.'}</p><p className="request-evidence-note">{sources.some((url:unknown)=>safeSource(url))?'Request-level sources are supplied below. They are not mapped to individual completion claims.':'No openable supporting source is supplied. Completion is unverified in this view.'}</p></div><div><h4>Still pending</h4><p>{r.pendingSummary||'No remaining work is recorded; this does not establish completion.'}</p></div></div>
     <section className="request-evidence" aria-label={'Evidence for '+r.title}><h4>Evidence & gaps</h4><p>These references provide request context. A link, supplied note or linked record does not by itself prove an action happened.</p>
      {sources.map((url:string,i:number)=>{const safe=safeSource(url);return <p key={i}>{safe?<a className="inline-link" href={url} target="_blank" rel="noreferrer">Request source {i+1} · {safe.hostname} ↗</a>:<span>Source {i+1} is not an openable HTTPS link.</span>}</p>})}
      {!sources.length&&<p>No directly openable source links supplied.</p>}
      {r.evidenceLevel&&<p>Supplied evidence note: {r.evidenceLevel}</p>}
      {r.userSourceMessageId&&<p>Supplied conversation reference (not resolved here): {r.userSourceMessageId}</p>}
     </section>
    </>}
    <div className="commitment-next"><strong>Next step · {r.owner?'Recorded owner: '+r.owner:'Owner unknown'}</strong><p>{r.nextStep}</p>{r.blocker&&<p>Blocker: {r.blocker}</p>}</div>
    {!compact&&<><h4>Needs you</h4><p>{r.needsUser?'Input explicitly requested; review the next step and blocker above.':'No input request is flagged in this record. Unreviewed sources may contain more.'} Reading this request grants no execution or sending authority.</p>
     <div className="commitment-links">{related.map(({kind,id,label,target}:{kind:string;id:string;label:string;target?:R})=>target?<button className="inline-link" key={kind+id} onClick={()=>kind==='task'?onTask(target.id):onNavigate(kind==='opportunity'?'opportunities/'+encodeURIComponent(target.data.id):kind==='project'?'projects':'schedule')}>{label}: {target.data.title||id}{kind==='project'||kind==='schedule'?' (open list)':''} →</button>:<p key={kind+id}>{label} reference {id}: unavailable in this snapshot.</p>)}</div>
     {!related.length&&<p className="request-evidence-note">No related task, opportunity, project or schedule references supplied.</p>}
     <details><summary>Request dates & identity</summary><p>Request ID: {r.id}</p><p>Requested: {r.requestedAt?historyTime(r.requestedAt):'Exact request time unavailable'}</p><p>Snapshot reviewed: {r.snapshotReviewedAt?historyTime(r.snapshotReviewedAt):'Unknown'}. This is not the action time or a live source check.</p></details>
    </>}
   </article>;
  })}</div>
 </section>;
}
