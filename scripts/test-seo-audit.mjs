import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {audit} from './seo-audit.mjs';
const root=await mkdtemp(join(tmpdir(),'ce-seo-test-'));
try{
 await mkdir(join(root,'seo'));
 const policy={origin:'https://example.com',criticalPages:['index.html'],excludedPrefixes:['seawall-','dock-'],searchBots:['OAI-SearchBot'],changeLimit:5};
 await writeFile(join(root,'seo/policy.json'),JSON.stringify(policy));
 const page='<html><head><title>Example</title><meta name="description" content="A useful description"><script type="application/ld+json">{"@type":"WebSite"}</script></head><body><h1>Example</h1><a href="tel:+13034347658">Call</a></body></html>';
 await writeFile(join(root,'index.html'),page);
 await writeFile(join(root,'robots.txt'),'User-agent: OAI-SearchBot\nAllow: /\nSitemap: https://example.com/sitemap.xml\n');
 await writeFile(join(root,'sitemap.xml'),'<urlset><url><loc>https://example.com/seawall-test</loc></url></urlset>');
 let r=await audit(root,true);assert(r.ok&&r.fixesApplied);assert.equal(r.changedFiles.length,2);
 assert((await readFile(join(root,'index.html'),'utf8')).includes('href="https://example.com/"'));
 assert(!(await readFile(join(root,'sitemap.xml'),'utf8')).includes('seawall-test'));
 r=await audit(root,true);assert(r.ok&&!r.fixesApplied&&r.changedFiles.length===0,'Second run must be idempotent');
 await writeFile(join(root,'index.html'),page.replace('{"@type":"WebSite"}','BROKEN'));
 r=await audit(root,true);assert(!r.ok&&!r.fixesApplied);assert(r.issues.some(x=>x.kind==='invalid_jsonld'));assert.equal(await readFile(join(root,'index.html'),'utf8'),page.replace('{"@type":"WebSite"}','BROKEN'),'Do not edit while a validation blocker exists');
 console.log('PASS: canonical repair, sitemap separation, idempotence, failure containment');
}finally{await rm(root,{recursive:true,force:true});}
