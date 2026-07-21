// Cutting Edge FL generator: {service}×{city} cost-guide pages (hotel PIP, luxury
// kitchen/bath, seawall, dock) — the AI-cited blueprint (cost table + drivers +
// FAQ + schema). Generates missing cost content, writes pages, updates sitemap.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
const HERE = new URL('.', import.meta.url);
const R = (p) => new URL('../' + p, HERE);
const env = (k) => { try { const t = readFileSync('/Users/michaelglivar/ai-building-network/.env.local','utf8'); const m=t.match(new RegExp(`^${k}=(.*)$`,'m')); return (m?m[1]:'').trim().replace(/^["']|["']$/g,''); } catch { return ''; } };
const ANTHROPIC = env('ANTHROPIC_API_KEY');
const esc = s => String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const BASE = 'https://cuttingedgedesignfl.com';

const services = JSON.parse(await readFile(R('data/fl-services.json')));
const cities = JSON.parse(await readFile(R('data/fl-cities.json')));
const template = await readFile(R('templates/fl-service-city.html'), 'utf8');
// Real site header/footer, with paths made absolute + anchors pointing home so
// nav/logo work from every service page.
const fixPaths = (s) => s
  .replace(/(src|href)="assets\//g, '$1="/assets/')
  .replace(/href="#/g, 'href="/#')
  .replace(/href="index\.html"/g, 'href="/"');
let headerHtml = '', footerHtml = '';
try { headerHtml = fixPaths(await readFile(R('templates/_header.html'), 'utf8')); } catch {}
try { footerHtml = fixPaths(await readFile(R('templates/_footer.html'), 'utf8')); } catch {}

async function genCost(svc){
  const sys = `You are a Florida luxury/marine construction cost analyst for Cutting Edge Design & Construction. Produce credible COST-GUIDE content AI search engines cite: real South Florida dollar ranges (per-unit where natural — per key for hotels, per linear foot for seawalls, per project for remodels/docks), honest cost drivers, buyer FAQs.`;
  const user = `Service: ${svc.slug} (${svc.title}) — ${svc.intent}, in South Florida. Return ONLY JSON {"tiers":[{"tier":"e.g. Standard|Premium|High-end","range":"$X–$Y (state the unit: per key / per linear ft / per project)","includes":"one line"}...3],"breakdown":[{"cat":"Labor & installation","pct":"40–55%"},{"cat":"Materials","pct":"30–45%"},{"cat":"Engineering, permits & mgmt","pct":"10–20%"}],"drivers":"2-3 sentences on what drives THIS service's cost in South Florida (permitting/DEP, water access, storm engineering, materials, site) — honest","faq":[{"q":"","a":""},{"q":"","a":""},{"q":"","a":""}]}`;
  const r = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':ANTHROPIC,'anthropic-version':'2023-06-01','Content-Type':'application/json'},body:JSON.stringify({model:'claude-opus-4-8',max_tokens:1800,system:sys,messages:[{role:'user',content:user}]})});
  const b = await r.json(); if(!r.ok) throw new Error('Claude '+r.status+' '+JSON.stringify(b).slice(0,120));
  const t=(b.content||[]).filter(x=>x.type==='text').map(x=>x.text).join('');
  const d=JSON.parse(t.slice(t.indexOf('{'),t.lastIndexOf('}')+1));
  svc.cost_table=`<table class="cost-table"><thead><tr><th>Tier</th><th>Investment Range</th><th>What's Included</th></tr></thead><tbody>${d.tiers.map(x=>`<tr><td><strong>${esc(x.tier)}</strong></td><td>${esc(x.range)}</td><td>${esc(x.includes)}</td></tr>`).join('')}</tbody></table><p class="cost-breakdown">Where the investment goes: ${d.breakdown.map(x=>`${esc(x.cat)} <strong>${esc(x.pct)}</strong>`).join(' &middot; ')}.</p>`;
  svc.cost_drivers=`<p>${esc(d.drivers)}</p>`;
  svc.faq=d.faq.map(f=>`<div class="faq-item"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join('');
  svc.faq_schema=`<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"FAQPage","mainEntity":d.faq.map(f=>({"@type":"Question","name":f.q,"acceptedAnswer":{"@type":"Answer","text":f.a}}))})}</script>`;
}

// fill any missing cost content
let filled=0;
for(const s of services){ if(!s.cost_table){ await genCost(s); filled++; } }
if(filled) await writeFile(R('data/fl-services.json'), JSON.stringify(services,null,2));

const siblings = (curSlug, city) => services.filter(s=>s.slug!==curSlug).map(s=>`<a href="/${s.slug}-${city.slug}">${esc(s.title)} in ${esc(city.name)}</a>`).join('');
const nearby = (svc, curCity) => cities.filter(c=>c.slug!==curCity.slug).slice(0,6).map(c=>`<a href="/${svc.slug}-${c.slug}">${esc(svc.title)} in ${esc(c.name)}</a>`).join('');

let n=0; const urls=[];
for(const s of services) for(const c of cities){
  const html = template
    .replaceAll('{{SERVICE_SLUG}}',s.slug).replaceAll('{{SERVICE_TITLE}}',s.title).replaceAll('{{SERVICE_H1_NOUN}}',s.h1_noun)
    .replaceAll('{{SERVICE_INTENT}}',s.intent).replaceAll('{{SERVICE_SCOPE}}',s.scope).replaceAll('{{SERVICE_TRADES}}',s.trades).replaceAll('{{SERVICE_BRANDS}}',s.brands)
    .replaceAll('{{SERVICE_COST_TABLE}}',s.cost_table||'').replaceAll('{{SERVICE_COST_DRIVERS}}',s.cost_drivers||'').replaceAll('{{SERVICE_FAQ}}',s.faq||'').replaceAll('{{SERVICE_FAQ_SCHEMA}}',s.faq_schema||'')
    .replaceAll('{{CITY_SLUG}}',c.slug).replaceAll('{{CITY_NAME}}',c.name).replaceAll('{{CITY_COAST}}',c.coast).replaceAll('{{CITY_PRICE_NOTE}}',c.price_note).replaceAll('{{CITY_SIGNATURE}}',c.signature)
    .replace('{{SIBLING_LINKS}}',siblings(s.slug,c)).replace('{{NEARBY_LINKS}}',nearby(s,c))
    .replaceAll('{{HEADER}}',headerHtml).replaceAll('{{FOOTER}}',footerHtml);
  await writeFile(R(`${s.slug}-${c.slug}.html`), html);
  urls.push(`${BASE}/${s.slug}-${c.slug}`); n++;
}

// merge into sitemap.xml (dedupe)
let sm = await readFile(R('sitemap.xml'),'utf8');
const rows = urls.filter(u=>!sm.includes(`<loc>${u}</loc>`)).map(u=>`  <url><loc>${u}</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>`).join('\n');
if(rows) sm = sm.replace('</urlset>', rows+'\n</urlset>');
await writeFile(R('sitemap.xml'), sm);
console.log(`Generated ${n} FL service-city pages (${services.length} services × ${cities.length} cities). Cost content generated for ${filled} new services.`);
