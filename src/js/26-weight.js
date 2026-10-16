// Вес: одна запись в день (S.wt = { "ГГГГ-ММ-ДД": кг }), строка внизу главного экрана, график в статистике
// режим: on — вес и разница; dyn — «Динамика»: сама цифра нигде не показывается, только изменение; off — выключено
const wtm=()=>{const v=S.set&&S.set.wt;return v==="off"||v==="dyn"?v:"on"},wton=()=>wtm()!=="off",wdyn=()=>wtm()==="dyn";
const dDiff=(a,b)=>Math.round((new Date(b+"T12:00:00")-new Date(a+"T12:00:00"))/864e5);
// последняя запись веса строго до дня k
function wPrev(k){let b=null;for(const d in S.wt||{})if(d<k&&(!b||d>b))b=d;return b?[b,S.wt[b]]:null}
const wFmt=v=>String(r1(v)).replace(".",","),wDate=k=>new Date(k+"T12:00:00").toLocaleDateString("ru-RU",{day:"numeric",month:"short"});
const wSg=d=>(d>0?"+":d<0?"−":"±")+wFmt(Math.abs(d));
// изменение «за неделю» к записи [k,v]: от той прошлой записи, что ближе всего к 7 дням назад
// (при равенстве — от более свежей); если она не через 7 дней — «за N дн.»
function wWeek(k,v){let b=null,bs=1e9;for(const d in S.wt||{}){if(d>=k)continue;const n=dDiff(d,k),sc=Math.abs(n-7)+(n>7?.1:0);if(sc<bs){b=d;bs=sc}}
 if(!b)return null;const n=dDiff(b,k);return{d:r1(v-S.wt[b]),per:n===7?"за неделю":`за ${n} дн.`}}
function wtCard(){if(!wton()||cur>today)return"";const v=(S.wt||{})[cur],pr=wPrev(cur),d=v&&pr?r1(v-pr[1]):null,ago=pr?dDiff(pr[0],cur):0;let val;
 if(wdyn()){const w=v?wWeek(cur,v):pr&&wWeek(pr[0],pr[1]);
  val=v?`<b>${w?wSg(w.d):"✓"}</b>${w?` кг <small>${w.per}</small>`:"<small>первая запись</small>"}`:`<span class="wta">Записать</span>${w?`<small>${wSg(w.d)} ${w.per}</small>`:""}`}
 else val=v?`<b>${wFmt(v)}</b> кг${d?`<small>${wSg(d)}</small>`:""}`:`<span class="wta">Записать</span>${pr?`<small>было ${wFmt(pr[1])}${ago>1?` · ${ago} дн. назад`:""}</small>`:""}`;
 return `<button class="wtc${v?" on":""}" onclick="wtOpen()" aria-label="Вес за день"><span class="wti">${ic("scale")}</span><span class="wtl">Вес</span><span class="wtv">${val}</span></button>`}
// ввод. В «Динамике» поле не заполняется записанным весом и нет кнопок ±0,1 (они показали бы цифру)
function wtOpen(){const v=(S.wt||{})[cur],dy=wdyn();$("wv").value=v&&!dy?wFmt(v):"";$("wv").placeholder=dy&&v?"Новый вес":"0,0";
 document.querySelectorAll("#v10 .wst").forEach(b=>b.hidden=dy);$("wdl").hidden=!v;wPv();svFocus=1;sv(10,"Вес · "+new Date(cur+"T12:00:00").toLocaleDateString("ru-RU",{day:"numeric",month:"long"}));show();
 const f=()=>{const g=$("wv");try{g.focus({preventScroll:true})}catch(e){g.focus()}g.select()};isOpen?f():requestAnimationFrame(f)}
const wIn=()=>num($("wv").value);
function wSt(n){const pr=wPrev(cur),b=wIn()||(S.wt||{})[cur]||(pr&&pr[1])||70;$("wv").value=wFmt(Math.max(1,Math.round(b*10+n)/10));wPv();hap(4)}
function wPv(){const v=wIn(),pr=wPrev(cur),el=$("wpv"),cv=(S.wt||{})[cur];
 if(wdyn()){if(!pr){el.textContent=cv?"Вес за этот день записан. Введите новый, чтобы заменить.":"Цифра нигде не показывается — только изменение.";return}
  const d=v>0?r1(v-pr[1]):null;el.innerHTML=d!=null?`С прошлой записи (${wDate(pr[0])}): <b>${wSg(d)} кг</b>`:cv?(w=>`Записано: <b>${w?wSg(w.d)+" кг "+w.per:"первая запись"}</b>. Введите новый вес, чтобы заменить.`)(wWeek(cur,cv)):`Прошлая запись — ${wDate(pr[0])}. Покажу только разницу.`;return}
 if(!pr){el.textContent="Лучше взвешиваться в одно время — например, утром.";return}
 const d=v>0?r1(v-pr[1]):null;el.innerHTML=`Прошлая запись: <b>${wFmt(pr[1])}</b> кг · ${wDate(pr[0])}`+(d?` · <span style="color:var(--tx)">${wSg(d)} кг</span>`:"")}
