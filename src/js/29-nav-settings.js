// Настройки › «Нижняя панель»: образец панели, большая кнопка, состав (компактная / полная), пункты по бокам с порядком;
// выбор действия для места; Настройки › «Тема и фон» — тема и оттенок фона на одном экране.

// мини-копия панели в строке «Нижняя панель»
const navMini = () => { const v = navGet(), m = navMid(v); return `<span class="nmini" aria-hidden="true">${v.s.map((k, i) => `<i class="${i === m ? "f" : ""}">${ic(NA[k][2])}</i>`).join("")}</span>` };
let navPop = -1;
function navOpen() { if (!$("v7").hidden) hubY = shBody().scrollTop; SUB = 7; drawNav(); sv(15, "Нижняя панель", "Что на панели и в каком порядке"); show() }
const navFullOf = v => v.n - (v.big ? 1 : 0) === 4;
function drawNav() {
  const v = navGet(), m = navMid(v), tg = tgSnap($("v15")), side = v.s.filter((k, i) => i !== m), h = side.length / 2;
  const prev = `<div class="pbv" style="grid-template-columns:${navCols(v, 60)}">${v.s.map((k, i) => `<button class="${i === m ? "f" : ""}${i === navPop ? " pop" : ""}" onclick="navPick(${i})" aria-label="${i === m ? "Большая кнопка" : "Место " + (i + 1)}: ${NA[k][0]}">${ic(NA[k][2])}${i === m ? "" : `<span>${NA[k][1]}</span>`}</button>`).join("")}</div>`;
  const lay = [0, 1].map(f => { const n = (f ? 4 : 2) + (v.big ? 1 : 0), on = navFullOf(v) === !!f, mm = v.big ? (n - 1) / 2 : -1;
    return `<button class="${on ? "on" : ""}" onclick="navFull(${f})" aria-pressed="${on}"><span class="lyp" style="grid-template-columns:${v.big ? `repeat(${(n - 1) / 2},1fr) 22px repeat(${(n - 1) / 2},1fr)` : `repeat(${n},1fr)`}">${Array.from({ length: n }, (_, i) => `<i class="${i === mm ? "f" : ""}"></i>`).join("")}</span><b>${f ? "Полная" : "Компактная"}</b><small>${n} ${plural(n, "место", "места", "мест")}${f ? "" : " · только обязательные"}</small></button>` }).join("");
  const row = (k, j) => { const req = NREQ.includes(k), i = v.s.indexOf(k);
    return `<div class="row nrow" data-k="${k}" onclick="if(!event.target.closest('.gp'))navPick(${i})"><span class="gp nodrag" aria-hidden="true">${ic("grip")}</span><span class="ic">${ic(NA[k][2])}</span><span class="tx">${NA[k][0]}<small>${j < h ? "Слева" : "Справа"}${req ? " · обязательный" : ""}</small></span>${req ? `<span class="lk" title="Обязательный пункт">${ic("lock")}</span>` : `<button class="ch" onclick="event.stopPropagation();navPick(${i})" aria-label="Выбрать другое действие вместо «${NA[k][0]}»">${ic("chevR")}</button>`}</div>` };
  $("v15").innerHTML = `<div class="pbw">${prev}<div class="pbc">Нажмите на место на образце, чтобы выбрать действие</div></div>
  <div class="grp">${srow("nbig", "fab", "Большая кнопка в центре", v.big ? "Главное действие — крупно, посередине" : "Выключена: на панели только обычные пункты", null, "navBig()", { sw: v.big })}${v.big ? srow("", NA[v.s[m]][2], "Действие кнопки", NA[v.s[m]][0], null, `navPick(${m})`) : ""}</div>
  <div class="gh">Состав</div><div class="lyo">${lay}</div>
  <div class="gh">Пункты по бокам · слева направо</div><div id="nvl" class="grp">${side.map(row).join("")}</div>
  <div class="hint">Порядок — перетащите строку за точки. «Продукты» и «Настройки» есть всегда: их можно переставить, но не убрать. Каждое действие — только в одном месте панели, по бокам пункты идут парами — панель всегда симметрична.</div>`;
  tgPlay(tg, $("v15")); navPop = -1; navDragBind()
}
// состав: компактная — только «Продукты» и «Настройки», полная — ещё по пункту с каждой стороны
function navFull(full) {
  full = !!full; const v = navGet(); if (navFullOf(v) === full) return;
  const old = JSON.parse(JSON.stringify(v)), m = navMid(v), c = m >= 0 ? v.s[m] : null; let side = v.s.filter((k, i) => i !== m), removed = [];
  if (full) { const back = (v.x || []).filter(k => nOk(k) && !v.s.includes(k)), add = [...back, ...NSUG.filter(k => nOk(k) && !v.s.includes(k) && !back.includes(k))].slice(0, 2); side = [add[0], side[0], add[1], side[1]] }
  else { removed = side.filter(k => !NREQ.includes(k)); side = side.filter(k => NREQ.includes(k)) }
  const h = side.length / 2, s = c ? [...side.slice(0, h), c, ...side.slice(h)] : side;
  navPop = -2; navSave({ ...v, n: s.length, s, x: removed.length ? removed : v.x }, full ? "Панель: полная" : `Панель: компактная. Убрано: ${removed.map(k => NA[k][1]).join(", ")}`, full ? null : old)
}
// большая кнопка: выключить — её действие уходит с панели (запоминается); включить — возвращается
function navBig() {
  const v = navGet(), old = JSON.parse(JSON.stringify(v)), m = navMid(v);
  if (v.big) { const c = v.s[m], s = v.s.filter((k, i) => i !== m); return navSave({ ...v, n: s.length, big: false, s, c }, `Большая кнопка выключена: «${NA[c][1]}» убрано с панели`, old) }
  const side = v.s.slice(), c = nOk(v.c) && !NREQ.includes(v.c) && !side.includes(v.c) ? v.c : NCEN.find(k => nOk(k) && !side.includes(k)), h = side.length / 2;
  navPop = h; navSave({ ...v, n: side.length + 1, big: true, s: [...side.slice(0, h), c, ...side.slice(h)] }, `Большая кнопка: ${NA[c][1]}`)
}
// выбор действия для места
let navSlot = 0;
function navPick(i) {
  const v = navGet(), k = v.s[i]; if (!k) return;
  if (NREQ.includes(k)) { vib("err"); return toast(`«${NA[k][0]}» — обязательный пункт: его можно переставить, но не убрать`) }
  if (!$("v15").hidden) navY = shBody().scrollTop;
  navSlot = i; drawNavPick(); sv(16, i === navMid(v) ? "Большая кнопка" : `Место ${i + 1} из ${v.n}`, i === navMid(v) ? "Действие по касанию" : "Сейчас: " + NA[k][0]); show()
}
let navY = 0;
function drawNavPick() {
  const v = navGet(), i = navSlot, m = navMid(v), cur_ = v.s[i];
  const it = k => {
    const j = v.s.indexOf(k), on = k === cur_, ok_ = nOk(k), noC = NREQ.includes(k) && i === m, dis = !ok_ || noC;
    const st = on ? NA[k][4] : !ok_ ? "Включите «Отслеживать вес» в Настройках" : noC ? "Обязательный пункт не ставится в центр" : j >= 0 ? `Сейчас: ${j === m ? "большая кнопка" : (j + 1) + "-е место"} · поменяются местами` : NA[k][4];
    return `<button class="row${on ? " on" : ""}${dis ? " dis" : ""}${j >= 0 && !on && !dis ? " used" : ""}" role="radio" aria-checked="${on}"${dis ? ' aria-disabled="true"' : ""} onclick="navSet('${k}')"><span class="ic">${ic(NA[k][2])}</span><span class="tx">${NA[k][0]}<small>${st}</small></span>${on ? `<span class="ok">${ic("check")}</span>` : j >= 0 && !dis ? `<span class="sw_" aria-hidden="true">${ic("swap")}</span>` : ""}</button>` };
  const G = g => Object.keys(NA).filter(k => NA[k][3] === g);
  $("v16").innerHTML = `<div class="gh">Добавить</div><div class="grp">${G("add").map(it).join("")}</div><div class="gh">Открыть</div><div class="grp">${G("go").map(it).join("")}</div>${i === m ? "" : `<div class="gh">Обязательные</div><div class="grp">${G("req").map(it).join("")}</div>`}`
}
function navSet(k) {
  const v = navGet(), i = navSlot, m = navMid(v), was = v.s[i];
  if (!nOk(k)) { vib("err"); return toast("Сначала включите «Отслеживать вес» в Настройках") }
  if (NREQ.includes(k) && i === m) { vib("err"); return toast("Обязательный пункт не ставится в центр") }
  if (was === k) return navBack();
  const old = JSON.parse(JSON.stringify(v)), s = v.s.slice(), j = s.indexOf(k);
  if (j >= 0) { s[j] = was; s[i] = k } else s[i] = k;
  navPop = i; navSave({ ...v, s }, j >= 0 ? `«${NA[k][1]}» и «${NA[was][1]}» поменялись местами` : `${i === m ? "Большая кнопка" : "Место " + (i + 1)}: ${NA[k][1]}`, old); navBack()
}
function navBack() { const y = navY; drawNav(); sv(15, "Нижняя панель", "Что на панели и в каком порядке"); shBody().scrollTop = y }
// перетаскивание пунктов по бокам за точки: строка идёт за пальцем, соседние расступаются, порядок — при отпускании
function navDragBind() {
  const box = $("nvl"); if (!box) return;
  box.querySelectorAll(".gp").forEach(g => g.addEventListener("pointerdown", e => {
    const rows = [...box.querySelectorAll(".nrow")], row = g.closest(".nrow"), i0 = rows.indexOf(row), R = rows.map(r => r.getBoundingClientRect()), y0 = e.clientY; let t = i0;
    e.preventDefault(); try { g.setPointerCapture(e.pointerId) } catch (_) { } row.classList.add("drg"); vib("ui");
    const mv = ev => {
      const lo = R[0].top - R[i0].top, hi = R[R.length - 1].bottom - R[i0].bottom, dy = Math.max(lo, Math.min(hi, ev.clientY - y0)), c = R[i0].top + R[i0].height / 2 + dy;
      row.style.transform = `translateY(${dy}px)`;
      // у края списка — крайнее место; иначе — по середине строки
      const nt = dy >= hi - 1 ? R.length - 1 : dy <= lo + 1 ? 0 : R.filter((r, j) => j < i0 ? r.top + r.height / 2 < c : j > i0 && r.top + r.height / 2 <= c).length;
      if (nt !== t) { t = nt; vib("ui") }
      rows.forEach((r, j) => { if (j === i0) return; const sh = i0 < t && j > i0 && j <= t ? -R[i0].height : i0 > t && j >= t && j < i0 ? R[i0].height : 0; r.style.transform = sh ? `translateY(${sh}px)` : "" })
    };
    const up = () => {
      g.removeEventListener("pointermove", mv); g.removeEventListener("pointerup", up); g.removeEventListener("pointercancel", up);
      if (t === i0) { row.classList.remove("drg"); rows.forEach(r => r.style.transform = ""); return }
      const v = navGet(), m = navMid(v), side = rows.map(r => r.dataset.k), [k] = side.splice(i0, 1); side.splice(t, 0, k);
      const h = side.length / 2; navPop = v.s.indexOf(k); navSave({ ...v, s: m >= 0 ? [...side.slice(0, h), v.s[m], ...side.slice(h)] : side })
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
