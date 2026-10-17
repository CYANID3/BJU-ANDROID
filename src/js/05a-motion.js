// Анимации: одни кривые и длительности для всего приложения (те же значения — в CSS: --ease, --ease-in, --spring, --t1…--t3)
//  - E   — основная кривая: быстрый старт, мягкое торможение (появление, перемещение, смена экрана)
//  - EI  — уход: плавный разгон (скрытие)
//  - ESP — лёгкая пружина для мелких откликов (галочки, переключатели)
const MO={E:"cubic-bezier(.22,1,.36,1)",EI:"cubic-bezier(.4,0,.8,.3)",ESP:"cubic-bezier(.3,1.3,.5,1)",t1:160,t2:260,t3:360};
function moOk(el){return el&&el.animate&&!matchMedia("(prefers-reduced-motion:reduce)").matches}
function mo(el,kf,o){if(!moOk(el))return null;try{return el.animate(kf,Object.assign({duration:MO.t2,easing:MO.E},typeof o==="number"?{duration:o}:o))}catch(e){return null}}
// появление: из прозрачности, чуть снизу и чуть меньше
function moIn(el,o){return mo(el,[{opacity:0,transform:"translateY(8px) scale(.985)"},{opacity:1,transform:"none"}],Object.assign({fill:"backwards"},o))}
// скрытие: затем done() (сразу, если анимации выключены)
function moOut(el,done,o){const a=mo(el,[{opacity:1,transform:"none"},{opacity:0,transform:"scale(.97)"}],Object.assign({duration:MO.t1+20,easing:MO.EI,fill:"forwards"},o));if(a)a.onfinish=()=>done&&done();else if(done)done()}
// смена содержимого на месте (месяц, режим): короткий сдвиг по направлению
function moSwap(el,dir){return mo(el,[{opacity:0,transform:`translateX(${(dir||0)*20}px)`+(dir?"":" scale(.985)")},{opacity:1,transform:"none"}])}

// Главный экран: плавная перестройка списка (FLIP). Перед перерисовкой запоминаем положение карточек и записей,
// после — сдвигаем их из старого места в новое; новые записи появляются, удалённые тают на своём месте.
let flipDay=null,flipPos=null,flipEl=new WeakMap();
function flipGrab(){const app=$("app");if(!moOk(app)||NAV||dgd||REP){flipPos=null;return}
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
