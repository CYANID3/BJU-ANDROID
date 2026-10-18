// Карточка дня (тройное касание), компактный/подробный вид
// ===== Карточка дня: тройное касание по итогу дня — включить, по карточке — выключить =====
let REP=0;
// Карточка всегда целиком помещается на экран (чтобы её можно было снять одним скриншотом):
// 1) продукты в каждом приёме — компактной строкой; 2) если всё ещё длинная — карточка уменьшается целиком
let repMode=1;// 1 — компактный (по умолчанию), 2 — подробный, 0 — авто (подробный, если помещается)
function setRepMode(m){repMode=m;render();scrollTo(0,0);hap(10);const c=$("app").querySelector(".rep");if(c&&!RM())try{c.animate([{opacity:.4,transform:`scale(${m===1?1.02:.98})`},{opacity:1,transform:"none"}],{duration:MO.t2,easing:MO.E})}catch(e){}}
const repDense=()=>{const c=$("app").querySelector(".rep");return !!c&&(c.classList.contains("dense")||!!c.style.zoom)};
// Подгонка под экран (авто и компактный вид): 1) компактный вид; 2) продукты в две колонки;
// 3) лёгкое уменьшение всей карточки (две колонки — только для очень насыщенного дня) — с повторным замером, пока низ карточки не окажется на экране
function repFit(){const app=$("app");let c=app.querySelector(".rep");if(!c)return;if(repMode===2)return;
 // меряем раскладку (offsetTop / offsetHeight × zoom), а не getBoundingClientRect — на нём сказывается анимация появления
 const lim=()=>innerHeight-(parseFloat(getComputedStyle(document.documentElement).paddingBottom)||0)-14,zo=()=>parseFloat(c.style.zoom||1),
  top=()=>{let y=0,e=c;while(e){y+=e.offsetTop;e=e.offsetParent}return y-scrollY},hh=()=>c.offsetHeight*zo(),fits=()=>top()+hh()<=lim();
 if(repMode===1||!fits()){app.innerHTML=repHTML(1);c=app.querySelector(".rep")}
 // две колонки — только если одной колонке пришлось бы уменьшиться сильнее, чем до 85 % (иначе названия обрезаются зря)
 if(!fits()&&(lim()-top())/hh()<.85&&c.querySelectorAll(".rp-it").length>8)c.classList.add("d2");
 for(let k=0;k<5&&!fits();k++)c.style.zoom=Math.max(.5,zo()*(lim()-top())/hh()*(k?.98:1))}
