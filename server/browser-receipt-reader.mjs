/** Read-only projection of a host-selected owned-receipt ledger, never JSON import. */
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {canonical,digest} from './browser-receipt-storage.mjs';
import {measureBrowserRuntime} from './browser-runtime-relevance.mjs';

const ensure=value=>{if(!value)throw new Error('Browser receipt read unavailable');};
const hash=value=>typeof value==='string'&&/^[0-9a-f]{64}$/.test(value);
const identifier=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(value);
const invalidCursor=()=>{throw Object.assign(new Error('Invalid browser receipt cursor'),{code:'INVALID_BROWSER_RECEIPT_CURSOR'});};
const encodeCursor=value=>Buffer.from(canonical(value)).toString('base64url');
function decodeCursor(cursor){
 if(cursor===undefined)return null;
 try{if(typeof cursor!=='string'||cursor.length>512||!/^[-_A-Za-z0-9]+$/.test(cursor))return invalidCursor();
  const value=JSON.parse(Buffer.from(cursor,'base64url').toString('utf8'));
  if(!value||Object.keys(value).sort().join(',')!=='anchor,before,v'||value.v!==1||!identifier(value.anchor)||(value.before!==null&&!identifier(value.before))||encodeCursor(value)!==cursor)return invalidCursor();
  return value;
 }catch{return invalidCursor();}
}
function read(root,name){
 ensure(typeof name==='string'&&!path.isAbsolute(name)&&!name.includes('\\')&&name.split('/').every(p=>p&&p!=='.'&&p!=='..'));
 let file=root;for(const segment of name.split('/')){file=path.join(file,segment);ensure(!lstatSync(file).isSymbolicLink());}
 const stat=lstatSync(file);ensure(stat.isFile()&&stat.size<=32_000_000);return readFileSync(file);
}
function measure(inputs,root){
 const measuredAt=new Date().toISOString(),scope='source_and_served_bundle_files';
 if(!root)return {state:'unknown',scope,measuredAt,checkedFiles:0,changedFiles:[],unavailableFiles:[]};
 const names=Object.keys(inputs.files);ensure(names.length>0&&names.length<=300);
 const changedFiles=[],unavailableFiles=[];let checkedFiles=0;
 for(const name of [...names,...Object.keys(inputs.bundles).map(n=>'dist/'+n)]){
  ensure(/^(ui|lib|server|python|db|scripts|dist)\/[A-Za-z0-9_./-]+$/.test(name)||['package.json','package-lock.json','output/playwright/evidence-relevance/matching-export.json'].includes(name));
  const expected=inputs.files[name]||inputs.bundles[name.slice(5)];ensure(hash(expected));
  try{const bytes=read(root,name);const actual=name==='dist/build-manifest.json'?digest(canonical(JSON.parse(bytes))):digest(bytes);checkedFiles++;if(actual!==expected)changedFiles.push(name);}catch{unavailableFiles.push(name);}
 }
 return {state:changedFiles.length?'stale':unavailableFiles.length?'unknown':'matches_measured_files',scope,measuredAt,checkedFiles,changedFiles:changedFiles.slice(0,10),unavailableFiles:unavailableFiles.slice(0,10)};
}
function relation(review,role){return review&&identifier(review.id)&&Number.isInteger(review.version)?{reviewId:review.id,version:review.version,role}:null;}
function fileRoles(inputs,measurement){
 // Annotate only names already disclosed by the bounded measurement. Manifest
 // membership describes historical use, not semantic changes or current producers.
 return [...new Set([...measurement.changedFiles,...measurement.unavailableFiles])].map(name=>{
  const bundle=name.startsWith('dist/')&&Object.hasOwn(inputs.bundles,name.slice(5));
  const file=Object.hasOwn(inputs.files,name);
  return {name,basis:'owned_receipt_input_manifest',role:bundle&&!file?'recorded_build_output':file&&!bundle?'recorded_file':'unknown'};
 });
}
export function createBrowserReceiptReader({ledger,ownerId,measurementRoot,runtimeMeasurement}){
 const filename=path.resolve(ledger);let identity;
 return async({principal,cursor})=>{
  ensure(ownerId&&principal.id===ownerId);
  const position=decodeCursor(cursor);
  const stat=lstatSync(filename);ensure(stat.isFile()&&!stat.isSymbolicLink());
  if(identity)ensure(identity.dev===stat.dev&&identity.ino===stat.ino);else identity={dev:stat.dev,ino:stat.ino};
  const root=realpathSync(path.dirname(filename));
  let measuredRoot=null;if(measurementRoot)try{measuredRoot=realpathSync(measurementRoot);}catch{}
  const db=new DatabaseSync(filename,{readOnly:true});
  try{
   const owners=db.prepare('SELECT owner FROM binding').all();ensure(owners.length===1&&owners[0].owner===ownerId);
   db.exec('BEGIN');
   const total=db.prepare('SELECT count(*) n FROM pending').get().n;
   const anchor=position?db.prepare('SELECT rowid,id FROM pending WHERE id=?').get(position.anchor):db.prepare('SELECT rowid,id FROM pending ORDER BY rowid DESC LIMIT 1').get();
   if(position&&!anchor)return invalidCursor();
   const boundary=position?.before?db.prepare('SELECT rowid FROM pending WHERE id=?').get(position.before):null;
   if(position?.before&&(!boundary||boundary.rowid>anchor.rowid))return invalidCursor();
   const ceiling=anchor?.rowid||0,before=boundary?.rowid??null;
   const snapshotTotal=db.prepare('SELECT count(*) n FROM pending WHERE rowid<=?').get(ceiling).n;
   const skipped=before===null?0:db.prepare('SELECT count(*) n FROM pending WHERE rowid<=? AND rowid>=?').get(ceiling,before).n;
   const found=db.prepare('SELECT p.id,p.data pending,r.data receipt,r.hash,(SELECT t.data FROM transitions t WHERE t.run_id=p.id ORDER BY t.sequence DESC LIMIT 1) last FROM pending p LEFT JOIN receipts r ON r.run_id=p.id WHERE p.rowid<=? AND (? IS NULL OR p.rowid<?) ORDER BY p.rowid DESC LIMIT 51').all(ceiling,before,before);
   const rows=found.slice(0,50);
   const page={cursor:anchor?encodeCursor({v:1,anchor:anchor.id,before:position?.before??null}):null,nextCursor:found.length>50?encodeCursor({v:1,anchor:anchor.id,before:rows.at(-1).id}):null,snapshotTotal,start:rows.length?skipped+1:0,end:rows.length?skipped+rows.length:0};
   db.exec('COMMIT'); // Release the read snapshot before hashing filesystem inputs.
   const measurements=new Map(),runtimeMeasurements=new Map();
   const runs=rows.map(row=>{
    ensure(row.pending.length<=500000&&(!row.receipt||row.receipt.length<=1000000));
    const pending=JSON.parse(row.pending);ensure(identifier(row.id)&&pending.runId===row.id&&pending.owner===ownerId&&pending.workflow==='isolated_browser_workflow_v1');
    ensure(hash(pending.inputHash)&&digest(pending.inputs)===pending.inputHash);
    ensure(row.last);const state=JSON.parse(row.last);const base={runId:row.id,workflow:pending.workflow,revision:pending.revision,preparedAt:pending.preparedAt,lastState:state.state,receipt:null,relations:[],measurement:null};
    if(!row.receipt)return base;
    const receipt=JSON.parse(row.receipt);ensure(hash(row.hash)&&digest(receipt)===row.hash&&state.receiptHash===row.hash&&receipt.runId===row.id&&receipt.revision===pending.revision&&receipt.inputHash===pending.inputHash&&digest(receipt.inputs)===receipt.inputHash&&receipt.authorizationHash===pending.authorizationHash);
    ensure(['completed','outcome_unknown','not_started'].includes(receipt.state)&&['pass','fail','gap'].includes(receipt.result)&&['local_workflow_observed','local_workflow_incomplete'].includes(receipt.basis));
    ensure(receipt.scope==='synthetic_local_browser_only'&&digest(receipt.environment)===receipt.environmentFingerprint);
    if(!measurements.has(receipt.inputHash)){
     const measurement=measure(receipt.inputs,measuredRoot);
     measurements.set(receipt.inputHash,{...measurement,fileRoles:fileRoles(receipt.inputs,measurement)});
    }
    const runtimeKey=receipt.inputHash+':'+receipt.environmentFingerprint;
    if(!runtimeMeasurements.has(runtimeKey))runtimeMeasurements.set(runtimeKey,measureBrowserRuntime({inputs:receipt.inputs,environment:receipt.environment,measurementRoot:measuredRoot,runtimeMeasurement}));
    const artifacts=Object.entries(receipt.artifacts).map(([name,artifact])=>{
     ensure(['observations.json','browser.png'].includes(name)&&hash(artifact.sha256));
     let availability='unavailable';try{availability=digest(read(root,'artifacts/'+row.id+'/'+name))===artifact.sha256?'hash_matches':'changed';}catch{}
     return {name,sha256:artifact.sha256,size:artifact.size,availability};
    });
    return {...base,measurement:measurements.get(receipt.inputHash),runtimeRelevance:runtimeMeasurements.get(runtimeKey),relations:[relation(receipt.observations?.current,'target'),relation(receipt.observations?.historical,'historical'),relation(receipt.partial?.review,'partial')].filter(Boolean),receipt:{hash:row.hash,state:receipt.state,result:receipt.result,basis:receipt.basis,scope:receipt.scope,recordedAt:receipt.recordedAt,revision:receipt.revision,inputHash:receipt.inputHash,environmentFingerprint:receipt.environmentFingerprint,interrupted:receipt.interrupted,resourcesConfirmed:receipt.resourcesConfirmed,integrityIssue:receipt.integrityIssue,artifacts}};
   });
   return {status:'available',total,runs,page};
  }finally{db.close();}
 };
}
