// Нижний лист: экраны, шапка (заголовок, «‹ назад», стрелки месяца), низ с кнопками действия, открытие и закрытие
const VWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
// список продуктов — всегда на всю высоту: при поиске лист не «прыгает»; остальные экраны — по содержимому
const FULL = new Set([1]);
const shEl = () => document.querySelector("#ov .sh"), shBody = () => document.querySelector("#ov .shb");
let SUB = 0; // экран открыт из «Ещё» (7): «‹» в шапке и «Назад» возвращают туда
/**
 * Показать экран n листа. t — заголовок, s — подпись под ним.
 * Лист прижат к низу и по высоте равен содержимому. Смена экрана: содержимое меняется на месте (старое гаснет,
 * новое проявляется — ничего не едет вбок), а верхний край листа плавно переезжает к новой высоте.
 */
let svG = [], svSnapPending = null;
// снимок заранее (перед шагом «назад»): sv() возьмёт его вместо нового
function svPre() { const sh = shEl(); if (!isOpen || RM() || !sh.animate || document.hidden) return; svKill(); try { svSnapPending = svSnap(sh) } catch (e) { svSnapPending = null } }
// прервать незаконченный переход: копии убрать, а все анимации листа и его содержимого (шапка, строки, «ручка») довести
// до конца — иначе шапка могла остаться прозрачной (пустое место сверху после выбора файла в системном окне)
function svKill() { svG.forEach(g => g.remove()); svG = []; document.querySelectorAll("#ov > .svl:not(.hsg), #ov > .sve, #ov > .smh").forEach(x => x.remove());
  try { shEl().getAnimations({ subtree: true }).forEach(a => { if (typeof CSSTransition !== "undefined" && (a instanceof CSSTransition || a instanceof CSSAnimation)) return; try { a.finish() } catch (e) { a.cancel() } }) } catch (e) { } }
