// Статистика за месяц: плитки, графики, средние, частые продукты
// ===== Статистика за месяц =====
let stM=null;
function stats(){const d=new Date(cur+"T12:00:00");stM=[d.getFullYear(),d.getMonth()];drawStats();sv(9,"Статистика");show()}
function stMv(n){stM[1]+=n;if(stM[1]<0){stM[1]=11;stM[0]--}if(stM[1]>11){stM[1]=0;stM[0]++}const el=$("stc");drawStats();if(!RM())try{el.animate([{opacity:0,transform:`translateX(${n*24}px)`},{opacity:1,transform:"none"}],{duration:MO.t2,easing:MO.E})}catch(e){}}
function stData(){const[y,m]=stM,n=new Date(y,m+1,0).getDate(),pad=x=>String(x).padStart(2,"0"),days=[];
 for(let d=1;d<=n;d++){const k=y+"-"+pad(m+1)+"-"+pad(d),E=S.d[k]||[],t=E.reduce((a,e)=>({p:a.p+e.p,f:a.f+e.f,c:a.c+e.c}),{p:0,f:0,c:0});days.push({d,k,w:(S.wt||{})[k]||0,n:E.length,kc:kc(t.p,t.f,t.c),p:t.p,f:t.f,c:t.c,E})}
 return days}
// столбцы калорий по дням: тонкие, скруглённые сверху, от общей базовой линии; пунктир — норма
function chKcal(days,gk,W){const H=150,L=34,Rr=8,T=12,B=20,iw=W-L-Rr,ih=H-T-B,st=iw/days.length,bw=Math.max(3,Math.min(10,st-2));
 const mx=Math.max(gk*1.15,...days.map(x=>x.kc))*1.04||1,Y=v=>T+ih-(v/mx)*ih,r=Math.min(4,bw/2);let g="";
 [0,gk].concat(mx>gk*1.6?[Math.round(mx*.9/500)*500]:[]).forEach(v=>{if(v<0||v>mx)return;g+=`<line x1="${L}" x2="${W-Rr}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--bd)" stroke-width="1"${v===gk&&v?' stroke-dasharray="4 4" stroke="var(--mu)"':""}/><text x="${L-6}" y="${Y(v)+3.5}" text-anchor="end">${v}</text>`});
 if(gk)g+=`<text x="${W-Rr}" y="${Y(gk)-5}" text-anchor="end">норма</text>`;
 // столбец дня сложен из вклада белков, жиров и углеводов (снизу вверх), верх скруглён, между частями — тонкий зазор
 days.forEach((x,i)=>{if(!x.kc)return;const cx=L+i*st+st/2,x0=cx-bw/2,yb=T+ih,parts=[[x.p*4,"var(--p)"],[x.f*9,"var(--f)"],[x.c*4,"var(--c)"]].filter(q=>q[0]>0),sum=parts.reduce((a,q)=>a+q[0],0)||1;
  let yc=yb;const yTop=Y(x.kc);g+=`<g data-i="${i}">`;
  parts.forEach(([v,c],j)=>{const h=(yb-yTop)*v/sum,last=j===parts.length-1,y1=yc-h+(last?0:1),hh=Math.max(0,yc-y1);
   if(last){const rr=Math.min(r,hh);g+=`<path d="M${x0},${yc}V${y1+rr}Q${x0},${y1} ${x0+rr},${y1}H${x0+bw-rr}Q${x0+bw},${y1} ${x0+bw},${y1+rr}V${yc}Z" fill="${c}"/>`}
   else g+=`<rect x="${x0}" y="${y1}" width="${bw}" height="${hh}" fill="${c}"/>`;yc-=h});g+=`</g>`});
 days.forEach((x,i)=>{if(x.d===1||x.d%7===1&&x.d<=29||x.d===days.length&&x.d%7!==1)g+=`<text x="${L+i*st+st/2}" y="${H-5}" text-anchor="middle">${x.d}</text>`});
 return{svg:`<svg viewBox="0 0 ${W} ${H}" height="${H}">${g}</svg>`,L,st}}
