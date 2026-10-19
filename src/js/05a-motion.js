// Анимации: одни кривые и длительности для всего приложения (те же значения — в CSS: --ease, --spring, --t1…--t3)
//  - E   — основная кривая: плавный старт, долгое мягкое торможение (появление, перемещение, смена экрана)
//  - EI  — уход: плавный разгон (скрытие)
//  - EIO — плавно в обе стороны (сжатие по высоте)
const MO={E:"cubic-bezier(.25,.8,.25,1)",EI:"cubic-bezier(.4,0,.8,.3)",EIO:"cubic-bezier(.4,0,.2,1)",t1:160,t2:260,t3:360};
function moOk(el){return el&&el.animate&&!RM()}
function mo(el,kf,o){if(!moOk(el))return null;try{return el.animate(kf,Object.assign({duration:MO.t2,easing:MO.E},typeof o==="number"?{duration:o}:o))}catch(e){return null}}
// появление: из прозрачности, чуть снизу и чуть меньше
function moIn(el,o){return mo(el,[{opacity:0,transform:"translateY(8px) scale(.985)"},{opacity:1,transform:"none"}],Object.assign({fill:"backwards"},o))}
// скрытие: затем done() (сразу, если анимации выключены)
function moOut(el,done,o){const a=mo(el,[{opacity:1,transform:"none"},{opacity:0,transform:"scale(.97)"}],Object.assign({duration:MO.t1+20,easing:MO.EI,fill:"forwards"},o));if(a)a.onfinish=()=>done&&done();else if(done)done()}
// выезд / уезд по высоте (элемент раздвигает соседей плавно): open — от нуля до своей высоты, иначе — до нуля, затем done().
// Вместе с высотой сжимаются внутренние отступы и рамка: иначе блок «застревает» на их высоте и в конце пропадает рывком
function moH(el,open,done){const cs=getComputedStyle(el),h=el.offsetHeight,B=["marginTop","marginBottom","paddingTop","paddingBottom","borderTopWidth","borderBottomWidth"],
  f=Object.assign({height:h+"px",minHeight:cs.minHeight,opacity:1,transform:"none"},...B.map(k=>({[k]:cs[k]}))),
  z=Object.assign({height:"0px",minHeight:"0px",opacity:0,transform:"scale(.98)"},...B.map(k=>({[k]:"0px"})));el.style.overflow="hidden";
 const a=mo(el,open?[z,f]:[f,z],open?{duration:MO.t3}:{duration:MO.t2,easing:MO.EIO,fill:"forwards"});
 const end=()=>{el.style.overflow="";done&&done()};if(a)a.onfinish=end;else end();return a}
// смена содержимого на месте (месяц, режим): короткий сдвиг по направлению
function moSwap(el,dir){return mo(el,[{opacity:0,transform:`translateX(${(dir||0)*20}px)`+(dir?"":" scale(.985)")},{opacity:1,transform:"none"}])}

// Главный экран: плавная перестройка списка (FLIP). Перед перерисовкой запоминаем положение карточек и записей,
// после — сдвигаем их из старого места в новое; новые записи появляются, удалённые тают на своём месте.
let flipDay=null,flipPos=null,flipEl=new WeakMap(),flipSkip=0;
function flipGrab(){const app=$("app");if(!moOk(app)||NAV||dgd||REP||flipSkip){flipPos=null;return}
 const m=new Map();app.querySelectorAll(":scope>[data-fk]").forEach(el=>m.set(el.dataset.fk,{el,r:el.getBoundingClientRect()}));
 // запись берём из снимка прошлой отрисовки: данные к этому моменту уже могли измениться (удаление, вставка)
 app.querySelectorAll(".it[data-i]").forEach(el=>{const e=flipEl.get(el);if(e)m.set(e,{el,r:el.getBoundingClientRect()})});
 flipPos=flipDay===cur?m:null}
