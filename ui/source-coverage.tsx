import type {SessionReview} from '../lib/work/engineering';
import {projectSourceCoverage} from '../lib/work/source-coverage';

export default function SourceCoverage({source}:{source:SessionReview['export']}){
 const entries=projectSourceCoverage(source);
 return <details>
  <summary>Source coverage</summary>
  <p>Only the selected owner-provided export is represented. References below are opaque labels; this display does not open the original sources.</p>
  <p>Coverage describes included material, not completed work or verified outcomes. The source list is limited to this export; it is not an inventory of all sessions or skills.</p>
  <ul>{entries.map(entry=><li key={entry.scope+':'+entry.sourceRef}>
   <p><strong>{entry.scope==='selected_export_only'?'Selected export only':entry.scope==='export_records_only'?'Exported event records only':'Skill inventory metadata only'}</strong> · <code>{entry.sourceRef}</code></p>
   {entry.scope==='selected_export_only'&&<p>Declared capture time: {entry.capturedAt}. Included events: {entry.eventCount}. The original selection interval and total source size are unknown.</p>}
   {entry.scope==='export_records_only'&&<p>Referenced event IDs: {entry.eventIds.join(', ')}. These records do not establish that the original source was inspected.</p>}
   {entry.scope==='inventory_only'&&<p>Referenced skill IDs: {entry.skillIds.join(', ')}. Inventory and applicability do not establish full skill invocation.</p>}
   <p>Basis: {entry.basis}. Original-source read coverage: {entry.originalReadCoverage}.</p>
  </li>)}</ul>
  {!source.skills.length&&<p>No skill references were supplied in this export.</p>}
  <p>Valid-empty, unreadable and unsupported original sources cannot be distinguished by this export format. None is inferred from missing records.</p>
 </details>;
}
