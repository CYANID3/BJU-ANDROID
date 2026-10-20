// Список продуктов, количество, форма продукта, норма
// Избранное (звёздочка) и недавние: при добавлении без поиска — разделы «Избранное», «Недавние», «Все продукты»
const isFav = n => !!(S.fav && S.fav[n]);
// недавние: последние добавленные продукты; если списка ещё нет — собрать из дневника
function rcList() { if (!S.rc) { const r = []; for (const k of Object.keys(S.d).sort().reverse()) { for (const e of S.d[k].slice().reverse()) if (!r.includes(e.n)) r.push(e.n); if (r.length >= 10) break } S.rc = r.slice(0, 10) } return S.rc }
function rcPush(n) { S.rc = [n, ...rcList().filter(x => x !== n)].slice(0, 10) }
function fav(el, i) { const n = S.db[i][0]; S.fav = Object.assign({}, S.fav); if (S.fav[n]) delete S.fav[n]; else S.fav[n] = 1; const on = !!S.fav[n]; el.classList.toggle("on", on); el.setAttribute("aria-pressed", on); el.setAttribute("aria-label", on ? "Убрать из избранного" : "В избранное"); vib("ui"); saveq() }
// фильтр в «Продуктах»: 0 — все, 1 — только продукты, 2 — только блюда (кнопки видны, если есть хотя бы одно блюдо)
// касание вкладки — тем же движением, что и взмах: список уезжает в сторону выбранной вкладки
let pFl = 0; function setPf(v) { const d = Math.sign(v - pFl); if (!d) return; vib("ui"); hSlide($("ls"), d, 0, () => { pFl = v; lst() }) }
function drawPf() { const has = mode === "mng" && S.db.some(p => p[5]); if (!has) pFl = 0; $("pf").hidden = !has; if (has) { const nD = S.db.filter(p => p[5]).length; $("pf").innerHTML = [["Все", 0, S.db.length], ["Продукты", 1, S.db.length - nD], ["Блюда", 2, nD]].map(([t, v, n]) => `<button class="${pFl === v ? "on" : ""}" onmousedown="event.preventDefault()" onclick="setPf(${v})">${t}<small>${n}</small></button>`).join("") } }
// Б / Ж / У цветными буквами: «Б 22,1 · Ж 1,3 · У 0»
const mxl = (p, f, c) => `<i class="mx p">Б</i>${f1(p)} · <i class="mx f">Ж</i>${f1(f)} · <i class="mx c">У</i>${f1(c)}`;
let lstQ = 0;
function lst() {
  const q = W($("q").value); drawPf(); IX = []; S.db.forEach((p, i) => { if ((!pFl || (pFl === 2) === !!p[5]) && q.every(t => W(p[0]).some(w => w.startsWith(t)))) IX.push(i) }); let hd = null;
  if (mode !== "mng") {
    const u = S.uc || {}, N = i => S.db[i][0]; IX.sort((a, b) => isFav(N(b)) - isFav(N(a)) || (u[N(b)] || 0) - (u[N(a)] || 0));
    if (!q.length) {
      const F = IX.filter(i => isFav(N(i))), pos = new Map(S.db.map((p, i) => [p[0], i]).reverse()), R = rcList().filter(n => !isFav(n) && pos.has(n)).slice(0, 8).map(n => pos.get(n));
      if (F.length || R.length) { const rest = IX.filter(i => !isFav(N(i)) && !R.includes(i)); IX = [...F, ...R, ...rest]; hd = { 0: F.length ? "Избранное" : null, [F.length]: R.length ? "Недавние" : null, [F.length + R.length]: "Все продукты" } }
    }
  }
  IX = IX.slice(0, hd ? 100 : 80);
  const row = (i, k) => { const p = S.db[i], f = isFav(p[0]); return (hd && hd[k] ? `<div class="lh">${hd[k]}</div>` : "") + `<button class="pk${p[5] ? " dish" : ""}" onclick="pc(${k})">${p[5] ? `<span class="dk">${ic("dish")}</span>` : ""}<div><div class="n">${esc(p[0])}</div><div class="mu">${p[5] ? `<span class="dt">Блюдо</span>` : ""}${mxl(p[1], p[2], p[3])} <span class="u">на 100 г</span></div></div><b>${kc(p[1], p[2], p[3])} <small>ккал</small></b><span class="fv${f ? " on" : ""}" role="button" aria-pressed="${f}" aria-label="${f ? "Убрать из избранного" : "В избранное"}" onclick="event.stopPropagation();fav(this,${i})">${ic("star")}</span></button>` };
  // первый экран — сразу, остальное — когда браузер свободен (не позже 0,3 с): лист открывается без задержки даже на слабых телефонах
  lstQ++; const q0 = lstQ, el = $("ls"); el.innerHTML = IX.length ? IX.slice(0, 24).map(row).join("") : (pFl === 2 ? '<div class="mu">Блюд не найдено — создайте новое блюдо</div>' : '<div class="mu">Ничего не найдено — создайте новый продукт</div>');
  if (IX.length > 24) (window.requestIdleCallback || requestAnimationFrame)(() => { if (q0 === lstQ) el.insertAdjacentHTML("beforeend", IX.slice(24).map((x, n) => row(x, n + 24)).join("")) }, { timeout: 300 })
}
// единица при открытии: «Запоминать единицу» — та, в которой продукт вводили в прошлый раз (граммы, шт, банка, долька…);
// иначе (или впервые) — первая мера продукта, без мер — граммы
function pc(k) {
  const i = IX[k]; if (mode === "mng") return edit(i); sel = S.db[i]; const us = sel[4] || [], L = luOn() && (S.lu || {})[sel[0]];
  let u = us.length ? 0 : -1, q = "";
  if (L) { const j = L[0] ? us.findIndex(x => x[0] === L[0]) : -1; if (!L[0] || j >= 0) { u = j; q = j >= 0 ? L[1] || "" : "" } }
  gv(u < 0 ? (S.lg || {})[sel[0]] : q, u)
}
const UM = () => uu < 0 ? 1 : sel[4][uu][1];
const nf = x => String(x).replace(".", ",");
// крупные числа — с неразрывным пробелом между тысячами: 11 796
const nk = x => Math.round(x) >= 10000 ? String(Math.round(x)).replace(/\B(?=(\d{3})+$)/g, "\u202f") : String(Math.round(x));
// экран количества: единицы — сегментом, поле значения, быстрые значения, итог порции; ввод — своей клавиатурой
const amtSub = () => (ei >= 0 ? "Изменить · " + LBL[am] + " · " : ik >= 0 || mode === "ing" ? "Ингредиент · " : "") + kc(sel[1], sel[2], sel[3]) + " ккал на 100 г" + (ei >= 0 || ik >= 0 ? "" : ` · Б ${nf(r1(sel[1]))} · Ж ${nf(r1(sel[2]))} · У ${nf(r1(sel[3]))}`);
function pv() {
  const q = num($("gr").value), g = q * UM(), el = $("pvw"); vfUnit($("gr"));
  const K = kc(sel[1] * g / 100, sel[2] * g / 100, sel[3] * g / 100);
  el.innerHTML = g > 0 ? `<b>${nk(K)}</b><small>ккал</small><span>${mxl(sel[1] * g / 100, sel[2] * g / 100, sel[3] * g / 100)}</span>${uu >= 0 ? `<em>${nf(r1(g))} г</em>` : ""}` : "";
  $("ch").querySelectorAll("button").forEach(b => b.classList.toggle("on", +b.dataset.v === q));
  $("ab").textContent = (ei >= 0 || ik >= 0 ? "Сохранить" : "Добавить") + (g > 0 && ei < 0 && ik < 0 ? " · " + nk(K) + " ккал" : "")
}
function gv(v, u) { uu = u == null ? -1 : u; $("gr").value = v ? nf(v) : ""; drawU(); drawMc(); sv(2, sel[0], amtSub()); fIn("gr", 1) }
function drawU() {
  const nd = `onmousedown="event.preventDefault()"`;
  const us = sel[4] || [], lg = (S.lg || {})[sel[0]]; $("un").hidden = !us.length;
  $("un").innerHTML = us.length ? [["Граммы"], ...us].map((x, i) => `<button class="${i - 1 === uu ? "on" : ""}" ${nd} onclick="su(${i - 1})" title="${esc(x[0])}"><span>${esc(x[0])}</span>${i ? `<small>${nf(r1(x[1]))} г</small>` : ""}</button>`).join("") : "";
  // ровная сетка, все ячейки одной ширины и высоты: до 3 вариантов — в один ряд; больше — «Граммы» отдельной строкой во всю
  // ширину, единицы под ней по 2 (2, 4 единицы) или по 3 в ряд; неполный последний ряд — по центру (сетка из 6 долей, ячейка — 2 доли)
  { const m = us.length, c = m + 1 <= 3 ? m + 1 : m % 3 === 0 ? 3 : m % 2 === 0 ? 2 : 3, el = $("un"), bs = [...el.children].slice(1);
    el.style.gridTemplateColumns = `repeat(${c === 3 && m + 1 > 3 ? 6 : c},minmax(0,1fr))`; el.classList.toggle("g1", m + 1 > 3);
    if (c === 3 && m + 1 > 3) { const r = m % 3; bs.forEach((b, i) => { b.style.gridColumn = "span 2"; if (r && i >= m - r) b.style.gridColumn = `${(r === 1 ? 3 : 2 + (i - (m - r)) * 2)} / span 2` }) } }
  // единица с названием — подписью под числом (класс .un): число всегда по центру и целиком, название — целиком или с «…» во всю ширину
  $("gu").textContent = uu < 0 ? "г" : us[uu][0]; $("gr").closest(".vf").classList.toggle("un", uu >= 0); $("gr").style.paddingLeft = $("gr").style.paddingRight = uu < 0 ? "56px" : "16px"; vfUnit($("gr"))
  // быстрые значения: прошлое количество (с галочкой), 50 / 100 / 150 / 200 г; в штуках — 0,5 / 1 / 2 / 3; при изменении — текущее
  const cur0 = ei >= 0 || ik >= 0 ? num($("gr").value) : 0;
  const qs = uu < 0 ? [...new Set([cur0, lg, 50, 100, 150, 200].filter(Boolean).map(r1))].slice(0, 4).sort((a, b) => a - b) : [.5, 1, 2, 3];
  $("ch").innerHTML = qs.map(g => `<button data-v="${g}" ${nd} onclick="qg(${g})">${uu < 0 && g === r1(lg || 0) ? `<i>${ic("check")}</i>` : ""}${nf(g)}${uu < 0 ? "<small>&nbsp;г</small>" : ""}</button>`).join(""); pv()
}
function su(i) { uu = i; $("gr").value = ""; drawU(); vib("ui"); try { $("gr").focus({ preventScroll: true }) } catch (e) { } }
function qg(g) { const i = $("gr"); i.value = nf(g); vib("ui"); pv(); if (document.activeElement === i) rpOn(i) }
function ee(i) { const e = S.d[cur][i], pr = S.db.find(x => x[0] === e.n); ei = i; am = e.m; sel = [e.n, e.p / e.g * 100, e.f / e.g * 100, e.c / e.g * 100, pr && pr[4]]; const k = e.ul && sel[4] ? sel[4].findIndex(x => x[0] === e.ul) : -1; SUB = 0; gv(k >= 0 ? e.q : e.g, k); show() }
// пустое или нулевое значение: поле вздрагивает, вибрация «ошибка»
function badField(id, msg) { const i = $(id); i.classList.remove("bad"); void i.offsetWidth; i.classList.add("bad"); setTimeout(() => i.classList.remove("bad"), 700); vib("err"); try { i.focus({ preventScroll: true }) } catch (e) { } if (msg) toast(msg) }
function ad() {
  const q = num($("gr").value), g = q * UM(); if (!(g > 0)) return badField("gr", "Введите количество");
  const R = x => Math.round(x * 1e3) / 1e3, o = { m: am, n: sel[0], g: R(g), p: R(sel[1] * g / 100), f: R(sel[2] * g / 100), c: R(sel[3] * g / 100) }; if (uu >= 0) { o.q = q; o.ul = sel[4][uu][0] }
  if (mode === "ing") { delete o.m; if (ik >= 0) dr.i[ik] = o; else dr.i.push(o); ik = -1; vib("save"); return drawDish() }
  const edit_ = ei >= 0; if (edit_) S.d[cur][ei] = o; else { (S.d[cur] = S.d[cur] || []).push(o); S.uc = S.uc || {}; S.uc[sel[0]] = (S.uc[sel[0]] || 0) + 1; rcPush(sel[0]) }
  if (uu < 0) { S.lg = S.lg || {}; S.lg[sel[0]] = g } if (mode !== "ing") { S.lu = S.lu || {}; S.lu[sel[0]] = uu < 0 ? [""] : [sel[4][uu][0], q] } vib("save"); save();
  // добавили из списка — возвращаемся в список (тот же приём), чтобы следующий продукт был в одно касание; изменение записи — лист закрывается
  if (!edit_ && mode === "add" && isOpen) { try { document.activeElement.blur() } catch (e) { } render(); $("q").value = ""; lst(); drawMc(); sv(1, vt()); lastDel = lastDb = null; lastAdd = { o, k: cur }; toast(`${LBL[o.m]}: ${o.n} · ${o.ul ? nf(o.q) + " " + o.ul : nf(r1(o.g)) + " г"} · ${nk(kc(o.p, o.f, o.c))} ккал`, 1, 3500); return }
  cl(); render()
}
// единицы измерения продукта: строки появляются только по кнопке «＋ Единица измерения»
function unRow(l, g) { return `<div class="ur"><input placeholder="Например, банка" value="${esc(l)}" autocomplete="off" enterkeyhint="next"><input class="num" placeholder="Граммы" inputmode="none" value="${g ? nf(g) : ""}" autocomplete="off" aria-label="Граммы в единице"><button class="x" onclick="unDel(this)" aria-label="Удалить единицу">${ic("close")}</button></div>` }
function unDraw(a) { $("unr").innerHTML = (a || []).map(x => unRow(x[0], x[1])).join("") }
function unAdd() { $("unr").insertAdjacentHTML("beforeend", unRow("", "")); vib("ui"); $("unr").lastElementChild.firstElementChild.focus() }
function unDel(b) { b.closest(".ur").remove(); vib("del") }
function unGet() { return [...$("unr").children].map(r => { const i = r.querySelectorAll("input"); return [i[0].value.trim(), num(i[1].value)] }).filter(x => x[0] && x[1] > 0) }
let v3from = 0, v3snap = "", v3ok = 0; const v3sig = () => JSON.stringify([["nn", "np", "nf", "nc"].map(i => $(i).value.trim()), unGet()]);
function nw() { v3from = isOpen && !$("v1").hidden ? 1 : 0; ed = -1; ["nn", "np", "nf", "nc"].forEach(i => $(i).value = ""); unDraw(); nkc(); $("dl").hidden = true; v3snap = v3sig(); sv(3, "Новый продукт"); fIn("nn") }
function edit(i) { const p0 = S.db[i]; if (p0[5]) { ed = i; pmode = mode; ik = -1; dfrom = 1; dr = { n: p0[0], i: p0[5].i.map(x => ({ ...x })), w: p0[5].w }; dsnap = dsig(); return drawDish() } ed = i; const p = S.db[i]; $("nn").value = p[0]; $("np").value = nf(p[1]); $("nf").value = nf(p[2]); $("nc").value = nf(p[3]); unDraw(p[4]); nkc(); $("dl").hidden = false; v3from = 1; v3snap = v3sig(); sv(3, "Изменить продукт") }
async function mk() {
  const n = $("nn").value.trim(); if (!n) return badField("nn", "Введите название");
  const a = [n, nn($("np").value), nn($("nf").value), nn($("nc").value)], un = unGet(); if (un.length) a[4] = un;
  if (a[1] + a[2] + a[3] > 100.5 && !await ask("Б+Ж+У больше 100 г на 100 г. Сохранить как есть?", "Сохранить")) return;
  if (S.db.some((x, i) => i !== ed && nz(x[0]) === nz(n)) && !await ask("Продукт «" + n + "» уже есть. Создать ещё один?", "Создать")) return;
  if (ed >= 0) { const o = S.db[ed][0]; if (o !== a[0]) for (const m of ["uc", "lg", "lu", "fav"]) if (S[m] && o in S[m]) { S[m][a[0]] = S[m][o]; delete S[m][o] } if (S.rc) S.rc = S.rc.map(x => x === o ? a[0] : x); S.db[ed] = a } else S.db.unshift(a); vib("save"); save();
  if ((mode === "add" || mode === "ing") && ed < 0) { sel = a; gv("", a[4] ? 0 : -1) } else if (v3from) listBack(); else cl()
}
async function rm() {
  if (ed < 0 || !await ask("«" + S.db[ed][0] + "» исчезнет из списка. Записи в дневнике останутся.", "Удалить", 1, 0, S.db[ed][5] ? "Удалить блюдо?" : "Удалить продукт?")) return;
  { const n = S.db[ed][0]; S.db.splice(ed, 1); if (!S.db.some(x => x[0] === n)) { if (S.fav) delete S.fav[n]; if (S.rc) S.rc = S.rc.filter(x => x !== n) } }
  vib("del"); save(); if (mode === "ing") mode = pmode; listBack()
}
function gk2() { $("ss").textContent = "≈ " + kc(nn($("gp").value), nn($("gf").value), nn($("gc").value)) + " ккал в день"; kpLabel() }
function goals(sub) { SUB = sub ? 7 : 0; $("gp").value = S.g.p; $("gf").value = S.g.f; $("gc").value = S.g.c; sv(4, "Норма на день", ""); gk2(); show(); fIn("gp", 1) }
function sg() { S.g = { p: nn($("gp").value), f: nn($("gf").value), c: nn($("gc").value) }; vib("save"); save(); if (SUB) { sets(1); render(); return } cl(); render() }