// БЖУ по дням в % от нормы (общая шкала — одна ось); пропущенные дни — разрыв линии
const MCH=[["p","Белки","var(--cp)",""],["f","Жиры","var(--cf)","5 4"],["c","Углеводы","var(--cc)","0.5 4.5"]];
function chMac(days,G,W){const H=160,L=34,Rr=26,T=12,B=20,iw=W-L-Rr,ih=H-T-B,st=iw/days.length;
 const pc=(x,k)=>G[k]?x[k]/G[k]*100:0,mx=Math.min(300,Math.max(150,...days.filter(x=>x.n).flatMap(x=>MCH.map(([k])=>pc(x,k))))*1.08),Y=v=>T+ih-(Math.min(v,mx)/mx)*ih,X=i=>L+i*st+st/2;let g="";
 [0,50,100,150,200,250,300].filter(v=>v<=mx).forEach(v=>{g+=`<line x1="${L}" x2="${W-Rr}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--bd)"${v===100?' stroke-dasharray="4 4" stroke="var(--mu)"':""}/><text x="${L-6}" y="${Y(v)+3.5}" text-anchor="end">${v}%</text>`});
 MCH.forEach(([k,n,c,da])=>{let seg=[],segs=[];days.forEach((x,i)=>{if(x.n){seg.push([X(i),Y(pc(x,k))])}else if(seg.length){segs.push(seg);seg=[]}});if(seg.length)segs.push(seg);
  segs.forEach(sg=>{if(sg.length===1)g+=`<circle cx="${sg[0][0]}" cy="${sg[0][1]}" r="4" fill="${c}" stroke="var(--sub)" stroke-width="2"/>`;else g+=`<polyline points="${sg.map(p=>p.join(",")).join(" ")}" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${da?` stroke-dasharray="${da}"`:""}/>`});});
 // подписи у концов линий (вторичное кодирование, кроме цвета)
 const last=days.map((x,i)=>x.n?i:-1).filter(i=>i>=0).pop();
 if(last!=null){const ys=MCH.map(([k])=>[Y(pc(days[last],k)),k]).sort((a,b)=>a[0]-b[0]);for(let j=1;j<ys.length;j++)if(ys[j][0]-ys[j-1][0]<11)ys[j][0]=ys[j-1][0]+11;
  ys.forEach(([y,k])=>{const m=MCH.find(x=>x[0]===k);g+=`<text x="${X(last)+7}" y="${y+3.5}" style="fill:var(--tx);font-weight:600">${m[1][0]}</text>`})}
 days.forEach((x,i)=>{if(x.d===1||x.d%7===1&&x.d<=29||x.d===days.length&&x.d%7!==1)g+=`<text x="${X(i)}" y="${H-5}" text-anchor="middle">${x.d}</text>`});
 g+=`<line class="cx" x1="0" x2="0" y1="${T}" y2="${T+ih}" stroke="var(--mu)" stroke-width="1" opacity="0"/>`;
 return{svg:`<svg viewBox="0 0 ${W} ${H}" height="${H}">${g}</svg>`,L,st}}
