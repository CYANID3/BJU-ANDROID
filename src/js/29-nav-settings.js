// Настройки › «Нижняя панель»: образец панели сверху, пункты на панели по порядку (с большой кнопкой в центре), «Можно добавить»;
// выбор действия для места; Настройки › «Тема и фон» — тема и оттенок фона на одном экране.

// мини-копия панели в строке «Нижняя панель»
const navMini = () => { const v = navGet(), m = navMid(v); return `<span class="nmini" aria-hidden="true">${v.s.map((k, i) => `<i class="${i === m ? "f" : ""}">${ic(NA[k][2])}</i>`).join("")}</span>` };
let navPop = -1, navY = 0, navSlot = 0;
const NAVT = ["Нижняя панель", "Пункты и их порядок"];
function navOpen() { if (!$("v7").hidden) hubY = shBody().scrollTop; SUB = 7; drawNav(); sv(15, ...NAVT); show() }
const navMax = v => v.big ? 5 : 5, navSides = v => v.s.filter((k, i) => i !== navMid(v));
function drawNav(lift) {
  const v = navGet(), m = navMid(v), side = navSides(v), L = navLeft(side.length), full = side.length >= (v.big ? 4 : 5);
  const prev = `<div class="pbv" style="grid-template-columns:${navCols(v, 60)}">${v.s.map((k, i) => `<button class="${i === m ? "f" : ""}${i === navPop ? " pop" : ""}" onclick="navPick(${i})" aria-label="${i === m ? "Кнопка в центре" : "Место " + (i + 1)}: ${NA[k][0]}">${ic(NA[k][2])}${i === m ? "" : `<span>${NA[k][1]}</span>`}</button>`).join("")}</div>`;
  const row = (k, j0, _, off) => { const req = NREQ.includes(k), i = v.s.indexOf(k), j = j0 + (off || 0);
    return `<div class="row nrow" data-k="${k}"><span class="gp nodrag" aria-hidden="true">${ic("grip")}</span><span class="ic">${ic(NA[k][2])}</span><span class="tx">${NA[k][0]}<small>${j < L ? "Слева" : "Справа"}${req ? " · всегда на панели" : ""}</small></span>${req ? `<span class="lk" title="Обязательный пункт">${ic("lock")}</span>` : `<button class="rm" onclick="navRm('${k}')" aria-label="Убрать «${NA[k][0]}» с панели">${ic("minus")}</button>`}</div>` };
  const ctr = `<button class="row ctr" data-k="ctr" onclick="navPick(-1)"><span class="gp0" aria-hidden="true"></span><span class="ic${v.big ? " on" : ""}">${ic(v.big ? NA[v.s[m]][2] : "close")}</span><span class="tx">Кнопка в центре<small>${v.big ? "Касание: " + NA[v.s[m]][0].toLowerCase() : "Скрыта — нажмите, чтобы выбрать действие"}</small></span><span class="ch">${ic("chevR")}</span></button>`;
  const add = Object.keys(NA).filter(k => !v.s.includes(k) && !NREQ.includes(k));
  const addRow = k => { const ok_ = nOk(k), why = !ok_ ? "Включите «Отслеживать вес» в Настройках" : full ? "На панели уже " + side.length + " — сначала уберите один" : NA[k][4];
    return `<div class="row${!ok_ || full ? " dis" : ""}" data-a="${k}"><span class="ic">${ic(NA[k][2])}</span><span class="tx">${NA[k][0]}<small>${why}</small></span><button class="rm ad" onclick="navAdd('${k}')"${!ok_ || full ? ' aria-disabled="true"' : ""} aria-label="Добавить «${NA[k][0]}» на панель">${ic("plusc")}</button></div>` };
  $("v15").innerHTML = `<div class="pbw">${prev}</div>
  <div class="gh">На панели · ${side.length} из ${v.big ? 4 : 5}${v.big ? " и кнопка" : ""}</div><div id="nvl" class="grp">${side.slice(0, L).map((k, j) => row(k, j)).join("")}${ctr}${side.slice(L).map((k, j) => row(k, j, 0, L)).join("")}</div>
  <div class="hint">Потяните строку за точки, чтобы поставить пункт на другое место. С кнопкой — до четырёх пунктов, без неё — до пяти.</div>
  ${add.length ? `<div class="gh">Можно добавить</div><div id="nva" class="grp">${add.map(addRow).join("")}</div>` : ""}
  <div class="hint">«Продукты» и «Настройки» убрать нельзя. Каждое действие — только в одном месте панели.</div>`;
  if (lift != null) { const r = $("nvl").querySelector(`.nrow[data-k="${lift}"]`); if (r) r.classList.add("drg") }
  navPop = -1; navDragBind()
}
// перерисовать экран панели; высота листа меняется плавно (строка ушла в «Можно добавить» или вернулась)
// плавная перерисовка: группы («На панели», «Можно добавить») меняют высоту плавно, строки внутри группы переезжают
// на новые места (FLIP), строка, перешедшая в другую группу, проявляется на новом месте. Всё, что ниже, едет вслед за высотой
const navKey = el => el.dataset.k || el.dataset.a;
function navRedraw() {
  const root = $("v15"); if (root.hidden) return;
  if (RM() || !root.animate) return drawNav();
  const G = () => [...root.querySelectorAll(".grp[id]")], rel = el => { const g = el.closest(".grp[id]"); return [g ? g.id : "", el.getBoundingClientRect().top - (g ? g.getBoundingClientRect().top : 0)] };
  const h0 = new Map(G().map(g => [g.id, g.getBoundingClientRect().height])), was = new Map([...root.querySelectorAll("[data-k],[data-a]")].map(el => [navKey(el), rel(el)]));
  root.getAnimations({ subtree: true }).forEach(a => { try { a.finish() } catch (e) { } });
  drawNav(); const D = 260, E = "cubic-bezier(.2,0,0,1)";
  G().forEach(g => { const a = h0.get(g.id), b = g.getBoundingClientRect().height; if (a != null && Math.abs(a - b) > .5) g.animate([{ height: a + "px" }, { height: b + "px" }], { duration: D, easing: E }) });
  root.querySelectorAll("[data-k],[data-a]").forEach(el => { const k = navKey(el), o = was.get(k), [gid, y] = rel(el);
    if (!o || o[0] !== gid) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, delay: 80, easing: "ease-out", fill: "backwards" });
    else if (Math.abs(o[1] - y) > .5) el.animate([{ transform: `translateY(${o[1] - y}px)` }, { transform: "none" }], { duration: D, easing: E }) })
}
function navRm(k) {
  const v = navGet(), old = JSON.parse(JSON.stringify(v)); if (NREQ.includes(k) || !v.s.includes(k)) return;
  const s = v.s.filter(x => x !== k), side = s.filter((x, i) => !(v.big && x === v.s[navMid(v)]));
  if (side.length < 2) return; navSave({ ...v, s: v.big ? (() => { const c = v.s[navMid(v)], sd = side, L = navLeft(sd.length); return [...sd.slice(0, L), c, ...sd.slice(L)] })() : s }, `Убрано с панели: ${NA[k][1]}`, old)
}
function navAdd(k) {
  const v = navGet(), side = navSides(v);
  if (!nOk(k)) { vib("err"); return toast("Сначала включите «Отслеживать вес» в Настройках") }
  if (side.length >= (v.big ? 4 : 5)) { vib("err"); return toast(v.big ? "С кнопкой — не больше четырёх пунктов. Уберите один или скройте кнопку" : "Не больше пяти пунктов — сначала уберите один") }
  // новый пункт встаёт перед последним («Настройки» остаются с краю)
  side.splice(Math.max(1, side.length - 1), 0, k); const L = navLeft(side.length), m = navMid(v);
  navPop = -2; navSave({ ...v, s: v.big ? [...side.slice(0, L), v.s[m], ...side.slice(L)] : side }, `Добавлено: ${NA[k][1]}`)
}
// выбор действия: для места сбоку или для кнопки в центре (i = -1 — кнопка, в том числе скрытая)
function navPick(i) {
  const v = navGet(); if (i === navMid(v)) i = -1; const k = i >= 0 ? v.s[i] : null; if (i >= 0 && !k) return;
  if (k && NREQ.includes(k)) { vib("err"); return toast(`«${NA[k][0]}» — обязательный пункт: его можно переставить, но не убрать`) }
  if (!$("v15").hidden) navY = shBody().scrollTop;
  navSlot = i; drawNavPick(); sv(16, i < 0 ? "Кнопка в центре" : `Место ${i + 1} из ${v.n}`, i < 0 ? "Что делает касание большой кнопки" : "Сейчас: " + NA[k][0]); show()
}
function drawNavPick() {
  const v = navGet(), i = navSlot, m = navMid(v), cur_ = i < 0 ? (v.big ? v.s[m] : null) : v.s[i];
  const it = k => {
    const j = v.s.indexOf(k), on = k === cur_, ok_ = nOk(k), noC = NREQ.includes(k) && i < 0, dis = !ok_ || noC;
    const st = on ? NA[k][4] : !ok_ ? "Включите «Отслеживать вес» в Настройках" : noC ? "Обязательный пункт не ставится в центр" : j >= 0 ? `Сейчас: ${j === m ? "кнопка в центре" : (j + 1) + "-е место"} · поменяются местами` : NA[k][4];
    return `<button class="row${on ? " on" : ""}${dis ? " dis" : ""}${j >= 0 && !on && !dis ? " used" : ""}" role="radio" aria-checked="${on}"${dis ? ' aria-disabled="true"' : ""} onclick="navSet('${k}')"><span class="ic">${ic(NA[k][2])}</span><span class="tx">${NA[k][0]}<small>${st}</small></span>${on ? `<span class="ok">${ic("check")}</span>` : j >= 0 && !dis ? `<span class="sw_" aria-hidden="true">${ic("swap")}</span>` : ""}</button>` };
  const G = g => Object.keys(NA).filter(k => NA[k][3] === g);
  $("v16").innerHTML = `<div class="gh">Добавить</div><div class="grp">${G("add").map(it).join("")}</div><div class="gh">Открыть</div><div class="grp">${G("go").map(it).join("")}</div>` +
    (i < 0 ? `<div class="grp" style="margin-top:var(--gap)"><button class="row${v.big ? "" : " on"}" role="radio" aria-checked="${!v.big}" onclick="navSet('')"><span class="ic">${ic("close")}</span><span class="tx">Скрыть кнопку<small>На панели только обычные пункты — до пяти</small></span>${v.big ? "" : `<span class="ok">${ic("check")}</span>`}</button></div>`
      : `<div class="gh">Всегда на панели</div><div class="grp">${G("req").map(it).join("")}</div>`)
}
function navSet(k) {
  const v = navGet(), i = navSlot, m = navMid(v), old = JSON.parse(JSON.stringify(v));
  if (i < 0) {
    if (!k) { if (v.big) setFa("hide"), toast(`Кнопка скрыта: «${NA[v.s[m]][1]}» убрано с панели`, 1, 6000), navUndo = { v: old, m: $("tm").textContent }; return navBack() }
    if (!nOk(k)) { vib("err"); return toast("Сначала включите «Отслеживать вес» в Настройках") }
    if (NREQ.includes(k)) { vib("err"); return toast("Обязательный пункт не ставится в центр") }
    if (v.big && v.s[m] === k) return navBack();
    navPop = v.big ? m : -2; navCenter(k, 1); return navBack()
  }
  const was = v.s[i];
  if (!nOk(k)) { vib("err"); return toast("Сначала включите «Отслеживать вес» в Настройках") }
  if (NREQ.includes(k) && i === m) { vib("err"); return toast("Обязательный пункт не ставится в центр") }
  if (was === k) return navBack();
  const s = v.s.slice(), j = s.indexOf(k);
  if (j >= 0) { s[j] = was; s[i] = k } else s[i] = k;
  navPop = i; navSave({ ...v, s }, j >= 0 ? `«${NA[k][1]}» и «${NA[was][1]}» поменялись местами` : `Место ${i + 1}: ${NA[k][1]}`, old); navBack()
}
function navBack() { const y = navY; drawNav(); sv(15, ...NAVT); shBody().scrollTop = y }
// перетаскивание за точки: строка идёт за пальцем, соседние расступаются, порядок — при отпускании.
// Строка «Кнопка в центре» стоит на месте; пункты переходят через неё (слева ↔ справа).
function navDragBind() {
  const box = $("nvl"); if (!box) return;
  box.querySelectorAll(".nrow .gp").forEach(g => g.addEventListener("pointerdown", e => {
    const all = [...box.children], rows = all.filter(r => r.classList.contains("nrow")), row = g.closest(".nrow"), i0 = rows.indexOf(row),
      R = rows.map(r => r.getBoundingClientRect()), RA = all.map(r => r.getBoundingClientRect()), y0 = e.clientY, H = R[i0].height; let t = i0;
    e.preventDefault(); try { g.setPointerCapture(e.pointerId) } catch (_) { } row.classList.add("drg"); vib("ui");
    const lo = RA[0].top - R[i0].top, hi = RA[RA.length - 1].bottom - R[i0].bottom;
    const mv = ev => {
      const dy = Math.max(lo, Math.min(hi, ev.clientY - y0)), c = R[i0].top + H / 2 + dy; row.style.transform = `translateY(${dy}px)`;
      const nt = dy >= hi - 1 ? rows.length - 1 : dy <= lo + 1 ? 0 : R.filter((r, j) => j < i0 ? r.top + r.height / 2 < c : j > i0 && r.top + r.height / 2 <= c).length;
      if (nt !== t) { t = nt; vib("ui") }
      // остальные строки занимают места пунктов в новом порядке (место строки «Кнопка в центре» не занимают)
      const ord = rows.filter((r, j) => j !== i0); ord.splice(t, 0, row);
      ord.forEach((r, q) => { if (r === row) return; const j = rows.indexOf(r), sh = R[q].top - R[j].top; r.style.transform = sh ? `translateY(${sh}px)` : "" })
    };
    const up = () => {
      g.removeEventListener("pointermove", mv); g.removeEventListener("pointerup", up); g.removeEventListener("pointercancel", up);
      if (t === i0) { row.classList.remove("drg"); row.style.transform = ""; rows.forEach(r => r.style.transform = ""); return }
      const v = navGet(), m = navMid(v), side = rows.map(r => r.dataset.k), [k] = side.splice(i0, 1); side.splice(t, 0, k);
      const L = navLeft(side.length); navPop = -1;
      // строки остаются на новых местах без скачка: перерисовка — уже с новым порядком
      navQuiet = 1; try { navSave({ ...v, s: m >= 0 ? [...side.slice(0, L), v.s[m], ...side.slice(L)] : side }) } finally { navQuiet = 0 }
    };
    g.addEventListener("pointermove", mv); g.addEventListener("pointerup", up); g.addEventListener("pointercancel", up)
  }))
}

