import {build,version} from 'esbuild';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const inputs={};
await mkdir('dist',{recursive:true});
const result=await build({entryPoints:['ui/main.tsx'],outdir:'dist',bundle:true,format:'esm',jsx:'automatic',minify:true,sourcemap:false,metafile:true,define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'consumed-input-hashes',setup(builder){builder.onLoad({filter:/\.(tsx?|jsx?|mjs|cjs|css|json)$/},async args=>{
 const name=path.relative(process.cwd(),args.path).split(path.sep).join('/');
 if(name.startsWith('../')||path.isAbsolute(name))throw new Error('Build input outside project');
 const contents=await readFile(args.path);inputs[name]=hash(contents);
 const extension=path.extname(args.path).slice(1);return {contents,loader:['mjs','cjs'].includes(extension)?'js':extension,resolveDir:path.dirname(args.path)};
})}}]});
if(Object.keys(result.metafile.inputs).some(name=>!inputs[name]))throw new Error('Unmeasured build input');
await writeFile('dist/index.html','<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>dot work dashboard</title><link rel="stylesheet" href="./main.css"></head><body><div id="root"></div><script type="module" src="./main.js"></script></body></html>');
for(const name of ['scripts/build.mjs','package.json','package-lock.json'])inputs[name]=hash(await readFile(name));
const outputs={};for(const name of ['index.html','main.js','main.css'])outputs[name]=hash(await readFile('dist/'+name));
await writeFile('dist/build-manifest.json',JSON.stringify({version:1,builder:{esbuild:version,node:process.version},inputs,outputs},null,2)+'\n');
console.log('Built dashboard client. Start the server separately; authentication defaults to denied. No runtime data is bundled.');
