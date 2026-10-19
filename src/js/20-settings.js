// «Ещё»: все настройки одной страницей; выбор из нескольких вариантов — отдельным экраном со списком и галочкой
// (как в настройках Android), «да / нет» — выключателем прямо в строке. «‹» в шапке и «Назад» возвращают в «Ещё».

// жест «потянуть вверх»: приём пищи по времени / новый продукт / статистика / вес (если вес включён) / выкл.
function swAct() { const v = (S.set && S.set.sw) || "off"; return v === "wt" && !wton() ? "off" : v }
// действие жеста «потянуть вверх»: новый продукт / статистика / вес (будущий день — на сегодня) / приём пищи по времени
function swipeAct() { const a = swAct(); if (a === "prod") { mode = "mng"; drawMc(); nw(); show() } else if (a === "stat") stats(); else if (a === "wt") { if (cur > today) { cur = today; head(); render() } wtOpen() } else op(autoMeal()) }

// Длина свайпа: множитель расстояния для жестов в стороны (дни, календарь, месяцы статистики, смахивание листа) + порог рывка.
// Сильнее всего уровни отличаются для жестов «потянуть вверх/вниз» — у них свои значения PLV (21-pull.js)
// [расстояние, скорость рывка px/мс, доля пути для рывка, старт распознавания px, строгость направления]
const SLV = {
  short: [.5, .25, .3, 9, 1.25, "Короткая", "Хватает лёгкого движения: дни листаются коротким взмахом, жесты вверх и вниз срабатывают от лёгкого движения."],
  mid: [1, .45, .45, 14, 1.5, "Средняя", "Баланс скорости и защиты от случайных срабатываний."],
  long: [1.8, 1.1, .7, 22, 2, "Длинная", "Нужно провести дальше и строго по направлению, а вверх и вниз — потянуть примерно на треть экрана. Случайные касания не срабатывают."]
};
const slv = () => { const v = S.set && S.set.sl; return SLV[v] ? v : "mid" }, GF = () => SLV[slv()][0], SL = i => SLV[slv()][i];
// ползунок на три положения (длина свайпа): дорожка с точками над тремя подписями, бегунок плавно переезжает —
// касанием подписи, перетаскиванием или стрелками. o: {keys, labels, get(), set(v), aria}
function sldDraw(id, o) {
  const el = $(id), K = o.keys, i = Math.max(0, K.indexOf(o.get())); el._o = o;
  if (!el.querySelector(".sldt")) { el.innerHTML = `<div class="sldt" role="slider" aria-label="${o.aria}" aria-valuemin="0" aria-valuemax="${K.length - 1}" tabindex="0"><i class="sldf"></i>${K.map((v, j) => `<span class="sldd" style="left:${j * 100 / (K.length - 1)}%"></span>`).join("")}<b class="sldk"></b></div><div class="sldl">${K.map((v, j) => `<button>${o.labels[j]}</button>`).join("")}</div>`; sldBind(el) }
  const f = i / (K.length - 1); el.style.setProperty("--slv", f); el.querySelectorAll(".sldl button").forEach((b, j) => b.classList.toggle("on", j === i)); el.querySelectorAll(".sldd").forEach((d, j) => d.classList.toggle("in", j <= i));
  const t = el.querySelector(".sldt"); t.setAttribute("aria-valuenow", i); t.setAttribute("aria-valuetext", o.labels[i])
}
function sldBind(el) {
  const t = el.querySelector(".sldt"), O = () => el._o, n = () => O().keys.length - 1; let on = 0, last = -1;
  const at = e => { const r = t.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) }, put = v => { if (v !== O().get()) O().set(v); else sldDraw(el.id, O()) };
  el.querySelectorAll(".sldl button").forEach((b, j) => b.onclick = () => put(O().keys[j]));
  t.addEventListener("pointerdown", e => { on = 1; last = O().keys.indexOf(O().get()); el.classList.add("drag"); try { t.setPointerCapture(e.pointerId) } catch (_) { } mv(e) });
  const mv = e => { if (!on) return; const f = at(e), k = Math.round(f * n()); el.style.setProperty("--slv", f); el.querySelectorAll(".sldd").forEach((d, j) => d.classList.toggle("in", j / n() <= f + .001)); if (k !== last) { last = k; vib("ui") } };
  t.addEventListener("pointermove", mv);
  t.addEventListener("pointerup", e => { if (!on) return; on = 0; el.classList.remove("drag"); put(O().keys[Math.round(at(e) * n())]) });
  t.addEventListener("pointercancel", () => { on = 0; el.classList.remove("drag"); sldDraw(el.id, O()) });
  t.addEventListener("keydown", e => { const K = O().keys, i = K.indexOf(O().get()), k = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : i; if (k !== i && K[k]) { e.preventDefault(); put(K[k]) } })
}
function setSl(v) { S.set = Object.assign({}, S.set, { sl: v }); saveq(); drawSet(); vib("ui") }
const PRE = ["", "#22a06b", "#14b8a6", "#3b82f6", "#8b5cf6", "#e5589a", "#e5484d", "#f08a24", "#f5c518", "#64748b"];
const SWL = [["meal", "Приём пищи", "plus", "Добавить в приём пищи по времени суток"], ["prod", "Новый продукт", "box", "Сразу открыть создание продукта"], ["stat", "Статистика", "chart", "Открыть статистику за месяц"], ["wt", "Вес", "scale", "Записать вес за день"], ["off", "Выключено", "close", "Жест не используется"]],
  DWL = [["cal", "Календарь", "cal", "Выбрать день в календаре"], ["today", "К сегодня", "today", "Вернуться к сегодняшнему дню"], ["off", "Выключено", "close", "Жест не используется"]];
