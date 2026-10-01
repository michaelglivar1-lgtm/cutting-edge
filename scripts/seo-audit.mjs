// Deterministic SEO maintenance. No model calls, credentials, spending or outreach.
import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';
export async function audit(root, fix=false) {
 const policy=JSON.parse(await readFile(resolve(root,'seo/policy.json'),'utf8'));
 const issues=[], changes=[], checked=[];
 const proposed=new Map();
 const issue=(file,kind)=>issues.push({file,kind});
 for(const file of policy.criticalPages){
  let text;try{text=await readFile(resolve(root,file),'utf8');}catch{issue(file,'missing_page');continue;}
  checked.push(file);
  const expected=policy.origin+(file==='index.html'?'/':'/'+file.replace(/\.html$/,''));
  const canonical=/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i;
  const match=text.match(canonical);
  if(!match){
   if(fix&&text.includes('</head>')){text=text.replace('</head>',`<link rel="canonical" href="${expected}">\n</head>`);proposed.set(file,text);changes.push({file,kind:'restore_missing_canonical',value:expected});}
   else issue(file,'missing_canonical');
  } else if(match[1]!==expected)issue(file,'canonical_changed_review_required');
  if(!/<title>[^<]+<\/title>/i.test(text))issue(file,'missing_title');
  if(!/<meta\b[^>]*name=["']description["'][^>]*content=["'][^"']+["']/i.test(text))issue(file,'missing_description');
  if((text.match(/<h1\b/gi)||[]).length!==1)issue(file,'heading_count');
  if(/<meta\b[^>]*name=["'](?:robots|googlebot)["'][^>]*content=["'][^"']*(?:noindex|none|nosnippet)/i.test(text))issue(file,'critical_page_indexing_restricted');
  for(const m of text.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
   try{JSON.parse(m[1]);}catch{issue(file,'invalid_jsonld');}
  }
  if(!text.includes('tel:+13034347658'))issue(file,'missing_verified_phone_link');
  for(const prefix of policy.excludedPrefixes){if(new RegExp('href=["\']/'+prefix).test(text))issue(file,'links_to_retired_service');}
 }
 let sitemap=await readFile(resolve(root,'sitemap.xml'),'utf8');
 const originalSitemap=sitemap;
 const oldUrls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 if(new Set(oldUrls).size!==oldUrls.length)issue('sitemap.xml','duplicate_urls');
 for(const prefix of policy.excludedPrefixes){
  const escaped=(policy.origin+'/'+prefix).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const pattern=new RegExp('\\s*<url>\\s*<loc>'+escaped+'[^<]*<\\/loc>[\\s\\S]*?<\\/url>','g');
  if(pattern.test(sitemap)){
   if(fix){sitemap=sitemap.replace(pattern,'');changes.push({file:'sitemap.xml',kind:'remove_retired_service_urls',prefix});}
   else issue('sitemap.xml','retired_service_urls');
  }
 }
 for(const file of policy.criticalPages){
  const url=policy.origin+(file==='index.html'?'/':'/'+file.replace(/\.html$/,''));
  if(!sitemap.includes('<loc>'+url+'</loc>')){
   if(fix&&sitemap.includes('</urlset>')){sitemap=sitemap.replace('</urlset>',`  <url><loc>${url}</loc></url>\n</urlset>`);changes.push({file:'sitemap.xml',kind:'restore_critical_url',value:url});}
   else issue('sitemap.xml','missing_critical_url:'+url);
  }
 }
 if(sitemap!==originalSitemap)proposed.set('sitemap.xml',sitemap);
 const robots=await readFile(resolve(root,'robots.txt'),'utf8');
 for(const bot of policy.searchBots){
  const blocks=robots.split(/(?=^User-agent:)/mi);
  const group=blocks.find(b=>new RegExp('^User-agent:\\s*'+bot.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*$','mi').test(b));
  if(!group||!/^Allow:\s*\/\s*$/mi.test(group)||/^Disallow:\s*\/\s*$/mi.test(group))issue('robots.txt','crawler_access_review:'+bot);
 }
 if(!robots.includes('Sitemap: '+policy.origin+'/sitemap.xml'))issue('robots.txt','sitemap_declaration');
 // Fail closed: do not combine automatic repairs with unresolved errors or broad changes.
 let applied=false;
 if(fix&&proposed.size&&issues.length===0&&proposed.size<=policy.changeLimit){
  for(const [file,text]of proposed)await writeFile(resolve(root,file),text);
  applied=true;
 }
 return {version:1,checkedAt:new Date().toISOString(),site:policy.origin,checkedPages:checked,issues,proposedChanges:changes,changedFiles:applied?[...proposed.keys()]:[],fixesApplied:applied,ok:issues.length===0&&(!changes.length||applied),scope:'source checks only; not a rank or traffic measurement'};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 try{const result=await audit(resolve(dirname(fileURLToPath(import.meta.url)),'..'),process.argv.includes('--fix'));console.log(JSON.stringify(result,null,2));process.exitCode=result.ok?0:1;}catch(e){console.error(JSON.stringify({ok:false,error:String(e)}));process.exitCode=1;}
}
