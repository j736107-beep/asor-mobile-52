/* m52: warstwa MOBILNA – tylko układ/obsługa dotykiem. Nie zmienia obliczeń, dawek, danych ani treści wydruków.
   - pola liczbowe: inputmode=decimal; tabele (≥3 kolumny z nagłówkiem) → karty (data-label); minimalna czcionka 14 px;
   - w oknie głównym: kompaktowy nagłówek z „chipem” pacjenta, zwijany panel pacjenta, dolna nawigacja, arkusz „Więcej”. */
(function(w,D){'use strict';if(w.__m52)return;w.__m52=1;
var TOP=(function(){try{return w.top===w;}catch(e){return false;}})();
function ready(f){D.readyState==='loading'?D.addEventListener('DOMContentLoaded',f):f();}
function txt(e){return (e&&e.textContent||'').replace(/\s+/g,' ').trim();}
function cardify(t){
 if(t.closest('#printArea')||t.closest('.m-nocards'))return;
 var rows=[].slice.call(t.rows);if(!rows.length)return;
 var head=null;
 if(t.tHead&&t.tHead.rows.length)head=t.tHead.rows[t.tHead.rows.length-1];
 else if(rows[0].cells.length&&[].every.call(rows[0].cells,function(c){return c.tagName==='TH';}))head=rows[0];
 var ncol=0;rows.forEach(function(r){var n=0;[].forEach.call(r.cells,function(c){n+=c.colSpan||1;});if(n>ncol)ncol=n;});
 if(!head||ncol<3){t.classList.add('m-tbl2');t.classList.remove('m-cards');return;}
 var labels=[];[].forEach.call(head.cells,function(c){for(var k=0;k<(c.colSpan||1);k++)labels.push(txt(c));});
 t.classList.add('m-cards');head.classList.add('m-head');
 rows.forEach(function(r){if(r===head||(t.tHead&&r.parentNode===t.tHead))return;
  var cells=[].slice.call(r.cells);
  if(cells.length===1&&(cells[0].colSpan||1)>=ncol-0){r.classList.add('m-sect');cells[0].classList.add('m-title');return;}
  var i=0;cells.forEach(function(c,j){if(j===0&&!c.hasAttribute('data-label')){c.classList.add('m-title');c.setAttribute('data-label','');}
   else if(!c.hasAttribute('data-label'))c.setAttribute('data-label',labels[i]||'');i+=c.colSpan||1;});});
}
function minFont(root){
 var tw=D.createTreeWalker(root,NodeFilter.SHOW_TEXT),nd,seen=[];
 while((nd=tw.nextNode())){if(!nd.nodeValue.trim())continue;var e=nd.parentElement;if(!e||e.__mf||seen.indexOf(e)>=0)continue;seen.push(e);
  if(e.closest('#printArea,svg,script,style,option'))continue;var fs=parseFloat(w.getComputedStyle(e).fontSize);
  if(fs&&fs<14){e.style.setProperty('font-size','14px','important');e.__mf=1;}}
}
// t69u: bez dopisku „Narzędzie pomocnicze…” na ekranie wersji mobilnej (wydruki A4 bez zmian – #printArea i szablony druku pomijane).
var DISC_RE=/Narzędzie pomocnicze(?:[,:]?\s*[–—-]?\s*niecertyfikowane)?[^.]*(?:\.|$)\s*/;
function noDisc(root){
 [].forEach.call(root.querySelectorAll('.disc,.kk-disc,footer,.sub'),function(e){if(!e.closest('#printArea')&&/^\s*Narzędzie pomocnicze/.test(e.textContent))e.classList.add('m-disc-hide');});
 var tw=D.createTreeWalker(root,NodeFilter.SHOW_TEXT),nd,list=[];while((nd=tw.nextNode())){if(nd.nodeValue.indexOf('Narzędzie pomocnicze')>=0)list.push(nd);}
 list.forEach(function(n){var e=n.parentElement;if(!e||e.closest('#printArea,script,style,[data-print],.print-only,.m-disc-hide'))return;
  n.nodeValue=n.nodeValue.replace(DISC_RE,'');
  if(!n.nodeValue.trim()&&(e.tagName==='B'||e.tagName==='STRONG')&&!e.textContent.trim())e.remove();});
}
function enhance(){var root=D.body;if(!root)return;noDisc(root);
 [].forEach.call(D.querySelectorAll('input[type=number]:not([inputmode])'),function(i){i.setAttribute('inputmode','decimal');});
 [].forEach.call(D.querySelectorAll('table'),function(t){if(!t.__m52||t.querySelector('td:not([data-label]),th:not([data-label])')){t.__m52=1;cardify(t);}});
 var m=TOP?(D.getElementById('main')||root):root;minFont(m);if(TOP){var s=D.getElementById('sidebar');if(s)minFont(s);var tp=D.getElementById('top');if(tp)minFont(tp);}
}
var pend=0;function sched(){if(pend)return;pend=1;(w.requestAnimationFrame||setTimeout)(function(){pend=0;try{enhance();}catch(e){}});}
ready(function(){
 D.documentElement.classList.add('m52');if(TOP)D.documentElement.classList.add('m52-top');enhance();
 new MutationObserver(sched).observe(D.body,{childList:true,subtree:true});
 if(!TOP)return;
 var top=D.getElementById('top'),pbar=D.getElementById('pbar');if(!top)return;
 // chip pacjenta (podsumowanie) – otwiera/zamyka panel pacjenta
 var chip=D.createElement('button');chip.id='mPtChip';chip.type='button';chip.setAttribute('aria-controls','pbar');
 var lamp=D.getElementById('lamp');top.insertBefore(chip,lamp||null);
 function val(id){var e=D.getElementById(id);return e&&e.value?e.value.trim():'';}
 function upd(){var wv=val('pw'),a=val('pa'),cr=txt(D.getElementById('pcr'));var p=[];
  if(a)p.push(a+' l.');if(wv)p.push(wv+' kg');if(cr&&!/—/.test(cr))p.push(cr.replace(/\s*\(.*\)/,''));
  chip.textContent='👤 '+(p.length?p.join(' · '):'Pacjent: wpisz dane');chip.classList.toggle('empty',!wv);
  chip.setAttribute('aria-expanded',String(D.body.classList.contains('m-pt-open')));}
 function setPt(o){D.body.classList.toggle('m-pt-open',o);try{localStorage.setItem('m_pt_open',o?'1':'0');}catch(e){}upd();nb('pt',o);}
 chip.onclick=function(){setPt(!D.body.classList.contains('m-pt-open'));};
 if(pbar){pbar.addEventListener('input',upd);pbar.addEventListener('change',upd);pbar.addEventListener('click',function(){setTimeout(upd,50);});}
 setInterval(upd,1500);
 // dolna nawigacja
 var nav=D.createElement('nav');nav.id='mNav';nav.setAttribute('aria-label','Nawigacja');
 var items=[['mods','☰','Moduły'],['home','⌂','Pulpit'],['pt','👤','Pacjent'],['print','🖨','Drukuj'],['more','⋯','Więcej']];
 nav.innerHTML=items.map(function(i){return '<button type="button" data-mnav="'+i[0]+'" aria-expanded="false" aria-label="'+i[2]+'" title="'+i[2]+'"><i aria-hidden="true">'+i[1]+'</i><span class="m-lbl">'+i[2]+'</span></button>';}).join('');
 var wrap=D.getElementById('wrap');D.body.insertBefore(nav,wrap?wrap.nextSibling:null);
 function nb(k,o){var b=nav.querySelector('[data-mnav="'+k+'"]');if(b)b.setAttribute('aria-expanded',String(!!o));}
 // arkusz „Więcej”: istniejące przyciski (te same obsługi zdarzeń) przeniesione z nagłówka
 var more=D.createElement('div');more.id='mMore';more.setAttribute('role','dialog');more.setAttribute('aria-label','Więcej');more.innerHTML='<h4>Więcej</h4>';
 ['printMod','srcMod','printAll','pinModule','nextPt'].forEach(function(id){var b=D.getElementById(id);if(b)more.appendChild(b);});
 D.body.insertBefore(more,nav);
 function closeAll(){D.body.classList.remove('m-more-open');nb('more',false);if(D.body.classList.contains('nav-open')){D.body.classList.remove('nav-open');}nb('mods',false);}
 more.addEventListener('click',function(e){if(e.target.closest('button'))setTimeout(function(){D.body.classList.remove('m-more-open');nb('more',false);},0);});
 nav.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var k=b.getAttribute('data-mnav');
  if(k==='mods'){var o=!D.body.classList.contains('nav-open');D.body.classList.remove('m-more-open');nb('more',false);D.body.classList.toggle('nav-open',o);nb('mods',o);if(o){var s=D.getElementById('moduleSearch');}}
  else if(k==='home'){closeAll();if(w.SKS&&SKS.show)SKS.show('dashboard');}
  else if(k==='pt'){closeAll();setPt(!D.body.classList.contains('m-pt-open'));}
  else if(k==='print'){closeAll();var p=D.getElementById('skPrint')||D.getElementById('printMod');if(p)p.click();}
  else if(k==='more'){var o2=!D.body.classList.contains('m-more-open');D.body.classList.remove('nav-open');nb('mods',false);D.body.classList.toggle('m-more-open',o2);nb('more',o2);}
 });
 var side=D.getElementById('side');if(side)side.addEventListener('click',function(e){if(e.target.closest('button'))setTimeout(function(){nb('mods',D.body.classList.contains('nav-open'));},0);});
 var lastMod;function curMod(){try{return localStorage.getItem('sk_mod');}catch(e){return null;}}lastMod=curMod();
 function modChk(){var m=curMod();if(m!==lastMod){lastMod=m;closeAll();var mm=D.getElementById('main');if(mm)mm.scrollTop=0;if(D.body.classList.contains('m-pt-open'))setPt(false);}}
 new MutationObserver(modChk).observe(D.getElementById('main')||D.body,{childList:true});setInterval(modChk,500);
 var openPt;try{openPt=localStorage.getItem('m_pt_open');}catch(e){}
 setPt(openPt==null?!val('pw'):openPt==='1');
});
})(window,document);