function drawStats(){const[y,m]=stM,days=stData(),G=S.g,gk=kc(G.p,G.f,G.c),lg=days.filter(x=>x.n),N=lg.length,W=Math.max(260,($("ov").clientWidth||360)-58);
 $("stm").textContent=MN[m]+" "+y;
 const WB=wtBlock(days,W);
 if(!N){$("stc").innerHTML=`<div class="stempty">В этом месяце записей нет</div>`+(WB?WB.html:"");if(WB)bindWt(days,W,WB.c);return}
 const av=k=>lg.reduce((a,x)=>a+x[k],0)/N,akc=Math.round(av("kc")),inN=lg.filter(x=>gk&&Math.abs(x.kc-gk)<=gk*.1).length;
 // серия: подряд идущие дни с записями, заканчивая последним днём с записями
 let streak=0,best=0,run=0;days.forEach(x=>{run=x.n?run+1:0;best=Math.max(best,run)});for(let i=days.map(x=>x.n>0).lastIndexOf(true);i>=0&&days[i].n;i--)streak++;
 const A={p:av("p"),f:av("f"),c:av("c")},ash=shrD(A)||[];
 // главное: средний день месяца — как итог дня на главном экране
 let h=`<div class="stb sthero"><h4>В среднем за день</h4><div class="big"><b>${akc}</b><span class="mu">из ${gk} ккал${gk?` · ${Math.round(akc/gk*100)}%`:""}</span></div>${kbar(A,gk,akc)}<div class="mac">${mtile("Белки",A.p,G.p,"var(--p)",1,ash[0])}${mtile("Жиры",A.f,G.f,"var(--f)",0,ash[1])}${mtile("Углеводы",A.c,G.c,"var(--c)",0,ash[2])}</div></div>`;
 const dn=n=>n%10===1&&n%100!==11?"день":(n%10>=2&&n%10<=4&&(n%100<10||n%100>=20))?"дня":"дней";
 h+=`<div class="stt"><div><div class="v">${N}<small>из ${days.length}</small></div><div class="l">${dn(N)} с записями</div></div><div><div class="v">${inN}</div><div class="l">в норме ±10%</div></div><div><div class="v">${best}</div><div class="l">${streak&&streak!==best?`серия · сейчас ${streak}`:"дней подряд"}</div></div></div>`;
 const c1=chKcal(days,gk,W);
 h+=`<div class="stb"><h4>Калории по дням</h4><div class="sd rdo" id="rd1" data-def="Столбец — день, цвета — вклад Б / Ж / У, пунктир — норма.">Столбец — день, цвета — вклад Б / Ж / У, пунктир — норма.</div><div class="chw" id="ch1">${c1.svg}</div></div>`+(WB?WB.html:"");
 const c2=chMac(days,{p:G.p,f:G.f,c:G.c},W);
 h+=`<div class="stb"><h4>БЖУ по дням</h4><div class="sd rdo" id="rd2" data-def="В процентах от нормы, пунктир — 100%.">В процентах от нормы, пунктир — 100%.</div><div class="leg">${MCH.map(([k,n,c,da])=>`<span><svg viewBox="0 0 18 6"><line x1="1" x2="17" y1="3" y2="3" stroke="${c}" stroke-width="2" stroke-linecap="round"${da?` stroke-dasharray="${da}"`:""}/></svg>${n}</span>`).join("")}</div><div class="chw" id="ch2">${c2.svg}</div></div>`;
 // чаще всего — строками, как записи дня
 const cnt={};lg.forEach(x=>x.E.forEach(e=>{const o=cnt[e.n]||(cnt[e.n]={n:e.n,c:0,k:0});o.c++;o.k+=kc(e.p,e.f,e.c)}));
 const top=Object.values(cnt).sort((a,b)=>b.c-a.c||b.k-a.k).slice(0,5);
 h+=`<div class="stb sttop"><h4>Чаще всего</h4><div class="il">${top.map(o=>`<div class="it"><span class="tc">${o.c}×</span><div><div class="n">${esc(o.n)}</div><div class="mu">≈ ${Math.round(o.k/o.c)} ккал за раз</div></div><b>${o.k}<small>ккал</small></b></div>`).join("")}</div></div>`;
 $("stc").innerHTML=h;
 // касание столбца/точки — подсказка (сдвиг пальцем ведёт её по дням)
 const fmt=stFmt,bind=(...a)=>stBind(days,W,...a);
 if(WB)bindWt(days,W,WB.c);
 bind("ch1","rd1",c1,d=>`${fmt(d)} · <b>${d.kc}</b> ккал${gk?` · ${Math.round(d.kc/gk*100)}%`:""}`,i=>$("ch1").querySelectorAll("[data-i]").forEach(p=>p.style.opacity=i<0||+p.dataset.i===i?"":".3"));
 bind("ch2","rd2",c2,d=>`${fmt(d)}`+MCH.map(([k,n,c])=>`<i style="background:${c}"></i>${n[0]} <b>${G[k]?Math.round(d[k]/G[k]*100):0}%</b>`).join(""),i=>{const l=$("ch2").querySelector(".cx");if(i<0)l.setAttribute("opacity","0");else{const x=c2.L+i*c2.st+c2.st/2;l.setAttribute("x1",x);l.setAttribute("x2",x);l.setAttribute("opacity",".6")}});
}
const stFmt=x=>new Date(x.k+"T12:00:00").toLocaleDateString("ru-RU",{day:"numeric",month:"short"});
 // табло под заголовком: при касании — данные дня, после отпускания — снова пояснение
 function stBind(days,W,id,rid,c,tip,mark,has=d=>d.n){const w=$(id),t=$(rid),sv_=w.querySelector("svg");let tm=0;
  const at=e=>{clearTimeout(tm);const r=sv_.getBoundingClientRect(),x=(e.clientX-r.left)*(W/r.width),i=Math.max(0,Math.min(days.length-1,Math.floor((x-c.L)/c.st)));const d=days[i];
   if(!has(d)){t.innerHTML=`${stFmt(d)} · записей нет`;t.classList.add("on");mark(-1);return}t.innerHTML=tip(d);t.classList.add("on");mark(i)};
  w.addEventListener("pointerdown",e=>{at(e)});w.addEventListener("pointermove",e=>{if(e.pressure||e.buttons)at(e)});
  const off=()=>{clearTimeout(tm);tm=setTimeout(()=>{t.textContent=t.dataset.def;t.classList.remove("on");mark(-1)},1600)};w.addEventListener("pointerup",off);w.addEventListener("pointercancel",off)}
function bindWt(days,W,c){stBind(days,W,"ch3","rd3",c,d=>wTip(d,c),i=>{const l=$("ch3").querySelector(".cx");$("ch3").querySelectorAll("circle").forEach(p=>p.setAttribute("r",+p.dataset.i===i?"5":"3.4"));if(i<0)l.setAttribute("opacity","0");else{const x=c.X(i);l.setAttribute("x1",x);l.setAttribute("x2",x);l.setAttribute("opacity",".6")}},d=>d.w)}
// свайп по экрану статистики (кроме графиков) — соседний месяц
(()=>{const v=$("v9");let x0=null,y0=0;v.addEventListener("touchstart",e=>{x0=e.target.closest(".chw")?null:e.touches[0].clientX;y0=e.touches[0].clientY},{passive:true});
 v.addEventListener("touchend",e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;x0=null;if(Math.abs(dx)>70*GF()&&Math.abs(dx)>Math.abs(dy)*1.6){hap(6,1);stMv(dx<0?1:-1)}},{passive:true})})();
