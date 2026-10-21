import type {SessionReview} from '../lib/work/engineering';

/** Read-only projection of one saved review; never a completion or execution gate. */
export default function ReviewNextSteps({review,onNavigate}:{review:SessionReview;onNavigate:(kind:string,id:string)=>void}){
 const taskLink=(task:SessionReview['tasks'][number])=>{
  const skill=review.export.skills.find(item=>item.id===task.selectedSkillId);
  const runs=review.runs.filter(run=>run.taskId===task.id);
  return <li key={task.id}>
   <button type="button" className="inline-link" onClick={()=>onNavigate('task',task.id)}>Inspect remediation {task.id}</button>
   <p>{task.status.replaceAll('_',' ')} · {skill?`Selected skill: ${skill.name} (${skill.revision})`:'No skill selected'}. Selection does not prove invocation.</p>
   <p>{runs.length} recorded local checklist receipts; no full skill or provider execution.</p>
   {runs.map(run=><p key={run.id}><button type="button" className="inline-link" onClick={()=>onNavigate('run',run.id)}>Inspect receipt {run.id}</button> · {run.state} · historical acceptance {run.acceptance} ({run.acceptanceBasis})</p>)}
  </li>;
 };
 return <section aria-label="Next steps for this review">
  <h3>Next steps for this review</h3>
  <p>Selected review {review.id} · saved version {review.version} · declared revision {review.export.revision}. This is a last-read snapshot, not a live checkout assessment or daily activity summary.</p>
  <p>Use each goal’s evidence to decide what to do next. These suggestions grant no execution or access permission. Source attribution and coverage remain limited to the supplied export; no goal is certified complete here.</p>
  {review.export.goals.map(goal=>{
   const observations=review.observations.filter(item=>item.goalId===goal.id&&item.revision===review.export.revision);
   const latest=observations.at(-1);
   const negatives=review.export.events.filter(event=>event.goalIds.includes(goal.id)&&['fail','blocked'].includes(event.outcome));
   const earlierFailures=observations.slice(0,-1).filter(item=>item.result==='fail').length;
   const findings=review.findings.filter(item=>item.goalId===goal.id);
   const tasks=review.tasks.filter(item=>item.goalId===goal.id);
   return <section className="bubble" key={goal.id} aria-label={'Next steps: '+goal.text}>
    <h4>{goal.text}</h4><p><strong>Expected behavior:</strong> {goal.expectedBehavior}</p>
    <p><strong>Latest recorded observation at this revision:</strong> {latest?`${latest.result} · owner_reported · ${latest.recordedAt} · ${latest.sourceRef}`:'None recorded. Actual behavior remains unknown.'}</p>
    <p><strong>Suggested next step:</strong> {!latest?'Inspect intent and remediation, then perform an authorized user workflow and record what happened.':latest.result==='fail'?'Inspect the observed mismatch and remediation before any separately authorized change. Keep the failure visible.':latest.result==='gap'?'Inspect the missing evidence and record only a workflow actually performed.':'Review the reported pass alongside remaining findings and historical negatives. Independent verification and remediation completion are not established.'}</p>
    <p>{findings.length} recorded rule findings; their original history is retained. {negatives.length} imported negative outcomes; {earlierFailures} earlier failing observations at this revision. Later reports or checklist success do not erase them.</p>
    <button type="button" className="inline-link" onClick={()=>onNavigate('goal',goal.id)}>Inspect intent and observation history</button>{' '}
    <button type="button" className="inline-link" onClick={()=>onNavigate('verification',goal.id)}>Record performed workflow evidence</button>
    {tasks.length?<ul>{tasks.map(taskLink)}</ul>:<p>No remediation draft is recorded for this goal. Absence does not establish completion.</p>}
   </section>;
  })}
  {review.tasks.some(task=>!task.goalId)&&<section className="bubble" aria-label="Unresolved goal scope"><h4>Unresolved goal scope</h4><p>These drafts have no linked goal. Inspect their source and resolve scope before planning work; no goal association or authority is inferred.</p><ul>{review.tasks.filter(task=>!task.goalId).map(taskLink)}</ul></section>}
  {!review.export.goals.length&&<p>No goals supplied in this selection. No next-work scope can be inferred.</p>}
 </section>;
}
