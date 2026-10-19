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
function mgPlan(mine,theirs){const seen=new Set();return theirs.map(p=>{const key0=(p[5]?"d:":"p:")+mgKey(p[0]);if(seen.has(key0))return{t:"dup"};const k=mine.findIndex(q=>mgSame(q,p));if(k>=0)seen.add(key0);if(k>=0)return mgDist(mine[k],p)>.3&&!p[5]?{t:"diff",k}:{t:"same",k};
 const key=(p[5]?"d:":"p:")+mgKey(p[0]);if(seen.has(key))return{t:"dup"};seen.add(key);
 let best=-1;mine.forEach((q,i)=>{if(mgNear(q,p)&&(best<0||mgDist(q,p)<mgDist(mine[best],p)))best=i});return best>=0?{t:"maybe",k:best}:{t:"new"}})}
// применение (чистая функция): yes — индексы «похожих», отмеченных «Это одно»
function mgApply(mine,theirs,plan,yes,skip,take){skip=skip||new Set();take=take||new Set();const db=mine.map(p=>p.slice()),added=[];let units=0;
 const addUnits=(q,p)=>{const have=new Set((q[4]||[]).map(u=>nz(u[0]))),extra=(p[4]||[]).filter(u=>!have.has(nz(u[0])));if(extra.length){q[4]=[...(q[4]||[]),...extra.map(u=>u.slice())];units+=extra.length}};
 let upd=0;theirs.forEach((p,i)=>{const x=plan[i];if(x.t==="dup")return;if(x.t==="diff"){addUnits(db[x.k],p);if(take.has(i)){db[x.k][1]=p[1];db[x.k][2]=p[2];db[x.k][3]=p[3];upd++}return}if(x.t==="same"||x.t==="maybe"&&yes.has(i))addUnits(db[x.k],p);else if(!skip.has(i)){db.push(JSON.parse(JSON.stringify(p)));added.push(p[0])}});
 return{db,added,units,upd}}
let lastDb=null,mgS=null;
function mgRun(t,name){const o=pRead(t);if(!o)return;
 const th=o.db||[],plan=mgPlan(S.db,th),mb=plan.map((x,i)=>x.t==="maybe"?i:-1).filter(i=>i>=0);
 mgS={th,plan,yes:new Set(),skip:new Set(),take:new Set(),name};
 // решать нечего (всё уже есть) — сразу итог, без экрана
 if(!plan.some(x=>x.t==="new"||x.t==="diff"||x.t==="maybe"))return mgDone();mgView()}
