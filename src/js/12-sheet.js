// Нижний лист: экраны, шапка (заголовок, «‹ назад», стрелки месяца), низ с кнопками действия, открытие и закрытие
const VWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
// список продуктов — всегда на всю высоту: при поиске лист не «прыгает»; остальные экраны — по содержимому
const FULL = new Set([1]);
const shEl = () => document.querySelector("#ov .sh"), shBody = () => document.querySelector("#ov .shb");
let SUB = 0; // экран открыт из «Ещё» (7): «‹» в шапке и «Назад» возвращают туда
/**
 * Показать экран n листа. t — заголовок, s — подпись под ним.
 * Лист прижат к низу и по высоте равен содержимому. Смена экрана: содержимое меняется на месте (старое гаснет,
 * новое проявляется — ничего не едет вбок), а верхний край листа плавно переезжает к новой высоте.
 */
let svG = [];
function svKill() { svG.forEach(g => g.remove()); svG = []; try { shEl().getAnimations().forEach(a => a.finish()) } catch (e) { } }
// снимок старого экрана: шапка, видимая часть содержимого и низ — копии на тех же местах экрана
function svSnap(sh) {
  const r0 = sh.getBoundingClientRect(), L = document.createElement("div"), strip = g => { g.removeAttribute("id"); g.querySelectorAll("[id]").forEach(x => x.removeAttribute("id")); g.hidden = false; return g };
  L.className = "svl"; Object.assign(L.style, { left: r0.left + "px", top: r0.top + "px", width: r0.width + "px", height: r0.height + "px" });
  const put = (el, clip) => { if (!el) return; const r = (clip || el).getBoundingClientRect(), g = strip(el.cloneNode(true)), box = document.createElement("div");
    Object.assign(box.style, { position: "absolute", left: r.left - r0.left + "px", top: r.top - r0.top + "px", width: r.width + "px", height: r.height + "px", overflow: "hidden" });
    if (clip) { const e = el.getBoundingClientRect(); Object.assign(g.style, { position: "absolute", left: e.left - r.left + "px", top: e.top - r.top + "px", width: e.width + "px", margin: 0 }) } else Object.assign(g.style, { margin: 0, width: "100%" });
    box.appendChild(g); L.appendChild(box) };
  put(sh.querySelector(".hd")); const v = VWS.map(i => $("v" + i)).find(x => !x.hidden); if (v) put(v, shBody());
  const sf = sh.querySelector(".shf"); if (sf && sf.offsetHeight) put(sf);
  L.querySelectorAll(".kpd button").forEach(b => b.classList.remove("dn"));
  return { L, r0 }
}
function sv(n, t, s) {
  const sh = shEl(), prev = VWS.find(i => !$("v" + i).hidden), anim = isOpen && prev && prev !== n && !RM() && !!sh.animate;
  let snap = null;
  if (anim) { svKill(); try { snap = svSnap(sh) } catch (e) { snap = null } }
  VWS.forEach(i => $("v" + i).hidden = i !== n);
  $("st").textContent = t || ""; $("ss").textContent = s || "";
  document.querySelectorAll(".shf .ft").forEach(f => f.hidden = +f.dataset.v !== n);
  sh.classList.toggle("full", FULL.has(n));
  shHead(n); kpView(n);
  // открытие листа и смена экрана — всегда с начала
  if (!isOpen || prev !== n) shBody().scrollTop = 0;
  if (!snap) return;
  // запуск — после текущего кода: вызвавший успевает восстановить прокрутку («назад» в «Ещё»), кадр ещё не нарисован
  queueMicrotask(() => svPlay(sh, snap, [$("v" + n), sh.querySelector(".hd .ht"), sh.querySelector(".shf")]))
}
// общий переход: верхний край листа переезжает со старой высоты на новую, старое гаснет, новое проявляется на своих местах
function svPlay(sh, snap, ins) {
  const { L, r0 } = snap, r1 = sh.getBoundingClientRect(), d = r1.top - r0.top, D = 320, E = "cubic-bezier(.3,0,.1,1)", R = "24px 24px 0 0";
  const ov = $("ov"); ov.appendChild(L); const out = [L], fin = [];
  L.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: "linear", fill: "forwards" });
  if (d > 1) {
    // лист стал ниже: фон старой высоты (под листом) плавно опускается к новому краю
    const ed = document.createElement("div"); ed.className = "sve";
    Object.assign(ed.style, { left: r0.left + "px", top: r0.top + "px", width: r0.width + "px", height: d + 30 + "px" }); ov.insertBefore(ed, sh); out.push(ed);
    fin.push(ed.animate([{ clipPath: `inset(0 0 0 0 round ${R})` }, { clipPath: `inset(${d}px 0 0 0 round ${R})` }], { duration: D, easing: E, fill: "forwards" }).finished);
    // старое содержимое уходит вместе с краем, а не висит над главным экраном
    L.animate([{ clipPath: "inset(0 0 0 0)" }, { clipPath: `inset(${d}px 0 0 0)` }], { duration: D, easing: E, fill: "forwards" });
  } else if (d < -1) {
    // лист стал выше: верхний край открывается снизу вверх
    fin.push(sh.animate([{ clipPath: `inset(${-d}px 0 0 0 round ${R})` }, { clipPath: `inset(0 0 0 0 round ${R})` }], { duration: D, easing: E }).finished);
  }
  ins.filter(Boolean).forEach(el => fin.push(el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, delay: 60, easing: "linear", fill: "backwards" }).finished));
  svG = out; Promise.all(fin).catch(() => { }).then(() => { out.forEach(x => x.remove()); if (svG === out) svG = [] })
}
// содержимое того же экрана поменяло высоту (подсказка жеста появилась или ушла, другой вариант выбора):
// fn() перерисовывает, край листа плавно переезжает, изменившийся блок проявляется
function shResize(fn, watch) {
  const sh = shEl(); if (!isOpen || RM() || !sh.animate || vtx.on) { fn(); return }
  svKill(); const r0 = sh.getBoundingClientRect(), bg = document.createElement("div");
  // блоки, которые могут появиться или пропасть (подсказка жеста): пропавший гаснет на старом месте, новый проявляется
  const was = (watch || []).map(q => { const el = document.querySelector(q); if (!el) return null; const r = el.getBoundingClientRect(), g = el.cloneNode(true); g.removeAttribute("id");
    Object.assign(g.style, { position: "fixed", left: r.left + "px", top: r.top + "px", width: r.width + "px", margin: 0, zIndex: 6, pointerEvents: "none" }); return [q, g] }).filter(Boolean);
  fn();
  const fresh = (watch || []).filter(q => document.querySelector(q) && !was.some(w => w[0] === q)).map(q => document.querySelector(q));

  const r1 = sh.getBoundingClientRect(), d = r1.top - r0.top, D = 280, R = "24px 24px 0 0", E = "cubic-bezier(.3,0,.1,1)";
  // шапка и содержимое едут вместе с краем листа (лист прижат к низу: без этого строки прыгнули бы на новое место сразу)
  if (Math.abs(d) > 1) {
    // лист стал ниже: шапка начинает выше нового края — на время пути лист её не обрезает (фон старой высоты — под ней)
    if (d > 1) sh.style.overflow = "visible";
    const an = [sh.querySelector(".hd"), shBody()].map(el => el.animate([{ transform: `translateY(${-d}px)` }, { transform: "none" }], { duration: D, easing: E }));
    an[0].finished.catch(() => { }).then(() => { sh.style.overflow = "" })
  }
  // пропавший блок уходит вниз вместе со всеми и гаснет
  was.filter(w => !document.querySelector(w[0])).forEach(([, g]) => { $("ov").appendChild(g); g.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateY(${Math.max(0, d)}px)` }], { duration: D, easing: E, fill: "forwards" }).finished.catch(() => { }).then(() => g.remove()) });
  if (d > 1) { bg.className = "sve"; Object.assign(bg.style, { left: r0.left + "px", top: r0.top + "px", width: r0.width + "px", height: d + 30 + "px" }); $("ov").insertBefore(bg, sh); svG = [bg];
    bg.animate([{ clipPath: `inset(0 0 0 0 round ${R})` }, { clipPath: `inset(${d}px 0 0 0 round ${R})` }], { duration: D, easing: E, fill: "forwards" }).finished.catch(() => { }).then(() => bg.remove()) }
  else if (d < -1) sh.animate([{ clipPath: `inset(${-d}px 0 0 0 round ${R})` }, { clipPath: `inset(0 0 0 0 round ${R})` }], { duration: D, easing: E });
  fresh.forEach(el => el.animate([{ opacity: 0, transform: "scale(.97)" }, { opacity: 1, transform: "none" }], { duration: 240, delay: 60, easing: MO.E, fill: "backwards" }));
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
function show() { if (!isOpen) { isOpen = true; oa = Date.now(); if (!NATIVE) try { history.pushState({ o: 1 }, "") } catch (e) { } } $("ov").classList.add("on"); document.documentElement.classList.add("lk") }
function closeUI() { if (!isOpen) return; svKill(); cpm = -1; isOpen = false; SUB = 0; if (mode === "ing") mode = pmode; ik = -1; $("ov").classList.remove("on"); document.documentElement.classList.remove("lk"); ei = -1; kpF = null; try { document.activeElement.blur() } catch (e) { } }
async function xcl() {
  if (!v3ok && !$("v3").hidden && v3sig() !== v3snap && !await ask("Продукт не сохранён. Закрыть без сохранения?", "Закрыть", 1)) return;
  if (!$("v8").hidden && dirtyDish() && !await ask("Закрыть без сохранения блюда?", "Закрыть", 1)) return;
  cl()
}
// браузер: лист — шаг истории («Назад» браузера закрывает его). Закрытие кнопкой убирает этот шаг;
// popstate от такого history.back() приходит позже и не должен закрыть лист, открытый сразу следом
let popSkip = 0;
function cl() { const was = isOpen; closeUI(); if (was && !NATIVE) { try { if (history.state && history.state.o) { popSkip++; history.back() } } catch (e) { } } }
