import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {prepareEntries,filterEntries,displayName} from '../core.js';
import {translations,regions} from '../i18n.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(await fs.readFile(path.join(root,'data/catalog.json'),'utf8'));
const entries=prepareEntries(data,regions);
assert.equal(crypto.createHash('sha256').update(await fs.readFile(path.join(root,'downloads',data.collectionFilename))).digest('hex'),data.collectionSha256);
await fs.access(path.join(root,'downloads/GoTracker_Catalog_EN.xlsx'));
assert.equal(entries.length,new Set(entries.map(e=>e.id)).size);
assert.deepEqual(Object.keys(translations).sort(),data.languages.toSorted());
for(const code of data.languages){assert.equal(data.names[code].length,1026);assert.ok(data.names[code].slice(1).every(Boolean));}
for(const e of entries){
 assert.equal(typeof e.available,'boolean');assert.equal(typeof e.go,'boolean');
 assert.ok([true,false,null].includes(e.home));assert.equal(e.available,e.folders.length>0);
 assert.ok(e.go||e.home===null);assert.ok(!e.available||e.go);
 assert.ok(e.folders.every(p=>/^GoTracker\/(SV|SS|BDSP|LZA)$/.test(p)));
 await fs.access(path.join(root,'assets/pokemon',e.id+'.png'));
}
const initial={lang:'en',q:'',available:'all',folder:'',go:'',home:'',region:'',sort:'dex'};
const search=(q,more={})=>filterEntries(entries,{...initial,q,...more},data);
assert.deepEqual(search('Glurak').map(e=>e.dex),[6]);
assert.deepEqual(search('ピカチュウ').map(e=>e.dex),[25]);
assert.deepEqual(search('피카츄').map(e=>e.dex),[25]);
assert.deepEqual(search('皮卡丘').map(e=>e.dex),[25]);
assert.deepEqual(search('#0025').map(e=>e.dex),[25]);
assert.deepEqual(search('mr mime').map(e=>e.dex),[122,122]);
assert.ok(search('Farfetchd').some(e=>e.dex===83));
assert.ok(search('Raichu Alola').every(e=>e.region==='Alola'));
for(const color of ['white','blue','yellow']){
 const result=search(`Squawkabilly ${color}`);
 assert.equal(result.length,1);assert.equal(result[0].form,color);
 assert.equal(result[0].available,true);assert.deepEqual(result[0].folders,['GoTracker/SV']);
}
assert.equal(search('Squawkabilly').length,4);
assert.ok(search('Squawkabilly blanco').some(e=>e.form==='white'));
const rotom=search('Rotom').find(e=>e.id==='0479-Base');
assert.equal(entries.filter(e=>e.id==='0479-Base').length,1);
assert.equal(rotom.available,true);assert.deepEqual(rotom.folders,['GoTracker/SV']);
assert.equal(search('zz_no_such_pokemon_zz').length,0);
assert.ok(search('',{available:'no',go:'yes',home:'yes'}).every(e=>!e.available&&e.go&&e.home));
for(const code of data.languages){
 const selected=search('',{lang:code,folder:'SV'});
 assert.ok(selected.every(e=>e.folders.includes('GoTracker/SV')));
 assert.equal(filterEntries(entries,{...initial,lang:code},data).length,entries.length);
 assert.ok(displayName(data,entries[0],code));
}
// One shared fact must affect every language view.
const copy=structuredClone(data),target=copy.entries.find(e=>e.id==='0001-Base');
target.available=false;target.folders=[];
const changed=prepareEntries(copy,regions);
for(const lang of data.languages)assert.ok(filterEntries(changed,{...initial,lang,available:'no'},copy).some(e=>e.id===target.id));
console.log(JSON.stringify({entries:entries.length,languages:data.languages.length,available:entries.filter(e=>e.available).length,missing:entries.filter(e=>!e.available).length,releasedTransferableMissing:search('',{available:'no',go:'yes',home:'yes'}).length,checks:'passed'}));
