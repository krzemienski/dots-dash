import {useId,useState} from 'react';
import {snapshotInstant} from '../lib/work/history-time.mjs';

type Row={id?:string;kind:string;data:Record<string,any>};
const ref=(row:Row)=>row.id||`${row.kind}:${row.data.id}`;
const instant=(value:unknown)=>{try{return snapshotInstant(value)}catch{return NaN}};
const calendarDate=(value:unknown):value is string=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
export function evidenceDay(value:unknown,zone:string){
 const time=instant(value);if(!Number.isFinite(time))return null;
 try{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(time);return ['year','month','day'].map(k=>parts.find(p=>p.type===k)?.value).join('-')}catch{return null}
}
const timestamp=(value:unknown)=>typeof value==='string'?value+(Number.isFinite(instant(value))?'':' · exact instant unavailable'):'Unknown';

export default function DailyEvidence({records,day,zone,onDay,onZone,onNavigate,onCopy}:{records:Row[];day:string;zone:string;onDay:(v:string)=>void;onZone:(v:string)=>void;onNavigate:(v:string)=>void;onCopy:(v:string)=>void}){
 const draftId=useId();
 const [zoneDraft,setZoneDraft]=useState(zone),[error,setError]=useState('');
 const mail=records.filter(r=>r.kind==='correspondence');
 const messages=mail.filter(r=>evidenceDay(r.data.occurredAt,zone)===day);
 const undated=mail.filter(r=>!evidenceDay(r.data.occurredAt,zone));
 const reviews=records.filter(r=>['engineering','opportunity'].includes(r.kind)&&evidenceDay(r.data.verifiedAt,zone)===day);
 const unplacedReviews=records.filter(r=>['engineering','opportunity'].includes(r.kind)&&!evidenceDay(r.data.verifiedAt,zone));
 const needs=records.filter(r=>r.kind==='commitment'&&r.data.needsUser===true);
 const schedule=records.filter(r=>r.kind==='schedule');
 // Timed starts are event-day context, not attendance or an occurrence expansion.
 const timed=schedule.filter(r=>!r.data.allDay&&evidenceDay(r.data.startAt,zone)===day);
 const allDay=schedule.filter(r=>r.data.allDay&&calendarDate(r.data.startDate)&&r.data.startDate<=day&&(r.data.endDate?calendarDate(r.data.endDate)&&r.data.endDate>day:r.data.startDate===day));
 const unplacedSchedule=schedule.filter(r=>r.data.allDay?!calendarDate(r.data.startDate)||!!r.data.endDate&&(!calendarDate(r.data.endDate)||r.data.endDate<=r.data.startDate):!evidenceDay(r.data.startAt,zone));
 const plans=records.filter(r=>r.kind==='task'&&r.data.state==='scheduled');
 const coverage=records.filter(r=>r.kind==='coverage');
 const valid=calendarDate(day);
 const draft=[`Review-only next-work draft. No execution, sending, scheduling or new access is authorized.`,
  `Selected calendar day ${day} in ${zone}; source coverage incomplete or unknown.`,
  `Message occurrence dates and evidence review dates are separate. Current pending context is not historical state for this day.`,
  ...messages.slice(0,20).map(r=>`Inspect recorded ${r.data.direction} / ${r.data.status} message ${ref(r)}. Delivery and actor are not established.`),
  ...reviews.slice(0,20).map(r=>`Inspect evidence reviewed on this day: ${ref(r)}. Supplied next step: ${r.data.nextStep}`),
  ...needs.slice(0,20).map(r=>`Review current input request ${ref(r)}. Supplied next step: ${r.data.nextStep}`),
  `Lists above include at most 20 records per group. ${undated.length} message dates and ${unplacedReviews.length} evidence review dates cannot be assigned to this day. No absence or completion is certified.`].join('\n');
 const rows=(items:Row[],render:(row:Row)=>React.ReactNode)=><><p>{items.length} stored matches; showing {Math.min(items.length,20)}.</p>{items.slice(0,20).map(r=><article className="bubble" key={ref(r)}><h4>{r.data.title||r.data.subject||r.data.label}</h4><p>Record {ref(r)}</p>{render(r)}</article>)}</>;
 return <section className="daily-evidence session-review" aria-label="Daily evidence check-in">
  <h2>Daily evidence check-in</h2><p>Read-only projection of stored records. No live source check or scheduled summary. This is not a complete log of verified work.</p>
  <div className="history-filters"><label>Summary day<input type="date" value={day} onChange={e=>onDay(e.target.value)}/></label><form onSubmit={e=>{e.preventDefault();try{const next=zoneDraft.trim();new Intl.DateTimeFormat('en',{timeZone:next}).format();onZone(next);setError('')}catch{setError('Unknown time zone. The previously applied zone remains in use.')}}}><label>Summary time zone<input value={zoneDraft} onChange={e=>setZoneDraft(e.target.value)} placeholder="UTC or America/New_York" maxLength={100}/></label><button type="submit">Apply time zone</button></form></div>
  {error&&<p role="alert">{error}</p>}
  <p>Applied scope: {day||'Choose a date'} · {zone}. Calendar-day membership uses this zone, including offset changes; it does not assume a 24-hour day. Date/zone selection is not persisted.</p>
  {!valid?<p role="alert">Choose a valid calendar day before reviewing or copying a summary.</p>:<>
   <section aria-label="Message events on selected day"><h3>Message events on this day</h3><p>Based only on exact recorded occurrence times. Sent is not delivered or read; the actor is not established.</p>{rows(messages,r=><p>{r.data.direction} · recorded status {r.data.status} · occurred {timestamp(r.data.occurredAt)} · evidence reviewed {timestamp(r.data.verifiedAt)}</p>)}{!messages.length&&<p>No matching message events stored. This does not establish no correspondence occurred.</p>}<p>{undated.length} stored messages have no usable exact occurrence time, including date-only records. They are not assigned to this day.</p><button type="button" onClick={()=>onNavigate('correspondence')}>Inspect correspondence →</button></section>
   <section aria-label="Evidence reviewed on selected day"><h3>Work evidence and leads reviewed on this day</h3><p>Review date is not action date, lead discovery, or completion time. Imported historical passes are claims about their recorded scope, not current independent verification.</p>{rows(reviews,r=><><p>{r.kind==='engineering'?`Evidence type: ${r.data.evidenceType}`:`Lead category: ${r.data.category}`}. Recorded status: {r.data.status}</p><p>{r.data.summary}</p>{r.kind==='engineering'&&<><p>Supplied evidence: {r.data.verifiedEvidence}</p><p>Gaps: {r.data.gaps} · revision {r.data.revision||'Unknown'}</p><p>References: {r.data.sourceRefs?.join(', ')||'None supplied'}</p></>}<p>Reviewed {timestamp(r.data.verifiedAt)} · next step: {r.data.nextStep}</p></>)}<p>{unplacedReviews.length} evidence/lead review dates are missing, invalid or date-only; their day in {zone} is unknown.</p><button type="button" onClick={()=>onNavigate('opportunities')}>Inspect leads →</button></section>
   <section aria-label="Current pending input"><h3>Current pending input</h3><p>Latest stored request snapshot, regardless of selected day. This is not historical state at that day or proof that a decision was executed.</p>{rows(needs,r=><><p>{r.data.status} · {r.data.nextStep}</p><p>Reviewed {timestamp(r.data.verifiedAt)}</p><button type="button" onClick={()=>onNavigate('requests/'+encodeURIComponent(r.data.id))}>Inspect request →</button></>)}{!needs.length&&<p>No stored request is explicitly flagged. Missing coverage does not mean no pending decisions.</p>}</section>
   <section aria-label="Calendar and planned work"><h3>Calendar and planned work</h3><p>Timed entries below start on the selected day; ongoing events that began earlier and unexpanded recurrence are not included. Reported event status does not prove booking, attendance or execution.</p>{rows(timed,r=><p>{r.data.kind==='inferred_deadline'?'Inferred deadline — not a booking':'Recorded event'} · {r.data.status} · scope {r.data.calendarScope} · participation {r.data.participation} · start {timestamp(r.data.startAt)} · source zone {r.data.timeZone}</p>)}<h4>All-day source dates, separately</h4><p>Matching source-calendar date labels; not converted into the selected time zone or ranked with timed events. End dates are exclusive.</p>{rows(allDay,r=><p>{r.data.kind==='inferred_deadline'?'Inferred deadline — not a booking':'Recorded event'} · {r.data.status} · {r.data.startDate} to {r.data.endDate||'single date'} · source zone {r.data.timeZone}</p>)}<p>{unplacedSchedule.length} schedule records have unusable start/date ranges; consult source context. {plans.length} currently scheduled task records are plans, not calendar bookings or scheduler-run receipts; they are not assigned to this day.</p><button type="button" onClick={()=>onNavigate('schedule')}>Inspect full schedule →</button></section>
   <section aria-label="Summary source freshness"><h3>Source freshness and gaps</h3><p>These are supplied coverage statements, not measured live health. A database read is not a source refresh.</p>{rows(coverage,r=><><p>Reported state: {r.data.state} · statement reviewed {timestamp(r.data.verifiedAt)}</p><p>{r.data.summary}</p></>)}{!coverage.length&&<p>Source coverage and freshness are unknown; no statements are stored.</p>}<button type="button" onClick={()=>onNavigate('sources')}>Inspect source coverage →</button></section>
   <label htmlFor={draftId}>Reviewable daily next-work draft</label><textarea id={draftId} readOnly rows={8} value={draft}/><button type="button" onClick={()=>onCopy(draft)}>Copy daily draft</button><p>Copying does not deliver this draft or authorize a run. Recheck current source and permissions before acting.</p>
  </>}
 </section>;
}
