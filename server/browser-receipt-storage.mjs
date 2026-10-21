/** Internal local ledger. No HTTP ingress and no driver write access. */
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
export const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
export const digest=value=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:canonical(value)).digest('hex');
export class BrowserReceiptStorage {
 #db;
 constructor(filename,owner){
  this.#db=new DatabaseSync(filename);
  this.#db.exec(`PRAGMA foreign_keys=ON;
   CREATE TABLE IF NOT EXISTS binding(owner TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS pending(id TEXT PRIMARY KEY,request_id TEXT UNIQUE NOT NULL,request_hash TEXT NOT NULL,data TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS transitions(sequence INTEGER PRIMARY KEY,run_id TEXT NOT NULL REFERENCES pending(id),data TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS receipts(run_id TEXT PRIMARY KEY REFERENCES pending(id),hash TEXT NOT NULL,data TEXT NOT NULL);
  `);
  for(const table of ['pending','transitions','receipts'])for(const operation of ['UPDATE','DELETE'])this.#db.exec(`CREATE TRIGGER IF NOT EXISTS immutable_${table}_${operation} BEFORE ${operation} ON ${table} BEGIN SELECT RAISE(ABORT,'Immutable browser evidence'); END`);
  const rows=this.#db.prepare('SELECT owner FROM binding').all();
  if(!rows.length)this.#db.prepare('INSERT INTO binding VALUES (?)').run(owner);
  else if(rows.length!==1||rows[0].owner!==owner){this.#db.close();throw new Error('Receipt owner mismatch');}
 }
 request(id){const row=this.#db.prepare('SELECT * FROM pending WHERE request_id=?').get(id);return row?{...row,data:JSON.parse(row.data)}:null;}
 prepare(data,requestHash){this.#db.prepare('INSERT INTO pending VALUES (?,?,?,?)').run(data.runId,data.requestId,requestHash,canonical(data));this.event(data.runId,{state:'prepared',at:data.preparedAt});}
 event(id,data){this.#db.prepare('INSERT INTO transitions(run_id,data) VALUES (?,?)').run(id,canonical(data));}
 finish(receipt){
  const hash=digest(receipt);this.#db.exec('BEGIN IMMEDIATE');
  try{const prior=this.#db.prepare('SELECT * FROM receipts WHERE run_id=?').get(receipt.runId);
   if(prior){if(prior.hash!==hash)throw new Error('Conflicting browser receipt');this.#db.exec('COMMIT');return {receipt:JSON.parse(prior.data),duplicate:true};}
   this.#db.prepare('INSERT INTO receipts VALUES (?,?,?)').run(receipt.runId,hash,canonical(receipt));
   this.event(receipt.runId,{state:receipt.state,at:receipt.recordedAt,receiptHash:hash});this.#db.exec('COMMIT');return {receipt,duplicate:false};
  }catch(error){this.#db.exec('ROLLBACK');throw error;}
 }
 receipt(id){const row=this.#db.prepare('SELECT data FROM receipts WHERE run_id=?').get(id);return row?JSON.parse(row.data):null;}
 history(id){return this.#db.prepare('SELECT data FROM transitions WHERE run_id=? ORDER BY sequence').all(id).map(r=>JSON.parse(r.data));}
 unsettled(){return this.#db.prepare("SELECT p.id FROM pending p LEFT JOIN receipts r ON r.run_id=p.id WHERE r.run_id IS NULL OR json_extract(r.data,'$.resourcesConfirmed')!=1").all();}
 close(){this.#db.close();}
}
