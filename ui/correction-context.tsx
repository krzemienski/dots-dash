import type {SessionEvent} from '../lib/work/engineering';
import {projectCorrectionContext} from '../lib/work/correction-context';

type Navigation={
 eventHref:(id:string)=>string;
 onNavigate:(id:string)=>void;
};

function EventContext({event,label,eventHref,onNavigate}:Navigation&{event:Readonly<SessionEvent>;label:string}){
 return <div>
  <p><strong>{label}:</strong> <a href={eventHref(event.id)} onClick={click=>{click.preventDefault();onNavigate(event.id)}}>{event.id}</a> · {event.kind}</p>
  <p>Original outcome: <strong>{event.outcome}</strong> · recorded status: {event.status}</p>
  <p>Source reference: {event.sourceRef}</p>
  <p>Goals: {event.goalIds.join(', ')||'None recorded'} · outcome scope: {event.outcomeScope||'Unknown'} · requirement revision: {event.requirementRevision}</p>
 </div>;
}

export default function CorrectionContext({events,eventHref,onNavigate}:Navigation&{events:ReadonlyArray<SessionEvent>}){
 const entries=projectCorrectionContext(events);
 if(!entries.length)return null;
 return <div className="correction-context">
  <h3>Correction context</h3>
  <p>These explicit supersession links compare export metadata. Differences need review; they do not establish an invalid correction, reopen a failure or prove remediation.</p>
  <p>Original negative outcomes remain below even when supersession excluded them from active findings. Source references are labels; this display does not open their contents or change saved analysis.</p>
  {entries.map(entry=><section className="bubble" key={entry.key}>
   <h4>{entry.source.id} supersedes {entry.targetId}</h4>
   {entry.reasons.length?<><p><strong>Review correction scope:</strong></p><ul>{entry.reasons.map(reason=><li key={reason}>{reason}</li>)}</ul></>:<p>No compared metadata differences detected. This does not validate the correction.</p>}
   <EventContext event={entry.source} label="Superseding record" eventHref={eventHref} onNavigate={onNavigate}/>
   {entry.target?<EventContext event={entry.target} label="Referenced original record" eventHref={eventHref} onNavigate={onNavigate}/>:<p>Unresolved target: {entry.targetId}. The referenced record is absent from this response; its outcome, status and source reference are unknown.</p>}
  </section>)}
 </div>;
}
