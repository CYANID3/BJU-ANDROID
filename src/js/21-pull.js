// Жесты «потянуть вверх/вниз» и их индикатор
// Жесты «потянуть»: индикатор-кольцо следует за пальцем; срабатывает по расстоянию или резкому рывку.
// длина «потянуть вверх/вниз»: короткий ≈21 px, средний ≈96 px, длинный ≈326 px
const PLV={short:[.22,.15,.15],mid:[1,.45,.45],long:[3.4,9,1]},PL=i=>PLV[slv()][i],THv=()=>96*PL(0);let rd=0,pAct=0,pDn=false,pbY=null,ptY=null,PS=[];
// скорость (px/мс) по последним ~100 мс жеста
const pVel=()=>{const l=PS[PS.length-1];if(!l)return 0;let o=l;for(const q of PS)if(l[0]-q[0]<=100){o=q;break}return l[0]>o[0]?(l[1]-o[1])/(l[0]-o[0]):0};
const atBot=()=>scrollY+innerHeight>=document.documentElement.scrollHeight-6;
// Индикатор «потянуть»: всегда идёт за пальцем в одном темпе (0.7 от движения, дальше — «резина»),
// при движении назад так же плавно возвращается; исчезает только после отпускания пальца.
function pull(v,dn){const u=$("pu"),w=u.firstElementChild,a=REP?"on":dn?(dwOn()?"on":"off"):swAct();dn=!!dn;
 if(a==="off"){if(pAct)phide();return}
 if(!pAct&&v<8)return;
 if(!pAct||pDn!==dn){pAct=1;pDn=dn;rd=0;pC=null;u.classList.remove("go","rdy");u.classList.add("drag");u.classList.toggle("tp",dn);
  const k=dn?dwAct():swAct();$("pa").innerHTML=ic(REP?(dn?"expand":"collapse"):dn?(k==="today"?"today":"cal"):({prod:"box",stat:"chart",wt:"scale"}[k]||"plus"));
  $("pt").textContent=REP?(dn?"Подробный вид":"Компактный вид"):dn?(k==="today"?"К сегодня":"Календарь"):({prod:"Новый продукт",stat:"Статистика",wt:"Вес"}[k]||"Добавить: "+LBL[autoMeal()])}
 v=Math.max(0,v);const TH=THv(),CAP=120,off=v<=CAP?v*.7:CAP*.7+(v-CAP)*.12;
 const r=rd?v>=TH*.92:v>=TH;if(r!==rd){rd=r;u.classList.toggle("rdy",r);if(r)hap(12)}
 pT={off,p:Math.min(1,v/TH),dn};if(!pRaf)pRaf=requestAnimationFrame(pStep)}
// индикатор догоняет палец каждый кадр (а не рывками по событиям касания): мягко, без дрожания,
// одинаково при движении вперёд и назад
let pT=null,pC=null,pRaf=0;
function pStep(){pRaf=0;if(!pAct||!pT)return;const u=$("pu"),w=u.firstElementChild,c=pC||(pC={off:0,p:0}),k=.42;
 c.off+=(pT.off-c.off)*k;c.p+=(pT.p-c.p)*k;if(Math.abs(pT.off-c.off)<.3){c.off=pT.off;c.p=pT.p}
 const y=90-c.off;u.style.opacity=Math.min(1,c.off/36);w.style.transform=`translateY(${pT.dn?-y:y}px)`;
 u.style.setProperty("--pgr",c.p);u.style.setProperty("--plo",Math.max(0,Math.min(1,(c.off-24)/30)));
 if(c.off!==pT.off)pRaf=requestAnimationFrame(pStep)}
