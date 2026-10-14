import {plumages} from './i18n.js';
export function normalize(value){return String(value??'').normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase('en').replace(/[’']/g,'');}
export function displayForm(entry,lang){return entry.form?(plumages[lang]||plumages.en)[entry.form]:'';}
export function displayName(data,entry,lang){return data.names[lang]?.[entry.dex]||data.names.en[entry.dex];}
export function prepareEntries(data,regions){
 return data.entries.map(entry=>{
  const aliases=[];
  for(const lang of data.languages){
   const name=displayName(data,entry,lang);aliases.push(name);
   if(entry.form){const form=displayForm(entry,lang);aliases.push(form,`${name} ${form}`);}
   if(entry.region!=='Base'){
    const reg=regions[lang][entry.region];aliases.push(`${reg} ${name}`,`${reg.replace(/\s/g,'')}${name}`,`${name}${reg.replace(/\s/g,'')}`);
   }
  }
  aliases.push(entry.region,String(entry.dex),String(entry.dex).padStart(4,'0'));
  return {...entry,search:normalize(aliases.join(' '))};
 });
}
export function filterEntries(entries,state,data){
 const query=normalize(state.q).trim();
 const number=/^#?\d{1,4}$/.test(query)?Number(query.replace('#','')):null;
 const tokens=query.split(/\s+/).filter(Boolean);
 const filtered=entries.filter(e=>{
  if(number!==null?e.dex!==number:!tokens.every(t=>e.search.includes(t)))return false;
  if(state.available==='yes'&&!e.available||state.available==='no'&&e.available)return false;
  if(state.folder&&!e.folders.some(p=>p.split('/').at(-1)===state.folder))return false;
  if(state.go==='yes'&&!e.go||state.go==='no'&&e.go)return false;
  if(state.home==='yes'&&e.home!==true||state.home==='no'&&e.home!==false||state.home==='na'&&e.home!==null)return false;
  return !state.region||e.region===state.region;
 });
 if(state.sort==='name'){
  const collator=new Intl.Collator(state.lang,{numeric:true,sensitivity:'base'});
  filtered.sort((a,b)=>collator.compare(displayName(data,a,state.lang),displayName(data,b,state.lang))||a.dex-b.dex);
 }
 return filtered;
}
