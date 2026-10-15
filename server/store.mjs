import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync,chmodSync} from 'node:fs';
import path from 'node:path';

/** Actual SQLite persistence with the D1 subset used by the domain layer. */
export function openStore(filename){
 if(filename!==':memory:'){mkdirSync(path.dirname(filename),{recursive:true,mode:0o700});}
 const sqlite=new DatabaseSync(filename);
 if(filename!==':memory:')chmodSync(filename,0o600);
 sqlite.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=DELETE;');
 const exists=sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='work_records'").get();
 if(!exists)sqlite.exec(readFileSync(new URL('../db/0001_empty.sql',import.meta.url),'utf8'));
 const prepare=(query,args=[])=>({query,args,bind(...values){return prepare(query,values)},async first(){return sqlite.prepare(query).get(...args)??null},async all(){return {results:sqlite.prepare(query).all(...args)}},async run(){return sqlite.prepare(query).run(...args)}});
 return {prepare,async batch(statements){sqlite.exec('BEGIN IMMEDIATE');try{const result=statements.map(s=>/^\s*(SELECT|WITH)\b/i.test(s.query)?{results:sqlite.prepare(s.query).all(...s.args)}:sqlite.prepare(s.query).run(...s.args));sqlite.exec('COMMIT');return result}catch(error){sqlite.exec('ROLLBACK');throw error}},close(){sqlite.close()}};
}
