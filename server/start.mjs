import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {openStore} from './store.mjs';
import {createApi} from './api.ts';
import {createEngineering,createLegacyReader} from './engineering.mjs';
import {createBrowserReceiptReader} from './browser-receipt-reader.mjs';

const port=Number(process.env.PORT||4173);
const publicOrigin=new URL(process.env.DASHBOARD_PUBLIC_ORIGIN||`http://127.0.0.1:${port}`).origin;
const database=process.env.DASHBOARD_DB_PATH||path.resolve('private-data/dashboard.sqlite');
const pythonReads=process.env.DASHBOARD_PYTHON_READS==='true';
if(pythonReads&&(!process.env.DASHBOARD_ENGINEERING_PYTHON||database===':memory:'))throw new Error('Python reads require an explicit interpreter and file-backed owner database');
const db=openStore(database);
// No development bypass, trusted header, hardcoded principal, or credential in source.
// An operator-provided server-only adapter must verify the actual session.
let authenticate;
if(process.env.DASHBOARD_AUTH_MODULE){
 const module=await import(pathToFileURL(path.resolve(process.env.DASHBOARD_AUTH_MODULE)).href);
 if(typeof module.authenticate!=='function')throw new Error('Auth module must export authenticate(request)');
 authenticate=module.authenticate;
}
const engineering=process.env.DASHBOARD_ENGINEERING_PYTHON?createEngineering({
 python:process.env.DASHBOARD_ENGINEERING_PYTHON,
 database:path.resolve(process.env.DASHBOARD_ENGINEERING_DB_PATH||'private-data/engineering.sqlite'),
 ownerId:process.env.DASHBOARD_OWNER_ID,
 allowImport:process.env.DASHBOARD_ALLOW_SESSION_IMPORT==='true',
 allowRunner:process.env.DASHBOARD_ALLOW_LOCAL_CHECKLIST==='true',
 allowContextLinks:process.env.DASHBOARD_ALLOW_CONTEXT_LINKS==='true',
 allowSourceInventory:process.env.DASHBOARD_ALLOW_SOURCE_INVENTORY==='true',
 allowSnapshotAssociations:process.env.DASHBOARD_ALLOW_SNAPSHOT_ASSOCIATIONS==='true',
 allowOwnerReviewReports:process.env.DASHBOARD_ALLOW_OWNER_REVIEW_REPORTS==='true',
 allowRequestActionClaims:process.env.DASHBOARD_ALLOW_REQUEST_ACTION_CLAIMS==='true',
}):undefined;
const legacyReader=pythonReads?createLegacyReader({python:process.env.DASHBOARD_ENGINEERING_PYTHON,database:path.resolve(database),ownerId:process.env.DASHBOARD_OWNER_ID}):undefined;
const browserReceiptReader=process.env.DASHBOARD_BROWSER_RECEIPTS_PATH?createBrowserReceiptReader({ledger:process.env.DASHBOARD_BROWSER_RECEIPTS_PATH,ownerId:process.env.DASHBOARD_OWNER_ID,measurementRoot:process.env.DASHBOARD_BROWSER_MEASUREMENT_ROOT}):undefined;
const api=createApi({db,publicOrigin,ownerId:process.env.DASHBOARD_OWNER_ID,sourceAccount:process.env.DASHBOARD_SOURCE_ACCOUNT,allowImport:process.env.DASHBOARD_ALLOW_IMPORT==='true',authenticate,engineering,legacyReader,browserReceiptReader});
const assets=new Map([['/','index.html'],['/index.html','index.html'],['/main.js','main.js'],['/main.css','main.css']]);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url||'/',publicOrigin);
  if(url.origin!==publicOrigin){res.writeHead(400);res.end();return}
  if(url.pathname.startsWith('/api/')){
   const request=new Request(url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method||'GET')?{}:{body:req,duplex:'half'})});
   const response=await api(request);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
  }
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return}
  const asset=assets.get(url.pathname);if(!asset){res.writeHead(404);res.end();return}
  const data=await readFile(path.resolve('dist',asset));
  res.writeHead(200,{'Content-Type':types[path.extname(asset)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'"});res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(503,{'Content-Type':'text/plain'});res.end('Service unavailable. Build the UI and check server configuration.');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Dashboard listening on loopback port ${port}; owner API ${authenticate&&process.env.DASHBOARD_OWNER_ID?'requires configured authentication':'denied until authentication is configured'}.`));
function stop(){server.close(()=>{db.close();process.exit(0)})}process.on('SIGINT',stop);process.on('SIGTERM',stop);
