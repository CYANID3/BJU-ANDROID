// Вес: одна запись в день (S.wt = { "ГГГГ-ММ-ДД": кг }), строка внизу главного экрана, график в статистике
const wton=()=>!(S.set&&S.set.wt==="off");
// последняя запись веса строго до дня k
function wPrev(k){let b=null;for(const d in S.wt||{})if(d<k&&(!b||d>b))b=d;return b?[b,S.wt[b]]:null}
const wFmt=v=>String(r1(v)).replace(".",","),wDate=k=>new Date(k+"T12:00:00").toLocaleDateString("ru-RU",{day:"numeric",month:"short"});
function wtCard(){if(!wton()||cur>today)return"";const v=(S.wt||{})[cur],pr=wPrev(cur),d=v&&pr?r1(v-pr[1]):null;
 return `<button class="wtc${v?" on":""}" onclick="wtOpen()" aria-label="Вес за день"><span class="wti">${ic("scale")}</span><span class="wtl">Вес</span><span class="wtv">${v?`<b>${wFmt(v)}</b> кг${d?`<small>${d>0?"+":"−"}${wFmt(Math.abs(d))}</small>`:""}`:`<span class="wta">Записать</span>${pr?`<small>было ${wFmt(pr[1])}</small>`:""}`}</span></button>`}
function wtOpen(){const v=(S.wt||{})[cur];$("wv").value=v?wFmt(v):"";$("wdl").hidden=!v;wPv();svFocus=1;sv(10,"Вес · "+new Date(cur+"T12:00:00").toLocaleDateString("ru-RU",{day:"numeric",month:"long"}));show();
 const f=()=>{const g=$("wv");try{g.focus({preventScroll:true})}catch(e){g.focus()}g.select()};isOpen?f():requestAnimationFrame(f)}
const wIn=()=>num($("wv").value);
function wSt(n){const pr=wPrev(cur),b=wIn()||(S.wt||{})[cur]||(pr&&pr[1])||70;$("wv").value=wFmt(Math.max(1,Math.round(b*10+n)/10));wPv();hap(4)}
function wPv(){const v=wIn(),pr=wPrev(cur),el=$("wpv");if(!pr){el.textContent="Лучше взвешиваться в одно время — например, утром.";return}
 const d=v>0?r1(v-pr[1]):null;el.innerHTML=`Прошлая запись: <b>${wFmt(pr[1])}</b> кг · ${wDate(pr[0])}`+(d?` · <span style="color:var(--tx)">${d>0?"+":"−"}${wFmt(Math.abs(d))} кг</span>`:"")}
function wSave(){const v=wIn();if(!(v>=20&&v<=400)){$("wv").focus();return toast("Введите вес в кг")}S.wt=Object.assign({},S.wt,{[cur]:Math.round(v*100)/100});hap(8);save();cl();render()}
async function wDel(){if(!await ask("Удалить запись веса за этот день?","Удалить",1))return;const w=Object.assign({},S.wt);delete w[cur];S.wt=w;save();cl();render()}
function setWt(v){S.set=Object.assign({},S.set,{wt:v});saveq();drawSet();render();hap(8)}
// график веса за месяц: линия через все записи (между записями — прямая), точки на днях с записью
function chWt(days,W){const H=130,L=34,Rr=26,T=12,B=20,iw=W-L-Rr,ih=H-T-B,st=iw/days.length,X=i=>L+i*st+st/2;
 const pts=days.map((x,i)=>x.w?[i,x.w]:null).filter(Boolean),vs=pts.map(p=>p[1]);
 let lo=Math.floor((Math.min(...vs)-.4)*2)/2,hi=Math.ceil((Math.max(...vs)+.4)*2)/2;if(hi-lo<2){const m=(hi+lo)/2;lo=Math.floor(m-1);hi=lo+2}
 const Y=v=>T+ih-(v-lo)/(hi-lo)*ih,stp=[.5,1,2,5,10].find(s=>(hi-lo)/s<=4)||10;let g="";
 for(let v=Math.ceil(lo/stp)*stp;v<=hi+1e-9;v+=stp)g+=`<line x1="${L}" x2="${W-Rr}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--bd)"/><text x="${L-6}" y="${Y(v)+3.5}" text-anchor="end">${wFmt(v)}</text>`;
 if(pts.length>1)g+=`<polyline points="${pts.map(([i,v])=>X(i)+","+Y(v)).join(" ")}" fill="none" stroke="var(--ac)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
 pts.forEach(([i,v])=>{g+=`<circle data-i="${i}" cx="${X(i)}" cy="${Y(v)}" r="3.4" fill="var(--ac)" stroke="var(--sub)" stroke-width="2"/>`});
 const [li,lv]=pts[pts.length-1];g+=`<text x="${X(li)+7}" y="${Y(lv)+3.5}" style="fill:var(--tx);font-weight:600">${wFmt(lv)}</text>`;
 days.forEach((x,i)=>{if(x.d===1||x.d%7===1&&x.d<=29||x.d===days.length&&x.d%7!==1)g+=`<text x="${X(i)}" y="${H-5}" text-anchor="middle">${x.d}</text>`});
 g+=`<line class="cx" x1="0" x2="0" y1="${T}" y2="${T+ih}" stroke="var(--mu)" stroke-width="1" opacity="0"/>`;
 return{svg:`<svg viewBox="0 0 ${W} ${H}" height="${H}">${g}</svg>`,L,st,X,pts}}
function wtBlock(days,W){if(!wton())return null;const pts=days.filter(x=>x.w);if(!pts.length)return null;const c=chWt(days,W),a=pts[0].w,b=pts[pts.length-1].w,d=r1(b-a);
 const def=pts.length>1?`${wFmt(a)} → ${wFmt(b)} кг · ${d?(d>0?"+":"−")+wFmt(Math.abs(d))+" кг":"без изменений"} за месяц`:`Одна запись: ${wFmt(a)} кг`;
 return{c,html:`<div class="stb"><h4>Вес</h4><div class="sd rdo" id="rd3" data-def="${def}">${def}</div><div class="chw" id="ch3">${c.svg}</div></div>`}}
