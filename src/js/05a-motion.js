// Анимации: одни кривые и длительности для всего приложения (те же значения — в CSS: --ease, --spring, --t1…--t3)
//  - E   — основная кривая: плавный старт, долгое мягкое торможение (появление, перемещение, смена экрана)
//  - EI  — уход: плавный разгон (скрытие)
//  - EIO — плавно в обе стороны (сжатие по высоте)
// темп анимаций: короткие и «упругие» в начале (быстрый старт, мягкая остановка) — отзывчиво, без тягучего хвоста
const MO={E:"cubic-bezier(.2,0,0,1)",EI:"cubic-bezier(.3,0,.8,.15)",EIO:"cubic-bezier(.4,0,.2,1)",t1:140,t2:200,t3:280};
function moOk(el){return el&&el.animate&&!RM()}
function mo(el,kf,o){if(!moOk(el))return null;try{return el.animate(kf,Object.assign({duration:MO.t2,easing:MO.E},typeof o==="number"?{duration:o}:o))}catch(e){return null}}
// появление: из прозрачности, чуть снизу и чуть меньше
// проявление: пауза перед ним (delay) — часть ключевых кадров, без fill: backwards — застывшая анимация не прячет элемент
function moIn(el,o){o=o||{};const dl=o.delay||0,du=o.duration||MO.t2,a={opacity:0,transform:"translateY(8px) scale(.985)"};
 return mo(el,dl?[Object.assign({offset:0},a),Object.assign({offset:dl/(dl+du),easing:MO.E},a),{opacity:1,transform:"none"}]:[a,{opacity:1,transform:"none"}],{duration:dl+du,easing:dl?"linear":MO.E})}
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
 old.forEach((o,k)=>{if(seen.has(k)||!o.el.classList.contains("it"))return;const g=noIds(o.el.cloneNode(true)),r=o.r;
  Object.assign(g.style,{position:"fixed",left:r.left+"px",top:r.top+"px",width:r.width+"px",height:r.height+"px",margin:0,zIndex:3,pointerEvents:"none",background:"var(--sub)"});
  document.body.appendChild(g);moOut(g,()=>g.remove())})}

// Сегменты (тема, вибрация, граммы / штуки…): общая «таблетка» под выбранной кнопкой. Подложка сегмента живёт дольше
// своих кнопок (их перерисовывают), поэтому таблетка переезжает со старого места на новое сама — переходом в CSS.
// копия, которая гаснет на месте ушедшего блока: без id — $() и поиск по id всегда находят настоящий элемент, а не копию
function noIds(g){g.removeAttribute("id");g.querySelectorAll("[id]").forEach(x=>x.removeAttribute("id"));return g}
function segSync(){document.querySelectorAll(".seg").forEach(s=>{if(s.closest(".svl"))return;const b=s.querySelector("button.on");
 if(!b||!s.offsetWidth){if(!b)s.classList.remove("sk");return}
 const v=[b.offsetLeft+"px",b.offsetTop+"px",b.offsetWidth+"px",b.offsetHeight+"px"],k=v.join();if(s._sk===k&&s.classList.contains("sk"))return;
 const first=!s.classList.contains("sk")||!s._sk;if(first)s.classList.add("sn");
 ["--skx","--sky","--skw","--skh"].forEach((n,i)=>s.style.setProperty(n,v[i]));s._sk=k;s.classList.add("sk");
 if(first){void s.offsetWidth;requestAnimationFrame(()=>s.classList.remove("sn"))}})}
(()=>{let q=0;const go=()=>{if(q||!isOpen&&!$("ov").classList.contains("on"))return;q=requestAnimationFrame(()=>{q=0;segSync()})};
 // все сегменты — внутри нижнего листа: следим только за ним и только пока он открыт (листание дней его не трогает)
 new MutationObserver(go).observe($("ov"),{subtree:true,childList:true,attributes:true,attributeFilter:["class","hidden"]});
 addEventListener("resize",()=>{document.querySelectorAll(".seg.sk").forEach(s=>{s._sk="";s.classList.remove("sk")});go()})})();


