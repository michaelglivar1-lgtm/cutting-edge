import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const match=html.match(/form\.addEventListener\('submit', async \(e\) => \{([\s\S]*?)\n      \}\);/);
assert(match,'Find the actual contact handler');
const build=new Function('form','document','window','state','fetch','FormData','WEB3FORMS_KEY','location','return async function(e){'+match[1]+'}');
async function run(accepted,valid=true){
 const button={disabled:false},status={textContent:''},success={hidden:true},events=[];
 let calls=0,mailDrafts=0;
 const form={hidden:false,reportValidity:()=>valid,querySelector:()=>button};
 const document={getElementById:id=>id==='reserveStatus'?status:success,createElement:()=>({click:()=>{mailDrafts++}})};
 const window={gtag:(...v)=>events.push(v)};
 const fetch=async()=>{calls++;return {ok:accepted,json:async()=>({success:accepted})}};
 class FormData {constructor(){return [['name','Fixture'],['email','fixture@example.invalid']];}}
 const fn=build(form,document,window,{projectLabel:'Kitchen',range:'fixture'},fetch,FormData,'fixture-key',{pathname:'/'});
 await fn({preventDefault(){}});
 return {form,button,status,success,events,calls,mailDrafts};
}
let r=await run(false);assert(!r.form.hidden&&r.success.hidden&&!r.button.disabled);assert(r.status.textContent.includes('has not been sent'));assert(!r.events.some(e=>e[1]==='consultation_request'));assert.equal(r.mailDrafts,1);
r=await run(true);assert(r.form.hidden&&!r.success.hidden);assert.equal(r.events.filter(e=>e[1]==='consultation_request').length,1);assert.equal(r.mailDrafts,0);
r=await run(true,false);assert.equal(r.calls,0);assert.equal(r.events.length,0);
console.log('PASS: failed submission stays visible; only provider acceptance records inquiry; invalid form does not send. No external request made.');
