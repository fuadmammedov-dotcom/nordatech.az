import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {categories,languages,company} from './site-content.mjs';
import {imageFor} from './category-media.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),dist=path.join(root,'dist');
const pages=JSON.parse(await fs.readFile(path.join(root,'generated-pages.json'),'utf8'));
let checks=0;const issues=[];
const check=(ok,message)=>{checks++;if(!ok)issues.push(message)};
check(categories.length===19,'Expected 19 categories');
check(categories.reduce((n,c)=>n+c.products.length,0)===114,'Expected 114 product groups');
check(new Set(categories.map(c=>c.id)).size===categories.length,'Duplicate category IDs');
check(new Set(categories.map(c=>imageFor(c.id))).size===categories.length,'Each category must have a distinct image');
const imageHashes=await Promise.all(categories.map(async c=>createHash('sha256').update(await fs.readFile(path.join(dist,imageFor(c.id)))).digest('hex')));
check(new Set(imageHashes).size===categories.length,'Category image files must not contain duplicated artwork');
check(pages.length===102&&new Set(pages).size===102,'Expected 102 unique pages');
const uiKeys=Object.keys(languages.az.ui).sort().join('|');
for(const l of Object.keys(languages))check(Object.keys(languages[l].ui).sort().join('|')===uiKeys,`${l}: interface keys differ`);
for(const c of categories)for(const l of Object.keys(languages))check(!!c.name[l]&&!!c.intro[l]&&c.products.every(p=>!!p[l]),`${c.id}/${l}: missing copy`);
const htmls=new Map();for(const file of pages)htmls.set(file,await fs.readFile(path.join(dist,file),'utf8'));
const idsFor=html=>[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
for(const [file,html]of htmls){
 const ids=idsFor(html),language=html.match(/<html lang="([^"]+)"/)?.[1];
 check(new Set(ids).size===ids.length,`${file}: duplicate IDs`);
 check((html.match(/<h1\b/g)||[]).length===1,`${file}: primary heading`);
 check(!!languages[language],`${file}: unknown language`);
 check(!html.includes('[object Object]')&&!html.includes('>undefined<'),`${file}: unresolved content`);
 for(const m of html.matchAll(/\b(?:aria-labelledby|aria-controls)="([^"]+)"/g))check(m[1].split(/\s+/).every(x=>ids.includes(x)),`${file}: broken ARIA reference ${m[1]}`);
 for(const m of html.matchAll(/<use\b[^>]*href="#([^"]+)"/g))check(ids.includes(m[1]),`${file}: missing icon ${m[1]}`);
 for(const m of html.matchAll(/<a\b([^>]*)>/g)){
  const attrs=m[1],href=attrs.match(/\bhref="([^"]+)"/)?.[1];check(!!href,`${file}: link without href`);
  if(attrs.includes('target="_blank"'))check(/rel="[^"]*noopener/.test(attrs),`${file}: external window protection`);
  if(!href)continue;
  if(href.startsWith('https://wa.me/'))check(href===company.whatsapp,`${file}: WhatsApp number`);
  if(/^(https?:|mailto:|tel:)/.test(href))continue;
  const url=new URL(href,'https://verify.local/'+file);
  const target=url.pathname.slice(1)||'index.html';
  check(htmls.has(target),`${file}: missing linked page ${href}`);
  if(url.hash&&htmls.has(target))check(idsFor(htmls.get(target)).includes(decodeURIComponent(url.hash.slice(1))),`${file}: missing fragment ${href}`);
 }
 for(const m of html.matchAll(/<(?:script|img|link)\b[^>]*\b(?:src|href)="([^"]+)"[^>]*>/g)){
  const ref=m[1];if(/^(https?:|#)/.test(ref))continue;
  const url=new URL(ref,'https://verify.local/'+file),absolute=path.join(dist,url.pathname.slice(1));
  try{await fs.access(absolute);check(true,'')}catch{check(false,`${file}: missing resource ${ref}`)}
  if(url.searchParams.has('v')){const hash=createHash('sha256').update(await fs.readFile(absolute)).digest('hex').slice(0,12);check(url.searchParams.get('v')===hash,`${file}: stale asset hash ${ref}`)}
 }
 for(const m of html.matchAll(/<img\b([^>]+)>/g))check(/\balt="[^"]*"/.test(m[1])&&/\bwidth="\d+"/.test(m[1])&&/\bheight="\d+"/.test(m[1]),`${file}: image dimensions or alt`);
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 check(schema.email===company.email&&schema.telephone===company.phone,`${file}: contact schema`);
 const payload=JSON.parse(html.match(/<script type="application\/json" id="site-data">([\s\S]*?)<\/script>/)[1]);
 check(payload.language===language&&payload.catalog.length===19,`${file}: runtime data`);
 check(payload.catalog.reduce((n,c)=>n+c.products.length,0)===114,`${file}: runtime products`);
}
console.log(JSON.stringify({pages:pages.length,categories:categories.length,productGroups:114,checks,passed:checks-issues.length,issues},null,2));
if(issues.length)process.exitCode=1;