// ===== «Тема и фон»: тема и оттенок фона на одном экране; выбор — как во всех настройках: строка со значком и галочкой =====
const lookLbl = () => { const t = PK.th.o().find(o => o[0] === PK.th.g()), n = PK.tn.o().find(o => o[0] === PK.tn.g()); return (t[0] === "auto" ? "Авто" : t[1]) + " · " + n[1].toLowerCase() };
function lookOpen() { if (!$("v7").hidden) hubY = shBody().scrollTop; SUB = 7; drawLook(); sv(17, "Тема и фон", "Светлая или тёмная, оттенок фона"); show() }
function drawLook() {
  const grp = (k, fn) => { const c = PK[k].g(); return `<div class="grp">${PK[k].o().map(([v, t, i, d]) => `<button class="row${v === c ? " on" : ""}" role="radio" data-v="${v}" aria-checked="${v === c}" onclick="${fn}('${v}')"><span class="ic">${ic(i)}</span><span class="tx">${t}${d ? `<small>${d}</small>` : ""}</span><span class="ok">${ic("check")}</span></button>`).join("")}</div>` };
  const el = $("v17"), key = PK.th.g() + PK.tn.g();
  // тот же экран — меняется только отметка (строки не пересоздаются: цвет и галочка переходят плавно)
  if (el._k && el.innerHTML) { el.querySelectorAll(".grp").forEach((g, n) => { const c = PK[n ? "tn" : "th"].g(); g.querySelectorAll(".row").forEach(r => { const on = r.dataset.v === c; r.classList.toggle("on", on); r.setAttribute("aria-checked", on) }) }); el._k = key; return }
  el._k = key; el.innerHTML = `<div class="gh">Тема</div>${grp("th", "setTh")}<div class="gh">Оттенок фона</div>${grp("tn", "setTn")}<div class="hint">Оттенок — примесь цвета акцента в фоне и карточках. Сам цвет акцента — отдельной строкой в «Настройках».</div>`
}
