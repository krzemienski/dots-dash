/** Fixed local phase protocol for an explicitly owned rehearsal process. */
import {readSync,writeSync} from 'node:fs';
import {runRehearsal} from './rehearsal-transport.mjs';

function line(limit) {
 const bytes=[],byte=Buffer.alloc(1);
 while(bytes.length<=limit){
  if(readSync(0,byte,0,1,null)!==1)throw new Error('Supervisor pipe closed');
  if(byte[0]===10)return Buffer.from(bytes).toString('utf8');
  bytes.push(byte[0]);
 }
 throw new Error('Rehearsal protocol line too large');
}
const emit=value=>writeSync(1,JSON.stringify(value)+'\n');
const pause=phase=>{emit({phase});if(line(32)!=='continue')throw new Error('Supervisor did not permit continuation');};
try {
 const x=JSON.parse(line(1000000));
 if(!['before-dispatch','before-audit','after-dispatch'].includes(x.pauseAt))throw new Error('Invalid rehearsal phase');
 let installed=false;
 const result=await runRehearsal(x,{
  beforeDispatch(){if(x.pauseAt==='before-dispatch')pause('before-dispatch');},
  beforeWrite(sqlite){
   if(x.pauseAt==='before-audit'&&!installed){
    installed=true;
    sqlite.function('owned_rehearsal_pause',()=>{pause('before-audit');return 1;});
    sqlite.exec('CREATE TEMP TRIGGER owned_rehearsal_pause_trigger BEFORE INSERT ON activity_events BEGIN SELECT owned_rehearsal_pause(); END;');
   }
  },
  afterDispatch(result){if(x.pauseAt==='after-dispatch')pause(result.status===200?'after-commit':'after-rejection');},
 });
 emit({phase:'result',response:result});
} catch {
 emit({phase:'result',response:{status:503,body:{error:'Owned rehearsal outcome unknown; reconcile before retrying'}}});
}
