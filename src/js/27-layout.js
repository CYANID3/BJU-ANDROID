// Расположение: нижняя панель — «В конце дня» (после приёмов пищи, по умолчанию) или «Всегда видна» (закреплена у края экрана)
// и кнопки «Новый продукт» / «Новое блюдо» в списке продуктов (под списком / под поиском)
const bbv=()=>S.set&&S.set.bb==="fix"?"fix":"page",nbv=()=>S.set&&S.set.nb==="top"?"top":"bottom";
// высота закреплённой панели → --bth (под неё отступ страницы, тост и индикатор жеста «потянуть вверх»)
let bthRO=null;
function applyLay(){const r=document.documentElement,fix=bbv()!=="page",bt=document.querySelector(".bt");r.classList.toggle("bfix",fix);
 if(fix&&bt){const m=()=>r.style.setProperty("--bth",bt.offsetHeight+"px");m();if(!bthRO&&window.ResizeObserver){bthRO=new ResizeObserver(m);bthRO.observe(bt)}}
 const lr=document.querySelector("#v1 .lr");if(lr){if(nbv()==="top")document.getElementById("q").after(lr);else document.getElementById("ls").after(lr);lr.classList.toggle("top",nbv()==="top")}}
function setBb(v){if(bbv()===v)return;const was=scrollY;S.set=Object.assign({},S.set,{bb:v});saveq();applyLay();drawSet();hap(8);
 const bt=document.querySelector(".bt");if(!RM()&&bt)try{bt.animate([{opacity:0,transform:"translateY(14px)"},{opacity:1,transform:"none"}],{duration:300,easing:"cubic-bezier(.22,1,.36,1)"})}catch(e){}scrollTo(0,was)}
function setNb(v){S.set=Object.assign({},S.set,{nb:v});saveq();applyLay();drawSet();hap(8)}
