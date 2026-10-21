/** Read-only comparisons of fixed recorded inputs. Never loads or executes them. */
import {readFileSync,lstatSync,realpathSync,readdirSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {digest,canonical} from './browser-receipt-storage.mjs';

const dependencies=new Set([
 'node_modules/react/jsx-runtime.js','node_modules/react/index.js',
 'node_modules/react/cjs/react.production.js','node_modules/react/cjs/react-jsx-runtime.production.js',
 'node_modules/react-dom/client.js','node_modules/react-dom/index.js',
 'node_modules/react-dom/cjs/react-dom-client.production.js','node_modules/react-dom/cjs/react-dom.production.js',
 'node_modules/scheduler/index.js','node_modules/scheduler/cjs/scheduler.production.js',
]);
const hash=value=>typeof value==='string'&&/^[0-9a-f]{64}$/.test(value);
const ensure=value=>{if(!value)throw new Error('Measurement unavailable');};
function regular(filename,limit=32_000_000){
 const stat=lstatSync(filename);ensure(stat.isFile()&&!stat.isSymbolicLink()&&stat.size<=limit);
 return readFileSync(filename);
}
function boundPath(root,name){
 ensure(root&&typeof root==='string'&&path.isAbsolute(root)&&realpathSync(root)===root&&!lstatSync(root).isSymbolicLink());
 let file=root;
 for(const segment of name.split('/')){ensure(segment&&segment!=='.'&&segment!=='..');file=path.join(file,segment);ensure(!lstatSync(file).isSymbolicLink());}
 return file;
}
function executable(filename){
 ensure(typeof filename==='string'&&path.isAbsolute(filename)&&realpathSync(filename)===filename);
 return digest(regular(filename,256_000_000));
}
function library(root){
 boundPath(root,'package.json');
 const entries={};let count=0,total=0;
 function visit(dir,prefix='',depth=0){
  ensure(depth<=30);
  const children=readdirSync(dir,{withFileTypes:true});ensure(children.length<=5000);
  for(const entry of children){
   ensure(++count<=5000&&!entry.isSymbolicLink());
   const key=prefix+entry.name,file=path.join(dir,entry.name);
   if(entry.isDirectory())visit(file,key+'/',depth+1);
   else{ensure(entry.isFile());const stat=lstatSync(file);total+=stat.size;ensure(total<=128_000_000);entries[key]=digest(regular(file));}
  }
 }
 visit(root);return digest(entries);
}
const group=fields=>({state:fields.some(f=>f.state==='changed')?'stale':fields.some(f=>f.state==='unknown')?'unknown':'matches_measured_inputs',fields});
function compare(input,expected,read,valid=true){
 if(!valid||expected===undefined||expected===null)return {input,state:'unknown',reason:'recorded_value_unavailable'};
 try{return {input,state:canonical(read())===canonical(expected)?'matches':'changed'};}
 catch{return {input,state:'unknown',reason:'input_unavailable_or_not_configured'};}
}
const unknown=input=>({input,state:'unknown',reason:'not_safely_remeasurable_without_execution'});
export function measureBrowserRuntime({inputs,environment,measurementRoot,runtimeMeasurement}){
 const measuredAt=new Date().toISOString(),fields=[];
 const recorded=inputs.buildInputs;
 if(!recorded||typeof recorded!=='object'||Array.isArray(recorded)||Object.keys(recorded).length>300){fields.push({input:'recorded dependency inventory',state:'unknown',reason:'recorded_value_unavailable'});}
 else{
  let unsupported=0;
  for(const [name,expected] of Object.entries(recorded)){
   if(Object.hasOwn(inputs.files,name))continue; // Existing source assessment owns these.
   if(!dependencies.has(name)){unsupported++;continue;}
   fields.push(compare(name,expected,()=>digest(regular(boundPath(measurementRoot,name))),hash(expected)));
  }
  if(unsupported)fields.push({input:'unrecognized recorded dependencies',state:'unknown',reason:'outside_fixed_allowlist'});
  if(!fields.length)fields.push({input:'recorded dependency inventory',state:'unknown',reason:'recorded_value_unavailable'});
 }
 const config=runtimeMeasurement||{},runtime=[];
 for(const [input,key] of [['nodeExecutableHash','nodeExecutable'],['pythonExecutableHash','pythonExecutable'],['browserLauncherHash','browserExecutable']])runtime.push(compare(input,environment[input],()=>executable(config[key]),hash(environment[input])));
 runtime.push(compare('playwrightLibraryHash',environment.playwrightLibraryHash,()=>library(config.playwrightModule),hash(environment.playwrightLibraryHash)));
 runtime.push(compare('playwright',environment.playwright,()=>{const version=JSON.parse(regular(boundPath(config.playwrightModule,'package.json'))).version;ensure(typeof version==='string'&&version.length<=100);return version;},typeof environment.playwright==='string'));
 for(const [input,value] of [['node',()=>{ensure(realpathSync(process.execPath)===config.nodeExecutable);return process.version;}],['platform',()=>process.platform],['architecture',()=>process.arch],['osRelease',()=>os.release()]]){
  runtime.push(compare(input,environment[input],()=>{ensure(config.includeHostFacts===true);return value();},typeof environment[input]==='string'));
 }
 for(const input of ['python','browserVersion','viewport','locale','timezone','builder.node','builder.esbuild'])runtime.push(unknown(input));
 const dependency=group(fields),host=group(runtime);
 return {state:dependency.state==='stale'||host.state==='stale'?'stale':dependency.state==='unknown'||host.state==='unknown'?'unknown':'matches_measured_inputs',scope:'allowlisted_recorded_dependencies_and_environment',measuredAt,dependencies:dependency,environment:host};
}
