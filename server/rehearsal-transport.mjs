/** Internal local rehearsal transport. Never registered with the application. */
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {openStore} from './store.mjs';
import {createApi} from './api.ts';
import {rehearsalGuard} from './rehearsal-fence.mjs';

export async function runRehearsal(x, hooks={}) {
let store;
let dispatchStarted = false;
try {
  if (!['history','instruction','decision'].includes(x.kind)) throw new Error('Invalid rehearsal operation kind');
  if (!path.isAbsolute(x.database) || path.basename(x.database) !== 'snapshot.sqlite' ||
      !path.basename(path.dirname(x.database)).startsWith('dots-instruction-rehearsal-')) {
    throw new Error('Invalid rehearsal storage');
  }
  const digest = createHash('sha256').update(JSON.stringify(x.body)).digest('hex');
  const guard = rehearsalGuard(x.owner, x.epoch, digest, x.kind);
  // A real application store lacks this controller table. Check read-only before
  // openStore can perform initialization, chmod or journal-mode setup.
  const probe = new DatabaseSync(x.database, {readOnly:true});
  try { guard(probe); } finally { probe.close(); }
  store = openStore(x.database, {beforeWrite(sqlite){guard(sqlite);if(hooks.beforeWrite&&hooks.beforeWrite(sqlite)!==undefined)throw new Error('Invalid synchronous rehearsal hook');}});
  if(hooks.beforeDispatch)await hooks.beforeDispatch();
  const api = createApi({db:store,ownerId:x.owner,publicOrigin:'https://rehearsal.invalid',
    sourceAccount:x.sourceAccount,allowImport:true,authenticate:async()=>({id:x.owner})});
  dispatchStarted = true;
  const route = x.kind === 'history' ? '/api/history' : '/api/work';
  const response = await api(new Request('https://rehearsal.invalid' + route, {
    method:'POST',headers:{origin:'https://rehearsal.invalid','content-type':'application/json'},
    body:JSON.stringify(x.body),
  }));
  const result={status:response.status,body:await response.json()};
  if(hooks.afterDispatch)await hooks.afterDispatch(result);
  return result;
} catch {
  return {status:dispatchStarted ? 503 : 409,
    body:{error:dispatchStarted ? 'Rehearsal outcome unknown; reconcile before retrying' : 'Rehearsal storage or lease unavailable'}};
} finally { store?.close(); }

}
