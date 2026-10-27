import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require(process.argv[2]||'sharp');
const original='artwork-originals',out='dist/assets/optimized';
await fs.mkdir(original,{recursive:true});await fs.mkdir(out,{recursive:true});
const files=(await fs.readdir('dist/assets')).filter(f=>f.startsWith('norda-')&&f.endsWith('.png'));
for(const file of files){const saved=path.join(original,file);try{await fs.access(saved)}catch{await fs.copyFile('dist/assets/'+file,saved)}}
let originalBytes=0,deliveryBytes=0;
for(const file of (await fs.readdir(original)).filter(f=>f.endsWith('.png'))){
 const src=path.join(original,file),base=file.slice(0,-4);originalBytes+=(await fs.stat(src)).size;
 const main=out+'/'+base+'.webp',small=out+'/'+base+'-sm.webp';
 await sharp(src).resize({width:base==='norda-logo'?480:1200,withoutEnlargement:true}).webp({quality:86,alphaQuality:100,effort:5}).toFile(main);
 if(base!=='norda-logo')await sharp(src).resize({width:600,withoutEnlargement:true}).webp({quality:82,alphaQuality:100,effort:5}).toFile(small);
 deliveryBytes+=(await fs.stat(main)).size;
}
console.log(JSON.stringify({originalBytes,mainWebpBytes:deliveryBytes,saving:((1-deliveryBytes/originalBytes)*100).toFixed(1)+'%'}));
