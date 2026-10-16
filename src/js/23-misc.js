// Service worker, поиск, тема, недельные итоги
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
if(!NATIVE&&"serviceWorker" in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("sw.js").catch(()=>{});
else if(NATIVE&&navigator.serviceWorker)navigator.serviceWorker.getRegistrations().then(r=>r.forEach(x=>x.unregister())).catch(()=>{});
const nz=s=>String(s).toLowerCase().replace(/ё/g,"е"),W=s=>nz(s).split(/[\s,()%.\-]+/).filter(Boolean),isN=x=>typeof x==="number"&&isFinite(x)&&x>=0;
let uu=-1,ik=-1,pmode="add",dr={n:"",i:[],w:0};
function applyTh(){const t=S.set&&S.set.th,r=document.documentElement;if(t==="light"||t==="dark")r.dataset.theme=t;else delete r.dataset.theme}
function setTh(v){S.set=Object.assign({},S.set,{th:v});saveq();applyAc();drawSet()}
function wk(){let n=0,k=0,p=0;for(let i=0;i<7;i++){const d=new Date(cur+"T12:00:00");d.setDate(d.getDate()-i);const E=S.d[iso(d)]||[];if(E.length){n++;k+=dk(E);p+=E.reduce((a,e)=>a+e.p,0)}}return n>1?`<div class="mu">За 7 дней (${n} дн.): в среднем ${Math.round(k/n)} ккал · белок ${Math.round(p/n)} г</div>`:""}
function shr(t){const k=t.p*4+t.f*9+t.c*4;return k?`<div class="mu">Доля ккал: Б ${Math.round(t.p*400/k)}% · Ж ${Math.round(t.f*900/k)}% · У ${Math.round(t.c*400/k)}%</div>`:""}
