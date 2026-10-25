'use client';
import {snapshotInstant} from '../lib/work/history-time.mjs';

type Row={id:string;kind:string;data:Record<string,any>};
type Props={records:Row[];serverTime:string;onNavigate:(view:string)=>void;onInstruction:()=>void};
// Validate calendar components before offset conversion; never normalize source evidence.
const instant=(value:unknown)=>{try{return snapshotInstant(value)}catch{return NaN}};
const day=(value:unknown)=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value?value:null;
const stamp=(value:unknown)=>Number.isFinite(instant(value))?new Date(String(value)).toLocaleString('en-US',{year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:'UTC'})+' UTC':day(value)?String(value)+' · exact time unknown':'Unknown';
function sourceDay(now:number,zone:unknown){
 if(!Number.isFinite(now)||typeof zone!=='string')return null;
 try{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);return ['year','month','day'].map(t=>parts.find(p=>p.type===t)?.value).join('-')}catch{return null}
}
function eligible(event:Row['data'],now:number){
 if(event.calendarScope!=='personal'||event.kind!=='confirmed_event'||!['confirmed','tentative'].includes(String(event.status).trim().toLowerCase())||['declined','cancelled','canceled','not_attending'].includes(String(event.participation).trim().toLowerCase())||!Number.isFinite(now))return false;
 if(event.allDay){const today=sourceDay(now,event.timeZone),start=day(event.startDate),end=day(event.endDate);return !!(today&&start&&(!event.endDate||end&&end>start)&&(start>=today||end&&end>today))}
 const start=instant(event.startAt),end=instant(event.endAt);
 return Number.isFinite(start)&&(!event.endAt||Number.isFinite(end)&&end>start)&&(start>=now||end>now);
}
function SourceLink({url,label}:{url:unknown;label:string}){
 if(typeof url!=='string')return <p className="overview-note">Source link unavailable.</p>;
 try{const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password)throw Error();return <a href={url} target="_blank" rel="noreferrer">{label} ↗</a>}catch{return <p className="overview-note">Source link unavailable.</p>}
}
export default function Overview({records,serverTime,onNavigate,onInstruction}:Props){
 const mail=records.filter(r=>r.kind==='correspondence'),schedule=records.filter(r=>r.kind==='schedule'),needs=records.filter(r=>r.kind==='commitment'&&r.data.needsUser===true),coverage=records.filter(r=>r.kind==='coverage');
 const dated=mail.filter(r=>Number.isFinite(instant(r.data.occurredAt))).sort((a,b)=>instant(b.data.occurredAt)-instant(a.data.occurredAt)||a.id.localeCompare(b.id));
 const uncertain=mail.filter(r=>!Number.isFinite(instant(r.data.occurredAt))).sort((a,b)=>a.id.localeCompare(b.id));
 const now=instant(serverTime),eligibleEvents=schedule.filter(r=>eligible(r.data,now));
 const timed=eligibleEvents.filter(r=>!r.data.allDay).sort((a,b)=>instant(a.data.startAt)-instant(b.data.startAt)||a.id.localeCompare(b.id));
 const allDay=eligibleEvents.filter(r=>r.data.allDay).sort((a,b)=>a.data.startDate.localeCompare(b.data.startDate)||a.id.localeCompare(b.id));
 const message=(r:Row)=><article className="overview-row" key={r.id}><span className="overview-meta">{r.data.direction==='outbound'?'Outbound':r.data.direction==='inbound'?'Inbound':'Direction unknown'} · Recorded status: {r.data.status||'unknown'}</span><h3>{r.data.subject}</h3><p>{r.data.summary}</p><p className="overview-note">Event: {stamp(r.data.occurredAt||r.data.occurredDate)} · Source evidence reviewed: {stamp(r.data.verifiedAt)}</p><SourceLink url={r.data.threadUrl} label={'Original thread for '+r.data.subject}/></article>;
 const event=(r:Row)=><article className="overview-row" key={r.id}><span className="overview-meta">{r.data.allDay?'All day · '+r.data.startDate:stamp(r.data.startAt)}{!r.data.allDay&&instant(r.data.startAt)<now?' · Ongoing at database read':''}</span><h3>{r.data.title}</h3><p>{r.data.summary}</p><p>Recorded status: {r.data.status}. Participation: {r.data.participation||'unknown'}.</p><p className="overview-note">Source zone: {r.data.timeZone||'unknown'} · Source: {r.data.sourceLabel}<br/>Source evidence reviewed: {stamp(r.data.verifiedAt)}{r.data.allDay?' · Date stays in its source zone; not ranked against timed events.':''}</p><SourceLink url={r.data.sourceUrl} label={'Original event for '+r.data.title}/></article>;
 return <section className="owner-overview" aria-labelledby="overview-title">
  <div className="page-heading"><div><h1 id="overview-title">Know what needs you.</h1><p>Correspondence, personal commitments and requests from your saved records.</p></div></div>
  <div className="overview-scope"><p>Stored snapshot · no live inbox or calendar sync.</p><p>Database read: {stamp(serverTime)}. This is not a source refresh. Event selection is relative to this read.</p></div>
  <nav className="overview-jumps" aria-label="Overview sections">{[["overview-mail","Correspondence"],["overview-schedule","Next event"],["overview-needs","Needs you"]].map(([id,label])=><button key={id} onClick={()=>{const target=document.getElementById(id);target?.focus();target?.scrollIntoView({block:"start"});}}>{label} ↓</button>)}</nav>
  <div className="overview-grid"><div>
   <section aria-labelledby="overview-mail"><div className="section-head"><h2 id="overview-mail" tabIndex={-1}>Recent correspondence</h2><button onClick={()=>onNavigate('correspondence')}>All correspondence ({mail.length}) →</button></div>
    <p className="overview-note">Actor not established here. Sent does not establish delivered or read.</p>
    {dated.slice(0,3).map(message)}{uncertain.length>0&&<><h3 className="overview-subheading">Exact event time unknown</h3>{uncertain.slice(0,2).map(message)}</>}
    {!mail.length&&<p className="overview-empty">No correspondence is stored. This does not mean your inbox is empty.</p>}
    {(dated.length>3||uncertain.length>2)&&<p className="overview-note">Preview shows up to three timed messages and two records without an exact time. Open all correspondence for the stored selection.</p>}
   </section>
   <section aria-labelledby="overview-schedule"><div className="section-head"><h2 id="overview-schedule" tabIndex={-1}>Next recorded personal event</h2><button onClick={()=>onNavigate('schedule')}>Full schedule →</button></div>
    <p className="overview-note">Timed events shown in UTC. Includes recorded confirmed/tentative personal events; attendance is not inferred. Subscriptions, inferred deadlines, declined/canceled, unknown-status and invalid-time records are not ranked here.</p>
    {timed[0]?event(timed[0]):<p className="overview-empty">No eligible upcoming or ongoing timed event in this snapshot. Other commitments may be missing or uncertain.</p>}
    {allDay.length>0&&<><h3 className="overview-subheading">All-day dates, separately</h3>{allDay.slice(0,2).map(event)}{allDay.length>2&&<p className="overview-note">Showing two of {allDay.length} eligible all-day entries. Open the full schedule for more.</p>}</>}
    <p className="overview-note">Calendar records do not create a scheduler. No provider schedule or run is configured by this view.</p>
   </section>
  </div><aside>
   <section aria-labelledby="overview-needs"><div className="section-head"><h2 id="overview-needs" tabIndex={-1}>Needs you</h2><span>{needs.length} explicitly flagged</span></div>
    <p className="overview-note">Recorded requests for input. Reading or resolving one does not authorize another action.</p>
    {needs.slice(0,3).map(r=><article className="overview-row" key={r.id}><span className="overview-meta">Recorded status: {r.data.status}</span><h3>{r.data.title}</h3><p>{r.data.nextStep}</p>{r.data.blocker&&<p>Blocker: {r.data.blocker}</p>}<p className="overview-note">Source evidence reviewed: {stamp(r.data.verifiedAt)}</p><button className="overview-action" onClick={()=>onNavigate('requests/'+encodeURIComponent(r.data.id))}>Review request: {r.data.title} →</button></article>)}
    {!needs.length&&<p className="overview-empty">No stored request is explicitly flagged for your input. Unreviewed sources may contain more.</p>}
    <button className="overview-action" onClick={()=>onNavigate('requests')}>All requests →</button>
   </section>
   <section aria-labelledby="overview-coverage"><div className="section-head"><h2 id="overview-coverage">Source coverage</h2><button onClick={()=>onNavigate('sources')}>Inspect sources →</button></div>
    {coverage.slice(0,3).map(r=><article className="overview-row" key={r.id}><h3>{r.data.label}</h3><p>Reported state: {r.data.state}</p><p>{r.data.summary}</p><p className="overview-note">Reported review: {stamp(r.data.verifiedAt)}</p></article>)}
    {!coverage.length&&<p className="overview-empty">Source coverage is unknown. No coverage records are stored.</p>}
    {coverage.length>3&&<p className="overview-note">Showing three of {coverage.length} stored coverage statements.</p>}
   </section>
  </aside></div>
  <section className="overview-next"><h2>Continue with context</h2><p>Review project evidence or save an instruction. Saving does not deliver it to dot.</p><div><button onClick={()=>onNavigate('day')}>Day & projects →</button><button onClick={onInstruction}>Save an instruction →</button></div></section>
 </section>;
}
