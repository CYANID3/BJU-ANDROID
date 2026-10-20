// Анимация перелистывания дней
let NAV=0,RDEF=0,NF=[],NB=0,ND=1,NP=null,NABS=0,GQ=0,SWV=0;const RM=()=>matchMedia("(prefers-reduced-motion:reduce)").matches;
function curX(el){try{const t=getComputedStyle(el).transform;return t&&t!=="none"?new DOMMatrix(t).m41:0}catch(e){return 0}}
function slide(el,n,fn){
 if(el.id!=="app"){fn();mo(el,[{opacity:.3,transform:`translateX(${n*28}px)`},{opacity:1,transform:"none"}]);return}
 if(RM()||!el.animate){NABS=0;fn();render();return}
 NF.push(fn);ND=n>0?1:-1;if(!NB)pump(el)}
function pump(el){NB=1;const x=curX(el),o=parseFloat(getComputedStyle(el).opacity)||1,a=el._a;el._a=null;if(a)a.cancel();
 // уход продолжает движение пальца (EV — без разгона с нуля). Темп — по скорости взмаха: быстрый уходит дальше
 // (инерция) и короче по времени (до 56 мс), медленный отпуск — 90 мс; следующий свайп во время появления дня — 64 мс,
 // очередь свайпов не отстаёт от пальца
 const d=ND,v=SWV,to=-d*Math.max(48,(x*-d>0?Math.abs(x):0)+32+Math.min(64,v*48));
 const dur=a||NF.length>1?64:v>.25?Math.max(56,90-(v-.25)*70):90;let out;try{out=el.animate([{transform:`translateX(${x}px)`,opacity:o},{transform:`translateX(${to}px)`,opacity:0}],{duration:dur,easing:MO.EV,fill:"forwards"})}catch(e){NB=0;apply(el,null,d);return}
 // новый день — сразу по истечении времени ухода: событие finish приходит на кадр-два позже (ещё ~30 мс задержки),
 // таймер на 400 мс — страховка, если вкладка была скрыта
 out.onfinish=()=>apply(el,out,d);setTimeout(()=>{if(NB&&el._o===out)apply(el,out,d)},dur);setTimeout(()=>{if(NB&&el._o===out)apply(el,out,d)},400);el._o=out}
function apply(el,out,d){if(out){if(out._d)return;out._d=1}
 const fns=NF;NF=[];NP=null;NABS=0;NB=0;NAV=1;RDEF=1;try{fns.forEach(f=>f())}finally{RDEF=0}
 try{render();head()}finally{NAV=0}
 // появление нового дня: после быстрого взмаха — короче (до 150 мс), после медленного — 230 мс
 const sp=SWV;SWV=0;try{const inn=el.animate([{transform:`translateX(${d*36}px)`,opacity:0},{transform:"none",opacity:1}],{duration:sp>.25?Math.max(150,230-(sp-.25)*110):230,easing:MO.E});el._a=inn;inn.onfinish=inn.oncancel=()=>{if(el._a===inn)el._a=null}}catch(e){}
 if(out)out.cancel()}
function fade(el){moSwap(el,0)}
