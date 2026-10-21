/** Fixed local transport entrypoint; never registered with the application. */
import {readFileSync} from 'node:fs';
import {runRehearsal} from './rehearsal-transport.mjs';
try {
 const raw=readFileSync(0);
 if(raw.length>1000000)throw new Error('Invalid rehearsal envelope');
 process.stdout.write(JSON.stringify(await runRehearsal(JSON.parse(raw))));
} catch {
 process.stdout.write(JSON.stringify({status:503,body:{error:'Rehearsal outcome unavailable; reconcile before retrying'}}));
}
