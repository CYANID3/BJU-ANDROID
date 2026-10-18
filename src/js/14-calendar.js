// Календарь: месяцы, годы, свайп за пальцем
let cm=[0,0];const cap=s=>s[0].toUpperCase()+s.slice(1);
let cv=0,cb=0;
const MN=Array.from({length:12},(_,i)=>cap(new Date(2000,i,1).toLocaleDateString("ru-RU",{month:"long"})));
function cal(){const d=new Date(cur+"T12:00:00");cm=[d.getFullYear(),d.getMonth()];cv=0;drawCal();sv(6,"Календарь");show()}
function vw(v){cb=cv;cv=v;drawCal();fade($("cg"))}
function mv(n){const el=$("cg");if(RM()||!el.animate){calStep(n);drawCal();return}if(el._co){el._co.finish()}calFlip(el,n,0,1)}
function pm(i){cm[1]=i;cv=0;drawCal();fade($("cg"))}
function py(y){cm[0]=y;cv=cb===1?1:0;drawCal();fade($("cg"))}
function drawCal(){const[y,m]=cm,gk=kc(S.g.p,S.g.f,S.g.c),g=$("cg"),ty=+today.slice(0,4),tmn=+today.slice(5,7)-1,mm=i=>String(i+1).padStart(2,"0");let h="";
 $("cwk").style.visibility=cv?"hidden":"";$("cmn").style.display=cv?"none":"";g.className="cg"+(cv?" m":"");
 if(cv===0){const n=new Date(y,m+1,0).getDate(),off=(new Date(y,m,1).getDay()+6)%7;let tot=0,days=0;
  for(let i=0;i<off;i++)h+='<div class="cd e"></div>';
  for(let d=1;d<=n;d++){const k=y+"-"+mm(m)+"-"+String(d).padStart(2,"0"),E=S.d[k]||[],s=dk(E);if(E.length){tot+=s;days++}
   h+=`<button class="cd${k===today?' t':''}${k===cur?' s':''}${s>gk?' o':''}" onclick="pd('${k}')" aria-label="${new Date(y,m,d).toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"})}${k===today?", сегодня":""}${E.length?", "+s+" ккал":", без записей"}"${k===cur?' aria-current="date"':''}>${d}<small>${E.length?s:"&nbsp;"}</small></button>`}
  for(let i=off+n;i<42;i++)h+='<div class="cd e"></div>';
  $("cmn").textContent=MN[m];$("cy").textContent=y;$("cy").onclick=()=>vw(2);$("cmn").onclick=()=>vw(1);
  $("cs").textContent=days?`Дней с записями: ${days} · в среднем ${Math.round(tot/days)} ккал`:"В этом месяце записей нет"}
 else if(cv===1){let all=0;for(let i=0;i<12;i++){const pre=y+"-"+mm(i),c=Object.keys(S.d).filter(k=>k.startsWith(pre)&&S.d[k].length).length;all+=c;
   h+=`<button class="cd${y===ty&&i===tmn?' t':''}${i===m?' s':''}" onclick="pm(${i})">${MN[i]}<small>${c?c+" дн.":"&nbsp;"}</small></button>`}
  $("cy").textContent=y;$("cy").onclick=()=>vw(2);$("cs").textContent=all?`Дней с записями за год: ${all}`:"В этом году записей нет"}
 else{const st=Math.floor(y/12)*12;for(let i=0;i<12;i++){const yr=st+i;h+=`<button class="cd${yr===ty?' t':''}${yr===y?' s':''}" onclick="py(${yr})">${yr}<small>&nbsp;</small></button>`}
  $("cy").textContent=st+"–"+(st+11);$("cy").onclick=()=>{cv=cb===1?1:0;drawCal();fade($("cg"))};$("cs").textContent=""}
 g.innerHTML=h}
function pd(k){if(cpm>=0){const mi=cpm,it=(S.d[cur]||[]).filter(e=>e.m===mi).map(e=>({...e}));cpm=-1;if(k===cur){cl();return}(S.d[k]=S.d[k]||[]).push(...it);cl();cur=k;save();render();toast("Скопировано записей: "+it.length);return}if(k===cur){cl();return}const dir=k>cur?1:-1;cl();NABS=1;slide($("app"),dir,()=>{cur=k})}
(()=>{const v=$("v6");let x0=null,y0=0,dx=0,md=0,lx=0,lt=0,vx=0;
 v.addEventListener("touchstart",e=>{if(e.touches.length>1){x0=null;return}x0=e.touches[0].clientX;y0=e.touches[0].clientY;dx=0;md=0;vx=0;lx=x0;lt=performance.now()},{passive:true});
 v.addEventListener("touchmove",e=>{if(x0===null)return;const t=e.touches[0],ddx=t.clientX-x0,ddy=t.clientY-y0,el=$("cg");
  if(!md){if(Math.abs(ddx)>10&&Math.abs(ddx)>Math.abs(ddy)*1.2){md=1;x0=t.clientX;if(el._ca){el._ca.cancel();el._ca=null}el.style.transition="none"}else if(Math.abs(ddy)>10){x0=null;return}else return}
  dx=t.clientX-x0;const n=performance.now();vx=(t.clientX-lx)/Math.max(1,n-lt);lx=t.clientX;lt=n;
  el.style.transform=`translateX(${dx}px)`;el.style.opacity=1-Math.min(.6,Math.abs(dx)/(el.offsetWidth*1.2||400))},{passive:true});
 const end=()=>{x0=null;if(!md)return;md=0;const el=$("cg"),w=el.offsetWidth||300;
  if(Math.abs(dx)>w*.22*GF()||(Math.abs(vx)>SL(1)*.8&&Math.abs(dx)>w*.22*GF()*SL(2))){hap(6,1);calFlip(el,dx<0?1:-1,dx,parseFloat(el.style.opacity)||1)}
  else{el.style.transition=`transform ${MO.t2}ms ${MO.E},opacity ${MO.t2}ms ${MO.E}`;el.style.transform="";el.style.opacity="";setTimeout(()=>{if(!md)el.style.transition=""},MO.t2)}};
 v.addEventListener("touchend",end);v.addEventListener("touchcancel",()=>{dx=0;vx=0;end()})})();
function calStep(n){if(cv===0){cm[1]+=n;if(cm[1]<0){cm[1]=11;cm[0]--}if(cm[1]>11){cm[1]=0;cm[0]++}}else if(cv===1)cm[0]+=n;else cm[0]+=n*12}
function calFlip(el,dir,from,op){const w=el.offsetWidth||300;el.style.transition="";el.style.transform="";el.style.opacity="";
 if(el._co){el._co.cancel();el._co=null}if(el._ca){el._ca.cancel();el._ca=null}
 const out=el.animate([{transform:`translateX(${from}px)`,opacity:op},{transform:`translateX(${-dir*w*.5}px)`,opacity:0}],{duration:Math.max(90,150*(1-Math.abs(from)/w)),easing:MO.EI,fill:"forwards"});el._co=out;
 out.onfinish=()=>{calStep(dir);drawCal();out.cancel();el._co=null;el._ca=el.animate([{transform:`translateX(${dir*w*.5}px)`,opacity:0},{transform:"none",opacity:1}],{duration:MO.t3,easing:MO.E})}}
