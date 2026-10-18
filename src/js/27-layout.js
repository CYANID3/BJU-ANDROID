// Расположение: нижняя панель — «В конце дня» (после приёмов пищи, по умолчанию) или «Всегда видна» (закреплена у края экрана)
// и кнопки «Новый продукт» / «Новое блюдо» в списке продуктов (под списком / под поиском)
const bbv=()=>S.set&&S.set.bb==="fix"?"fix":"page",nbv=()=>S.set&&S.set.nb==="top"?"top":"bottom";
// высота закреплённой панели → --bth (под неё отступ страницы, тост и индикатор жеста «потянуть вверх»)
let bthRO=null;
function applyLay(){const r=document.documentElement,fix=bbv()!=="page",bt=document.querySelector(".bt");r.classList.toggle("bfix",fix);
 if(fix&&bt){const m=()=>r.style.setProperty("--bth",bt.offsetHeight+"px");m();if(!bthRO&&window.ResizeObserver){bthRO=new ResizeObserver(m);bthRO.observe(bt)}}
 const lr=document.querySelector("#v1 .lr");if(lr){if(nbv()==="top")document.getElementById("q").after(lr);else document.getElementById("ls").after(lr);lr.classList.toggle("top",nbv()==="top")}}
function setBb(v){if(bbv()===v)return;const was=scrollY;S.set=Object.assign({},S.set,{bb:v});saveq();applyLay();drawSet();hap(8);
 mo(document.querySelector(".bt"),[{opacity:0,transform:"translateY(14px)"},{opacity:1,transform:"none"}]);scrollTo(0,was)}
function setNb(v){S.set=Object.assign({},S.set,{nb:v});saveq();applyLay();drawSet();hap(8)}
// перекусы на главном: «Тонкой строкой» — пустые видны тонкой строкой между приёмами;
// «По двойному касанию» — пустых не видно; два касания по названию основного приёма (Завтрак / Обед / Ужин)
// выдвигают под ним «+ Перекус N», ещё два — убирают. Открытый, но пустой перекус сам прячется при смене дня.
const snv=()=>S.set&&(S.set.sn==="tap"||S.set.sn==="hide")?"tap":"row";
let snOpen=new Set(),snDay="";
function snToggle(mi){const s=mi+1;if(!SN[s])return;hap(8);const q=()=>document.querySelector(`#app .snk[data-m="${s}"]`),rr=()=>{flipSkip=1;render();flipSkip=0};
 // уезжает: строка плавно сжимается, соседи подтягиваются вслед; выезжает — наоборот
 if(snOpen.has(s)){snOpen.delete(s);const b=q();if(b&&!b._sh){b._sh=1;moH(b,0,rr)}else rr();return}
 snOpen.add(s);rr();const b=q();if(b)moH(b,1)}
function setSn(v){S.set=Object.assign({},S.set,{sn:v});saveq();snOpen.clear();drawSet();render();hap(6)}
// двойное касание по шапке основного приёма (не по кнопкам)
(()=>{let t=0,m=-1;addEventListener("pointerup",e=>{if(isOpen||REP||snv()!=="tap"||e.button>0)return;const h=e.target.closest&&e.target.closest("#app .meal:not(.sn) .mh");if(!h||e.target.closest("button"))return;
 const mi=+h.parentElement.dataset.m,n=Date.now();if(m===mi&&n-t<420){t=0;m=-1;snToggle(mi)}else{t=n;m=mi}})})();