function flipPlay(){const app=$("app"),old=flipPos,E=S.d[cur]||[];flipPos=null;const day=flipDay;flipDay=cur;
 app.querySelectorAll(".it[data-i]").forEach(el=>{const e=E[+el.dataset.i];if(e)flipEl.set(el,e)});if(!old||day!==cur||!moOk(app))return;
 const seen=new Set(),dly=new Map();let born=0;
 const move=(el,o,par)=>{const r=el.getBoundingClientRect(),dy=o.r.top-r.top-(par||0);if(Math.abs(dy)>.5)mo(el,[{transform:`translateY(${dy}px)`},{transform:"none"}],MO.t3);return o.r.top-r.top};
 app.querySelectorAll(":scope>[data-fk]").forEach(el=>{const o=old.get(el.dataset.fk);if(o){seen.add(el.dataset.fk);dly.set(el,move(el,o))}else moIn(el)});
 app.querySelectorAll(".it[data-i]").forEach(el=>{const e=E[+el.dataset.i],o=e&&old.get(e),sec=el.closest("[data-fk]");if(o){seen.add(e);move(el,o,dly.get(sec)||0)}else if(born++<12)moIn(el,{delay:Math.min(born-1,6)*30})});
 // удалённые записи и карточки: «призрак» на старом месте плавно исчезает
 old.forEach((o,k)=>{if(seen.has(k)||!o.el.classList.contains("it"))return;const g=o.el.cloneNode(true),r=o.r;
  Object.assign(g.style,{position:"fixed",left:r.left+"px",top:r.top+"px",width:r.width+"px",height:r.height+"px",margin:0,zIndex:3,pointerEvents:"none",background:"var(--sub)"});
  document.body.appendChild(g);moOut(g,()=>g.remove())})}

// Сегменты (тема, вибрация, граммы / штуки…): общая «таблетка» под выбранной кнопкой. Подложка сегмента живёт дольше
// своих кнопок (их перерисовывают), поэтому таблетка переезжает со старого места на новое сама — переходом в CSS.
function segSync(){document.querySelectorAll(".seg").forEach(s=>{const b=s.querySelector("button.on");
 if(!b||!s.offsetWidth){if(!b)s.classList.remove("sk");return}
 const v=[b.offsetLeft+"px",b.offsetTop+"px",b.offsetWidth+"px",b.offsetHeight+"px"],k=v.join();if(s._sk===k&&s.classList.contains("sk"))return;
 const first=!s.classList.contains("sk")||!s._sk;if(first)s.classList.add("sn");
 ["--skx","--sky","--skw","--skh"].forEach((n,i)=>s.style.setProperty(n,v[i]));s._sk=k;s.classList.add("sk");
 if(first){void s.offsetWidth;requestAnimationFrame(()=>s.classList.remove("sn"))}})}
(()=>{let q=0;const go=()=>{if(q)return;q=requestAnimationFrame(()=>{q=0;segSync()})};
 // все сегменты — внутри нижнего листа: следим только за ним, а не за всей страницей
 new MutationObserver(go).observe($("ov"),{subtree:true,childList:true,attributes:true,attributeFilter:["class","hidden"]});
 addEventListener("resize",()=>{document.querySelectorAll(".seg.sk").forEach(s=>{s._sk="";s.classList.remove("sk")});go()})})();


// Смена всего кадра (тема, цвет, карточка дня, вид главного экрана) — плавно, через View Transitions:
// старый кадр растворяется в новом, карточки главного экрана переезжают и меняют высоту сами.
// На время смены CSS-переходы выключены, чтобы все элементы сменились одновременно, а не с запозданием.
// Без поддержки в WebView или при «Уменьшить движение» — сразу, как раньше.
function vtx(fn) {
  const d = document.documentElement;
  if (vtx.on) { fn(); return }
  // без View Transitions (старый WebView) или при «Уменьшить движение» — сразу, но тоже одновременно (без запоздалых переходов цвета)
  if (!document.startViewTransition || RM()) { d.classList.add("notr"); fn(); requestAnimationFrame(() => requestAnimationFrame(() => d.classList.remove("notr"))); return }
  // свои имена у карточек (переезжают), у шапки, нижней панели и листа (остаются поверх карточек)
  const names = on => { document.querySelectorAll("#app>[data-fk]").forEach(el => el.style.viewTransitionName = on ? "c-" + el.dataset.fk.replace(/[^\w-]/g, "_") : "");
    [[".nav", "nav"], [".bt", "bar"], ["#ov.on", "ov"]].forEach(([q, n]) => { const el = document.querySelector(q); if (el) el.style.viewTransitionName = on ? n : "" }) };
  vtx.on = 1; d.classList.add("notr"); names(1);
  let t; try { t = document.startViewTransition(() => { fn(); names(1) }) } catch (e) { vtx.on = 0; d.classList.remove("notr"); names(0); fn(); return }
  t.finished.catch(() => { }).then(() => { vtx.on = 0; d.classList.remove("notr"); names(0) })
}
