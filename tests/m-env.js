// m52: środowisko MOBILNE dla testów e2e (node -r ./m-env.js test.js): każda strona puppeteer startuje jako telefon
// 412×915 CSS px (Samsung Galaxy S25 Ultra), isMobile + hasTouch. page.setViewport({width>430}) z testów PC → 412 (szerokości 360–430 bez zmian),
// wysokość z testu zachowana (zrzuty „wysokie”). Zmienna M_W pozwala uruchomić zestaw dla 360/430.
const W=+(process.env.M_W||412),H=915;
const M={width:W,height:H,isMobile:true,hasTouch:true,deviceScaleFactor:1};
const fix=v=>Object.assign({},M,v||{},{width:(v&&v.width&&v.width<=430)?v.width:W,isMobile:true,hasTouch:true,deviceScaleFactor:(v&&v.deviceScaleFactor)||1});
function patchPage(p){if(p.__m52)return p;p.__m52=1;const sv=p.setViewport.bind(p);p.setViewport=v=>sv(fix(v));return p;}
function patchBrowser(b){if(b.__m52)return b;b.__m52=1;const np=b.newPage.bind(b);b.newPage=async(...a)=>{const p=await np(...a);patchPage(p);await p.setViewport(M);return p;};
 const pg=b.pages.bind(b);b.pages=async()=>(await pg()).map(patchPage);
 if(b.createBrowserContext){const cc=b.createBrowserContext.bind(b);b.createBrowserContext=async(...a)=>{const c=await cc(...a);const n2=c.newPage.bind(c);c.newPage=async()=>{const p=await n2();patchPage(p);await p.setViewport(M);return p;};return c;};}
 return b;}
for(const name of ['puppeteer-core','puppeteer']){try{const pp=require(name);const L=pp.launch.bind(pp);pp.launch=async(o)=>patchBrowser(await L(Object.assign({},o,{defaultViewport:M})));}catch(e){}}