const ghOn = () => S.set && S.set.gh === "on";
function togGh() { S.set = Object.assign({}, S.set, { gh: ghOn() ? "off" : "on" }); saveq(); drawSet(); vib("ui") }
function setSw(v) { S.set = Object.assign({}, S.set, { sw: v }); saveq(); drawSet(); render(); vib("ui") }
function setAc(h) { S.set = Object.assign({}, S.set, { ac: h }); saveq(); applyAc(); drawSet(); vib("ui") }

// ===== экраны выбора =====
const gHint = (dn, edge) => `<div id="${dn ? "dwh" : "sgh"}" class="smh ${dn ? "phd" : "phu"}${edge ? " edge" : ""}" aria-hidden="true"><div class="smp"><i><s></s><s></s><s></s><u></u></i></div><div class="smt">${dn ? "В начале списка <b>потяните вниз</b> и отпустите" : edge ? "Потяните вверх <b>от нижней панели</b> — где угодно в списке. Кнопки панели при этом не нажимаются" : "Долистайте до конца дня и <b>потяните вверх</b>"}</div></div>`;
// k: { t — заголовок, s — подпись, o() — варианты [значение, название, значок, пояснение], g() — текущее, set(v), x() — что ниже списка }
const PK = {
  th: { t: "Тема", o: () => [["auto", "Как в системе", "auto", "Светлая или тёмная — по настройке телефона"], ["light", "Светлая", "sun", ""], ["dark", "Тёмная", "moon", ""]], g: () => (S.set && S.set.th) || "auto", set: v => setTh(v) },
  ac: { t: "Цвет акцента", s: "Кнопки, выбранные варианты, значки", x: acPick },
  tn: { t: "Оттенок фона", o: () => [["off", "Выключен", "close", "Нейтральный фон и карточки"], ["soft", "Лёгкий", "tint", "Едва заметная примесь цвета акцента"], ["strong", "Заметный", "tint", "Фон и карточки в тон акцента"]], g: () => tnv(), set: v => setTn(v) },
  fa: { t: "Кнопка «＋» в панели", s: "Что делает касание большой кнопки", o: () => FAB.filter(x => x[0] !== "wt" || wton()), g: () => fabAct(), set: v => setFa(v), x: () => `<div class="hint">Значок на кнопке меняется под выбранное действие. Потянуть вверх от панели — по-прежнему жест «Потянуть вверх».</div>` },
  dc: { t: "Карточка дня", s: "Как открывать сводку дня для скриншота", o: () => [["tap", "Тройное касание", "tap", "Три касания по итогу дня — открыть и закрыть"], ["row", "Строка в итоге дня", "layout", "«Карточка дня ›» внизу итога, закрыть — «Назад» или ✕"]], g: () => dcv(), set: v => setDc(v), x: () => `<div class="hint">Свайп вверх и вниз на карточке переключает компактный и подробный вид в обоих режимах.</div>` },
  nb: { t: "Кнопки «Новый продукт» и «Новое блюдо»", s: "Во всех списках продуктов", o: () => [["top", "Сверху", "up", "Под поиском, перед списком"], ["bottom", "Снизу", "down", "После списка продуктов"]], g: () => nbv(), set: v => setNb(v) },
  sn: { t: "Пустые перекусы", o: () => [["row", "Ссылкой", "plus", "«＋ Перекус» внизу карточки приёма"], ["tap", "По двойному касанию", "tap", "Два касания по названию приёма — показать или скрыть «＋ Перекус»"]], g: () => snv(), set: v => setSn(v) },
  dw: { t: "Потянуть вниз", s: "в начале дня", o: () => DWL, g: () => dwAct(), set: v => setDw(v), x: () => ghOn() && dwAct() !== "off" ? gHint(1) : "" },
  sw: { t: "Потянуть вверх", s: "в конце дня или от нижней панели", o: () => SWL.filter(([v]) => v !== "wt" || wton()), g: () => swAct(), set: v => setSw(v), x: () => swAct() === "off" ? "" : `<div id="sfr"><div class="gh">Откуда тянуть</div><div id="sfm" class="seg">${[["edge", "От панели"], ["end", "В конце списка"]].map(([v, t]) => `<button class="${sfv() === v ? "on" : ""}" onclick="setSf('${v}')">${t}</button>`).join("")}</div></div>` + (ghOn() ? gHint(0, sfv() === "edge") : "") },
  sl: { t: "Длина свайпа", s: "для всех жестов", x: () => `<div id="slm" class="sld"></div><div class="hint">${SLV[slv()][6]} Действует на листание дней, месяцев, смахивание листа и «потянуть вверх/вниз».</div>`, after: () => sldDraw("slm", { keys: Object.keys(SLV), labels: Object.values(SLV).map(x => x[5]), get: slv, set: setSl, aria: "Длина свайпа" }) }
};
let pkCur = "", hubY = 0;
function pick(k) { if (!$("v7").hidden) hubY = shBody().scrollTop; pkCur = k; SUB = 7; drawPick(); sv(13, PK[k].t, PK[k].s || ""); show() }
function drawPick() {
  const P = PK[pkCur]; if (!P) return; const cur_ = P.g ? P.g() : null;
  $("pko").hidden = !P.o;
  if (P.o) $("pko").innerHTML = P.o().map(([v, t, i, d]) => `<button class="row${v === cur_ ? " on" : ""}" role="radio" aria-checked="${v === cur_}" onclick="pkSet('${v}')"><span class="ic">${ic(i)}</span><span class="tx">${t}${d ? `<small>${d}</small>` : ""}</span><span class="ok">${ic("check")}</span></button>`).join("");
  $("pkx").innerHTML = P.x ? P.x() : ""; if (P.after) P.after()
}
function pkSet(v) { const P = PK[pkCur]; if (P.g() === v) return; P.set(v) }
// цвет акцента: десять готовых и «Свой цвет»
function acPick() {
  const c = (S.set && S.set.ac) || "", own = c && !PRE.includes(c);
  return `<div id="swc" class="swc">${PRE.map(h => `<button class="${c === h ? "on" : ""}" style="background:${h || acDef()}" onclick="setAc('${h}')" aria-label="${h ? "Цвет " + h : "Стандартный цвет"}">${ic("check")}</button>`).join("")}</div>
  <div class="grp"><button class="row cc" onclick="cpOpen()"><span class="ic">${ic("pal")}</span><span class="tx">Свой цвет${own ? `<small id="cpn">${c.toUpperCase()}</small>` : `<small>Любой оттенок и код #RRGGBB</small>`}</span><span class="v"><i style="background:${own ? c : "transparent"};box-shadow:inset 0 0 0 1.5px var(--mu)"></i></span><span class="ch">${ic("chevR")}</span></button></div>`
}

