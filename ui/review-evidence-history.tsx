import {useState} from 'react';
import type {SessionReview} from '../lib/work/engineering';
import {evidenceDay} from './daily-evidence';

// Python receipts retain microseconds. Reduce precision for calendar-day comparison
// only; never change saved timestamp text, hashes, identity or record order.
const recordDay=(value:unknown,zone:string)=>typeof value==='string'?evidenceDay(value.replace(/(\.\d{3})\d{1,3}(?=Z$|[+-]\d{2}:\d{2}$)/,'$1'),zone):null;
const validDay=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;

export default function ReviewEvidenceHistory({review,onNavigate}:{review:SessionReview;onNavigate:(kind:string,id:string)=>void}){
 const [day,setDay]=useState(()=>recordDay(review.export.capturedAt,'UTC')||''),[zone,setZone]=useState('UTC'),[draftZone,setDraftZone]=useState('UTC'),[error,setError]=useState('');
 const source=review.export.events, reports=review.observations, runs=review.runs;
 const sourcesOnDay=source.filter(item=>recordDay(item.observedAt,zone)===day);
 const reportsOnDay=reports.filter(item=>recordDay(item.recordedAt,zone)===day);
 const runsOnDay=runs.filter(item=>recordDay(item.recordedAt,zone)===day);
 const sourceLink=(id:string,label:string)=>source.some(item=>item.id===id)?<button type="button" className="inline-link" onClick={()=>onNavigate('event',id)}>{label} {id}</button>:<span>{label} {id} · unavailable in retained export</span>;
 const counts=(selected:number,total:number,unknown:number)=><p>{selected} on selected day; showing {Math.min(selected,50)}. {total} retained in this review; {unknown} have unusable timestamps. Remaining dated records fall outside the selected day. Stored record order is preserved.</p>;
 return <details className="review-evidence-history"><summary>Evidence history by day</summary><section aria-label="Selected review evidence history">
  <h3>Selected review evidence history</h3>
  <p>Review {review.id} · saved version {review.version} · declared revision {review.export.revision}. Last-read snapshot only. Source records, saved reports and local receipts use different time bases; none establishes a complete verified-work day.</p>
  <p>No original-source coverage, human authorship, workflow occurrence time or completed processing is inferred. This view excludes other reviews, retained-record report streams and owned browser receipts; their existing views remain separate.</p>
  <label>Evidence history day<input type="date" value={day} onChange={e=>setDay(e.target.value)}/></label>
  <form onSubmit={e=>{e.preventDefault();try{const next=draftZone.trim();new Intl.DateTimeFormat('en',{timeZone:next}).format();setZone(next);setError('')}catch{setError('Unknown time zone. The previous history scope remains in use.')}}}><label>Evidence history time zone<input value={draftZone} onChange={e=>setDraftZone(e.target.value)} maxLength={100}/></label><button type="submit">Apply history time zone</button></form>
  {error&&<p role="alert">{error}</p>}<p>History scope: {day||'Choose a day'} · {zone}. Selection is temporary and does not modify evidence.</p>
  {!validDay(day)?<p role="alert">Choose a valid history day.</p>:<>
   <section aria-label="Source observation history"><h4>Source observations — supplied time</h4><p>Uses export observedAt, not independent event occurrence or ingestion time. Superseded records remain visible. Corrections outside the selected day are still linked for context.</p>
    {counts(sourcesOnDay.length,source.length,source.filter(item=>!recordDay(item.observedAt,zone)).length)}
    {sourcesOnDay.slice(0,50).map(item=><section className="bubble" key={item.id} aria-label={'Source history '+item.id}>
     <h5>{item.id} · {item.kind}</h5><p>Supplied observation time: {item.observedAt} · reference {item.sourceRef}</p><p>Original outcome: {item.outcome} · scope {item.outcomeScope} · recorded status {item.status} · basis {item.basis}</p><p>Code revision {item.codeRevision||'Unknown'} · requirement {item.requirementRevision||'Unknown'}</p>
     {sourceLink(item.id,'Inspect source')}
     {item.supersedes.map(id=><p key={id}>{sourceLink(id,'Corrects')}</p>)}
     {source.filter(other=>other.supersedes.includes(item.id)).map(other=><p key={other.id}>{sourceLink(other.id,'Later correction')} · supplied observation {other.observedAt}. No failure is erased by this link.</p>)}
     {review.export.admission?.corrections.filter(c=>c.eventId===item.id||c.targetId===item.id).map((c,i)=><p key={i}>Scoped assertion: {sourceLink(c.eventId,'From')} → {sourceLink(c.targetId,'To')} · goals {c.goalIds.join(', ')} · {c.scopeRef}. Context only; no global supersession or authority.</p>)}
    </section>)}
    {!sourcesOnDay.length&&<p>No retained source observations match this day. Source activity outside this selection is unknown.</p>}
   </section>
   <section aria-label="Saved owner report history"><h4>Owner reports — server save time</h4><p>Uses recordedAt. The performed workflow may have happened at another time; its occurrence time is not separately recorded. Owner-reported is not independently verified human authorship or acceptance.</p><p>Latest report saved: {reports.at(-1)?.recordedAt||'None retained'}.</p>
    {counts(reportsOnDay.length,reports.length,reports.filter(item=>!recordDay(item.recordedAt,zone)).length)}
    {reportsOnDay.slice(0,50).map(item=><section className="bubble" key={item.id} aria-label={'Report history '+item.id}><h5>{item.id} · {item.result}</h5><p>Saved {item.recordedAt} · {item.basis} · goal {item.goalId} · revision {item.revision}</p><p>Evidence reference: {item.sourceRef}</p><button type="button" className="inline-link" onClick={()=>onNavigate('goal',item.goalId)}>Inspect report {item.id}</button></section>)}
    {!reportsOnDay.length&&<p>No reports saved on this day in this review. This is not proof that no workflow was performed.</p>}
   </section>
   <section aria-label="Local checklist receipt history"><h4>Local checklist receipts — recorded time</h4><p>Uses the receipt recordedAt, not remediation completion time. This producer attests only bounded declarative checks. Later reports do not rewrite historical acceptance.</p><p>Latest receipt recorded: {runs.at(-1)?.recordedAt||'None retained'}.</p>
    {counts(runsOnDay.length,runs.length,runs.filter(item=>!recordDay(item.recordedAt,zone)).length)}
    {runsOnDay.slice(0,50).map(item=><section className="bubble" key={item.id} aria-label={'Receipt history '+item.id}><h5>{item.id} · {item.state}</h5><p>Recorded {item.recordedAt} · task {item.taskId} · skill {item.skillId} at {item.skillRevision}</p><p>Scope {item.scope} · historical acceptance {item.acceptance} ({item.acceptanceBasis}) · {item.productVerification}</p><p>Revision {item.revision} · input hash {item.inputHash} · authorization hash {item.authorizationHash}</p><button type="button" className="inline-link" onClick={()=>onNavigate('run',item.id)}>Inspect local receipt {item.id}</button></section>)}
    {!runsOnDay.length&&<p>No local checklist receipts recorded on this day in this review. No other work or provider execution is inferred.</p>}
   </section>
  </>}
 </section></details>;
}