function wSave(){const v=wIn();if(!(v>=20&&v<=400)){$("wv").focus();return toast("Введите вес в кг")}S.wt=Object.assign({},S.wt,{[cur]:Math.round(v*100)/100});hap(8);save();cl();render()}
async function wDel(){if(!await ask("Удалить запись веса за этот день?","Удалить",1))return;const w=Object.assign({},S.wt);delete w[cur];S.wt=w;save();cl();render()}
function setWt(v){S.set=Object.assign({},S.set,{wt:v});saveq();drawSet();render();hap(8)}
// график веса за месяц: линия через все записи (между записями — прямая), точки на днях с записью.
// В «Динамике» шкала — изменение от первой записи месяца (0, −0,5, −1…), без самих килограммов
function chWt(days,W){const H=130,L=34,Rr=30,T=12,B=20,iw=W-L-Rr,ih=H-T-B,st=iw/days.length,X=i=>L+i*st+st/2,dy=wdyn();
 const raw=days.map((x,i)=>x.w?[i,x.w]:null).filter(Boolean),b0=dy?raw[0][1]:0,pts=raw.map(([i,v])=>[i,v-b0]),vs=pts.map(p=>p[1]),F=dy?v=>Math.abs(v)<1e-9?"0":wSg(v):wFmt;
 let lo=Math.floor((Math.min(...vs)-.4)*2)/2,hi=Math.ceil((Math.max(...vs)+.4)*2)/2;if(hi-lo<2){const m=(hi+lo)/2;lo=Math.floor(m-1);hi=lo+2}
 const Y=v=>T+ih-(v-lo)/(hi-lo)*ih,stp=[.5,1,2,5,10].find(s=>(hi-lo)/s<=4)||10;let g="";
 for(let v=Math.ceil(lo/stp)*stp;v<=hi+1e-9;v+=stp)g+=`<line x1="${L}" x2="${W-Rr}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--bd)"${dy&&Math.abs(v)<1e-9?' stroke-dasharray="4 4" stroke="var(--mu)"':""}/><text x="${L-6}" y="${Y(v)+3.5}" text-anchor="end">${F(v)}</text>`;
 if(pts.length>1)g+=`<polyline points="${pts.map(([i,v])=>X(i)+","+Y(v)).join(" ")}" fill="none" stroke="var(--ac)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
 pts.forEach(([i,v])=>{g+=`<circle data-i="${i}" cx="${X(i)}" cy="${Y(v)}" r="3.4" fill="var(--ac)" stroke="var(--sub)" stroke-width="2"/>`});
 const [li,lv]=pts[pts.length-1];g+=`<text x="${X(li)+7}" y="${Y(lv)+3.5}" style="fill:var(--tx);font-weight:600">${F(lv)}</text>`;
 days.forEach((x,i)=>{if(x.d===1||x.d%7===1&&x.d<=29||x.d===days.length&&x.d%7!==1)g+=`<text x="${X(i)}" y="${H-5}" text-anchor="middle">${x.d}</text>`});
 g+=`<line class="cx" x1="0" x2="0" y1="${T}" y2="${T+ih}" stroke="var(--mu)" stroke-width="1" opacity="0"/>`;
 return{svg:`<svg viewBox="0 0 ${W} ${H}" height="${H}">${g}</svg>`,L,st,X,pts,b0,first:raw[0]}}
function wtBlock(days,W){if(!wton())return null;const pts=days.filter(x=>x.w);if(!pts.length)return null;const c=chWt(days,W),a=pts[0].w,b=pts[pts.length-1].w,d=r1(b-a),dy=wdyn();
 const ch=d?wSg(d)+" кг":"без изменений",def=pts.length>1?(dy?`${ch} за месяц · от первой записи ${pts[0].d}-го`:`${wFmt(a)} → ${wFmt(b)} кг · ${ch} за месяц`):(dy?"Одна запись в этом месяце":`Одна запись: ${wFmt(a)} кг`);
 return{c,html:`<div class="stb"><h4>${dy?"Изменение веса":"Вес"}</h4><div class="sd rdo" id="rd3" data-def="${def}">${def}</div><div class="chw" id="ch3">${c.svg}</div></div>`}}
// подсказка при касании графика
const wTip=(d,c)=>wdyn()?`${stFmt(d)} · <b>${Math.abs(d.w-c.b0)<1e-9?"0":wSg(r1(d.w-c.b0))}</b> кг от ${c.first[0]+1}-го`:`${stFmt(d)} · <b>${wFmt(d.w)}</b> кг`;
// вес на карточке дня: небольшая плашка под остатком калорий (только если в этот день есть запись)
function wtRep(){if(!wton())return"";const v=(S.wt||{})[cur];if(!v)return"";const pr=wPrev(cur);
 if(wdyn()){const w=wWeek(cur,v);return `<div class="rp-w">${ic("scale")}${w?`<b>${wSg(w.d)}</b> кг<small>${w.per}</small>`:`<small>вес записан</small>`}</div>`}
 const d=pr?r1(v-pr[1]):0;return `<div class="rp-w">${ic("scale")}<b>${wFmt(v)}</b> кг${d?`<small>${wSg(d)}</small>`:""}</div>`}
