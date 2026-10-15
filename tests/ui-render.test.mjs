import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import React from 'react';
import {renderToString} from 'react-dom/server';

test('all empty views render; synthetic source content is escaped',async()=>{
 const dir=await mkdtemp(path.resolve('.ui-test-'));
 try{
  const out=path.join(dir,'history.mjs');
  await build({entryPoints:['ui/history-views.tsx'],outfile:out,bundle:true,platform:'node',format:'esm',jsx:'automatic',packages:'external'});
  const {default:View}=await import(pathToFileURL(out));
  for(const view of ['correspondence','schedule','opportunities','projects','sources']){
   const html=renderToString(React.createElement(View,{view,records:[]}));assert.ok(html.length>100);assert.ok(!html.includes('syntheticmessage'));
  }
  const records=[{id:'opportunity:synthetic',kind:'opportunity',version:1,data:{id:'synthetic',organization:'Example',title:'<script>unsafe</script>',summary:'Synthetic only',category:'role',classificationBasis:'explicit',status:'review',nextStep:'Review',threadUrls:[]}}];
  const html=renderToString(React.createElement(View,{view:'opportunities',records}));assert.ok(html.includes('&lt;script&gt;unsafe&lt;/script&gt;'));assert.ok(!html.includes('<script>unsafe</script>'));
 }finally{await rm(dir,{recursive:true,force:true})}
});

 test('day workspace renders truthful empty state without runtime data',async()=>{
 const dir=await mkdtemp(path.resolve('.ui-test-'));try{
 const out=path.join(dir,'day.mjs');await build({entryPoints:['ui/day-workspace.tsx'],outfile:out,bundle:true,platform:'node',format:'esm',jsx:'automatic',packages:'external'});
 const {default:View}=await import(pathToFileURL(out));const html=renderToString(React.createElement(View,{records:[],instructions:[],onNavigate:()=>{}}));
 assert.ok(html.includes('Review day (UTC)'));assert.ok(html.includes('No request reviews recorded'));
 }finally{await rm(dir,{recursive:true,force:true})}
 });
