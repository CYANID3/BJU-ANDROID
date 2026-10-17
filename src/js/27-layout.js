// Расположение: нижняя панель — «Плавающая» (у края экрана, прячется при прокрутке вниз и появляется при прокрутке вверх),
// «Всегда видна» (закреплена у края) или «В конце страницы» (после приёмов пищи)
// и кнопки «Новый продукт» / «Новое блюдо» в списке продуктов (под списком / под поиском)
const bbv=()=>{const v=S.set&&S.set.bb;return v==="fix"||v==="page"?v:"float"},nbv=()=>S.set&&S.set.nb==="top"?"top":"bottom";
// высота закреплённой панели → --bth (под неё отступ страницы, тост и индикатор жеста «потянуть вверх»)
let bthRO=null;
function applyLay(){const r=document.documentElement,fix=bbv()!=="page",bt=document.querySelector(".bt");r.classList.toggle("bfix",fix||bbv()==="float");r.classList.toggle("bflt",bbv()==="float");if(bbv()!=="float")r.classList.remove("bhide");
 if(fix&&bt){const m=()=>r.style.setProperty("--bth",bt.offsetHeight+"px");m();if(!bthRO&&window.ResizeObserver){bthRO=new ResizeObserver(m);bthRO.observe(bt)}}
 const lr=document.querySelector("#v1 .lr");if(lr){if(nbv()==="top")document.getElementById("q").after(lr);else document.getElementById("ls").after(lr);lr.classList.toggle("top",nbv()==="top")}}
function setBb(v){if(bbv()===v)return;const was=scrollY;S.set=Object.assign({},S.set,{bb:v});saveq();applyLay();drawSet();hap(8);
 const bt=document.querySelector(".bt");if(!RM()&&bt)try{bt.animate([{opacity:0,transform:"translateY(14px)"},{opacity:1,transform:"none"}],{duration:300,easing:"cubic-bezier(.22,1,.36,1)"})}catch(e){}scrollTo(0,was)}
function setNb(v){S.set=Object.assign({},S.set,{nb:v});saveq();applyLay();drawSet();hap(8)}
// плавающая панель: прячется при прокрутке вниз, появляется при прокрутке вверх, в начале и в конце страницы
(()=>{let y0=scrollY,acc=0;const set=h=>document.documentElement.classList.toggle("bhide",h);
 addEventListener("scroll",()=>{if(bbv()!=="float")return;const y=scrollY,dy=y-y0;y0=y;
  if(y<40||atBot()){acc=0;set(false);return}
  acc=dy*acc>0?acc+dy:dy;if(acc>24)set(true);else if(acc<-16)set(false)},{passive:true})})();