// снимок старого экрана: шапка, видимая часть содержимого и низ — копии на тех же местах экрана
function svSnap(sh) {
  // id в копии сохраняются: на них завязаны стили (#pkx, #ls…); копия стоит в документе после листа, поэтому $(id) находит оригинал
  const r0 = sh.getBoundingClientRect(), L = document.createElement("div"), strip = g => { g.hidden = false; g.setAttribute("aria-hidden", "true"); g.inert = true; return g }, fix = [];
  // копия непрозрачна (фон и скругление листа): новый экран под ней проявляется по мере того, как она гаснет — чистое
  // растворение без наложения текста двух экранов
  L.className = "svl" + (sh.classList.contains("kpo") ? " kpo" : ""); Object.assign(L.style, { left: r0.left + "px", top: r0.top + "px", width: r0.width + "px", height: r0.height + "px", background: getComputedStyle(sh).backgroundColor, borderRadius: "24px 24px 0 0" });
  const put = (el, clip) => {
    if (!el) return; const r = (clip || el).getBoundingClientRect();
    // метка на первом видимом «листовом» элементе каждого блока — по ней копия выравнивается точно по оригиналу
    // (в абсолютной копии отступы детей не схлопываются с родителем, без выравнивания она съезжает на 4–12 px)
    const mark = (src, unit) => { const an = [...src.querySelectorAll("*")].find(x => !x.firstElementChild && x.getBoundingClientRect().height > 0) || (src.getBoundingClientRect().height > 0 ? src : null); if (!an) return; an.dataset.sva = fix.length; fix.push([an.getBoundingClientRect(), unit]); return an };
    let g, ms = []; if (clip) { g = strip(el.cloneNode(false)); const br = r, er = el.getBoundingClientRect(); [...el.children].forEach(c => { const cr = c.getBoundingClientRect(); if (!cr.height || cr.bottom < br.top || cr.top > br.bottom) return;
      const an = mark(c, null), k = c.cloneNode(true); if (an) fix[fix.length - 1][1] = k; ms.push(an);
      Object.assign(k.style, { position: "absolute", left: cr.left - er.left + "px", top: cr.top - er.top + "px", width: cr.width + "px", margin: 0 }); g.appendChild(k) }) }
    else { ms.push(mark(el, null)); g = strip(el.cloneNode(true)); if (fix.length && !fix[fix.length - 1][1]) fix[fix.length - 1][1] = g }
    ms.forEach(an => an && delete an.dataset.sva); const box = document.createElement("div");
    Object.assign(box.style, { position: "absolute", left: r.left - r0.left + "px", top: r.top - r0.top + "px", width: r.width + "px", height: r.height + "px", overflow: "hidden" });
    if (clip) { const e = el.getBoundingClientRect(); Object.assign(g.style, { position: "absolute", left: e.left - r.left + "px", top: e.top - r.top + "px", width: e.width + "px", height: e.height + "px", margin: 0 }) }
    else Object.assign(g.style, { margin: 0, width: "100%", height: "100%" });
    box.appendChild(g); L.appendChild(box)
  };
  put(sh.querySelector(".hd")); const v = VWS.map(i => $("v" + i)).find(x => !x.hidden); if (v) put(v, shBody());
  const sf = sh.querySelector(".shf"); if (sf && sf.offsetHeight) put(sf);
  L.querySelectorAll(".kpd button").forEach(b => b.classList.remove("dn"));
  // копия ставится сразу, а выравнивание (см. svAlign) — в одном пересчёте раскладки с новым экраном, без лишнего кадра работы
  $("ov").appendChild(L);
  return { L, r0, fix }
}
// копия совпадает с оригиналом до пикселя (поля и схлопывание отступов в копии иначе дают сдвиг на пару пикселей)
function svAlign(fix) { fix.forEach(([a, g], i) => { const c = g && (g.dataset.sva == i ? g : g.querySelector(`[data-sva="${i}"]`)); if (!c) return; const b = c.getBoundingClientRect(), dy = a.top - b.top, dx = a.left - b.left;
  if (Math.abs(dy) > .1 || Math.abs(dx) > .1) g.style.translate = `${dx}px ${dy}px`; delete c.dataset.sva }) }