// ===== «Ещё» =====
const srow = (id, icn, t, sub, v, act, o = {}) => `<button class="row"${id ? ` id="${id}"` : ""}${o.sw != null ? ` role="switch" aria-checked="${!!o.sw}"` : ""} onclick="${act}">${icn ? `<span class="ic">${ic(icn)}</span>` : ""}<span class="tx">${t}${sub ? `<small${o.sc ? ` class="${o.sc}"` : ""}>${sub}</small>` : ""}</span>${v != null ? `<span class="v">${v}</span>` : ""}${o.sw != null ? `<i class="tg${o.sw ? " on" : ""}"><i></i></i>` : `<span class="ch">${ic("chevR")}</span>`}</button>`;
const lbl = (k) => { const P = PK[k], v = P.g(), x = P.o().find(o => o[0] === v); return k === "fa" && v === "meal" ? "Приём пищи" : x ? x[1] : "" };
function sets(back) {
  const y = hubY; SUB = 0; drawSet(); sv(7, "Ещё"); show();
  if (back) { shBody().scrollTop = y; vib("ui") }
}
function drawSet() {
  const G = S.g, gk = kc(G.p, G.f, G.c), fs = fileState(), vn = VIB.filter(x => veOn(x[0])).length;
  $("v7").innerHTML =
    `<div class="gh">Норма</div><div class="grp">${srow("", "target", "Норма на день", `Б ${G.p} · Ж ${G.f} · У ${G.c} г`, gk + " ккал", "goals(1)")}</div>` +
    `<div class="gh">Данные</div><div class="grp">${srow("", "file", "Файл данных", fs[1], "", "fp(1)", { sc: fs[0] })}${mgOn() ? srow("", "merge", "Добавить продукты из файла", "", null, "mgPick()") : ""}${srow("mgm", "import", "Показывать «Добавить продукты из файла»", "", null, "setMg(mgOn()?'off':'on')", { sw: mgOn() })}</div>` +
    `<div class="gh">Оформление</div><div class="grp">${srow("", "moon", "Тема", "", lbl("th"), "pick('th')")}${srow("", "pal", "Цвет акцента", "", `<i style="background:var(--ac)"></i>`, "pick('ac')")}${srow("", "tint", "Оттенок фона", "", lbl("tn"), "pick('tn')")}</div>` +
    `<div class="gh">Главный экран</div><div class="grp">${srow("", "fab", "Кнопка «＋» в панели", "", lbl("fa"), "pick('fa')")}${srow("", "layout", "Карточка дня", "", lbl("dc"), "pick('dc')")}${srow("", "btn", "Кнопки «Новый продукт» и «Новое блюдо»", "", lbl("nb"), "pick('nb')")}${srow("", "snack", "Пустые перекусы", "", lbl("sn"), "pick('sn')")}${srow("wtm", "scale", "Отслеживать вес", "", null, "setWt(wton()?'off':'on')", { sw: wton() })}</div>` +
    `<div class="gh">Жесты</div><div class="grp">${srow("", "down", "Потянуть вниз", "в начале дня", lbl("dw"), "pick('dw')")}${srow("", "up", "Потянуть вверх", "в конце дня или от панели", lbl("sw"), "pick('sw')")}${srow("", "swipe", "Длина свайпа", "", SLV[slv()][5], "pick('sl')")}${srow("ghm", "hint", "Подсказки к жестам", "Анимация на экранах жестов", null, "togGh()", { sw: ghOn() })}</div>` +
    `<div class="gh">Отклик</div><div class="grp">${srow("", "vib", "Вибрация", vbOn() ? "Где включена и какая сила" : "", vbOn() ? vn + " из " + VIB.length : "Выкл.", "vibOpen()")}</div>` +
    `<div class="ver">Версия ${BUILD}</div>`;
  if (!$("v13").hidden) drawPick(); if (!$("v14").hidden) drawVib()
}

