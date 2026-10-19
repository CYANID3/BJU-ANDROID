// Service worker, поиск, недельные итоги
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
if(!NATIVE&&"serviceWorker" in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("sw.js").catch(()=>{});
else if(NATIVE&&navigator.serviceWorker)navigator.serviceWorker.getRegistrations().then(r=>r.forEach(x=>x.unregister())).catch(()=>{});
// сумма БЖУ записей; три плитки Б / Ж / У карточки дня (итог дня и средний день в статистике — столбцы mcols, 06-render.js)
const sumE=E=>E.reduce((a,e)=>({p:a.p+e.p,f:a.f+e.f,c:a.c+e.c}),{p:0,f:0,c:0});
const mtiles=(t,G,sh=[])=>mtile("Белки",t.p,G.p,"var(--p)",1,sh[0])+mtile("Жиры",t.f,G.f,"var(--f)",0,sh[1])+mtile("Углеводы",t.c,G.c,"var(--c)",0,sh[2]);
const nz=s=>String(s).toLowerCase().replace(/ё/g,"е"),W=s=>nz(s).split(/[\s,()%.\-]+/).filter(Boolean);
let uu=-1,ik=-1,pmode="add",dr={n:"",i:[],w:0};
// последние 7 дней (включая выбранный): сколько дней с записями, средние калории и белок
function wkD(){let n=0,k=0,p=0,f=0,c=0;for(let i=0;i<7;i++){const d=new Date(cur+"T12:00:00");d.setDate(d.getDate()-i);const E=S.d[iso(d)]||[];if(E.length){n++;k+=dk(E);for(const e of E){p+=e.p;f+=e.f;c+=e.c}}}return n>1?{n,k:Math.round(k/n),p:Math.round(p/n),f:Math.round(f/n),c:Math.round(c/n)}:null}
// доля калорий от белков / жиров / углеводов, %
function shrD(t){const k=t.p*4+t.f*9+t.c*4;return k?[t.p*400/k,t.f*900/k,t.c*400/k].map(Math.round):null}