function sv(n, t, s) {
  const sh = shEl(), prev = VWS.find(i => !$("v" + i).hidden), anim = isOpen && prev && prev !== n && !RM() && !!sh.animate && !document.hidden;
  let snap = null;
  if (anim) { if (svSnapPending) { snap = svSnapPending; svSnapPending = null } else { svKill(); try { snap = svSnap(sh) } catch (e) { snap = null } } } else if (svSnapPending) { svSnapPending.L.remove(); svSnapPending = null }
  VWS.forEach(i => $("v" + i).hidden = i !== n);
  $("st").textContent = t || ""; $("ss").textContent = s || "";
  sh.querySelectorAll(".shf .ft").forEach(f => f.hidden = +f.dataset.v !== n);
  sh.classList.toggle("full", FULL.has(n));
  shHead(n); kpView(n);
  // открытие листа и смена экрана — всегда с начала
  if (!isOpen || prev !== n) shBody().scrollTop = 0;
  if (!snap) return;
  // запуск — после текущего кода: вызвавший успевает восстановить прокрутку («назад» в «Ещё»), кадр ещё не нарисован
  queueMicrotask(() => svPlay(sh, snap))
}
// общий переход: верхний край листа переезжает со старой высоты на новую, старое гаснет, новое проявляется на своих местах
function svPlay(sh, snap) {
  const { L, r0 } = snap, r1 = sh.getBoundingClientRect(); svAlign(snap.fix || []); const d = r1.top - r0.top, D = 260, E = "cubic-bezier(.2,0,0,1)";
  const ov = $("ov"); ov.appendChild(L); const out = [L], fin = [];
  // плавная смена без провала: старое быстро тускнеет (основная часть — за первые 0,06 с), новое проявляется почти сразу
  fin.push(L.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 110, easing: "cubic-bezier(0,0,.2,1)", fill: "forwards" }).finished);
  // только transform и opacity: их рисует видеокарта, и движение идёт ровно, даже пока приложение строит новый экран
  if (d > 1) {
    // лист стал ниже: полоса фона старой высоты (под листом) опускается к новому краю, старое содержимое тем временем гаснет
    const ed = document.createElement("div"); ed.className = "sve";
    Object.assign(ed.style, { left: r0.left + "px", top: r0.top + "px", width: r0.width + "px", height: d + 30 + "px" }); ov.insertBefore(ed, sh); out.push(ed);
    fin.push(ed.animate([{ transform: "none" }, { transform: `translateY(${d}px)` }], { duration: D, easing: E, fill: "forwards" }).finished);
    // старое содержимое обрезается опускающимся краем (а не висит над главным экраном): рамка едет вниз, копия внутри —
    // на столько же вверх, поэтому копия стоит на месте, а уходит только её верх. Тоже только transform
    const cb = document.createElement("div"); cb.className = "svl"; Object.assign(cb.style, { left: L.style.left, top: L.style.top, width: L.style.width, height: L.style.height, overflow: "hidden" });
    L.style.position = "absolute"; L.style.left = L.style.top = "0px"; ov.insertBefore(cb, L); cb.appendChild(L); out.push(cb);
    cb.animate([{ transform: "none" }, { transform: `translateY(${d}px)` }], { duration: D, easing: E, fill: "forwards" });
    L.animate([{ transform: "none" }, { transform: `translateY(${-d}px)` }], { duration: D, easing: E, fill: "forwards" });
  } else if (d < -1) {
    // лист стал выше: он поднимается целиком с прежней высоты (внизу он уходит за край экрана — там ничего не видно)
    fin.push(sh.animate([{ transform: `translateY(${-d}px)` }, { transform: "none" }], { duration: D, easing: E }).finished);
  }
  // Новый экран сразу виден целиком — его ничто не делает прозрачным: смену даёт гаснущая поверх копия старого.
  // Раньше новые шапка и содержимое проявлялись из прозрачности; на некоторых телефонах WebView на миг переставал
  // рисовать кадры, и шапка оставалась прозрачной (пустое место вместо «Изменить продукт», «‹» и «×»).
  svG = out; Promise.all(fin).catch(() => { }).then(() => { out.forEach(x => x.remove()); if (svG === out) svG = [] });
  // страховка: если WebView приостановили посреди перехода (системное окно выбора файла), через 0,7 с всё доводится до конца
  setTimeout(() => { if (svG === out) svKill() }, 700)
}
// содержимое того же экрана поменяло высоту (подсказка жеста появилась или ушла, другой вариант выбора):
// fn() перерисовывает, край листа плавно переезжает, изменившийся блок проявляется
function shResize(fn, watch) {
  const sh = shEl(); if (!isOpen || RM() || !sh.animate || vtx.on || document.hidden) { fn(); return }
  svKill(); const r0 = sh.getBoundingClientRect(), bg = document.createElement("div");
  // блоки, которые могут появиться или пропасть (подсказка жеста): пропавший гаснет на старом месте, новый проявляется
  const was = (watch || []).map(q => { const el = document.querySelector(q); if (!el) return null; const r = el.getBoundingClientRect(), g = noIds(el.cloneNode(true));
    Object.assign(g.style, { position: "fixed", left: r.left + "px", top: r.top + "px", width: r.width + "px", margin: 0, zIndex: 6, pointerEvents: "none" }); return [q, g] }).filter(Boolean);
  fn();
  const fresh = (watch || []).filter(q => document.querySelector(q) && !was.some(w => w[0] === q)).map(q => document.querySelector(q));

  const r1 = sh.getBoundingClientRect(), d = r1.top - r0.top, D = 240, E = "cubic-bezier(.2,0,0,1)";
  // только transform и opacity (рисует видеокарта — ровно даже при занятом приложении)
  if (d > 1) {
    // лист стал ниже: шапка и содержимое едут вниз вместе с краем; шапка начинает выше нового края — на время пути
    // лист её не обрезает (под ней — полоса фона старой высоты, она опускается следом)
    sh.style.overflow = "visible";
    const an = [sh.querySelector(".hd"), shBody()].map(el => el.animate([{ transform: `translateY(${-d}px)` }, { transform: "none" }], { duration: D, easing: E }));
    // «ручка» листа (::before) едет вместе с шапкой, а не стоит на новом краю поверх заголовка
    try { sh.animate([{ transform: `translateY(${-d}px)` }, { transform: "none" }], { duration: D, easing: E, pseudoElement: "::before" }) } catch (e) { }
    an[0].finished.catch(() => { }).then(() => { sh.style.overflow = "" })
  } else if (d < -1) {
    // лист стал выше: поднимается целиком со старой высоты (низ уходит за край экрана — там его не видно)
    sh.animate([{ transform: `translateY(${-d}px)` }, { transform: "none" }], { duration: D, easing: E });
    // низ листа (кнопки) стоит на месте: встречный сдвиг гасит подъём листа, растёт только верхний край
    const f = sh.querySelector(".shf"); if (f) f.animate([{ transform: `translateY(${d}px)` }, { transform: "none" }], { duration: D, easing: E })
  }
  // пропавший блок уходит вниз вместе со всеми и гаснет — быстро, в первые 40 % пути, чтобы не наложиться на новый текст
  was.filter(w => !document.querySelector(w[0])).forEach(([, g]) => { $("ov").appendChild(g); g.animate([{ opacity: 1, transform: "none" }, { opacity: 0, offset: .4 }, { opacity: 0, transform: `translateY(${Math.max(0, d)}px)` }], { duration: D, easing: E, fill: "forwards" }).finished.catch(() => { }).then(() => g.remove()) });
  if (d > 1) { bg.className = "sve"; Object.assign(bg.style, { left: r0.left + "px", top: r0.top + "px", width: r0.width + "px", height: d + 30 + "px" }); $("ov").insertBefore(bg, sh); svG = [bg];
    bg.animate([{ transform: "none" }, { transform: `translateY(${d}px)` }], { duration: D, easing: E, fill: "forwards" }).finished.catch(() => { }).then(() => bg.remove()) }
  fresh.forEach(el => el.animate([{ opacity: 0, transform: "scale(.97)", offset: 0 }, { opacity: 0, transform: "scale(.97)", offset: 90 / 310, easing: MO.E }, { opacity: 1, transform: "none" }], { duration: 310 }));
}
// шапка: «‹ назад» — если «Назад» ведёт на шаг внутри листа; у календаря и статистики — стрелки месяца
function shHead(n) {
  const mn = n === 6 || n === 9, hd = document.querySelector("#ov .hd");
  hd.classList.toggle("mn", mn); hd.classList.toggle("cal", n === 6); $("hl").hidden = $("hr").hidden = !mn;
  $("hl").onclick = n === 6 ? () => mv(-1) : n === 9 ? () => stMv(-1) : null; $("hr").onclick = n === 6 ? () => mv(1) : n === 9 ? () => stMv(1) : null;
  $("st").onclick = n === 6 ? calTitle : null;
  $("hb").hidden = mn || !stepTo();
}
const LBL = ["Завтрак", "Перекус 1", "Обед", "Перекус 2", "Ужин", "Перекус 3"], LBLIN = ["завтрак", "перекус 1", "обед", "перекус 2", "ужин", "перекус 3"];
function autoMeal() { const h = new Date().getHours() + new Date().getMinutes() / 60; return h < 11 ? 0 : h < 12.5 ? 1 : h < 15 ? 2 : h < 18 ? 3 : h < 21 ? 4 : 5 }
// выбор приёма пищи — при добавлении (список продуктов и количество). Сетка 3×2: в столбце основной приём и перекус после него.
// При изменении записи переключателя нет — меняется только количество.
const MCO = [0, 2, 4, 1, 3, 5];
function drawMc() {
  $("dbn").querySelector("span").textContent = mode === "ing" ? "Назад к блюду" : "Новое блюдо";
  const nd = `onmousedown="event.preventDefault()"`;
  [["mc", mode === "add"], ["em", mode === "add" && ei < 0]].forEach(([id, on]) => {
    const el = $(id); el.hidden = !on;
    if (on) el.innerHTML = MCO.map(i => `<button class="${i === am ? "on" : ""}" role="radio" aria-checked="${i === am}" ${nd} onclick="sm(${i})">${LBL[i]}</button>`).join("")
  })
}
function sm(i) { if (am === i) return; am = i; drawMc(); vib("ui"); if ($("v2").hidden) $("st").textContent = "Добавить в " + LBLIN[i]; else $("ss").textContent = amtSub() }
function op(m) { am = m; mode = "add"; SUB = 0; $("q").value = ""; lst(); drawMc(); sv(1, "Добавить в " + LBLIN[m]); show() }
function mng() { mode = "mng"; SUB = 0; pFl = 0; $("q").value = ""; lst(); drawMc(); sv(1, "Продукты", prodSub()); show() }
const prodSub = () => { const nD = S.db.filter(p => p[5]).length, n = S.db.length - nD; return n + " " + plural(n, "продукт", "продукта", "продуктов") + (nD ? " · " + nD + " " + plural(nD, "блюдо", "блюда", "блюд") : "") };
const plural = (n, a, b, c) => n % 10 === 1 && n % 100 !== 11 ? a : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? b : c;
const num = v => parseFloat(String(v).replace(",", ".")) || 0, nn = v => Math.max(0, num(v));
let ei = -1, lastDel = null, tmr, isOpen = false;
// Закрытый лист остаётся в странице (видимость скрыта), и последний экран — например, список из сотен продуктов — браузер
// продолжал пересчитывать при каждой смене стилей: смена темы с большим списком была вдвое дольше. Через 0,4 с после закрытия
// (анимация закрытия уже отыграла) содержимое листа выключается из расчёта (класс idle → content-visibility:hidden),
// при открытии — включается до всего остального.
let ovIdleT = 0; const ovWake = () => { clearTimeout(ovIdleT); ovIdleT = 0; $("ov").classList.remove("idle") };
function show() { ovWake(); if (!isOpen) shDragReset(); if (!isOpen) { isOpen = true; oa = Date.now(); if (!NATIVE) try { history.pushState({ o: 1 }, "") } catch (e) { } } $("ov").classList.add("on"); document.documentElement.classList.add("lk") }
function closeUI() { if (!isOpen) return; svKill(); cpm = -1; isOpen = false; SUB = 0; if (mode === "ing") mode = pmode; ik = -1; $("ov").classList.remove("on"); document.documentElement.classList.remove("lk"); clearTimeout(ovIdleT); ovIdleT = setTimeout(() => { ovIdleT = 0; if (!isOpen) $("ov").classList.add("idle") }, 400); ei = -1; kpF = null; try { document.activeElement.blur() } catch (e) { } }
async function xcl() {
  if (!v3ok && !$("v3").hidden && v3sig() !== v3snap && !await ask("Продукт не сохранён. Закрыть без сохранения?", "Закрыть", 1)) return;
  if (!$("v8").hidden && dirtyDish() && !await ask("Закрыть без сохранения блюда?", "Закрыть", 1)) return;
  cl()
}
// браузер: лист — шаг истории («Назад» браузера закрывает его). Закрытие кнопкой убирает этот шаг;
// popstate от такого history.back() приходит позже и не должен закрыть лист, открытый сразу следом
let popSkip = 0;
function cl() { const was = isOpen; closeUI(); if (was && !NATIVE) { try { if (history.state && history.state.o) { popSkip++; history.back() } } catch (e) { } } }