// Смена всего кадра — только там, где меняется весь экран (тема, карточка дня): старый кадр растворяется в новом
// через View Transitions. Оба кадра непрозрачны и меняются за одно время (смешение «plus-lighter»), поэтому
// ничего не мигает. На время смены CSS-переходы выключены — все элементы меняются одновременно.
// Пока идёт смена, касания не доходят до кнопок — поэтому смена короткая (0,26 с) и только для редких действий.
// Без View Transitions (старый WebView) или при «Уменьшить движение» — сразу, но тоже одновременно.
function vtx(fn) {
  const d = document.documentElement;
  if (!document.startViewTransition || RM() || document.hidden) { allAtOnce(fn); return }
  // новая смена во время текущей: текущая сразу завершается, новая начинается с того, что сейчас на экране (без «кулдауна»)
  if (vtx.t) try { vtx.t.skipTransition() } catch (e) { }
  d.classList.add("notr");
  let t; try { t = document.startViewTransition(fn) } catch (e) { d.classList.remove("notr"); fn(); return }
  vtx.t = t; t.finished.catch(() => { }).then(() => { if (vtx.t !== t) return; vtx.t = null; d.classList.remove("notr") })
}
// мгновенная смена, но одновременно: без запоздалых переходов цвета у отдельных элементов (цвет акцента, оттенок фона)
// плавная смена цветов всего экрана (тема, оттенок, акцент) — обычными переходами цвета, без снимков кадра
function themeFade(fn) { const d = document.documentElement; if (RM() || document.hidden) { allAtOnce(fn); return } clearTimeout(themeFade.t); d.classList.remove("notr"); d.classList.add("thx"); fn(); themeFade.t = setTimeout(() => d.classList.remove("thx"), 260) }
function allAtOnce(fn) { const d = document.documentElement; d.classList.add("notr"); fn(); requestAnimationFrame(() => requestAnimationFrame(() => d.classList.remove("notr"))) }
// экран погас или приложение свёрнуто посреди смены кадра — смена завершается сразу (иначе после разблокировки мог остаться пустой кадр)
// возврат после блокировки экрана: незаконченная смена кадра завершается сразу, а страница перерисовывается целиком
// (прозрачность 0,999 на два кадра — незаметно, но заставляет WebView нарисовать новый кадр; transform тут нельзя — сдвинул бы закреплённые панели)
document.addEventListener("visibilitychange", () => { if (vtx.t) try { vtx.t.skipTransition() } catch (e) { } if (!document.hidden) { if (isOpen) svKill(); const b = document.body; b.style.opacity = ".999"; requestAnimationFrame(() => requestAnimationFrame(() => { b.style.opacity = "" })) } });

// Главный экран: блок появляется (раскрывается по высоте) или исчезает (сжимается) плавно — для настроек, меняющих вид
// главного экрана: пустые перекусы, строка «Карточка дня», чип веса. Без View Transitions: касания не теряются.
// out — элементы, которые исчезнут (сначала сжимаются, потом перерисовка); after() возвращает новые — они раскрываются.
function mainMorph(out, redraw, after) {
  const go = () => { flipSkip = 1; try { redraw() } finally { flipSkip = 0 } const add = after ? after() : []; add.forEach(el => moH(el, 1)) };
  const els = out.filter(el => el && el.isConnected && el.offsetHeight); if (!els.length || RM()) { go(); return }
  let n = els.length; els.forEach(el => moH(el, 0, () => { if (--n === 0) go() }))
}
// переключатели «да / нет» после перерисовки строки: бегунок доезжает с прежнего положения, а не прыгает
function tgSnap(root) { const m = new Map(); (root || document).querySelectorAll(".row[id] .tg").forEach(t => m.set(t.closest(".row").id, t.classList.contains("on"))); return m }
function tgPlay(prev, root) { (root || document).querySelectorAll(".row[id] .tg").forEach(t => { const id = t.closest(".row").id, was = prev.get(id), on = t.classList.contains("on"); if (was == null || was === on) return;
  const k = t.querySelector("i"); if (moOk(k)) { k.animate([{ transform: was ? "translateX(18px)" : "none" }, { transform: on ? "translateX(18px)" : "none" }], { duration: MO.t2, easing: MO.E }); t.animate([{ backgroundColor: getComputedStyle(t).backgroundColor, opacity: .7 }, { opacity: 1 }], { duration: MO.t2 }) } }) }
