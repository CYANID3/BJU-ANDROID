// Слияние баз продуктов: из чужого файла (например, файла другого человека) берутся только продукты и блюда — дневник не меняется.
//  1) тот же набор слов в названии (регистр, «ё», пробелы, знаки и порядок слов не важны) — тот же продукт: остаётся ваш,
//     к нему добавляются недостающие меры (банка, штука…);
//  2) похожие — одно название входит в другое (или большая часть слов общая) и БЖУ близкое: «Яйцо» и «Яйцо (варёное)».
//     Их решает человек на экране «Похожие продукты»: «Это одно» или «Разные» (по умолчанию «Разные» — ничего не склеится);
//  3) остальное — новые продукты, добавляются в конец списка.
// Разные числа в названии («Молоко 2,5%» и «Молоко 3,2%»), продукт и блюдо — всегда разные. Пока не нажато «Готово», список не меняется.
const mgKey=s=>nz(s).replace(/(\d)\s*%/g,"$1%").replace(/[«»"'`()[\],.;:/\\-]+/g," ").split(" ").filter(Boolean).sort().join(" ");
const mgSame=(a,b)=>!!a[5]===!!b[5]&&mgKey(a[0])===mgKey(b[0]);
const mgDist=(a,b)=>Math.abs(a[1]-b[1])+Math.abs(a[2]-b[2])+Math.abs(a[3]-b[3]);
function mgNear(a,b){if(!!a[5]!==!!b[5])return false;const ta=mgKey(a[0]).split(" "),tb=mgKey(b[0]).split(" "),num=t=>t.filter(x=>/\d/.test(x)).join();
 if(num(ta)!==num(tb))return false;const st=w=>w.slice(0,5),A=new Set(ta.map(st)),B=new Set(tb.map(st)),both=[...A].filter(x=>B.has(x)).length,small=Math.min(A.size,B.size);
 if(!both)return false;const near=k=>[1,2,3].every(i=>Math.abs(a[i]-b[i])<=Math.max(k,.08*Math.max(a[i],b[i])));
 return both===small&&near(1.5)||both*2>=small&&near(.3)}
// разбор: для каждого продукта из файла — {t:"same",k} | {t:"maybe",k} | {t:"new"} (k — индекс своего продукта)
function mgPlan(mine,theirs){const seen=new Set();return theirs.map(p=>{const k=mine.findIndex(q=>mgSame(q,p));if(k>=0)return{t:"same",k};
 const key=(p[5]?"d:":"p:")+mgKey(p[0]);if(seen.has(key))return{t:"dup"};seen.add(key);
 let best=-1;mine.forEach((q,i)=>{if(mgNear(q,p)&&(best<0||mgDist(q,p)<mgDist(mine[best],p)))best=i});return best>=0?{t:"maybe",k:best}:{t:"new"}})}
// применение (чистая функция): yes — индексы «похожих», отмеченных «Это одно»
function mgApply(mine,theirs,plan,yes){const db=mine.map(p=>p.slice()),added=[];let units=0;
 const addUnits=(q,p)=>{const have=new Set((q[4]||[]).map(u=>nz(u[0]))),extra=(p[4]||[]).filter(u=>!have.has(nz(u[0])));if(extra.length){q[4]=[...(q[4]||[]),...extra.map(u=>u.slice())];units+=extra.length}};
 theirs.forEach((p,i)=>{const x=plan[i];if(x.t==="dup")return;if(x.t==="same"||x.t==="maybe"&&yes.has(i))addUnits(db[x.k],p);else{db.push(JSON.parse(JSON.stringify(p)));added.push(p[0])}});
 return{db,added,units}}
let lastDb=null,mgS=null;
function mgRun(t,name){const o=pRead(t);if(!o)return;
 const th=o.db||[],plan=mgPlan(S.db,th),mb=plan.map((x,i)=>x.t==="maybe"?i:-1).filter(i=>i>=0);
 mgS={th,plan,yes:new Set(),name};if(mb.length)return mgView();mgDone()}
// экран «Похожие продукты»: пара «из файла ↔ ваш» и переключатель «Разные / Это одно»
const mgMac=p=>`Б ${f1(p[1])} · Ж ${f1(p[2])} · У ${f1(p[3])}`;
function mgView(){const{th,plan,yes}=mgS;$("mgl").innerHTML=plan.map((x,i)=>x.t!=="maybe"?"":`<div class="mgp"><div class="mgr"><small>Из файла</small><b>${esc(th[i][0])}</b><span>${mgMac(th[i])}</span></div>
 <div class="mgr"><small>У вас</small><b>${esc(S.db[x.k][0])}</b><span>${mgMac(S.db[x.k])}</span></div><div class="seg"><button class="${yes.has(i)?"":"on"}" onclick="mgSet(${i},0)">Разные</button><button class="${yes.has(i)?"on":""}" onclick="mgSet(${i},1)">Это одно</button></div></div>`).join("");
 if($("v12").hidden)sv(12,"Похожие продукты");show()}
function mgSet(i,v){if(v)mgS.yes.add(i);else mgS.yes.delete(i);vib("ui");mgView()}
function mgDone(){const s=mgS;mgS=null;if(!s)return;const r=mgApply(S.db,s.th,s.plan,s.yes);
 if(!r.added.length&&!r.units){if(!$("v12").hidden)fp();return say(`В файле${s.name?" «"+s.name+"»":""} нет новых продуктов: все ${s.th.length} уже есть в вашем списке.`)}
 lastDb=S.db;lastDel=lastAdd=null;S.db=r.db;save();if(!$("v12").hidden)fp();
 const ex=r.added.slice(0,3).join(", ")+(r.added.length>3?" и ещё "+(r.added.length-3):"");
 toast((r.added.length?`Добавлено продуктов: ${r.added.length} (${ex})`:"Новых продуктов нет")+(r.units?` · новых мер: ${r.units}`:""),1,7000)}
async function mgPick(){const N=NX();if(!N||!N.file.available)return $("fmg").click();let r;try{r=await N.file.open()}catch(e){return}
 let t;try{t=await N.file.read(r.uri)}catch(e){return say("Не удалось прочитать файл")}finally{if(!MF||MF.uri!==r.uri)N.file.release(r.uri).catch(()=>{})}mgRun(t,r.name)}
function mgFile(el){const f=el.files[0];el.value="";if(f)f.text().then(t=>mgRun(t,f.name))}
// настройка «Импорт продуктов»: выключен — кнопки «Добавить продукты из другого файла» нет
const mgOn=()=>!(S.set&&S.set.mg==="off");
function setMg(v){S.set=Object.assign({},S.set,{mg:v});saveq();drawSet();vib("ui")}
