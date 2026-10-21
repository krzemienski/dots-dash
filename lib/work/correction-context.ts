import type {SessionEvent} from './engineering';

export type CorrectionReason =
 | 'Goal associations differ'
 | 'Outcome scopes differ'
 | 'Requirement revisions differ'
 | 'Correction scope incomplete';

export type CorrectionContext = {
 key:string;
 source:Readonly<SessionEvent>;
 target:Readonly<SessionEvent>|undefined;
 targetId:string;
 reasons:CorrectionReason[];
};

// Read-only display metadata: no inference about whether a correction is valid.
export function projectCorrectionContext(events:ReadonlyArray<SessionEvent>):CorrectionContext[]{
 const byId=new Map(events.map(event=>[event.id,event]));
 const seen=new Set<string>();
 const entries:CorrectionContext[]=[];
 for(const source of events){
  for(const targetId of source.supersedes){
   const key=JSON.stringify([source.id,targetId]);
   if(seen.has(key))continue;
   seen.add(key);
   const target=byId.get(targetId);
   const reasons:CorrectionReason[]=[];
   if(target){
    const sourceGoals=new Set(source.goalIds),targetGoals=new Set(target.goalIds);
    const goalsKnown=sourceGoals.size>0&&targetGoals.size>0;
    const scopesKnown=!!source.outcomeScope&&!!target.outcomeScope
     &&source.outcomeScope!=='unknown'&&target.outcomeScope!=='unknown';
    if(goalsKnown&&(sourceGoals.size!==targetGoals.size||[...sourceGoals].some(id=>!targetGoals.has(id)))){
     reasons.push('Goal associations differ');
    }
    if(scopesKnown&&source.outcomeScope!==target.outcomeScope)reasons.push('Outcome scopes differ');
    if(source.requirementRevision!==target.requirementRevision)reasons.push('Requirement revisions differ');
    if(!goalsKnown||!scopesKnown)reasons.push('Correction scope incomplete');
   }else{
    reasons.push('Correction scope incomplete');
   }
   // Include superseded sources and targets; their historical status is unchanged.
   entries.push({key,source,target,targetId,reasons});
  }
 }
 return entries;
}
