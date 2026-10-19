// Нижний лист: экраны, шапка (заголовок, «‹ назад», стрелки месяца), низ с кнопками действия, открытие и закрытие
const VWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
// список продуктов — всегда на всю высоту: при поиске лист не «прыгает»; остальные экраны — по содержимому
const FULL = new Set([1]);
const shEl = () => document.querySelector("#ov .sh"), shBody = () => document.querySelector("#ov .shb");
let SUB = 0; // экран открыт из «Ещё» (7): «‹» в шапке и «Назад» возвращают туда
/**
 * Показать экран n листа. t — заголовок, s — подпись под ним.
 * Лист прижат к низу и по высоте равен содержимому; смена экрана — новый проявляется на месте, лист плавно меняет высоту.
 */
function sv(n, t, s) {
  const sh = shEl(), prev = VWS.find(i => !$("v" + i).hidden), h0 = isOpen ? sh.offsetHeight : 0;
  VWS.forEach(i => $("v" + i).hidden = i !== n);
  $("st").textContent = t || ""; $("ss").textContent = s || "";
  document.querySelectorAll(".shf .ft").forEach(f => f.hidden = +f.dataset.v !== n);
  sh.classList.toggle("full", FULL.has(n));
  shHead(n); kpView(n);
  // открытие листа и смена экрана — всегда с начала
  if (!isOpen || prev !== n) shBody().scrollTop = 0;
  if (!isOpen || prev === n || RM() || !sh.animate) return;
  const E = { duration: MO.t2, easing: MO.E };
  try { $("v" + n).animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], E); $("st").parentElement.animate([{ opacity: 0 }, { opacity: 1 }], { duration: MO.t2 }) } catch (e) { }
  const h1 = sh.offsetHeight; if (Math.abs(h1 - h0) > 4) try { sh.animate([{ height: h0 + "px" }, { height: h1 + "px" }], E) } catch (e) { }
}
// шапка: «‹ назад» — если «Назад» ведёт на шаг внутри листа; у календаря и статистики — стрелки месяца
function shHead(n) {
  const mn = n === 6 || n === 9, hd = document.querySelector("#ov .hd");
  hd.classList.toggle("mn", mn); $("hl").hidden = $("hr").hidden = !mn;
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
function closeUI() { if (!isOpen) return; cpm = -1; isOpen = false; SUB = 0; if (mode === "ing") mode = pmode; ik = -1; $("ov").classList.remove("on"); document.documentElement.classList.remove("lk"); ei = -1; kpF = null; try { document.activeElement.blur() } catch (e) { } }
async function xcl() {
  if (!v3ok && !$("v3").hidden && v3sig() !== v3snap && !await ask("Продукт не сохранён. Закрыть без сохранения?", "Закрыть", 1)) return;
  if (!$("v8").hidden && dirtyDish() && !await ask("Закрыть без сохранения блюда?", "Закрыть", 1)) return;
  cl()
}
// браузер: лист — шаг истории («Назад» браузера закрывает его). Закрытие кнопкой убирает этот шаг;
// popstate от такого history.back() приходит позже и не должен закрыть лист, открытый сразу следом
let popSkip = 0;
function cl() { const was = isOpen; closeUI(); if (was && !NATIVE) { try { if (history.state && history.state.o) { popSkip++; history.back() } } catch (e) { } } }
