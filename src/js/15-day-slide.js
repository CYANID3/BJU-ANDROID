// Анимация перелистывания дней
let NAV=0,RDEF=0,NF=[],NB=0,ND=1,NP=null,NABS=0,GQ=0;const RM=()=>matchMedia("(prefers-reduced-motion:reduce)").matches;
function curX(el){try{const t=getComputedStyle(el).transform;return t&&t!=="none"?new DOMMatrix(t).m41:0}catch(e){return 0}}
function slide(el,n,fn){
 if(el.id!=="app"){fn();if(RM()||!el.animate)return;try{el.animate([{opacity:.3,transform:`translateX(${n*28}px)`},{opacity:1,transform:"none"}],{duration:MO.t2,easing:MO.E})}catch(e){}return}
 if(RM()||!el.animate){NABS=0;fn();render();return}
 NF.push(fn);ND=n>0?1:-1;if(!NB)pump(el)}
function pump(el){NB=1;const x=curX(el),o=parseFloat(getComputedStyle(el).opacity)||1,a=el._a;el._a=null;if(a)a.cancel();
 // уход продолжает движение пальца (без отката назад); при быстром перелистывании — короче
 const d=ND,to=-d*Math.max(48,(x*-d>0?Math.abs(x):0)+32);let out;try{out=el.animate([{transform:`translateX(${x}px)`,opacity:o},{transform:`translateX(${to}px)`,opacity:0}],{duration:a?90:140,easing:MO.EI,fill:"forwards"})}catch(e){NB=0;apply(el,null,d);return}
 out.onfinish=()=>apply(el,out,d);setTimeout(()=>{if(NB&&el._o===out)apply(el,out,d)},400);el._o=out}
function apply(el,out,d){if(out){if(out._d)return;out._d=1}
 const fns=NF;NF=[];NP=null;NABS=0;NB=0;NAV=1;RDEF=1;try{fns.forEach(f=>f())}finally{RDEF=0}
 try{render();head()}finally{NAV=0}
 try{const inn=el.animate([{transform:`translateX(${d*56}px)`,opacity:0},{transform:"none",opacity:1}],{duration:MO.t3,easing:MO.E});el._a=inn;inn.onfinish=inn.oncancel=()=>{if(el._a===inn)el._a=null}}catch(e){}
 if(out)out.cancel()}
function fade(el){if(RM())return;try{el.animate([{opacity:0,transform:"scale(.97)"},{opacity:1,transform:"none"}],{duration:MO.t2,easing:MO.E})}catch(e){}}
