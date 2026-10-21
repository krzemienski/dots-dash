import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

/** Fixed local worker, no user-controlled executable, arguments, environment or paths. */
export function createEngineering({python,database,ownerId,allowImport=false,allowRunner=false,allowContextLinks=false,allowSourceInventory=false,allowSnapshotAssociations=false,allowOwnerReviewReports=false,mode='engineering'}){
 const script=fileURLToPath(new URL('../python/worker.py',import.meta.url));
 return async ({principal,method,body,sources})=>new Promise((resolve,reject)=>{
  const child=spawn(python,['-B',script],{shell:false,stdio:['pipe','pipe','ignore'],env:{PATH:process.env.PATH||'',LANG:'C.UTF-8'}});
  const chunks=[];let size=0,finished=false;
  const finish=(error,value)=>{if(finished)return;finished=true;clearTimeout(timer);error?reject(error):resolve(value)};
  const timer=setTimeout(()=>{child.kill();finish(new Error('Engineering worker outcome unknown'))},10000);
  child.on('error',error=>finish(error));child.stdin.on('error',error=>finish(error));
  child.stdout.on('data',chunk=>{size+=chunk.length;if(size>16000000){child.kill();finish(new Error('Engineering response too large'))}else chunks.push(chunk)});
  child.on('close',code=>{if(code!==0)return finish(new Error('Engineering worker unavailable'));try{finish(null,JSON.parse(Buffer.concat(chunks).toString('utf8')))}catch{finish(new Error('Invalid engineering response'))}});
  child.stdin.end(JSON.stringify({database,owner:ownerId,principal:principal.id,allowImport,allowRunner,allowContextLinks,allowSourceInventory,allowSnapshotAssociations,allowOwnerReviewReports,mode,method,body,sources}));
 });
}

/** The same bounded transport; read mode and database are host configuration. */
export function createLegacyReader({python,database,ownerId}){
 const invoke=createEngineering({python,database,ownerId,mode:'legacy_read'});
 return ({principal,path})=>invoke({principal,method:'GET',body:{path}});
}
