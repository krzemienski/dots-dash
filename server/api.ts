import {createHash} from 'node:crypto';
import {importHistory,readHistory} from '../lib/work/history.ts';
import {validateInstruction,validateDecision,canDecide} from '../lib/work/validation.mjs';
export type Principal={id:string};
export type RuntimeOptions={db:D1Database;ownerId?:string;publicOrigin:string;sourceAccount?:string;allowImport?:boolean;authenticate?:(request:Request)=>Promise<Principal|null>;engineering?:(input:{principal:Principal;method:string;body?:unknown;sources?:unknown})=>Promise<{status:number;body:unknown}>;legacyReader?:(input:{principal:Principal;path:string})=>Promise<{status:number;body:unknown}>;browserReceiptReader?:(input:{principal:Principal;cursor?:string})=>Promise<unknown>};
const headers={'Cache-Control':'private, no-store','Content-Type':'application/json','X-Content-Type-Options':'nosniff'};
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
async function limitedBody(request:Request,max:number){
 if(!request.headers.get('content-type')?.toLowerCase().includes('application/json'))throw new Error('JSON required');
 if(Number(request.headers.get('content-length')||0)>max)throw new Error('Request too large');
 const reader=request.body?.getReader();if(!reader)throw new Error('Invalid JSON');
 const chunks:Uint8Array[]=[];let size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw new Error('Request too large')}chunks.push(value)}
 const all=new Uint8Array(size);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.byteLength}return JSON.parse(new TextDecoder().decode(all));
}
export function createApi(options:RuntimeOptions){return async function handle(request:Request){
 const path=new URL(request.url).pathname;
 let principal:Principal|null=null;try{principal=options.authenticate?await options.authenticate(request):null}catch{return json({error:'Authentication unavailable'},503)}
 if(!options.ownerId||!principal||principal.id!==options.ownerId)return json({error:'Owner authentication is not configured or this session is not authorized.'},401);
 const D=options.db;
 try{
 if(path==='/api/browser-receipts'){
  if(request.method!=='GET')return json({error:'Method not allowed'},405);
  if(!options.browserReceiptReader)return json({status:'unconfigured',total:0,runs:[]});
  const cursors=new URL(request.url).searchParams.getAll('cursor');
  if(cursors.length>1)return json({error:'Invalid browser receipt cursor'},400);
  try{return json(await options.browserReceiptReader({principal,...(cursors.length?{cursor:cursors[0]}:{})}))}catch(error){if(error&&typeof error==='object'&&'code' in error&&error.code==='INVALID_BROWSER_RECEIPT_CURSOR')return json({error:'Invalid browser receipt cursor'},400);return json({status:'unavailable',total:0,runs:[]},503)}
 }
 if(path==='/api/context-links'){
  if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed'},405);
  if(request.method==='POST'&&request.headers.get('origin')!==new URL(options.publicOrigin).origin)return json({error:'Same-origin request required'},403);
  if(!options.engineering)return json({error:'Session context is unconfigured'},503);
  const rows=await D.prepare("SELECT id,version,data FROM work_records WHERE kind='commitment' ORDER BY id LIMIT 51").all<any>();
  const sources={complete:rows.results.length<=50,requests:rows.results.slice(0,50).map((row:any)=>({id:row.id,version:row.version,hash:createHash('sha256').update(row.data).digest('hex'),title:String(JSON.parse(row.data).title).slice(0,200)}))};
  const result=await options.engineering({principal,method:request.method==='GET'?'CONTEXT_GET':'CONTEXT_POST',sources,...(request.method==='POST'?{body:await limitedBody(request,6000)}:{})});
  return json(result.body,result.status);
 }
 if(path==='/api/snapshot-review-associations'){
  if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed'},405);
  if(request.method==='POST'&&request.headers.get('origin')!==new URL(options.publicOrigin).origin)return json({error:'Same-origin request required'},403);
  if(!options.engineering)return json({error:'Snapshot associations are unconfigured'},503);
  const query=new URL(request.url).searchParams;
  if([...query.keys()].some(key=>!['snapshotId','reviewId'].includes(key))||['snapshotId','reviewId'].some(key=>query.getAll(key).length>1)||[...query.values()].some(value=>!/^[A-Za-z0-9_-]{1,100}$/.test(value))||(request.method==='POST'&&query.size))return json({error:'Invalid association query'},400);
  const input={principal,method:request.method==='POST'?'ASSOCIATION_POST':'ASSOCIATION_GET',...(request.method==='POST'?{body:await limitedBody(request,10000)}:query.size?{body:Object.fromEntries(query)}:{})};
  let result;try{result=await options.engineering(input)}catch{return json({error:'Association outcome could not be confirmed. Reconcile the same operation before another write.'},503)}
  return json(result.body,result.status);
 }
 if(path==='/api/source-coverage'){
  if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed'},405);
  if(request.method==='POST'&&request.headers.get('origin')!==new URL(options.publicOrigin).origin)return json({error:'Same-origin request required'},403);
  if(!options.engineering)return json({error:'Source inventory is unconfigured'},503);
  const query=new URL(request.url).searchParams,selected=query.getAll('inventoryId'),anchors=query.getAll('anchor'),offsets=query.getAll('offset');
  if([...query.keys()].some(key=>!['inventoryId','anchor','offset'].includes(key))||[selected,anchors,offsets].some(values=>values.length>1)||[...selected,...anchors].some(value=>!/^[A-Za-z0-9_-]{1,100}$/.test(value))||(offsets.length&&!/^(0|50)$/.test(offsets[0]))||(offsets[0]==='50'&&!anchors.length)||(request.method==='POST'&&query.size))return json({error:'Invalid inventory query'},400);
  const selection={...(selected.length?{inventoryId:selected[0]}:{}),...(anchors.length?{anchor:anchors[0]}:{}),...(offsets.length?{offset:Number(offsets[0])}:{})};
  const input={principal,method:request.method==='POST'?'COVERAGE_POST':'COVERAGE_GET',...(request.method==='POST'?{body:await limitedBody(request,8000)}:query.size?{body:selection}:{})};
  // Worker transport/decoding failure may follow a commit. Do not classify it
  // as a definite input rejection through the generic error-message handler.
  let result;try{result=await options.engineering(input)}catch{return json({error:'Coverage operation could not be confirmed. Reconcile the same operation before another write.'},503)}
  return json(result.body,result.status);
 }
 if(path==='/api/engineering'||path==='/api/engineering/schema'){
  if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed'},405);
  if(request.method==='POST'&&request.headers.get('origin')!==new URL(options.publicOrigin).origin)return json({error:'Same-origin request required'},403);
  if(path.endsWith('/schema')&&request.method!=='GET')return json({error:'Method not allowed'},405);
  if(!options.engineering)return json({error:'Python session review is not configured',capabilities:{runner:'unconfigured',externalExecution:false}},503);
  const selected=new URL(request.url).searchParams.get('reviewId');
  const result=await options.engineering({principal,method:path.endsWith('/schema')?'SCHEMA':request.method,...(request.method==='POST'?{body:await limitedBody(request,240000)}:selected?{body:{reviewId:selected}}:{})});
  return json(result.body,result.status);
 }
 if(request.method==='GET'){
  if(options.legacyReader&&['/api/work','/api/history','/api/health'].includes(path)){
   const result=await options.legacyReader({principal,path});return json(result.body,result.status);
  }
  if(path==='/api/history')return json(await readHistory(D));
  if(path==='/api/health')return json({storage:'available',bridge:'not_connected',externalExecution:false});
  if(path!=='/api/work')return json({error:'Not found'},404);
  const [records,instructions,events,decisions]=await D.batch([D.prepare('SELECT * FROM work_records ORDER BY id'),D.prepare('SELECT * FROM instructions WHERE owner_id=? ORDER BY created_at ASC LIMIT 300').bind(principal.id),D.prepare('SELECT * FROM activity_events ORDER BY COALESCE(occurred_at,recorded_at) DESC LIMIT 200'),D.prepare('SELECT * FROM approval_decisions WHERE owner_id=? ORDER BY created_at DESC').bind(principal.id)]);
  return json({records:records.results.map((r:any)=>({...r,data:JSON.parse(r.data)})),instructions:instructions.results,events:events.results,decisions:decisions.results,serverTime:new Date().toISOString(),initialized:true,bridge:{connected:false,reason:'No authenticated assistant delivery adapter configured.'}});
 }
 if(request.method!=='POST')return json({error:'Method not allowed'},405);
 if(request.headers.get('origin')!==new URL(options.publicOrigin).origin)return json({error:'Same-origin request required'},403);
 if(path==='/api/history'){
  if(!options.allowImport)return json({error:'Owner import capability is disabled'},403);
  const body=await limitedBody(request,900000);return json(await importHistory(D,body,{sourceAccount:options.sourceAccount}));
 }
 if(path!=='/api/work')return json({error:'Not found'},404);
 const body=await limitedBody(request,12000), now=new Date().toISOString();
 if(body.action==='instruction'){
  const v=validateInstruction(body);
  if(v.taskId&&!await D.prepare("SELECT id FROM work_records WHERE id=? AND kind='task'").bind(v.taskId).first())return json({error:'Task not found'},404);
  const existing=await D.prepare('SELECT * FROM instructions WHERE request_id=?').bind(v.requestId).first<any>();
  if(existing){if(existing.owner_id!==principal.id||existing.body!==v.body||existing.task_id!==v.taskId)return json({error:'Request ID already used for different content'},409);return json({ok:true,instruction:existing,duplicate:true})}
  const id=crypto.randomUUID();
  await D.batch([D.prepare('INSERT OR IGNORE INTO instructions (id,owner_id,task_id,body,status,created_at,request_id) VALUES (?,?,?,?,?,?,?)').bind(id,principal.id,v.taskId,v.body,'saved_not_delivered',now,v.requestId),D.prepare("INSERT OR IGNORE INTO activity_events (id,task_id,type,summary,actor,occurred_at,recorded_at) SELECT ?,?,'instruction_saved','Instruction saved; not delivered',?,?,? WHERE EXISTS (SELECT 1 FROM instructions WHERE id=?)").bind('instruction-'+id,v.taskId,'Owner',now,now,id)]);
  const saved=await D.prepare('SELECT * FROM instructions WHERE request_id=?').bind(v.requestId).first<any>();
  if(!saved||saved.owner_id!==principal.id||saved.body!==v.body||saved.task_id!==v.taskId)return json({error:'Conflicting request ID'},409);
  return json({ok:true,instruction:saved,...(saved.id!==id?{duplicate:true}:{})});
 }
 if(body.action==='decision'){
  const v=validateDecision(body),previous=await D.prepare('SELECT * FROM approval_decisions WHERE request_id=?').bind(v.requestId).first<any>();
  if(previous){if(previous.owner_id!==principal.id||previous.approval_id!==v.approvalId||previous.decision!==v.decision||previous.payload_version!==v.version)return json({error:'Conflicting request ID'},409);return json({ok:true,decision:previous,duplicate:true,executed:false})}
  const record=await D.prepare("SELECT * FROM work_records WHERE id=? AND kind='approval'").bind(v.approvalId).first<any>();
  if(!record)return json({error:'Approval not found'},404);record.data=JSON.parse(record.data);
  if(!canDecide(record,v.version,Date.now())){
   const winner=await D.prepare('SELECT * FROM approval_decisions WHERE request_id=?').bind(v.requestId).first<any>();
   if(winner&&winner.owner_id===principal.id&&winner.approval_id===v.approvalId&&winner.decision===v.decision&&winner.payload_version===v.version)return json({ok:true,decision:winner,duplicate:true,executed:false});
   return json({error:'Approval is stale, expired, incomplete, or already decided'},409);
  }
  const id=crypto.randomUUID();
  await D.batch([D.prepare("INSERT OR IGNORE INTO approval_decisions (id,approval_id,owner_id,decision,payload_version,created_at,request_id) SELECT ?,?,?,?,?,?,? FROM work_records WHERE id=? AND version=? AND json_extract(data,'$.state')='pending'").bind(id,v.approvalId,principal.id,v.decision,v.version,now,v.requestId,v.approvalId,v.version),D.prepare("UPDATE work_records SET data=json_set(data,'$.state',?),version=version+1,updated_at=? WHERE id=? AND version=? AND EXISTS (SELECT 1 FROM approval_decisions WHERE id=?)").bind(v.decision==='approve'?'approved':'declined',now,v.approvalId,v.version,id),D.prepare("INSERT OR IGNORE INTO activity_events (id,task_id,type,summary,actor,occurred_at,recorded_at) SELECT ?,?,'decision',?,'Owner',?,? WHERE EXISTS (SELECT 1 FROM approval_decisions WHERE id=?)").bind('decision-'+id,record.data.taskId||null,'Decision recorded: '+v.decision+'. No external execution.',now,now,id)]);
  const saved=await D.prepare('SELECT * FROM approval_decisions WHERE id=?').bind(id).first();
  if(!saved){
   const winner=await D.prepare('SELECT * FROM approval_decisions WHERE request_id=?').bind(v.requestId).first<any>();
   if(winner&&winner.owner_id===principal.id&&winner.approval_id===v.approvalId&&winner.decision===v.decision&&winner.payload_version===v.version)return json({ok:true,decision:winner,duplicate:true,executed:false});
   return json({error:'Another decision won the race'},409);
  }
  return json({ok:true,decision:saved,executed:false});
 }
 return json({error:'Unsupported action. No external executor is configured.'},400);
 }catch(error){const message=error instanceof Error?error.message:'';if(message==='Request too large')return json({error:message},413);if(message==='JSON required')return json({error:message},415);if(error instanceof SyntaxError||/Invalid|Unsupported|Batch|unknown opportunity|Empty|Duplicate|must|required|Provide|too large/.test(message))return json({error:'Request rejected: invalid or conflicting input'},400);return json({error:'Operation could not be confirmed. Read current records before retrying.'},503)}
};}