function phide(){const u=$("pu");pAct=0;rd=0;pT=pC=null;u.classList.remove("drag","rdy");u.style.opacity=0;u.firstElementChild.style.transform="";u.style.setProperty("--pgr",0);u.style.setProperty("--plo",0)}
function pgo(){const u=$("pu");pAct=0;rd=0;pT=pC=null;u.classList.remove("drag");u.classList.add("rdy","go");u.style.setProperty("--pgr",1);u.style.opacity="";
 setTimeout(()=>{u.classList.remove("go","rdy");u.style.opacity=0;u.firstElementChild.style.transform="";u.style.setProperty("--pgr",0);u.style.setProperty("--plo",0)},360)}
function dwAct(){const v=S.set&&S.set.dw;return v==="today"||v==="off"?v:"cal"}
function dwOn(){const a=dwAct();return a==="cal"||(a==="today"&&cur!==today)}
function dwDo(){if(dwAct()==="today"){if(cur!==today){const d=today>cur?1:-1;NABS=1;slide($("app"),d,()=>{cur=today})}}else if(dwAct()==="cal")cal()}
function setDw(v){S.set=Object.assign({},S.set,{dw:v});saveq();drawSet()}
const onMv=e=>{if(e._m)return;e._m=1;if(isOpen)return;const t=e.touches[0],dx=t.clientX-sx,dy=t.clientY-sy;
 if(!gd){const s0=SL(3),k=SL(4);if(Math.abs(dx)>s0&&Math.abs(dx)>Math.abs(dy)*k)gd=1;else if(Math.abs(dy)>s0)gd=2}
 if(gd===1&&e.touches.length===1){drag(dx);if(pAct)phide();return}
 if(dgd&&e.touches.length>1){undrag(1);return}
 if(gd!==2||e.touches.length>1){if(pAct)phide();return}
 // край страницы мог быть достигнут уже во время жеста — отсчёт идёт от этой точки
 if(pbY===null&&dy<0&&atBot())pbY=t.clientY;
 if(ptY===null&&dy>0&&scrollY<=2)ptY=t.clientY;
 const up=pbY!==null?pbY-t.clientY:0,dn=ptY!==null?t.clientY-ptY:0,v=Math.max(up,dn,0);
 PS.push([e.timeStamp,v]);if(PS.length>8)PS.shift();
 if(Math.abs(dx)>Math.max(70,v*.9)/SL(4)*1.5){if(pAct)phide();return}
 if(REP){const d=repDense();if(up>0&&!d)pull(up);else if(dn>0&&d)pull(dn,1);else if(pAct)pull(0,pDn);return}
 if(up>0)pull(up);else if(dn>0&&dwOn())pull(dn,1);else if(pAct)pull(0,pDn);
 // пока тянется индикатор, страница под пальцем не прокручивается (иначе при отмене она едет вместе с пальцем и всё дёргается)
 if(pAct&&e.cancelable)e.preventDefault()};addEventListener("touchmove",onMv,{passive:false});
const onEn=e=>{if(e._e)return;e._e=1;if(isOpen||!gd){if(pAct)phide();return}const t=e.changedTouches[0],dx=t.clientX-sx,g=gd;gd=0;
 if(g===1){if(pAct)phide();const gf=GF();if(Math.abs(dx)>56*gf||(Math.abs(dx)>56*gf*SL(2)&&Date.now()-st<(gf<1?320:gf>1?200:260))){GQ=dgx;go(dx<0?1:-1);GQ=0;undrag(1)}else undrag();return}
 if(!pAct)return;
 const ve=pDn?(ptY!==null?t.clientY-ptY:0):(pbY!==null?pbY-t.clientY:0);PS.push([e.timeStamp,ve]);
 // сработало: дотянули до порога или резко дёрнули (почти половина пути и > 0.45 px/мс)
 if(rd||(ve>THv()*PL(2)&&pVel()>PL(1))){const dn=pDn;if(!rd)hap(12);pgo();if(REP)setRepMode(dn?2:1);else if(dn)dwDo();else swipeAct()}else phide()};addEventListener("touchend",onEn);
const onCn=()=>{if(pAct)phide();gd=0;undrag()};addEventListener("touchcancel",onCn);
