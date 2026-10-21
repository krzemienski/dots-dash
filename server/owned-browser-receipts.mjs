/** Opt-in local coordinator. Fixed workflow only; never mounted on a public API. */
import {spawn,execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {StringDecoder} from 'node:string_decoder';
import {randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,realpathSync,lstatSync,readdirSync,chmodSync,openSync,closeSync,unlinkSync,fstatSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {BrowserReceiptStorage,canonical,digest} from './browser-receipt-storage.mjs';

const WORKFLOW='isolated_browser_workflow_v1';
const FIXTURE='output/playwright/evidence-relevance/matching-export.json';
const OUTPUTS=['observations.json','browser.png'];
const now=()=>new Date().toISOString();
const ensure=(value,message)=>{if(!value)throw new Error(message);};
const bytes=filename=>{const stat=lstatSync(filename);ensure(stat.isFile()&&!stat.isSymbolicLink()&&stat.size<=32_000_000,'Bounded regular file required');return readFileSync(filename);};
function contained(root,name){ensure(typeof name==='string'&&!name.includes('\\')&&!path.isAbsolute(name)&&name.split('/').every(p=>p&&p!=='.'&&p!=='..'),'Unsafe input path');let p=root;for(const segment of name.split('/')){p=path.join(p,segment);ensure(!lstatSync(p).isSymbolicLink(),'Symlink input rejected');}return p;}
function libraryHash(root){const entries={};function visit(dir,prefix=''){for(const entry of readdirSync(dir,{withFileTypes:true})){ensure(!entry.isSymbolicLink(),'Library symlink rejected');const key=prefix+entry.name;if(entry.isDirectory())visit(path.join(dir,entry.name),key+'/');else if(entry.isFile()){ensure(Object.keys(entries).length<5000,'Library bound exceeded');entries[key]=digest(bytes(path.join(dir,entry.name)));}}}visit(root);return digest(entries);}
const bounded=async(promise,ms)=>{let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Owned process outcome unknown')),ms);})]);}finally{clearTimeout(timer);}};

export class OwnedBrowserReceipts {
 #config;#ledger;#lock;#lockPath;#runs=new Map();#closed=false;
 constructor({repository,scratchRoot=os.tmpdir(),playwrightModule,browserExecutable,python,enabled=false}){
  ensure(enabled===true,'Local browser adapter is disabled');
  const repo=realpathSync(repository),moduleRoot=realpathSync(playwrightModule);
  const browser=realpathSync(browserExecutable),pythonPath=realpathSync(python);
  ensure(path.isAbsolute(repo)&&path.isAbsolute(moduleRoot),'Host configuration required');
  this.root=mkdtempSync(path.join(realpathSync(scratchRoot),'dots-owned-browser-'));chmodSync(this.root,0o700);
  this.#lockPath=path.join(this.root,'coordinator.lock');this.#lock=openSync(this.#lockPath,'wx',0o600);
  this.#config={repo,moduleRoot,browser,python:pythonPath};
  this.#ledger=new BrowserReceiptStorage(path.join(this.root,'receipts.sqlite'),'synthetic-owner');
  chmodSync(path.join(this.root,'receipts.sqlite'),0o600);
 }
 #guard(){ensure(!this.#closed,'Coordinator closed');const held=fstatSync(this.#lock),current=lstatSync(this.#lockPath);ensure(current.isFile()&&held.ino===current.ino&&held.dev===current.dev,'Coordinator identity changed');}
 #snapshot(revision,destination){
  const {repo}=this.#config;ensure(/^[0-9a-f]{40}$/.test(revision||''),'Exact revision required');
  const git=args=>execFileSync('git',args,{cwd:repo,encoding:'utf8',maxBuffer:4_000_000});
  ensure(git(['rev-parse','--verify',revision+'^{commit}']).trim()===revision,'Revision unavailable');
  const names=git(['ls-files','--','ui','lib','server','python','db','package.json','package-lock.json','scripts/build.mjs',FIXTURE]).trim().split('\n').filter(Boolean);
  ensure(names.length>0&&names.length<=300,'Source inventory bound exceeded');
  const manifest={revision,files:{},buildInputs:{},bundles:{}};
  const put=(name,content)=>{const target=path.join(destination,name);mkdirSync(path.dirname(target),{recursive:true,mode:0o700});writeFileSync(target,content,{mode:0o600});};
  for(const name of names){const content=bytes(contained(repo,name));const expected=execFileSync('git',['show',revision+':'+name],{cwd:repo,maxBuffer:32_000_000});ensure(digest(content)===digest(expected),'Source differs from pinned revision');manifest.files[name]=digest(content);put(name,content);}
  const build=JSON.parse(bytes(contained(repo,'dist/build-manifest.json')));
  ensure(build.version===1&&Object.keys(build.inputs).length<=300&&Object.keys(build.outputs).sort().join(',')==='index.html,main.css,main.js','Build manifest unavailable');
  ensure(typeof build.builder?.esbuild==='string'&&typeof build.builder?.node==='string','Build environment unavailable');manifest.builder=build.builder;
  for(const [name,hash] of Object.entries(build.inputs)){
   ensure(name in manifest.files||name.startsWith('node_modules/'),'Unrecognized build input');
   ensure(digest(bytes(contained(repo,name)))===hash,'Build input changed');manifest.buildInputs[name]=hash;
  }
  ensure(build.inputs['scripts/build.mjs']===manifest.files['scripts/build.mjs']&&build.inputs['package-lock.json']===manifest.files['package-lock.json'],'Build recipe is not bound');
  for(const [name,hash] of Object.entries(build.outputs)){const content=bytes(contained(repo,'dist/'+name));ensure(digest(content)===hash,'Built bundle changed');manifest.bundles[name]=hash;put('dist/'+name,content);}
  put('dist/build-manifest.json',canonical(build));manifest.files['dist/build-manifest.json']=digest(canonical(build));
  return manifest;
 }
 #checkSnapshot(run){for(const [name,hash] of Object.entries(run.pending.inputs.files))ensure(digest(bytes(contained(run.inputRoot,name)))===hash,'Pinned input changed');for(const [name,hash] of Object.entries(run.pending.inputs.bundles))ensure(digest(bytes(contained(run.inputRoot,'dist/'+name)))===hash,'Served bundle changed');}
 async start({requestId,revision,authorized=false}){
  this.#guard();ensure(authorized===true&&/^[A-Za-z0-9_-]{1,100}$/.test(requestId||''),'Explicit scoped authorization required');
  ensure(/^[0-9a-f]{40}$/.test(revision||''),'Exact revision required');
  const requestHash=digest({requestId,revision,authorized,workflow:WORKFLOW});const previous=this.#ledger.request(requestId);
  if(previous){ensure(previous.request_hash===requestHash,'Conflicting run request');return {runId:previous.id,duplicate:true,receipt:this.#ledger.receipt(previous.id)};}
  ensure(this.#ledger.unsettled().length===0,'Prior run ownership is unsettled');
  const id=randomUUID(),runRoot=path.join(this.root,id),inputRoot=path.join(runRoot,'input');mkdirSync(inputRoot,{recursive:true,mode:0o700});
  const inputs=this.#snapshot(revision,inputRoot),{moduleRoot,browser,python}=this.#config;
  const environment={node:process.version,nodeExecutableHash:digest(readFileSync(process.execPath)),python:execFileSync(python,['--version'],{encoding:'utf8',env:{LANG:'C.UTF-8'}}).trim(),pythonExecutableHash:digest(readFileSync(python)),playwright:JSON.parse(bytes(path.join(moduleRoot,'package.json'))).version,playwrightLibraryHash:libraryHash(moduleRoot),browserLauncherHash:digest(bytes(browser)),platform:process.platform,architecture:process.arch,osRelease:os.release(),viewport:{width:1000,height:850},locale:'en-US',timezone:'UTC'};
  const pending={runId:id,requestId,workflow:WORKFLOW,owner:'synthetic-owner',goalId:'historical-context',expectedReviewVersion:1,revision,preparedAt:now(),inputs,inputHash:digest(inputs),environment,authorizationHash:requestHash,driverHash:inputs.files['server/browser-workflow-driver.mjs']};
  this.#ledger.prepare(pending,requestHash);
  const run={pending,runRoot,inputRoot,events:[],child:null,browser:null,ready:false,interrupted:false,closed:false,result:null,protocolError:false,launching:true};run.launchDone=new Promise(resolve=>{run.launchSettled=resolve;});this.#runs.set(id,run);
  try{
   const {chromium}=createRequire(import.meta.url)(moduleRoot);
   run.browser=await chromium.launchServer({executablePath:browser,host:'127.0.0.1',headless:true,timeout:20000,env:{PATH:path.dirname(process.execPath),LANG:'C.UTF-8',TZ:'UTC',TMPDIR:runRoot}});
   run.browserProcess=run.browser.process();ensure(run.browserProcess&&run.browserProcess.exitCode===null,'Browser ownership unavailable');
   this.#ledger.event(id,{state:'browser_started',at:now()});
   ensure(!run.interrupted,'Interrupted during browser launch');
   const child=spawn(process.execPath,[path.join(inputRoot,'server/browser-workflow-driver.mjs')],{cwd:inputRoot,stdio:['pipe','pipe','ignore'],env:{PATH:path.dirname(process.execPath),LANG:'C.UTF-8',TZ:'UTC'}});run.child=child;
   let buffer='',size=0;const decoder=new StringDecoder('utf8');
   run.exit=new Promise(resolve=>{child.once('error',()=>{run.spawnError=true;});child.once('close',(code,signal)=>{buffer+=decoder.end();if(buffer.trim())run.protocolError=true;run.closed=true;resolve({code,signal});});});
   child.stdout.on('data',chunk=>{size+=chunk.length;if(size>2_000_000){run.protocolError=true;child.kill('SIGTERM');return;}buffer+=decoder.write(chunk);let index;while((index=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,index);buffer=buffer.slice(index+1);try{const event=JSON.parse(line);ensure(event&&event.version===1&&['ready','result'].includes(event.type),'Invalid result protocol');if(event.type==='ready'){ensure(!run.ready&&!run.result,'Duplicate ready');run.ready=true;run.events.push({state:'browser_ready',at:now()});this.#ledger.event(id,run.events.at(-1));}else{ensure(!run.result,'Duplicate result');run.result=event;} }catch{run.protocolError=true;}}});
   child.stdin.on('error',()=>{run.protocolError=true;});
   child.stdin.write(JSON.stringify({version:1,runId:id,revision,wsEndpoint:run.browser.wsEndpoint(),playwrightModule:moduleRoot,python,runRoot})+'\n');
   this.#ledger.event(id,{state:'running',at:now()});
   return {runId:id,duplicate:false};
  }catch{
   run.protocolError=!run.interrupted;await this.#closeBrowser(run);if(!run.child)run.closed=true;
   run.startFailed=true;return {runId:id,duplicate:false,startFailed:true};
  }finally{run.launching=false;run.launchSettled();}
 }
 async waitReady(id){this.#guard();const run=this.#owned(id);const until=Date.now()+45000;while(!run.ready&&!run.closed&&Date.now()<until)await new Promise(resolve=>setTimeout(resolve,50));ensure(run.ready&&!run.protocolError,'Browser workflow did not become ready');return {runId:id,ready:true};}
 status(id){this.#guard();const run=this.#owned(id);return {ready:run.ready,driverExitConfirmed:run.closed,resultReceived:!!run.result,receiptSaved:!!run.final};}
 #owned(id){const run=this.#runs.get(id);ensure(run,'Run handle not owned by this coordinator');return run;}
 proceed(id){this.#guard();const run=this.#owned(id);ensure(run.ready&&!run.closed&&!run.proceeded&&!run.interrupted,'Run cannot proceed');run.proceeded=true;run.child.stdin.write('{"action":"continue"}\n');}
 async interrupt(id){this.#guard();const run=this.#owned(id);ensure(!run.final,'Run already finalized');run.interrupted=true;if(run.child&&!run.closed)run.child.stdin.write('{"action":"interrupt"}\n');return this.collect(id);}
 async #closeBrowser(run){if(!run.browser){run.browserClosed=true;return;}try{await bounded(run.browser.close(),10000);}catch{try{await bounded(run.browser.kill(),5000);}catch{}}run.browserClosed=!!run.browserProcess&&(run.browserProcess.exitCode!==null||run.browserProcess.signalCode!=null);}
 async collect(id){
  this.#guard();const run=this.#owned(id);
  if(run.final)return this.#ledger.finish(run.final);
  if(run.collecting){await run.collecting;return this.#ledger.finish(run.final);}
  run.collecting=this.#collectOwned(run,id);return run.collecting;
 }
 async #collectOwned(run,id){
  if(run.launching)try{await bounded(run.launchDone,30000);}catch{run.interrupted=true;}
  let exit={code:null,signal:null};
  if(run.child){try{exit=await bounded(run.exit,60000);}catch{run.interrupted=true;run.child.kill('SIGTERM');try{exit=await bounded(run.exit,10000);}catch{}}}
  await this.#closeBrowser(run);
  const result=run.result;let valid=!run.protocolError&&!run.interrupted&&exit.code===0&&result?.status==='completed'&&run.proceeded;
  let artifacts={},observation=null,inputsUnchanged=false,integrityIssue=null,stage='input_or_runtime_changed';
  try{
   this.#checkSnapshot(run);
   ensure(libraryHash(this.#config.moduleRoot)===run.pending.environment.playwrightLibraryHash&&digest(bytes(this.#config.browser))===run.pending.environment.browserLauncherHash&&digest(readFileSync(this.#config.python))===run.pending.environment.pythonExecutableHash&&digest(readFileSync(process.execPath))===run.pending.environment.nodeExecutableHash,'Runtime identity changed');
   inputsUnchanged=true;
   if(result?.status==='completed'){
    stage='artifact_binding_invalid';
    ensure(canonical(result.artifacts)===canonical(OUTPUTS),'Unexpected artifact set');
    const artifactRoot=path.join(this.root,'artifacts',id);mkdirSync(artifactRoot,{recursive:true,mode:0o700});
    for(const name of OUTPUTS){const content=bytes(contained(path.join(run.runRoot,'output'),name));ensure(result.artifactHashes?.[name]===digest(content),'Artifact differs from owned channel');artifacts[name]={sha256:digest(content),size:content.length};writeFileSync(path.join(artifactRoot,name),content,{mode:0o400});}
    stage='workflow_record_invalid';observation=JSON.parse(bytes(path.join(artifactRoot,'observations.json')));
    ensure(observation.runId===id&&observation.revision===run.pending.revision&&observation.workflow===WORKFLOW,'Observed run identity mismatch');
    const required=['historicalImport','freshImport','sourceFocus','historicalUnchanged','missingRejected','reloadUnchanged','attributionPreserved'];
    ensure(required.every(key=>typeof observation.checks[key]==='boolean')&&Object.keys(observation.checks).length===required.length&&Array.isArray(observation.pageErrors),'Workflow acceptance incomplete');
   }else valid=false;
  }catch{valid=false;integrityIssue=stage;}
  const resourcesConfirmed=!!(run.closed&&run.browserClosed&&(run.startFailed&&!run.child||result?.hostClosed===true));
  valid=!!(valid&&resourcesConfirmed&&inputsUnchanged&&observation);
  const environment={...run.pending.environment,browserVersion:result?.browserVersion||null};
  const passed=valid&&Object.values(observation.checks).every(value=>value===true)&&observation.pageErrors.length===0;
  const browserExit=run.browserProcess?{code:run.browserProcess.exitCode,signal:run.browserProcess.signalCode}:null;
  run.final={version:1,runId:id,workflow:WORKFLOW,basis:valid?'local_workflow_observed':'local_workflow_incomplete',scope:'synthetic_local_browser_only',state:valid?'completed':run.startFailed&&!run.child?'not_started':'outcome_unknown',result:valid?(passed?'pass':'fail'):'gap',revision:run.pending.revision,goalId:run.pending.goalId,expectedReviewVersion:run.pending.expectedReviewVersion,inputHash:run.pending.inputHash,inputs:run.pending.inputs,inputsUnchanged,integrityIssue,protocolError:run.protocolError,environment,environmentFingerprint:digest(environment),authorizationHash:run.pending.authorizationHash,driverHash:run.pending.driverHash,startedAt:run.pending.preparedAt,recordedAt:now(),exit,browserExit,resourcesConfirmed,interrupted:run.interrupted,artifacts,observations:observation,partial:result?.partial||null,productVerification:'limited_to_named_synthetic_workflow',externalExecution:false};
  return this.#ledger.finish(run.final);
 }
 receipt(id){this.#guard();return this.#ledger.receipt(id);}
 history(id){this.#guard();return this.#ledger.history(id);}
 relevance(id,{revision,inputHash}){const receipt=this.receipt(id);ensure(receipt,'Receipt unavailable');return !revision||!inputHash?'unknown':revision===receipt.revision&&inputHash===receipt.inputHash?'matches_explicit_inputs':'stale';}
 async close(){this.#guard();for(const [id,run] of this.#runs)if(!run.final)await this.interrupt(id);ensure(this.#ledger.unsettled().length===0,'Unconfirmed ownership: retain coordinator storage');this.#ledger.close();this.#guard();closeSync(this.#lock);unlinkSync(this.#lockPath);this.#closed=true;}
}