// ===== вибрация: общий выключатель, сила, отдельные случаи =====
function vibOpen() { if (!$("v7").hidden) hubY = shBody().scrollTop; SUB = 7; drawVib(); sv(14, "Вибрация"); show() }
function drawVib() {
  const on = vbOn();
  $("v14").innerHTML = `<div class="grp">${srow("vbm", "vib", "Вибрация", "Общий выключатель", null, "setVb(!vbOn())", { sw: on })}</div>` +
    (on ? `<div class="gh">Сила</div><div id="vsm" class="seg">${Object.entries(VSS).map(([k, [t]]) => `<button class="${vss() === k ? "on" : ""}" onclick="setVs('${k}')">${t}</button>`).join("")}</div>` +
      `<div class="gh">Когда вибрировать</div><div class="grp">${VIB.map(([k, t, d]) => srow("ve-" + k, "", t, k === "days" && hpv() === "nodays" ? "Раньше: «Кроме дней»" : d, null, `setVe('${k}')`, { sw: veOn(k) })).join("")}</div>` : `<div class="hint">Вибрация выключена во всём приложении.</div>`)
}
// перед изменением — все случаи записываются явно; старое поле vibration (on / exceptDays / off) остаётся совместимым
function veAll() { return Object.fromEntries(VIB.map(([k]) => [k, veOn(k)])) }
function vbSave(ve, on) { S.set = Object.assign({}, S.set, { ve, hp: on ? (ve.days ? "on" : "nodays") : "off" }); saveq(); drawVib(); drawSet() }
function setVb(on) { vbSave(veAll(), on); vib("ui") }
function setVe(k) { const ve = veAll(); ve[k] = !ve[k]; vbSave(ve, true); vib(k) }
function setVs(v) { S.set = Object.assign({}, S.set, { vs: v }); saveq(); drawVib(); vib("save") }

