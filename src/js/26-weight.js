// Вес: одна запись в день (S.wt = { "ГГГГ-ММ-ДД": кг }), плашка в итоге дня, график в статистике, плашка на карточке дня
// включено, пока в настройках не выбрано «Выкл.»
const wtm=()=>S.set&&S.set.wt==="off"?"off":"on",wton=()=>wtm()!=="off";
// последняя запись веса строго до дня k
function wPrev(k){let b=null;for(const d in S.wt||{})if(d<k&&(!b||d>b))b=d;return b?[b,S.wt[b]]:null}
const wFmt=v=>String(r1(v)).replace(".",","),WDF=new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short"}),wDate=k=>WDF.format(new Date(k+"T12:00:00"));
const wSg=d=>(d>0?"+":d<0?"−":"±")+wFmt(Math.abs(d));
// чип «Вес» под итогом дня: записан за этот день — «72,4 кг» и разница с прошлой записью;
// не записан — «Записать» (и прошлый вес мелко). Если вес пишется жестом «потянуть вверх» — пустого чипа нет.
function wtTile() {
  if (!wton() || cur > today) return ""; const v = (S.wt || {})[cur], pr = wPrev(cur);
  if (v) { const d = pr ? r1(v - pr[1]) : null; return `<button class="dtl wtl on" onclick="wtOpen()" aria-label="Вес ${wFmt(v)} кг, изменить"><span class="ti">${ic("scale")}</span><span class="tx"><small>Вес</small><b>${wFmt(v)}<i>кг</i></b></span><em>${d ? wSg(d) : pr ? "±0" : ""}</em></button>` }
  if (swAct() === "wt") return "";
  return `<button class="dtl wtl" onclick="wtOpen()" aria-label="Записать вес"><span class="ti">${ic("plus")}</span><span class="tx"><small>Вес</small><b class="wa">Записать</b></span><em>${pr ? "было " + wFmt(pr[1]) : ""}</em></button>`
}
function wtOpen(sub) { SUB = 0; const v = (S.wt || {})[cur], pr = wPrev(cur); $("wv").value = v ? wFmt(v) : ""; $("wdl").hidden = !v; sv(10, "Вес · " + new Date(cur + "T12:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long" }), pr ? `Прошлая запись: ${wFmt(pr[1])} кг · ${wDate(pr[0])}` : ""); wPv(); show(); fIn("wv", 1) }
const wIn = () => num($("wv").value);
function wSt(n) { const pr = wPrev(cur), b = wIn() || (S.wt || {})[cur] || (pr && pr[1]) || 70; $("wv").value = wFmt(Math.max(1, Math.round(b * 10 + n) / 10)); wPv(); vib("ui"); if (document.activeElement === $("wv")) rpOn($("wv")) }
function wPv() {
  const v = wIn(), pr = wPrev(cur), el = $("wpv"); vfUnit($("wv"));
  if (!pr) { el.textContent = "Лучше взвешиваться в одно время — например, утром."; return }
  const d = v > 0 ? r1(v - pr[1]) : null; el.innerHTML = (d ? `<b>${wSg(d)} кг</b> с ${new Date(pr[0] + "T12:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} · ` : v > 0 ? "Без изменений · " : "") + "кнопки ± меняют на 0,1"
}
function wSave() { const v = wIn(); if (!(v >= 20 && v <= 400)) return badField("wv", "Введите вес в кг"); S.wt = Object.assign({}, S.wt, { [cur]: Math.round(v * 100) / 100 }); vib("save"); save(); cl(); render() }
async function wDel() { if (!await ask("Запись веса за этот день будет удалена.", "Удалить", 1, 0, "Удалить вес?")) return; const w = Object.assign({}, S.wt); delete w[cur]; S.wt = w; vib("del"); save(); cl(); render() }
function setWt(v) {
  S.set = Object.assign({}, S.set, { wt: v }); saveq(); vib("ui"); drawSet(); scSync();
  // чип веса появляется или уходит плавно; соседний чип недели — на месте, меняет ширину плавно (FLIP)
  const duo = document.querySelector("#app .duo"), wk = duo && duo.querySelector(".dtl:not(.wtl)"), r0 = wk && wk.getBoundingClientRect(), wl = duo && duo.querySelector(".wtl");
  const fix = () => { const d2 = document.querySelector("#app .duo"), w2 = d2 && d2.querySelector(".dtl:not(.wtl)"); if (!w2 || !r0 || !moOk(w2)) return; const r1 = w2.getBoundingClientRect();
    w2.animate([{ transform: `translateX(${r0.left - r1.left}px)`, width: r0.width + "px" }, { transform: "none", width: r1.width + "px" }], { duration: MO.t3, easing: MO.E }) };
  if (v === "off") mainMorph(wk ? [] : [duo], () => { render(); fix() }); else mainMorph([], () => { render(); fix() }, () => { const d2 = document.querySelector("#app .duo"); return d2 && !duo ? [d2] : [] });
  if (v === "off" && wl && wk) { const r = wl.getBoundingClientRect(), g = noIds(wl.cloneNode(true)); Object.assign(g.style, { position: "fixed", left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", margin: 0, zIndex: 2, pointerEvents: "none" }); document.body.appendChild(g); moOut(g, () => g.remove()) }
  if (v !== "off") { const w = document.querySelector("#app .wtl"); if (w && duo) moIn(w) }
}
// ярлык «Вес» у иконки приложения — по настройке (вызывается при запуске и при переключении)
// (вызывается и из applyAc — в том числе до объявления let-переменных, поэтому состояние хранится в window)
function scSync(){const N=window.BJU_NATIVE;if(!N||!N.native||!N.shortcuts)return;const w=wton();if(window.__scL===w)return;window.__scL=w;N.shortcuts({weight:w})}
// график веса за месяц: линия через все записи (между записями — прямая), точки на днях с записью
function chWt(days,W){const f=chF(days,W,130,26),{T,ih,X}=f;
 const pts=days.map((x,i)=>x.w?[i,x.w]:null).filter(Boolean),vs=pts.map(p=>p[1]);
 let lo=Math.floor((Math.min(...vs)-.4)*2)/2,hi=Math.ceil((Math.max(...vs)+.4)*2)/2;if(hi-lo<2){const m=(hi+lo)/2;lo=Math.floor(m-1);hi=lo+2}
 const Y=v=>T+ih-(v-lo)/(hi-lo)*ih,stp=[.5,1,2,5,10].find(s=>(hi-lo)/s<=4)||10;let g="";
 for(let v=Math.ceil(lo/stp)*stp;v<=hi+1e-9;v+=stp)g+=chGrid(f,Y(v),wFmt(v));
 if(pts.length>1)g+=`<polyline points="${pts.map(([i,v])=>X(i)+","+Y(v)).join(" ")}" fill="none" stroke="var(--ac)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
 pts.forEach(([i,v])=>{g+=`<circle data-i="${i}" cx="${X(i)}" cy="${Y(v)}" r="3.4" fill="var(--ac)" stroke="var(--sub)" stroke-width="2"/>`});
 const [li,lv]=pts[pts.length-1];g+=`<text x="${X(li)+7}" y="${Y(lv)+3.5}" style="fill:var(--tx);font-weight:600">${wFmt(lv)}</text>`;
 return chOut(f,g+chDays(f,days)+chCross(f),{f,pts})}
function wtBlock(days,W){if(!wton())return null;const pts=days.filter(x=>x.w);if(!pts.length)return null;const c=chWt(days,W),a=pts[0].w,b=pts[pts.length-1].w,d=r1(b-a);
 const def=pts.length>1?`${wFmt(a)} → ${wFmt(b)} кг · ${d?wSg(d)+" кг":"без изменений"} за месяц`:`Одна запись: ${wFmt(a)} кг`;
 return{c,html:`<div class="stb"><h4>Вес</h4><div class="sd rdo" id="rd3" data-def="${def}">${def}</div><div class="chw" id="ch3">${c.svg}</div></div>`}}
// подсказка при касании графика
const wTip=d=>`${stFmt(d)} · <b>${wFmt(d.w)}</b> кг`;
// вес на карточке дня: небольшая плашка под остатком калорий (только если в этот день есть запись)
function wtRep(){if(!wton())return"";const v=(S.wt||{})[cur];if(!v)return"";const pr=wPrev(cur),d=pr?r1(v-pr[1]):0;
 return `<div class="rp-w">${ic("scale")}<b>${wFmt(v)}</b> кг${d?`<small>${wSg(d)}</small>`:""}</div>`}
