import {importHistory,readHistory} from '../lib/work/history.ts';
import {validateInstruction,validateDecision,canDecide} from '../lib/work/validation.mjs';
export type Principal={id:string};
export type RuntimeOptions={db:D1Database;ownerId?:string;publicOrigin:string;sourceAccount?:string;allowImport?:boolean;authenticate?:(request:Request)=>Promise<Principal|null>};
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
 if(request.method==='GET'){
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
  return json({ok:true,instruction:saved});
 }
 if(body.action==='decision'){
  const v=validateDecision(body),previous=await D.prepare('SELECT * FROM approval_decisions WHERE request_id=?').bind(v.requestId).first<any>();
  if(previous){if(previous.owner_id!==principal.id||previous.approval_id!==v.approvalId||previous.decision!==v.decision||previous.payload_version!==v.version)return json({error:'Conflicting request ID'},409);return json({ok:true,decision:previous,duplicate:true,executed:false})}
  const record=await D.prepare("SELECT * FROM work_records WHERE id=? AND kind='approval'").bind(v.approvalId).first<any>();
  if(!record)return json({error:'Approval not found'},404);record.data=JSON.parse(record.data);
  if(!canDecide(record,v.version,Date.now()))return json({error:'Approval is stale, expired, incomplete, or already decided'},409);
  const id=crypto.randomUUID();
  await D.batch([D.prepare("INSERT OR IGNORE INTO approval_decisions (id,approval_id,owner_id,decision,payload_version,created_at,request_id) SELECT ?,?,?,?,?,?,? FROM work_records WHERE id=? AND version=? AND json_extract(data,'$.state')='pending'").bind(id,v.approvalId,principal.id,v.decision,v.version,now,v.requestId,v.approvalId,v.version),D.prepare("UPDATE work_records SET data=json_set(data,'$.state',?),version=version+1,updated_at=? WHERE id=? AND version=? AND EXISTS (SELECT 1 FROM approval_decisions WHERE id=?)").bind(v.decision==='approve'?'approved':'declined',now,v.approvalId,v.version,id),D.prepare("INSERT OR IGNORE INTO activity_events (id,task_id,type,summary,actor,occurred_at,recorded_at) SELECT ?,?,'decision',?,'Owner',?,? WHERE EXISTS (SELECT 1 FROM approval_decisions WHERE id=?)").bind('decision-'+id,record.data.taskId||null,'Decision recorded: '+v.decision+'. No external execution.',now,now,id)]);
  const saved=await D.prepare('SELECT * FROM approval_decisions WHERE id=?').bind(id).first();if(!saved)return json({error:'Another decision won the race'},409);return json({ok:true,decision:saved,executed:false});
 }
 return json({error:'Unsupported action. No external executor is configured.'},400);
 }catch(error){const message=error instanceof Error?error.message:'';if(message==='Request too large')return json({error:message},413);if(message==='JSON required')return json({error:message},415);if(error instanceof SyntaxError||/Invalid|Unsupported|Batch|unknown opportunity|Empty|Duplicate|must|required|Provide|too large/.test(message))return json({error:'Request rejected: invalid or conflicting input'},400);return json({error:'Operation could not be confirmed. Read current records before retrying.'},503)}
};}