addEventListener("resize",()=>{if(REP)requestAnimationFrame(()=>{if(REP){const y=scrollY;render();scrollTo(0,y)}})});
// Б / Ж / У цветными буквами: «Б 22,1  Ж 1,3  У 0»
const mxs=e=>[["p","Б",e.p],["f","Ж",e.f],["c","У",e.c]].map(([k,l,v])=>`<i class="mx ${k}">${l}</i>${f1(v)}`).join(" ");
// полоса состава приёма: вклад Б / Ж / У в его калории, на всю ширину
function cbar(t){const part=[t.p*4,t.f*9,t.c*4],sum=part[0]+part[1]+part[2]||1;return `<div class="bar km cb">${part.map((v,i)=>v>0?`<i style="flex:${v/sum};background:${["var(--p)","var(--f)","var(--c)"][i]}"></i>`:"").join("")}</div>`}
function repHTML(dense){const E=S.d[cur]||[],t=E.reduce((a,e)=>({p:a.p+e.p,f:a.f+e.f,c:a.c+e.c}),{p:0,f:0,c:0}),G=S.g,gk=kc(G.p,G.f,G.c),k=kc(t.p,t.f,t.c),left=gk-k;
 const dd=new Date(cur+"T12:00:00"),title=cap(dd.toLocaleDateString("ru-RU",{weekday:"long"}))+", "+dd.toLocaleDateString("ru-RU",{day:"numeric",month:"long"})+(dd.getFullYear()!==new Date().getFullYear()?" "+dd.getFullYear():"");
 const kp=[t.p*4,t.f*9,t.c*4],ks=kp[0]+kp[1]+kp[2],col=["var(--p)","var(--f)","var(--c)"];
 // кольцо долей калорий Б / Ж / У — дугами SVG (сглаживаются чисто, в отличие от conic-gradient): ровные узкие зазоры между цветами
 const R=44.5,SW=11,arc=(len,off,c)=>`<circle cx="50" cy="50" r="${R}" pathLength="100" fill="none" stroke="${c}" stroke-width="${SW}" stroke-dasharray="${len.toFixed(3)} ${(100-len).toFixed(3)}" stroke-dashoffset="${(-off).toFixed(3)}"/>`;
 let arcs=arc(100,0,"var(--sub)");
 if(ks>0){const seg=kp.map((v,i)=>[v/ks*100,col[i]]).filter(x=>x[0]>0);if(seg.length===1)arcs=arc(100,0,seg[0][1]);else{const gap=.9;let st=0;arcs="";
  seg.forEach(([w,c])=>{arcs+=arc(Math.max(.5,w-gap),st+gap/2,c);st+=w})}}
 const ring=`<div class="rp-ring"><svg viewBox="0 0 100 100" aria-hidden="true"><g transform="rotate(-90 50 50)">${arcs}</g></svg><div class="rp-rc"><b>${gk?Math.round(k/gk*100):0}%</b><span>нормы</span></div></div>`;
 // Б / Ж / У — те же плитки, что на главном экране (съедено / норма, полоска, остаток, доля калорий)
 const sh=ks>0?kp.map(v=>Math.round(v/ks*100)):[];
 let h=`<div class="rep rep-in${dense?" dense":""}"><div class="rp-h"><div><div class="rp-d">${esc(title)}</div><div class="rp-k">${k}<span>из ${gk} ккал</span></div><div class="rp-l${left<0?" ov":""}">${left>=0?`Осталось <b>${left}</b> ккал`:`Перебор <b>${-left}</b> ккал`}</div>${wtRep()}</div>${ring}</div>`;
 h+=`<div class="mac rp-mac">${mtile("Белки",t.p,G.p,"var(--p)",1,sh[0])}${mtile("Жиры",t.f,G.f,"var(--f)",0,sh[1])}${mtile("Углеводы",t.c,G.c,"var(--c)",0,sh[2])}</div>`;
 // приёмы пищи — один блок, приёмы через тонкую линию; продукты — ровные строки: название · количество · ккал
 // (компактный вид — те же колонки мельче и плотнее, без БЖУ приёма)
 const meals=MEALS.map((m,mi)=>[m,E.filter(e=>e.m===mi),mi]).filter(x=>x[1].length);
 if(!meals.length)h+=`<div class="rp-empty">Записей за этот день нет</div>`;
 else{h+=`<div class="rp-ml">`;meals.forEach(([m,it,mi])=>{const s0=it.reduce((a,e)=>({p:a.p+e.p,f:a.f+e.f,c:a.c+e.c}),{p:0,f:0,c:0}),amt=e=>e.ul?f1(e.q)+" "+esc(e.ul):f1(e.g)+" г";
  h+=`<div class="rp-meal"><div class="rp-mh"><b>${LBL[mi]}</b>${dense?"":`<span class="rp-mm">${mxs(s0)}</span>`}<span class="kp">${kc(s0.p,s0.f,s0.c)} ккал</span></div>`+
   (dense?"":`<div class="rp-mb">${cbar(s0)}<span>${gk?Math.round(kc(s0.p,s0.f,s0.c)/gk*100):0}% нормы</span></div>`)+`<div class="rp-its">`+it.map(e=>`<div class="rp-it"><span>${esc(e.n)}</span><em>${amt(e)}</em><b>${kc(e.p,e.f,e.c)}</b>${dense?"":`<small>${mxs(e)}</small>`}</div>`).join("")+`</div></div>`});h+=`</div>`}
 h+=`<div class="rp-f"><span>Норма: ${gk} ккал · Б ${G.p} · Ж ${G.f} · У ${G.c} г</span><span><img src="icon-192.png" alt="">БЖУ</span></div></div>`;
 return h}
function togRep(on){REP=on==null?!REP:on;repMode=1;document.documentElement.classList.toggle("repm",!!REP);hap(10);render();scrollTo(0,0);
 if(!REP&&!RM())try{$("app").animate([{opacity:0,transform:"scale(.98)"},{opacity:1,transform:"none"}],{duration:MO.t2,easing:MO.E})}catch(e){}
 if(REP)toast("Свайп вверх/вниз — вид · три касания — назад",0,2600)}
(()=>{let n=0,t=0,x=0,y=0,sw=0;
 addEventListener("pointerdown",e=>{x=e.clientX;y=e.clientY},true);
 addEventListener("pointerup",e=>{if(isOpen||e.button>0)return;if(Math.hypot(e.clientX-x,e.clientY-y)>12){n=0;return}
  const el=e.target.closest&&e.target.closest(REP?"#app .rep":"#app .sum");if(!el){n=0;return}
  const now=Date.now();n=now-t<450?n+1:1;t=now;if(n>=3){n=0;sw=now+500;togRep()}},true);
 // клик от этого же касания не должен попасть в новую разметку под пальцем (например, в «+»)
 addEventListener("click",e=>{if(Date.now()<sw){e.preventDefault();e.stopPropagation();sw=0}},true)})();
