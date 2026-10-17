// Карточка дня (тройное касание), компактный/подробный вид
// ===== Карточка дня: тройное касание по итогу дня — включить, по карточке — выключить =====
let REP=0;
// Карточка всегда целиком помещается на экран (чтобы её можно было снять одним скриншотом):
// 1) продукты в каждом приёме — компактной строкой; 2) если всё ещё длинная — карточка уменьшается целиком
let repMode=0;
function setRepMode(m){repMode=m;render();scrollTo(0,0);hap(10);const c=$("app").querySelector(".rep");if(c&&!RM())try{c.animate([{opacity:.4,transform:`scale(${m===1?1.02:.98})`},{opacity:1,transform:"none"}],{duration:280,easing:"cubic-bezier(.22,1,.36,1)"})}catch(e){}}
const repDense=()=>{const c=$("app").querySelector(".rep");return !!c&&(c.classList.contains("dense")||!!c.style.zoom)};
function repFit(){const app=$("app");let c=app.querySelector(".rep");if(!c)return;
 if(repMode===2)return;if(repMode===1){app.innerHTML=repHTML(1);c=app.querySelector(".rep")}const avail=innerHeight-(parseFloat(getComputedStyle(document.documentElement).paddingTop)||0)-(parseFloat(getComputedStyle(document.documentElement).paddingBottom)||0)-28;
 if(c.offsetHeight>avail){app.innerHTML=repHTML(1);c=app.querySelector(".rep")}
 if(c.offsetHeight>avail){const z=Math.max(.5,avail/c.offsetHeight);c.style.zoom=z}}
function repHTML(dense){const E=S.d[cur]||[],t=E.reduce((a,e)=>({p:a.p+e.p,f:a.f+e.f,c:a.c+e.c}),{p:0,f:0,c:0}),G=S.g,gk=kc(G.p,G.f,G.c),k=kc(t.p,t.f,t.c),left=gk-k;
 const dd=new Date(cur+"T12:00:00"),title=cap(dd.toLocaleDateString("ru-RU",{weekday:"long"}))+", "+dd.toLocaleDateString("ru-RU",{day:"numeric",month:"long"})+(dd.getFullYear()!==new Date().getFullYear()?" "+dd.getFullYear():"");
 // кольцо: доли калорий Б/Ж/У одним цельным кругом, цвета плавно перетекают друг в друга (как на логотипе)
 const kp=[t.p*4,t.f*9,t.c*4],ks=kp[0]+kp[1]+kp[2],col=["var(--p)","var(--f)","var(--c)"];
 let grad="var(--sub)";
 if(ks>0){const seg=kp.map((v,i)=>[v/ks*100,col[i]]).filter(x=>x[0]>0);if(seg.length===1)grad=seg[0][1];else{let st=0,parts=[];const bl=4;
  seg.forEach(([w,c],j)=>{const a=st,b=st+w;parts.push(`${c} ${j?Math.min(b,a+bl/2):a}% ${j===seg.length-1?Math.max(a,b-bl/2):Math.max(a,b-bl/2)}%`);st=b});
  parts.push(`${seg[0][1]} 100%`);grad=`conic-gradient(from 0deg,${parts.join(",")})`}}
 const ring=`<div class="rp-ring" style="--rg:${grad}"><div class="rp-rc"><b>${gk?Math.round(k/gk*100):0}%</b><span>нормы</span></div></div>`;
 // Б / Ж / У — те же плитки, что на главном экране (съедено / норма, полоска, остаток, доля калорий)
 const sh=ks>0?kp.map(v=>Math.round(v/ks*100)):[];
 let h=`<div class="rep rep-in${dense?" dense":""}"><div class="rp-h"><div><div class="rp-d">${esc(title)}</div><div class="rp-k">${k}<span>из ${gk} ккал</span></div><div class="rp-l${left<0?" ov":""}">${left>=0?`Осталось <b>${left}</b> ккал`:`Перебор <b>${-left}</b> ккал`}</div>${wtRep()}</div>${ring}</div>`;
 h+=`<div class="mac rp-mac">${mtile("Белки",t.p,G.p,"var(--p)",1,sh[0])}${mtile("Жиры",t.f,G.f,"var(--f)",0,sh[1])}${mtile("Углеводы",t.c,G.c,"var(--c)",0,sh[2])}</div>`;
 // приёмы пищи — один блок, приёмы разделены тонкой линией; компактно — продукты плашками, подробно — строками
 const meals=MEALS.map((m,mi)=>[m,E.filter(e=>e.m===mi),mi]).filter(x=>x[1].length);
 if(!meals.length)h+=`<div class="rp-empty">Записей за этот день нет</div>`;
 else{h+=`<div class="rp-ml">`;meals.forEach(([m,it,mi])=>{const s0=it.reduce((a,e)=>({p:a.p+e.p,f:a.f+e.f,c:a.c+e.c}),{p:0,f:0,c:0}),amt=e=>e.ul?f1(e.q)+" "+esc(e.ul):f1(e.g)+" г";
  h+=`<div class="rp-meal"><div class="rp-mh"><b>${LBL[mi]}</b>${dense?"":`<span class="rp-mm">Б ${f1(s0.p)} · Ж ${f1(s0.f)} · У ${f1(s0.c)}</span>`}<span class="kp">${kc(s0.p,s0.f,s0.c)} ккал</span></div>`+
   (dense?`<div class="rp-dl">${it.map(e=>`<span><i>${esc(e.n)}</i><em>${amt(e)}</em><b>${kc(e.p,e.f,e.c)}</b></span>`).join("")}</div>`
    :it.map(e=>`<div class="rp-it"><span>${esc(e.n)}</span><em>${amt(e)}</em><b>${kc(e.p,e.f,e.c)}</b></div>`).join(""))+`</div>`});h+=`</div>`}
 h+=`<div class="rp-f"><span>Норма: ${gk} ккал · Б ${G.p} · Ж ${G.f} · У ${G.c} г</span><span><img src="icon-192.png" alt="">БЖУ</span></div></div>`;
 return h}
function togRep(on){REP=on==null?!REP:on;repMode=0;document.documentElement.classList.toggle("repm",!!REP);hap(10);render();scrollTo(0,0);
 if(!REP&&!RM())try{$("app").animate([{opacity:0,transform:"scale(.98)"},{opacity:1,transform:"none"}],{duration:280,easing:"cubic-bezier(.22,1,.36,1)"})}catch(e){}
 if(REP)toast("Свайп вверх/вниз — вид · три касания — назад",0,2600)}
(()=>{let n=0,t=0,x=0,y=0,sw=0;
 addEventListener("pointerdown",e=>{x=e.clientX;y=e.clientY},true);
 addEventListener("pointerup",e=>{if(isOpen||e.button>0)return;if(Math.hypot(e.clientX-x,e.clientY-y)>12){n=0;return}
  const el=e.target.closest&&e.target.closest(REP?"#app .rep":"#app .sum");if(!el){n=0;return}
  const now=Date.now();n=now-t<450?n+1:1;t=now;if(n>=3){n=0;sw=now+500;togRep()}},true);
 // клик от этого же касания не должен попасть в новую разметку под пальцем (например, в «+»)
 addEventListener("click",e=>{if(Date.now()<sw){e.preventDefault();e.stopPropagation();sw=0}},true)})();
