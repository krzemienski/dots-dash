import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {openStore} from '../server/store.mjs';
import {createApi} from '../server/api.ts';
const origin='https://example.test';
const req=(route,body,extra={})=>new Request(origin+route,{method:body?'POST':'GET',headers:body?{'content-type':'application/json',origin,...extra}:extra,...(body?{body:JSON.stringify(body)}:{})});

// Isolated contract tests use a controlled principal function; this is not a
// real sign-in integration or a claim that a production auth provider works.
test('API denies anonymous, wrong owner, and unconfigured owner before data lookup',async()=>{const db=openStore(':memory:');try{
 for(const options of [{},{ownerId:'test-owner'},{ownerId:'test-owner',authenticate:async()=>({id:'other-owner'})},{authenticate:async()=>({id:'test-owner'})}]){
  const api=createApi({db,publicOrigin:origin,...options});
  for(const route of ['/api/work','/api/history','/api/health'])assert.equal((await api(req(route))).status,401);
  assert.equal((await api(req('/api/work',{action:'instruction'}))).status,401);
 }
}finally{db.close()}});
test('SQLite-backed instruction persists across reopen, replays safely, and has no delivery claim',async()=>{const dir=await mkdtemp(path.join(os.tmpdir(),'dashboard-storage-'));const filename=path.join(dir,'work.sqlite');let db=openStore(filename);try{
 const options={publicOrigin:origin,ownerId:'test-owner',authenticate:async()=>({id:'test-owner'})};let api=createApi({...options,db});
 const payload={action:'instruction',requestId:'isolated_instruction_01',body:'Controlled local persistence check',taskId:null};
 const saved=await api(req('/api/work',payload));assert.equal(saved.status,200);assert.equal((await saved.json()).instruction.status,'saved_not_delivered');
 assert.equal((await (await api(req('/api/work',payload))).json()).duplicate,true);
 assert.equal((await api(req('/api/work',{...payload,body:'Changed payload'}))).status,409);
 assert.equal((await api(req('/api/work',payload,{origin:'https://other.test'}))).status,403);
 assert.equal((await api(req('/api/history',{batchId:'disabled'}))).status,403);
 db.close();db=openStore(filename);api=createApi({...options,db});const read=await (await api(req('/api/work'))).json();assert.equal(read.instructions.length,1);assert.equal(read.events.length,1);assert.equal(read.bridge.connected,false);assert.equal(read.records.length,0);
}finally{db.close();await rm(dir,{recursive:true,force:true})}});
test('actual SQLite transaction rolls back on a failing batch',async()=>{const db=openStore(':memory:');try{await assert.rejects(db.batch([db.prepare("INSERT INTO work_records VALUES ('test','task','{}',1,'2026-01-01')"),db.prepare('INSERT INTO nonexistent_table VALUES (1)')]));assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM work_records').first()).n,0)}finally{db.close()}});
test('API rejects oversized payload and stale or absent approvals without executing',async()=>{const db=openStore(':memory:');try{const api=createApi({db,publicOrigin:origin,ownerId:'test-owner',authenticate:async()=>({id:'test-owner'})});assert.equal((await api(req('/api/work',{action:'instruction',body:'x'.repeat(13000)}))).status,413);assert.equal((await api(req('/api/work',{action:'decision',requestId:'isolated_decision_01',approvalId:'missing',decision:'approve',version:1}))).status,404)}finally{db.close()}});
