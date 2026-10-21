/** Fixed owned child. Runs only the synthetic local session-review journey. */
import {createInterface} from 'node:readline';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {canonical,digest} from './browser-receipt-storage.mjs';
import {openStore} from './store.mjs';
import {createApi} from './api.ts';
import {createEngineering} from './engineering.mjs';

const emit=data=>process.stdout.write(JSON.stringify({version:1,...data})+'\n');
let abort=false,advance,configResolve;
const configPromise=new Promise(resolve=>{configResolve=resolve;});
const control=new Promise(resolve=>{advance=resolve;});
let configured=false;
const lines=createInterface({input:process.stdin,terminal:false});
lines.on('line',line=>{try{if(line.length>20000)throw new Error();const item=JSON.parse(line);if(!configured){configured=true;configResolve(item);}else if(item.action==='interrupt'){abort=true;advance();}else if(item.action==='continue')advance();else{abort=true;advance();}}catch{abort=true;advance();}});
lines.on('close',()=>{abort=true;advance();});
process.on('SIGTERM',()=>{abort=true;advance();});
process.on('SIGINT',()=>{abort=true;advance();});
const config=await configPromise;
let server,db,browser,context,browserVersion=null,hostClosed=false,partial=null,status='incomplete',artifactHashes=null;
const active=new Set();
try{
 if(config.version!==1||!config.runId||!/^([0-9a-f]{40})$/.test(config.revision))throw new Error('Invalid fixed configuration');
 const output=path.join(config.runRoot,'output');await mkdir(output,{mode:0o700});
 db=openStore(path.join(config.runRoot,'work.sqlite'));
 const transport=createEngineering({python:config.python,database:path.join(config.runRoot,'engineering.sqlite'),ownerId:'synthetic-owner',allowImport:true,allowRunner:false});
 const engineering=input=>{const promise=transport(input);active.add(promise);promise.finally(()=>active.delete(promise)).catch(()=>{});return promise;};
 let origin,api;
 server=createServer(async(req,res)=>{try{
  if(req.url.startsWith('/api/')){const response=await api(new Request(origin+req.url,{method:req.method,headers:req.headers,...(req.method==='GET'?{}:{body:req,duplex:'half'})}));res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;}
  const name={'/':'index.html','/main.js':'main.js','/main.css':'main.css'}[req.url.split('?')[0]];
  if(!name){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html':name.endsWith('.js')?'text/javascript':'text/css','Cache-Control':'no-store'});res.end(await readFile(new URL('../dist/'+name,import.meta.url)));
 }catch{res.writeHead(503);res.end();}});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 origin='http://127.0.0.1:'+server.address().port;
 api=createApi({db,engineering,ownerId:'synthetic-owner',publicOrigin:origin,authenticate:async()=>({id:'synthetic-owner'})});
 const {chromium}=createRequire(import.meta.url)(config.playwrightModule);
 browser=await chromium.connect(config.wsEndpoint,{timeout:15000});browserVersion=browser.version();
 context=await browser.newContext({viewport:{width:1000,height:850},locale:'en-US',timezoneId:'UTC',serviceWorkers:'block'});
 await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 await context.routeWebSocket('**/*',socket=>socket.close());
 const page=await context.newPage();page.setDefaultTimeout(15000);
 const errors=[];page.on('pageerror',()=>errors.push('Application JavaScript error'));
 const startedAt=new Date().toISOString();
 await page.goto(origin);
 await page.getByRole('button',{name:'Open day & projects →',exact:true}).click();
 await page.getByRole('tab',{name:'Session review',exact:true}).click();
 await page.getByText('Import sanitized owner export',{exact:true}).click();
 const original=JSON.parse(await readFile(new URL('../output/playwright/evidence-relevance/matching-export.json',import.meta.url),'utf8'));
 const read=async id=>page.evaluate(async selected=>await (await fetch('/api/engineering'+(selected?'?reviewId='+selected:''))).json(),id||null);
 async function submit(payload){await page.getByLabel('Sanitized export JSON').fill(JSON.stringify(payload));const response=page.waitForResponse(r=>r.url().endsWith('/api/engineering')&&r.request().method()==='POST');await page.getByRole('button',{name:'Import and analyze',exact:true}).click();return (await response).status();}
 const historicalStatus=await submit(original);
 await page.getByText('Matches the declared review revision.',{exact:false}).waitFor();
 const historical=(await read()).reviews[0];partial={phase:'historical_import_persisted',review:historical,totalReviews:(await read()).totalReviews};
 emit({type:'ready'});
 await control;
 if(abort)throw new Error('Interrupted before continuation');
 const fresh=structuredClone(original);fresh.revision=config.revision;fresh.sessionId='owned-'+config.runId;
 const freshStatus=await submit(fresh);
 await page.getByText('Stale for this review — the evidence revision differs.',{exact:false}).waitFor();
 const current=(await read()).reviews[0];
 await page.getByRole('link',{name:'browser-evidence',exact:true}).click();
 const focus=await page.evaluate(()=>document.activeElement.id);
 await page.getByLabel('Saved session review').selectOption(historical.id);
 await page.getByText('Matches the declared review revision.',{exact:false}).waitFor();
 const historicalAgain=(await read(historical.id)).reviews[0];
 await page.getByLabel('Saved session review').selectOption(current.id);
 await page.getByText('Stale for this review — the evidence revision differs.',{exact:false}).waitFor();
 const missing=structuredClone(fresh);missing.sessionId='missing-'+config.runId;delete missing.events[2].codeRevision;
 const missingStatus=await submit(missing);await page.getByRole('alert').waitFor();const rejection=await page.getByRole('alert').innerText();
 await page.getByRole('button',{name:'Refresh session reviews',exact:true}).click();
 await page.getByText('Stale for this review — the evidence revision differs.',{exact:false}).waitFor();
 await page.reload();await page.getByRole('tab',{name:'Session review',exact:true}).click();
 await page.getByText('Stale for this review — the evidence revision differs.',{exact:false}).waitFor();
 const persisted=await read(),oldPersisted=(await read(historical.id)).reviews[0];
 const card=page.locator('section[id$="-event-browser-evidence"]');await card.scrollIntoViewIfNeeded();await card.screenshot({path:path.join(output,'browser.png')});
 if(abort)throw new Error('Interrupted during workflow');
 const observations={label:'TEST DATA — actual owned local browser workflow',workflow:'isolated_browser_workflow_v1',runId:config.runId,revision:config.revision,startedAt,completedAt:new Date().toISOString(),browserVersion,checks:{historicalImport:historicalStatus===200,freshImport:freshStatus===200,sourceFocus:focus===`session-${current.id}-event-browser-evidence`,historicalUnchanged:canonical(historical)===canonical(historicalAgain)&&canonical(historical)===canonical(oldPersisted),missingRejected:missingStatus===400&&rejection.includes('Invalid input'),reloadUnchanged:persisted.totalReviews===2&&canonical(persisted.reviews[0])===canonical(current),attributionPreserved:[historical,current].every(r=>r.export.events[1].basis==='export_claim'&&r.export.events[2].basis==='owner_provided_export'&&r.runs.length===0&&r.observations.length===0)},historical,current,persisted,missingStatus,rejection,cardText:await card.innerText(),pageErrors:errors};
 await writeFile(path.join(output,'observations.json'),JSON.stringify(observations,null,2)+'\n',{mode:0o600});
 artifactHashes={};for(const name of ['observations.json','browser.png'])artifactHashes[name]=digest(await readFile(path.join(output,name)));
 status='completed';
}catch{status='incomplete';}
finally{
 try{if(context)await context.close();if(browser)await browser.close();}catch{status='incomplete';}
 try{if(server){await new Promise(resolve=>server.close(resolve));await Promise.allSettled([...active]);}if(db)db.close();hostClosed=true;}catch{hostClosed=false;}
 emit({type:'result',status:abort?'incomplete':status,hostClosed,browserVersion,artifacts:status==='completed'?['observations.json','browser.png']:[],artifactHashes,partial});
 lines.close();process.stdin.destroy();
}
