import {displayName,displayForm,prepareEntries,filterEntries} from './core.js';
import {translations,regions} from './i18n.js';
const $=id=>document.getElementById(id),PAGE_SIZE=60;
const defaults={lang:'en',q:'',available:'all',folder:'',go:'',home:'',region:'',sort:'dex',page:1};
let data,entries,state={...defaults},toastTimer;
const choices={available:['all','yes','no'],folder:['','SV','SS','BDSP','LZA','LGPE'],go:['','yes','no'],home:['','yes','no','na'],region:['','Base','Alola','Galar','Hisui','Paldea'],sort:['dex','name']};
const t=key=>translations[state.lang][key]||translations.en[key]||key;
function format(key,values){return t(key).replace(/\{(\w+)\}/g,(_,k)=>values[k]??'');}
function readLocation(){
 const params=new URLSearchParams(location.search);let saved='en';
 try{saved=localStorage.getItem('gotracker-language')||'en';}catch{}
 const lang=params.get('lang')||saved;
 state={...defaults,lang:translations[lang]?lang:'en',q:(params.get('q')||'').slice(0,150),page:Math.max(1,Number.parseInt(params.get('page'),10)||1)};
 for(const [key,values] of Object.entries(choices)){const value=params.get(key);if(values.includes(value))state[key]=value;}
}
function updateLocation(){
 const params=new URLSearchParams();
 for(const [key,value] of Object.entries(state))if(value!==defaults[key]&&value!=='')params.set(key,String(value));
 history.replaceState(null,'',location.pathname+(params.size?'?'+params:'')+location.hash);
}
function element(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
function badge(value,kind=''){const key=value===null?'na':value?'yes':'no';return element('span',`badge ${key==='na'?'':key==='yes'?'yes':kind==='home'?'blocked':'no'}`,t(key));}
function updateTexts(){
 document.documentElement.lang=state.lang;
 document.title=`GoTracker — ${t('title')}`;
 for(const el of document.querySelectorAll('[data-i18n]'))el.textContent=t(el.dataset.i18n);
 $('search').placeholder=t('placeholder');$('language').setAttribute('aria-label',t('language'));
 $('filters').setAttribute('aria-label',t('sort'));$('results').setAttribute('aria-label',t('title'));
 document.querySelector('.download').setAttribute('aria-label',t('download'));
 for(const el of document.querySelectorAll('[data-region]'))el.textContent=regions[state.lang][el.dataset.region];
 const date=new Date(data.updated+'T12:00:00Z');
 $('updated').textContent=format('updated',{date:new Intl.DateTimeFormat(state.lang,{dateStyle:'medium',timeZone:'UTC'}).format(date)});
 $('available-total').textContent=new Intl.NumberFormat(state.lang).format(entries.filter(e=>e.available).length);
}
function syncControls(){
 for(const id of ['language','search','folder','go','home','region','sort'])$(id).value=id==='language'?state.lang:id==='search'?state.q:state[id];
 for(const button of $('availability').querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.value===state.available));
}
function render(){
 const filtered=filterEntries(entries,state,data),pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
 state.page=Math.min(pages,Math.max(1,state.page));
 const from=(state.page-1)*PAGE_SIZE,fragment=document.createDocumentFragment();
 for(const entry of filtered.slice(from,from+PAGE_SIZE)){
  const tr=element('tr');tr.dataset.id=entry.id;
  const dex=element('td','dex','#'+String(entry.dex).padStart(4,'0'));tr.append(dex);
  const monCell=element('td'),mon=element('div','mon'),img=element('img');
  img.src=`./assets/pokemon/${entry.id}.png`;img.alt='';img.width=56;img.height=56;img.loading='lazy';img.decoding='async';
  const name=displayName(data,entry,state.lang),nameBox=element('div');nameBox.append(element('span','mon-name',name));
  if(entry.form)nameBox.append(element('span','mon-sub',displayForm(entry,state.lang)));
  else if(entry.region!=='Base')nameBox.append(element('span','mon-sub',regions[state.lang][entry.region]));
  else if(state.lang!=='en'&&name!==data.names.en[entry.dex])nameBox.append(element('span','mon-sub',data.names.en[entry.dex]));
  mon.append(img,nameBox);monCell.append(mon);tr.append(monCell);
  const availableCell=element('td');availableCell.dataset.label=t('inCollection');
  availableCell.append(element('span',`badge ${entry.available?'yes':'no'}`,t(entry.available?'available':'missing')));tr.append(availableCell);
  const folder=element('td','folder');folder.dataset.label=t('zipFolder');
  if(entry.folders.length)for(const path of entry.folders)folder.append(element('div','',path));
  else folder.append(element('span','no-folder','—'));tr.append(folder);
  for(const [value,label,kind] of [[entry.go,'inGo','go'],[entry.home,'home','home']]){
   const cell=element('td');cell.dataset.label=t(label);cell.append(badge(value,kind));tr.append(cell);
  }
  fragment.append(tr);
 }
 $('rows').replaceChildren(fragment);$('empty').hidden=filtered.length>0;
 document.querySelector('table').hidden=filtered.length===0;
 $('result-count').textContent=format('resultCount',{first:filtered.length?from+1:0,last:Math.min(from+PAGE_SIZE,filtered.length),total:new Intl.NumberFormat(state.lang).format(filtered.length)});
 $('page-label').textContent=format('pageLabel',{page:state.page,pages});
 $('previous').disabled=state.page===1;$('next').disabled=state.page===pages;
 syncControls();updateLocation();
}
function reset(){state={...defaults,lang:state.lang};render();$('search').focus();}
function notify(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3000);}
async function start(){
 readLocation();
 try{
  const response=await fetch('./data/catalog.json',{cache:'no-cache'});if(!response.ok)throw Error(`HTTP ${response.status}`);
  data=await response.json();entries=prepareEntries(data,regions);
  updateTexts();render();
  for(const source of data.sources){const li=element('li'),link=element('a','',source.label);link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';li.append(link);$('sources').append(li);}
 }catch(error){console.error(error);$('result-count').textContent=t('loadingError');$('previous').disabled=true;$('next').disabled=true;return;}
 $('search').addEventListener('input',event=>{state.q=event.target.value;state.page=1;render();});
 $('language').addEventListener('change',event=>{state.lang=event.target.value;try{localStorage.setItem('gotracker-language',state.lang);}catch{}updateTexts();render();});
 $('availability').addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;state.available=button.dataset.value;state.page=1;render();});
 for(const key of ['folder','go','home','region','sort'])$(key).addEventListener('change',event=>{state[key]=event.target.value;state.page=1;render();});
 $('clear').addEventListener('click',reset);$('empty-reset').addEventListener('click',reset);
 for(const [id,delta] of [['previous',-1],['next',1]])$(id).addEventListener('click',()=>{state.page+=delta;render();$('results').scrollIntoView({block:'start'});});
 $('share').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);notify(t('copied'));}catch{notify(t('copyFailed'));}});
 window.addEventListener('popstate',()=>{readLocation();updateTexts();render();});
 document.addEventListener('keydown',event=>{if(event.key==='/'&&!/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)){event.preventDefault();$('search').focus();}});
}
start();
