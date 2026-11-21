// m52: wersja MOBILNA – manifest, SW asor-m52, magazyn m52:, nagłówek kompaktowy, chip/panel pacjenta, dolna nawigacja, arkusz „Więcej”,
// tabele→karty, inputmode=decimal, druk z telefonu (window.print), brak poziomego przewijania; viewport 412×915 isMobile/hasTouch.
// SHOTS – katalog zrzutów (prefiks m1-, 412×915): pulpit, ZP, AF, zatrucia, SCORE2, pompy.
const pp=require('puppeteer-core');
const BASE=process.env.BASE||'http://localhost:8781/',SHOTS=process.env.SHOTS||'';
const sleep=t=>new Promise(r=>setTimeout(r,t));
let n=0,fail=0;const rec=(name,ok,info)=>{n++;if(!ok)fail++;console.log((ok?'PASS ':'FAIL ')+name+(ok?'':' :: '+String(info||'').slice(0,900)));};
(async()=>{
  const br=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await br.newPage();await page.setViewport({width:412,height:915,isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('dialog',d=>d.accept());
  await page.goto(BASE+'?t='+Date.now(),{waitUntil:'networkidle2',timeout:60000});
  await page.evaluate(async()=>{try{for(const r of await navigator.serviceWorker.getRegistrations())await r.unregister();for(const k of await caches.keys())await caches.delete(k);}catch(e){}localStorage.clear();sessionStorage.clear();});
  await page.goto(BASE+'?t='+Date.now(),{waitUntil:'networkidle2',timeout:60000});await sleep(600);
  const setP=o=>page.evaluate(o=>{for(const [id,v] of Object.entries(o)){const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}},o);
  const hs=()=>page.evaluate(()=>{const d=document.documentElement,m=document.getElementById('main');return d.scrollWidth<=d.clientWidth+1&&(!m||m.scrollWidth<=m.clientWidth+1);});
  const SHP=process.env.SHOTP||'m1-';const shot=async name=>{if(!SHOTS)return;await sleep(600);await page.screenshot({path:SHOTS.replace(/\/$/,'')+'/'+name.replace(/^m1-/,SHP)});};
  // manifest / SW / tytuł / meta
  const mf=await page.evaluate(()=>fetch('manifest.webmanifest?'+Date.now()).then(r=>r.json()));
  rec('Manifest: „Asystent SOR mobile”, start_url/scope ./, standalone, portrait',mf.name==='Asystent SOR mobile'&&mf.start_url==='./'&&mf.scope==='./'&&mf.display==='standalone'&&mf.orientation==='portrait',JSON.stringify(mf));
  const sw=await page.evaluate(()=>fetch('sw.js?'+Date.now()).then(r=>r.text()));
  rec('SW: cache asor-m52-*, czyści tylko własne cache (asor-m52), mobile.css/js w cache',/const C='asor-m52-\d+'/.test(sw)&&/indexOf\('asor-m52'\)===0/.test(sw)&&!/indexOf\('asor-v52'\)/.test(sw)&&/"mobile\.css"/.test(sw)&&/"mobile\.js"/.test(sw),sw.slice(0,60));
  const meta=await page.evaluate(()=>({t:document.title,vp:document.querySelector('meta[name=viewport]').content,top:document.getElementById('top').innerText,foot:(document.querySelector('.nav-foot')||{}).offsetHeight||0}));
  rec('Tytuł „Asystent SOR mobile”; t69u: w górnym pasku brak nazwy/wersji/daty, stopka menu ukryta; viewport-fit=cover, zoom dozwolony',meta.t==='Asystent SOR mobile'&&!/Asystent|wersja|5\.2|21\.11|Narzędzie/.test(meta.top)&&meta.foot===0&&/viewport-fit=cover/.test(meta.vp)&&!/user-scalable=no|maximum-scale=1/.test(meta.vp),JSON.stringify(meta));
  // magazyn m52:
  await setP({pw:'80',pa:'60',ph:'175',pc:'1'});await sleep(400);
  const st=await page.evaluate(()=>{const raw=localStorage.__raw;const ks=[];for(let i=0;i<raw.length;i++)ks.push(raw.key(i));return{pref:window.SK_PREFIX,ks};});
  rec('localStorage z prefiksem m52: (osobno od PC v52:)',st.pref==='m52:'&&st.ks.length>0&&st.ks.every(k=>k.indexOf('m52:')===0),JSON.stringify(st));
  // nagłówek kompaktowy, chip
  const hd=await page.evaluate(()=>{const h=document.getElementById('top');document.body.classList.remove('m-pt-open');return{h:h.getBoundingClientRect().height,chip:document.getElementById('mPtChip').textContent,pos:getComputedStyle(h).position,base:getComputedStyle(document.documentElement).fontSize};});
  rec('t70u: górny pasek ≤28 px (bez safe-area) przy zwiniętym panelu, jeden rząd, sticky, chip „60 l. · 80 kg”, czcionka bazowa 17 px',hd.h<=28&&hd.pos==='sticky'&&/60 l\./.test(hd.chip)&&/80 kg/.test(hd.chip)&&hd.base==='17px',JSON.stringify(hd));
  await page.tap('#mPtChip');await sleep(300);
  const po=await page.evaluate(()=>{const p=document.getElementById('pbar');const r=p.getBoundingClientRect();const pw=document.getElementById('pw').getBoundingClientRect();return{open:document.body.classList.contains('m-pt-open'),h:r.height,pwH:pw.height,fs:getComputedStyle(document.getElementById('pw')).fontSize};});
  rec('Dotknięcie chipu otwiera panel pacjenta; pole masy ≥48 px, czcionka ≥16 px',po.open&&po.h>100&&po.pwH>=48&&parseFloat(po.fs)>=16,JSON.stringify(po));
  await page.tap('[data-mnav="pt"]');await sleep(300);rec('„Pacjent” w dolnym pasku zamyka panel',!(await page.evaluate(()=>document.body.classList.contains('m-pt-open'))),'');
  // dolna nawigacja
  const nv=await page.evaluate(()=>{const n=document.getElementById('mNav');const r=n.getBoundingClientRect();return{labels:[...n.querySelectorAll('button')].map(b=>b.getAttribute('aria-label')),vis:[...n.querySelectorAll('.m-lbl')].filter(s=>s.getBoundingClientRect().width>1).map(s=>s.textContent).join(''),h:r.height,bottom:Math.round(r.bottom),vh:innerHeight,minW:Math.min(...[...n.querySelectorAll('button')].map(b=>b.getBoundingClientRect().width))};});
  rec('t70u: dolna nawigacja ≤18 px (bez safe-area), same ikonki (aria-label: Moduły, Pulpit, Pacjent, Więcej – bez Drukuj), szerokie obszary ≥70 px, przy dolnej krawędzi',JSON.stringify(nv.labels)==='["Moduły","Pulpit","Pacjent","Więcej"]'&&nv.h<=18&&!nv.vis&&nv.minW>=70&&Math.abs(nv.bottom-nv.vh)<=2,JSON.stringify(nv));
  await shot('m1-pulpit-412x915.png');
  await page.tap('[data-mnav="mods"]');await sleep(400);
  const sb=await page.evaluate(()=>{const s=document.getElementById('sidebar');const r=s.getBoundingClientRect();return{open:document.body.classList.contains('nav-open'),w:r.width,vis:getComputedStyle(s).display!=='none'};});
  rec('„Moduły” otwiera pełnoekranowe menu modułów',sb.open&&sb.vis&&sb.w>=400,JSON.stringify(sb));
  await page.evaluate(()=>{const b=[...document.querySelectorAll('#side button')].find(b=>/^.*Zatrucia/.test(b.textContent));b.click();});await sleep(900);
  rec('Wybór modułu z menu zamyka menu i otwiera moduł (Zatrucia)',await page.evaluate(()=>!document.body.classList.contains('nav-open')&&/Zatrucia/.test(document.querySelector('#main h2').textContent)),'');
  // arkusz „Więcej”
  await page.tap('[data-mnav="more"]');await sleep(300);
  const mo=await page.evaluate(()=>{const m=document.getElementById('mMore');return{vis:getComputedStyle(m).display!=='none',ids:[...m.querySelectorAll('button')].map(b=>b.id)};});
  rec('„Więcej”: Źródła, Zapisz moduł, Następny pacjent; t70u: bez „Ten ekran” i „Raport zbiorczy” (druk usunięty)',mo.vis&&['srcMod','pinModule','nextPt'].every(i=>mo.ids.includes(i))&&!mo.ids.includes('printMod')&&!mo.ids.includes('printAll'),JSON.stringify(mo));
  await page.tap('[data-mnav="more"]');await sleep(200);
  // NAC → karty, inputmode
  await page.evaluate(()=>document.querySelector('[data-clin-tab="para"]').click());await sleep(500);
  await page.evaluate(()=>{for(const [id,v] of [['mg','12000'],['hrs','2']]){const e=document.querySelector('#main .clinical-form #'+id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}});await sleep(700);
  const nac=await page.evaluate(()=>{const s=[...document.querySelectorAll('#main .clinical-result')].find(x=>/NAC – schemat 3-workowy/.test(x.querySelector('h3').textContent));if(!s)return null;const t=s.querySelector('table');const tr=t.querySelector('tbody tr');const tds=[...tr.cells];return{cls:t.className,disp:getComputedStyle(tr).display,labels:tds.map(c=>c.getAttribute('data-label')),txt:tr.innerText.replace(/\s+/g,' '),w:t.getBoundingClientRect().width,mw:document.getElementById('main').clientWidth};});
  rec('NAC: tabela worków jako karty (data-label), bez poziomego przewijania, wartości jak w PC (320 ml/h)',!!nac&&/m-cards/.test(nac.cls)&&nac.disp==='block'&&nac.labels.includes('Prędkość')&&/320 ml\/h/.test(nac.txt)&&nac.w<=nac.mw,JSON.stringify(nac));
  const im=await page.evaluate(()=>{const a=[...document.querySelectorAll('#main input[type=number]')];return{n:a.length,bad:a.filter(i=>i.getAttribute('inputmode')!=='decimal').map(i=>i.id)};});
  rec('Pola liczbowe: inputmode=decimal',im.bad.length===0,JSON.stringify(im));
  rec('Zatrucia: brak poziomego przewijania',await hs(),'');
  await page.evaluate(()=>{document.querySelector('[data-clin-tab="alcohols"]').click();document.getElementById('main').scrollTop=0;});await sleep(500);await shot('m1-zatrucia-412x915.png');
  // ZP (Zapalenie płuc – antybiotykoterapia)
  await page.evaluate(()=>SKS.show('cap'));await sleep(900);await page.evaluate(()=>document.querySelector('[data-clin-tab="abx51"]').click());await sleep(1800);
  const zp=await page.evaluate(()=>{const f=document.getElementById('zpFrame');if(!f)return null;const d=f.contentDocument;return{sw:d.documentElement.scrollWidth,cw:d.documentElement.clientWidth,css:!!d.querySelector('link[href*="mobile.css"]')};});
  rec('ZP (iframe antybiotykoterapii): mobile.css, brak poziomego przewijania',!!zp&&zp.css&&zp.sw<=zp.cw+1,JSON.stringify(zp));
  await page.evaluate(()=>{const f=document.getElementById('zpFrame');f.scrollIntoView({block:'start'});});await shot('m1-zp-412x915.png');
  // AF
  await page.evaluate(()=>SKS.show('af'));await sleep(900);rec('AF: brak poziomego przewijania',await hs(),'');await shot('m1-af-412x915.png');
  // SCORE2
  await page.evaluate(()=>SKS.show('kalk'));await sleep(900);await page.evaluate(()=>document.querySelector('.kk-chip[data-c="score2hs"]').click());await sleep(500);
  const sc=await page.evaluate(()=>{const P=document.getElementById('kk-panel');P.scrollIntoView({block:'start'});const b=document.getElementById('kk-go');return{h:P.querySelector('h3').textContent,bh:b.getBoundingClientRect().height};});
  rec('SCORE2: panel kalkulatora, przycisk „Oblicz” ≥48 px, brak poziomego przewijania',/SCORE2/.test(sc.h)&&sc.bh>=48&&await hs(),JSON.stringify(sc));await shot('m1-score2-412x915.png');
  // Pompy
  await page.evaluate(()=>SKS.openPompa('noradrenalina_c80'));await sleep(2000);
  const pm=await page.evaluate(()=>{const f=document.querySelector('#main iframe');const d=f.contentDocument;return{sw:d.documentElement.scrollWidth,cw:d.documentElement.clientWidth,t:d.body.innerText.slice(0,200)};});
  rec('Pompy (noradrenalina 80 µg/ml): brak poziomego przewijania w module',pm.sw<=pm.cw+1&&/Noradrenalina/.test(pm.t),JSON.stringify(pm));await shot('m1-pompy-412x915.png');
  // t69u: dopisek „Narzędzie pomocnicze…” nie jest widoczny na ekranie (moduł, iframe pomp, Kalkulatory)
  const disc=[];for(const id of ['pompy','kalk','el','trop','dashboard']){await page.evaluate(id=>SKS.show(id),id);await sleep(1600);const t=await page.evaluate(()=>{let s=document.body.innerText;for(const f of document.querySelectorAll('#main iframe')){try{s+=f.contentDocument.body.innerText;}catch(e){}}return s;});if(/Narzędzie pomocnicze/.test(t))disc.push(id);}
  rec('t69u: brak „Narzędzie pomocnicze…” na ekranie (pompy, kalkulatory, elektrolity, troponina, pulpit)',disc.length===0,disc.join(','));
  // t70u: brak jakiejkolwiek funkcji drukowania na ekranie (wszystkie moduły + iframe)
  const prv=[];const mods=await page.evaluate(()=>SKM.list.filter(m=>!m.sep&&m.id).map(m=>m.id));
  for(const id of mods){await page.evaluate(id=>SKS.show(id),id);await sleep(900);
   const f=await page.evaluate(()=>{const chk=d=>[...d.querySelectorAll('button,a,[role=button]')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&/🖨|drukuj|wydruk|raport zbiorczy/i.test((e.textContent||'')+' '+(e.title||''))).map(e=>(e.id||e.className||e.tagName)+':'+(e.textContent||'').trim().slice(0,30));let r=chk(document);for(const fr of document.querySelectorAll('#main iframe')){try{r=r.concat(chk(fr.contentDocument).map(x=>'[iframe] '+x));}catch(e){}}return r;});
   if(f.length)prv.push(id+' → '+f.join(' | '));}
  rec('t70u: w żadnym module brak widocznego przycisku druku / raportu do druku; window.print wyłączone',prv.length===0&&await page.evaluate(()=>String(window.print).indexOf('native code')<0),prv.join(' ;; '));
  rec('Brak błędów JS',errs.length===0,errs.join(' | '));
  console.log(fail?`FAILS ${fail}/${n}`:`ALL PASS ${n}/${n}`);await br.close();process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