// «Свой цвет»: квадрат насыщенности и яркости, полоса оттенка, поле для кода; «Готово» применяет цвет
let cpH = 250, cpS = .55, cpV = .94;
const hsv2hex = (h, s, v) => { const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)) }; return "#" + [f(5), f(3), f(1)].map(x => Math.round(x * 255).toString(16).padStart(2, "0")).join("") };
function hex2hsv(x) { const n = parseInt(x.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255, M = Math.max(r, g, b), m = Math.min(r, g, b), d = M - m; let h = 0; if (d) { h = M === r ? ((g - b) / d) % 6 : M === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360 } return [h, M ? d / M : 0, M] }
const CPS = ["#e11d48", "#f97316", "#eab308", "#16a34a", "#0d9488", "#0891b2", "#2563eb", "#7c3aed", "#c026d3", "#57534e"];
function cpOpen() { [cpH, cpS, cpV] = hex2hsv(acCur()); $("cps").innerHTML = CPS.map(h => `<button style="background:${h}" onclick="cpSet('${h}')" aria-label="Цвет ${h}"></button>`).join(""); cpDraw(1); SUB = 7; sv(11, "Свой цвет") }
function cpSet(h) { [cpH, cpS, cpV] = hex2hsv(h); cpDraw(1); vib("ui") }
function cpDraw(hx) {
  const c = hsv2hex(cpH, cpS, cpV), a = $("cpa"); a.style.setProperty("--cph", cpH); a.style.setProperty("--cpx", cpS); a.style.setProperty("--cpy", 1 - cpV); $("cph").style.setProperty("--cpx", cpH / 360);
  $("cpak").style.background = c; $("cphk").style.background = `hsl(${cpH} 100% 50%)`; $("cpv").style.background = c; if (hx) $("cpx").value = c.toUpperCase();
  const ok = $("cpok"); ok.style.background = c; ok.style.color = crt("#ffffff", c) >= 3.1 ? "#fff" : "#141922";
  $("cps").querySelectorAll("button").forEach(b => b.classList.toggle("on", b.getAttribute("onclick").includes(c)))
}
function cpHex(v) { v = v.trim(); if (v && v[0] !== "#") v = "#" + v; if (/^#[0-9a-f]{6}$/i.test(v)) { [cpH, cpS, cpV] = hex2hsv(v.toLowerCase()); cpDraw(0) } }
function cpOk() { setAc(hsv2hex(cpH, cpS, cpV)); vib("save"); pick("ac") }
(() => {
  const drag = (el, fn) => {
    let on = 0; const at = e => { const r = el.getBoundingClientRect(); fn(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))); cpDraw(1) };
    el.addEventListener("pointerdown", e => { on = 1; el.classList.add("drag"); try { el.setPointerCapture(e.pointerId) } catch (_) { } at(e) });
    el.addEventListener("pointermove", e => { if (on) at(e) }); const up = () => { on = 0; el.classList.remove("drag") }; el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up)
  };
  drag($("cpa"), (x, y) => { cpS = x; cpV = 1 - y }); drag($("cph"), x => { cpH = Math.min(359.9, x * 360) })
})();
