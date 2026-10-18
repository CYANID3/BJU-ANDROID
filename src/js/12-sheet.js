// Нижний лист: переходы между экранами, открытие/закрытие
let svBack=0,svFocus=0;const VWS=[1,2,3,4,5,6,7,8,9,10,11,12];
// Высота листа после смены экрана с учётом того, где окажется клавиатура (откроется / закроется / останется)
let hPend=0,hT=0;
// убрать временную высоту листа (после того как клавиатура доехала); небольшую разницу — плавно
function clearH(now){if(!hPend)return;hPend=0;clearTimeout(hT);const sh=document.querySelector("#ov .sh"),c=sh.offsetHeight;sh.style.height="";if(now||RM()||!isOpen)return;const n=sh.offsetHeight;if(Math.abs(c-n)>2)try{sh.animate([{height:c+"px"},{height:n+"px"}],{duration:MO.t2,easing:MO.E})}catch(e){}}
const kbFuture=willKb=>willKb?(kbH>0?kbH:kbLast||Math.round(innerHeight*.38)):0;
function svTargetH(sh,willKb){const nat=document.documentElement.classList.contains("native"),kbF=!nat?0:willKb?(kbH>0?kbH:kbLast):0;
 if(!nat||kbF===kbH)return sh.offsetHeight;const ov=$("ov").clientHeight,sat=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sat"))||0;
 return Math.min(sh.scrollHeight,Math.min(ov*.92,ov-sat-12)-kbF)}
function sv(n,t){const sh_=document.querySelector("#ov .sh"),prev=VWS.find(i=>!$("v"+i).hidden),h0=isOpen?sh_.offsetHeight:0,back=svBack,willKb=svFocus;svBack=0;svFocus=0;clearH(1);
 VWS.forEach(i=>$("v"+i).hidden=i!==n);$("st").textContent=t||"";
 if(!isOpen||prev===n)return;sh_.scrollTop=0;if(RM()||!sh_.animate)return;
 const E={duration:MO.t2,easing:MO.E};
 try{$("v"+n).animate([{opacity:0,transform:`translateX(${back?-24:24}px)`},{opacity:1,transform:"none"}],E);$("st").animate([{opacity:0},{opacity:1}],{duration:MO.t2})}catch(e){}
 const kbF=kbFuture(willKb);
 if(document.documentElement.classList.contains("native")&&kbF!==kbH){
  // клавиатура сейчас поедет: высота = (содержимое + клавиатура в конце) − текущая клавиатура.
  // Пока клавиатура движется (покадрово), верх окна стоит на месте в своей конечной точке.
  const ov=$("ov").clientHeight,sat=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sat"))||0,
   nat=Math.min(sh_.scrollHeight,Math.min(ov*.92,ov-sat-12)-kbF),tgt=`calc(${Math.round(nat+kbF)}px - var(--kb))`;
  sh_.style.height=tgt;hPend=1;clearTimeout(hT);hT=setTimeout(()=>clearH(),1200);
  try{sh_.animate([{height:h0+"px"},{height:tgt}],E)}catch(e){}
  return}
 const h1=svTargetH(sh_,willKb);
 if(Math.abs(h1-h0)>4)try{sh_.animate([{height:h0+"px"},{height:h1+"px"}],E)}catch(e){}}
const LBL=["Завтрак","Перекус 1","Обед","Перекус 2","Ужин","Перекус 3"];
function autoMeal(){const h=new Date().getHours()+new Date().getMinutes()/60;return h<11?0:h<12.5?1:h<15?2:h<18?3:h<21?4:5}
// выбор приёма пищи — при добавлении (список продуктов и количество): жест и «＋» в виджете подставляют приём по времени, здесь его можно сменить.
// При изменении записи переключателя нет — меняется только количество. Сетка 3×2: в столбце основной приём и перекус после него.
const MCO=[0,2,4,1,3,5];
function drawMc(){$("dbn").textContent=mode==="ing"?"Назад к блюду":"Новое блюдо";const nd=`onmousedown="event.preventDefault()"`;
 [["mc",mode==="add"],["em",mode==="add"&&ei<0]].forEach(([id,on])=>{const el=$(id);el.hidden=!on;if(on)el.innerHTML=MCO.map(i=>`<button class="${i===am?"on":""}" role="radio" aria-checked="${i===am}" ${nd} onclick="sm(${i})">${LBL[i]}</button>`).join("")})}
function sm(i){if(am===i)return;am=i;drawMc();hap(4);$("st").textContent=!$("v2").hidden?LBL[i]:"Добавить: "+LBL[i]}
function op(m){am=m;mode="add";$("q").value="";lst();drawMc();sv(1,"Добавить: "+LBL[m]);show()}
function mng(){mode="mng";pFl=0;$("q").value="";lst();drawMc();sv(1,"Все продукты ("+S.db.length+")");show()}
const num=v=>parseFloat(String(v).replace(",","."))||0,nn=v=>Math.max(0,num(v));
let ei=-1,lastDel=null,tmr,isOpen=false;
function show(){if(!isOpen){isOpen=true;oa=Date.now();if(!NATIVE)try{history.pushState({o:1},"")}catch(e){}}$("ov").classList.add("on");document.documentElement.classList.add("lk")}
function closeUI(){if(!isOpen)return;clearH(1);fch=0;cpm=-1;isOpen=false;if(mode==="ing")mode=pmode;ik=-1;$("ov").classList.remove("on");document.documentElement.classList.remove("lk");ei=-1;try{document.activeElement.blur()}catch(e){}}
async function xcl(){if(!v3ok&&!$("v3").hidden&&v3sig()!==v3snap&&!await ask("Продукт не сохранён. Закрыть без сохранения?","Закрыть",1))return;if(!$("v8").hidden&&($("dn").value.trim()||dr.i.length)&&!await ask("Закрыть без сохранения блюда?","Закрыть",1))return;cl()}
function cl(){const was=isOpen;closeUI();if(was&&!NATIVE){try{if(history.state&&history.state.o)history.back()}catch(e){}}}