// экран «Похожие продукты»: пара «из файла ↔ ваш» и переключатель «Разные / Это одно»
const mgMac=p=>`Б ${f1(p[1])} · Ж ${f1(p[2])} · У ${f1(p[3])}`;
// экран «Импорт продуктов»: что добавится и что решить. Группы: новые (галочки), отличаются (чьи БЖУ оставить),
// похожие («Разные / Это одно»), уже есть (свёрнуто). Пока не нажата кнопка внизу, список не меняется.
function mgView(){const{th,plan,yes,skip,take,name}=mgS,G=t=>plan.map((x,i)=>x.t===t?i:-1).filter(i=>i>=0),nw=G("new"),df=G("diff"),mb=G("maybe"),sm=G("same");
 const row=(i,body,right)=>`<div class="mgi">${body}${right||""}</div>`,nm=p=>`<b>${esc(p[0])}</b><span>${mgMac(p)}</span>`;
 let h=`<div class="mgs"><div><b>${nw.length}</b><small>новых</small></div><div class="${df.length?"w":""}"><b>${df.length}</b><small>отличаются</small></div><div class="${mb.length?"w":""}"><b>${mb.length}</b><small>похожих</small></div><div><b>${sm.length}</b><small>уже есть</small></div></div>`;
 if(df.length)h+=`<div class="gh">Отличаются БЖУ · ${df.length}</div><div class="mgh">Такое название у вас уже есть, но числа другие. Выберите, какие оставить.</div>`+df.map(i=>`<div class="mgp"><b class="mgn">${esc(S.db[plan[i].k][0])}</b><div class="mgc"><button class="${take.has(i)?"":"on"}" onclick="mgTk(${i},0)"><small>Мои</small>${mgMac(S.db[plan[i].k])}</button><button class="${take.has(i)?"on":""}" onclick="mgTk(${i},1)"><small>Из файла</small>${mgMac(th[i])}</button></div></div>`).join("");
 if(mb.length)h+=`<div class="gh">Похожие · ${mb.length}</div><div class="mgh">Это один продукт? Если да — у вашего появятся меры из файла, а новый не добавится.</div>`+mb.map(i=>`<div class="mgp"><div class="mgpr"><div class="mgr"><small>Из файла</small>${nm(th[i])}</div><div class="mgr"><small>У вас</small>${nm(S.db[plan[i].k])}</div></div><div class="seg"><button class="${yes.has(i)?"":"on"}" onclick="mgSet(${i},0)">Разные</button><button class="${yes.has(i)?"on":""}" onclick="mgSet(${i},1)">Это одно</button></div></div>`).join("");
 if(nw.length)h+=`<div class="gh mgg">Новые · ${nw.length}<button onclick="mgAll()">${skip.size?"Выбрать все":"Снять все"}</button></div><div class="grp">`+nw.map(i=>`<button class="row mgk${skip.has(i)?"":" on"}" onclick="mgSk(${i})"><span class="tx">${esc(th[i][0])}<small>${th[i][5]?"Блюдо · ":""}${mgMac(th[i])} · ${kc(th[i][1],th[i][2],th[i][3])} ккал</small></span><span class="cb">${ic("check")}</span></button>`).join("")+`</div>`;
 if(sm.length)h+=`<div class="gh">Уже есть · ${sm.length}</div><div class="mgh">${sm.slice(0,4).map(i=>esc(th[i][0])).join(", ")}${sm.length>4?" и ещё "+(sm.length-4):""}. Пропускаются; недостающие меры добавятся.</div>`;
 $("mgl").innerHTML=h;const na=nw.length-skip.size+mb.filter(i=>!yes.has(i)).length,nu=take.size;$("mgok").textContent=na||nu?["Добавить "+na,nu?"обновить "+nu:""].filter(x=>!/ 0$/.test(x)&&x).join(" · "):"Готово";
 if($("v12").hidden)sv(12,"Импорт продуктов",(name?name+" · ":"")+th.length+" "+plural(th.length,"продукт","продукта","продуктов")+" в файле");show()}
function mgSet(i,v){if(v)mgS.yes.add(i);else mgS.yes.delete(i);vib("ui");mgView()}
function mgTk(i,v){if(v)mgS.take.add(i);else mgS.take.delete(i);vib("ui");mgView()}
function mgSk(i){if(mgS.skip.has(i))mgS.skip.delete(i);else mgS.skip.add(i);vib("ui");mgView()}
function mgAll(){const nw=mgS.plan.map((x,i)=>x.t==="new"?i:-1).filter(i=>i>=0);if(mgS.skip.size)mgS.skip.clear();else nw.forEach(i=>mgS.skip.add(i));vib("ui");mgView()}
function mgDone(){const s=mgS;mgS=null;if(!s)return;const r=mgApply(S.db,s.th,s.plan,s.yes,s.skip,s.take);
 if(!r.added.length&&!r.units&&!r.upd){if(!$("v12").hidden)fp();return say(`В файле${s.name?" «"+s.name+"»":""} нет новых продуктов: все ${s.th.length} уже есть в вашем списке.`)}
 lastDb=S.db;lastDel=lastAdd=null;S.db=r.db;save();if(!$("v12").hidden)fp();
 const ex=r.added.slice(0,3).join(", ")+(r.added.length>3?" и ещё "+(r.added.length-3):"");
 toast((r.added.length?`Добавлено: ${r.added.length} (${ex})`:"Новых продуктов нет")+(r.upd?` · обновлено: ${r.upd}`:"")+(r.units?` · новых мер: ${r.units}`:""),1,7000)}
async function mgPick(){const N=NX();if(!N||!N.file.available)return $("fmg").click();let r;try{r=await N.file.open()}catch(e){return}
 let t;try{t=await N.file.read(r.uri)}catch(e){return say("Не удалось прочитать файл")}finally{if(!MF||MF.uri!==r.uri)N.file.release(r.uri).catch(()=>{})}mgRun(t,r.name)}
function mgFile(el){const f=el.files[0];el.value="";if(f)f.text().then(t=>mgRun(t,f.name))}

