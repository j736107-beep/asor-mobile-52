// m52: automatyczny audyt układu mobilnego – każdy moduł (i każda zakładka) przy szerokości W (domyślnie 412):
// brak poziomego przewijania (dokument, #main, iframe), przyciski i pola ≥48 px, pozostałe elementy klikalne (linki, summary, etykiety checkbox/radio) ≥44 px, tekst ≥14 px, pola tekstowe ≥16 px (brak zoomu przy focusie).
const pp=require('puppeteer-core');
const BASE=process.env.BASE||'http://localhost:8781/',W=+(process.env.W||412),H=+(process.env.H||915),VERB=process.env.VERB||'';
const sleep=t=>new Promise(r=>setTimeout(r,t));
let n=0,fail=0;const rec=(name,ok,info)=>{n++;if(!ok)fail++;console.log((ok?'PASS ':'FAIL ')+name+(ok?'':' :: '+String(info||'').slice(0,VERB?20000:1500)));};
function audit(){ // wykonywane w kontekście dokumentu (głównego lub iframe)
  const vw=document.documentElement.clientWidth,out={hs:[],small:[],font:[],inp:[]};
  const vis=e=>{const r=e.getBoundingClientRect();if(r.width<1||r.height<1)return null;const s=getComputedStyle(e);if(s.visibility==='hidden'||s.display==='none'||+s.opacity===0)return null;return r;};
  const de=document.documentElement;if(de.scrollWidth>de.clientWidth+1)out.hs.push('document '+de.scrollWidth+'>'+de.clientWidth);
  const desc=e=>(e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/).slice(0,2).join('.'):'')+' „'+(e.innerText||e.value||e.getAttribute('aria-label')||'').trim().slice(0,30)+'”');
  for(const e of document.querySelectorAll('body *')){const s=getComputedStyle(e);if(/(auto|scroll)/.test(s.overflowX)&&e.scrollWidth>e.clientWidth+2&&vis(e)&&!e.closest('#printArea'))out.hs.push('scroll-x '+desc(e)+' '+e.scrollWidth+'>'+e.clientWidth);}
  const inMain=e=>!e.closest('#printArea')&&!e.closest('#sidebar:not(.m-open)')&&!e.closest('[hidden]');
  for(const e of document.querySelectorAll('button,a[href],input:not([type=hidden]),select,textarea,summary,[role=button],[onclick]')){
    if(!inMain(e))continue;const r=vis(e);if(!r)continue;if(e.closest('.m-exempt'))continue;
    let t=e;if((e.type==='checkbox'||e.type==='radio')){const l=e.closest('label')||(e.id&&document.querySelector('label[for="'+e.id+'"]'));if(l)t=l;}
    if(e.tagName==='A'&&e.closest('p,li,td,.mut,small')&&!e.closest('nav')){const pr=e.parentElement.getBoundingClientRect();if(e.innerText&&pr.width>r.width*1.5)continue;} // link w tekście (WCAG 2.5.8 – wyjątek inline)
    const rr=t.getBoundingClientRect();const bar=e.closest('#mNav')||(e.closest('#top')&&!e.closest('#pbar'));
    if(bar){if(rr.width<44||rr.height<18)out.small.push('[pasek] '+desc(e)+' '+Math.round(rr.width)+'×'+Math.round(rr.height));} // t69u: paski niskie (≤38/≤19 px) – wyjątek: obszar ≥44 px szerokości, ≥18 px wysokości
    else{const need=(t===e&&/^(BUTTON|SELECT|TEXTAREA|INPUT)$/.test(e.tagName)&&e.type!=='range')?48:44;if(rr.height<need-0.5)out.small.push(desc(e)+' '+Math.round(rr.width)+'×'+Math.round(rr.height));
    }
    if(rr.right>vw+1)out.hs.push('poza ekranem '+desc(e)+' right='+Math.round(rr.right));
    if((e.tagName==='INPUT'&&!/checkbox|radio|range|button|submit|color|file/.test(e.type))||e.tagName==='SELECT'||e.tagName==='TEXTAREA'){if(parseFloat(getComputedStyle(e).fontSize)<16)out.inp.push(desc(e)+' '+getComputedStyle(e).fontSize);}
  }
  const tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let nd;const seen=new Set();
  while(nd=tw.nextNode()){if(!nd.nodeValue.trim())continue;const e=nd.parentElement;if(!e||seen.has(e))continue;seen.add(e);if(!inMain(e)||e.closest('svg,script,style,noscript,option'))continue;const r=vis(e);if(!r)continue;const fs=parseFloat(getComputedStyle(e).fontSize);if(fs<14-0.01)out.font.push(desc(e)+' '+fs+'px');}
  if(/Narzędzie pomocnicze/.test(document.body.innerText))out.font.push('t69u: widoczny dopisek „Narzędzie pomocnicze…”');
  return out;
}
(async()=>{
  const br=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await br.newPage();await page.setViewport({width:W,height:H,isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('dialog',d=>d.accept());
  await page.goto(BASE+'?t='+Date.now(),{waitUntil:'networkidle2',timeout:60000});
  await page.evaluate(async()=>{try{for(const r of await navigator.serviceWorker.getRegistrations())await r.unregister();for(const k of await caches.keys())await caches.delete(k);}catch(e){}localStorage.clear();sessionStorage.clear();});
  await page.goto(BASE+'?t='+Date.now(),{waitUntil:'networkidle2',timeout:60000});await page.evaluate(()=>{window.print=()=>{};});await sleep(500);
  await page.evaluate(()=>{for(const [id,v] of Object.entries({pw:'80',pa:'60',ph:'175',pc:'1'})){const e=document.getElementById(id);if(e){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}}});
  const mods=await page.evaluate(()=>SKM.list.filter(m=>!m.sep&&m.id).map(m=>({id:m.id,name:m.name,frame:!!m.frame})));
  const tot={hs:0,small:0,font:0,inp:0};
  const one=async(label,frame)=>{let r=await page.evaluate(audit.toString().replace(/^function audit\(\)/,'(function()')+')()');
    for(const fh of await page.$$('#main iframe')){const fr=await fh.contentFrame();if(fr){try{await fr.waitForSelector('body',{timeout:5000});const r2=await fr.evaluate(audit.toString().replace(/^function audit\(\)/,'(function()')+')()');for(const k in r2)r[k]=r[k].concat(r2[k].map(x=>'[iframe] '+x));}catch(e){r.hs.push('iframe err '+e.message);}}}
    const bad=r.hs.length+r.small.length+r.font.length+r.inp.length;for(const k in tot)tot[k]+=r[k].length;
    rec(`${W}px ${label}: brak poziomego przewijania, przyciski/pola ≥48 px, inne klikalne ≥44 px, tekst ≥14 px, czcionka pól ≥16 px`,bad===0,JSON.stringify({hs:r.hs.slice(0,8),small:r.small.slice(0,VERB?400:12),font:r.font.slice(0,VERB?400:10),inp:r.inp.slice(0,8),n:[r.hs.length,r.small.length,r.font.length,r.inp.length]}));};
  await one('pasek/nagłówek + pulpit',false);
  for(const m of mods){await page.evaluate(id=>SKS.show(id),m.id);await sleep(m.frame?1800:700);await one(m.id+' ('+m.name+')',m.frame);
    const tabs=m.frame?[]:await page.evaluate(()=>[...document.querySelectorAll('#main .tabs button, #main [data-clin-tab]')].map((b,i)=>i));
    for(const i of tabs.slice(1,12)){await page.evaluate(i=>{const b=[...document.querySelectorAll('#main .tabs button, #main [data-clin-tab]')][i];b&&b.click();},i);await sleep(400);await one(m.id+' zakładka '+(i+1),false);}}
  rec('Brak błędów JS',errs.length===0,errs.join(' | '));
  console.log('SUMA naruszeń: '+JSON.stringify(tot));
  console.log(fail?`FAILS: ${fail}/${n}`:`ALL PASS ${n}/${n}`);await br.close();process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
