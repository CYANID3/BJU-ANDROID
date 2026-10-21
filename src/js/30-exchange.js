// Профиль (имя и цвет кружка — чтобы вас узнали при обмене) и обмен продуктами с телефоном рядом.
// Связь — native/android/BjuExchangePlugin.java (Google Nearby Connections: поиск по Bluetooth, передача по Wi‑Fi напрямую).
// Передаются только продукты и блюда (в формате файла данных — та же проверка, что при импорте файла). Дневник, цели и
// настройки — никогда. Полученное сразу открывается на экране импорта (28-merge.js); до «Добавить» ваш список не меняется.

// ===== профиль: только на телефоне, без регистрации =====
const PFC = ["#6458dc", "#0d7f70", "#2f6fd6", "#c23d7f", "#c43b3f", "#b8611a", "#24804f", "#55606f"];
function xpf() { const p = S.set && S.set.pf; return p && typeof p === "object" && typeof p.n === "string" && p.n.trim() ? { n: p.n.trim().slice(0, 20), c: PFC.includes(p.c) ? p.c : PFC[0] } : null }
const pfN = () => (xpf() || {}).n || "", pfC = () => (xpf() || {}).c || PFC[0];
const xini = n => esc(((n || "?").trim()[0] || "?").toUpperCase());
const xav = (n, c, k) => `<span class="xav${k ? " " + k : ""}" style="background:${PFC.includes(c) ? c : PFC[1]}" aria-hidden="true">${xini(n)}</span>`;
const nP = (n, a, b, c) => n + " " + plural(n, a, b, c);
let pfDraft = null, pfFrom = 0, xModel = "";
function pfOpen(from) {
  // from: 0 — из «Настроек», 1 — с экрана обмена (после «Сохранить» — снова туда)
  pfFrom = from ? 1 : 0; if (!$("v7").hidden) hubY = shBody().scrollTop; if (!pfFrom) SUB = 7; if (pfFrom) xStop();
  pfDraft = { n: pfN(), c: pfC() }; drawProf(); sv(18, "Профиль", "Как вас увидят при обмене"); show();
  const N = XN(); if (N && !xModel) N.state().then(st => { xModel = st.model || ""; if (!$("v18").hidden) { const m = document.querySelector("#v18 .row small"); if (m) m.textContent = (xModel || "Ваш телефон") + " · " + nP(S.db.length, "продукт", "продукта", "продуктов") } }).catch(() => { })
}
function drawProf() {
  const d = pfDraft;
  $("v18").innerHTML = `<div class="pfh">${xav(d.n || "?", d.c, "xl")}<small>Имя и цвет видит только тот, кто рядом и тоже открыл обмен. Хранится на этом телефоне, без регистрации.</small></div>
  <div class="gh">Имя</div><input id="pfn" value="${esc(d.n)}" placeholder="Например, Алексей" maxlength="20" autocomplete="off" enterkeyhint="done" oninput="pfDraft.n=this.value;pfLive()" onkeydown="if(event.key==='Enter')pfSave()">
  <div class="gh">Цвет кружка</div><div class="pfc" role="radiogroup" aria-label="Цвет кружка">${PFC.map(c => `<button class="${c === d.c ? "on" : ""}" role="radio" aria-checked="${c === d.c}" style="background:${c}" onclick="pfColor('${c}')" aria-label="Цвет ${c}">${ic("check")}</button>`).join("")}</div>
  <div class="gh">Так вас увидят</div><div class="grp"><div class="row">${xav(d.n || "?", d.c)}<span class="tx"><span id="pfv">${esc(d.n.trim() || "Без имени")}</span><small>${esc(xModel || "Ваш телефон")} · ${nP(S.db.length, "продукт", "продукта", "продуктов")}</small></span></div></div>`
}
// имя и цвет меняются на месте — поле ввода не пересоздаётся (клавиатура не закрывается)
function pfLive() { const d = pfDraft; document.querySelectorAll("#v18 .xav").forEach(a => a.innerHTML = xini(d.n)); const v = $("pfv"); if (v) v.textContent = d.n.trim() || "Без имени" }
// выбор цвета убирает фокус с поля имени: иначе Android снова открывает клавиатуру после каждого касания цвета
function pfColor(c) { pfDraft.c = c; vib("ui"); const a = document.activeElement; if (a && a.id === "pfn") a.blur(); document.querySelectorAll("#v18 .xav").forEach(a => a.style.background = c); document.querySelectorAll("#v18 .pfc button").forEach(b => { const on = b.style.background && b.getAttribute("onclick").includes(c); b.classList.toggle("on", on); b.setAttribute("aria-checked", on) }) }
function pfSave() {
  const n = (pfDraft.n || "").replace(/\|/g, "").trim().slice(0, 20);
  if (!n) { vib("err"); $("pfn").focus(); return toast("Введите имя — его увидит второй телефон") }
  S.set = Object.assign({}, S.set, { pf: { n, c: pfDraft.c } }); saveq(); vib("save");
  try { document.activeElement.blur() } catch (e) { }
  if (pfFrom) xOpen(X.sub); else sets(1)
}

// ===== обмен =====
const XN = () => (window.BJU_NATIVE && window.BJU_NATIVE.exchange) || null;
// состояние экрана обмена. s: intro | perm | nobt | bt | search | wait | code | choose | go | lost | err | web
const X = { s: "intro", sub: 0, on: 0, found: new Map(), peer: null, code: "", meOk: 0, meReady: null, peerReady: null, opt: { p: 1, d: 1 }, inp: [0, 0], out: [0, 0], data: null, err: "", t: 0, none: 0, subs: 0, wifi: true };
const myP = () => S.db.filter(p => !p[5]).length, myD = () => S.db.filter(p => p[5]).length;
// имя для поиска: версия|имя|цвет|модель|продукты|блюда (коротко — Bluetooth передаёт мало)
const xEp = () => ["1", pfN(), pfC(), (xModel || "").replace(/\|/g, "").slice(0, 24), myP(), myD()].join("|");
function xPeer(id, name) { const a = String(name || "").split("|"); return a[0] === "1" && a.length >= 6 ? { id, n: a[1] || "Без имени", c: a[2], m: a[3], p: +a[4] || 0, d: +a[5] || 0 } : { id, n: String(name || "Телефон").slice(0, 20), c: PFC[1], m: "", p: 0, d: 0 } }
const xNm = () => X.peer ? X.peer.n : "";
function xOpen(fromSet) {
  if (fromSet === 1 && !$("v7").hidden) { hubY = shBody().scrollTop; SUB = 7 } else if (fromSet !== 1) SUB = 0;
  X.sub = SUB ? 1 : 0; xReset(); const N = XN();
  if (!N) { X.s = "web"; return xDraw() }
  if (!pfN() || !(S.set && S.set.xi)) { X.s = "intro"; N.state().then(st => { xModel = st.model || xModel }).catch(() => { }); return xDraw() }
  xGo()
}
function xReset() { clearTimeout(X.t); X.found = new Map(); X.peer = null; X.code = ""; X.meOk = 0; X.meReady = null; X.peerReady = null; X.inp = [0, 0]; X.out = [0, 0]; X.data = null; X.err = ""; X.none = 0 }
// по порядку: разрешение → Bluetooth → поиск
async function xGo() {
  const N = XN(); if (!N) return; if (!pfN()) return pfOpen(1);
  S.set = Object.assign({}, S.set, { xi: 1 }); saveq();
  let st; try { st = await N.state() } catch (e) { X.s = "err"; X.err = "Обмен недоступен на этом телефоне"; return xDraw() }
  xModel = st.model || xModel; X.wifi = st.wifi !== false;
  if (!st.btExists) { X.s = "nobt"; return xDraw() }
  if (st.perm !== "granted") { let r = { granted: false }; try { r = await N.requestPerms() } catch (e) { } if (!r.granted) { X.s = "perm"; return xDraw() } }
  if (!st.bt) { X.s = "bt"; return xDraw() }
  xListen(); xReset(); X.s = "search"; xDraw();
  try { await N.start(xEp()); X.on = 1 } catch (e) { X.s = "err"; X.err = "Не удалось начать поиск" + (e && e.code && e.code !== "-1" ? ` (код ${e.code})` : "") + ". Проверьте, что Bluetooth включён, и попробуйте ещё раз"; return xDraw() }
  // минута без находок — подсказка (поиск идёт дальше)
  X.t = setTimeout(() => { if (X.s === "search" && !X.found.size) { X.none = 1; xDraw() } }, 60000)
}
async function xBt() { const N = XN(); let r = { enabled: false }; try { r = await N.enableBt() } catch (e) { } if (r.enabled) xGo(); else toast("Bluetooth выключен — без него телефоны не найдут друг друга") }
function xStop() { clearTimeout(X.t); const N = XN(); if (N && X.on) N.stop().catch(() => { }); X.on = 0; if (X.s !== "web") X.s = "intro" }
function xListen() {
  const N = XN(); if (!N || X.subs) return; X.subs = 1;
  N.on("found", e => { if (!X.on) return; X.found.set(e.id, xPeer(e.id, e.name)); X.none = 0; if (X.s === "search") xDraw() });
  N.on("lost", e => { X.found.delete(e.id); if (X.s === "search") xDraw() });
  N.on("initiated", e => {
    if (!X.on) return; if (X.peer && X.peer.id !== e.id && X.s !== "search") { N.reject(e.id).catch(() => { }); return }
    const p = X.found.get(e.id) || xPeer(e.id, e.name); X.peer = p; X.code = String(e.code || ""); X.meOk = 0;
    clearTimeout(X.t); X.t = setTimeout(() => xFail("Время вышло — подтверждения не было"), 60000);
    if (e.incoming && X.s === "search") {
      vib("ui"); ask(`${p.m ? p.m + " · " : ""}${nP(p.p, "продукт", "продукта", "продуктов")}${p.d ? " и " + nP(p.d, "блюдо", "блюда", "блюд") : ""}.\nЕсли вы не знаете этого человека — отклоните: без согласия ничего не передаётся.`, "Принять", 0, 0, `${p.n} хочет обменяться`)
        .then(ok => { if (!X.peer || X.peer.id !== e.id) return; if (ok) { X.s = "code"; xDraw() } else { XN().reject(e.id).catch(() => { }); xBack("Обмен отклонён") } });
      $("dgn").textContent = "Отклонить"
    } else { X.s = "code"; xDraw() }
  });
  N.on("connected", e => { if (!X.peer || X.peer.id !== e.id) return; clearTimeout(X.t); X.s = "choose"; N.pause().catch(() => { }); vib("save"); xDraw() });
  N.on("rejected", e => { if (!X.peer || X.peer.id !== e.id) return; xBack(`${X.peer.n}: обмен отклонён или код не совпал`) });
  N.on("disconnected", e => { if (!X.peer || X.peer.id !== e.id) return; if (X.s === "choose" || X.s === "go") { X.s = "lost"; xDraw() } });
  N.on("message", e => { if (!X.peer || X.peer.id !== e.id) return; let m; try { m = JSON.parse(e.data) } catch (_) { return }
    if (m.t === "ready") { X.peerReady = { p: +m.p || 0, d: +m.d || 0 }; if (X.s === "choose") { if (X.meReady) xBegin(); else xDraw() } }
    else if (m.t === "data") { try { X.data = parseData(JSON.stringify({ format: "bju-diary", version: 3, products: Array.isArray(m.products) ? m.products : [] })).db } catch (er) { X.s = "err"; X.err = "Не удалось прочитать полученные продукты: " + (er.message || "неверный формат"); return xDraw() } xCheck() } });
  N.on("progress", e => { if (!X.peer || X.peer.id !== e.id) return; if (e.dir === "in") X.inp = [e.done, e.total]; else { X.out = [e.done, e.total]; if (e.failed) { X.s = "lost"; return xDraw() } } if (X.s === "go") { xBars(); xCheck() } });
}
function xBack(msg) { clearTimeout(X.t); const p = X.peer; X.peer = null; X.code = ""; X.meOk = 0; X.meReady = X.peerReady = null; if (p) XN().disconnect(p.id).catch(() => { }); if (X.on) { X.s = "search"; XN().start(xEp()).catch(() => { }) } xDraw(); if (msg) toast(msg) }
function xFail(msg) { if (X.s === "code" || X.s === "wait") xBack(msg) }
function xConnect(id) {
  const p = X.found.get(id); if (!p) return; X.peer = p; X.s = "wait"; vib("ui"); xDraw();
  clearTimeout(X.t); X.t = setTimeout(() => xFail(`${p.n} не ответил(а) — попробуйте ещё раз`), 30000);
  XN().connect(id).catch(e => xBack("Не удалось подключиться" + (e && e.code && e.code !== "-1" ? ` (код ${e.code})` : "")))
}
function xCodeOk() { if (!X.peer) return; X.meOk = 1; vib("save"); XN().accept(X.peer.id).catch(() => xBack("Не удалось подключиться")); xDraw() }
function xCodeNo() { if (!X.peer) return; XN().reject(X.peer.id).catch(() => { }); xBack("Код не совпал — обмен отменён") }
// «Обменяться»: сообщаем, что отправим; передача начинается, когда нажали оба
function xReady() {
  if (!X.peer || X.meReady) return; const n = xSel(); X.meReady = { p: n.filter(p => !p[5]).length, d: n.filter(p => p[5]).length }; vib("save");
  XN().send(X.peer.id, JSON.stringify({ t: "ready", ...X.meReady })).catch(() => { X.s = "lost"; xDraw() });
  if (X.peerReady) xBegin(); else xDraw()
}
const xSel = () => S.db.filter(p => p[5] ? X.opt.d : X.opt.p);
function xBegin() {
  X.s = "go"; X.inp = [0, X.peerReady ? 1 : 0]; xDraw();
  const products = toFile({ d: {}, g: S.g, db: xSel(), set: {}, wt: {} }).products;
  XN().send(X.peer.id, JSON.stringify({ t: "data", products })).catch(() => { X.s = "lost"; xDraw() })
}
// всё отправлено и всё получено — сразу экран импорта
function xCheck() {
  if (X.s !== "go" || !X.data || !(X.out[1] > 0 && X.out[0] >= X.out[1])) return;
  const p = X.peer, th = X.data; xStop(); X.s = "done"; vib("save");
  const banner = `<div class="fst ok">${ic("ok")}<div><b>Обмен завершён</b><small>Вы отправили ${nP(X.meReady ? X.meReady.p : 0, "продукт", "продукта", "продуктов")}${X.meReady && X.meReady.d ? " и " + nP(X.meReady.d, "блюдо", "блюда", "блюд") : ""}. Ниже — что пришло от собеседника «${esc(p.n)}»: отметьте, что добавить к себе.</small></div></div>`;
  if (!th.length) { cl(); return say(`${p.n} ничего не отправил(а) — выбрано «не отправлять».`) }
  mgS = { th, plan: mgPlan(S.db, th), yes: new Set(), skip: new Set(), take: new Set(), name: p.n, title: "Продукты: " + p.n, sub: nP(th.length, "продукт", "продукта", "продуктов") + " получено", top: banner, after: () => cl(), none: `${p.n}: всё полученное (${th.length}) уже есть в вашем списке.` };
  if (!mgS.plan.some(x => x.t === "new" || x.t === "diff" || x.t === "maybe")) { cl(); return mgDone() }
  mgView()
}
// полосы передачи — без перерисовки экрана
function xBars() {
  const f = ([a, b]) => b > 0 ? Math.min(100, Math.round(a / b * 100)) : 0, set = (k, v) => { const i = document.querySelector(`#v19 .br i[data-x="${k}"]`); if (i) i.style.width = v + "%" };
  set("out", f(X.out)); set("in", f(X.inp));
  const t = (k, v) => { const e = document.querySelector(`#v19 [data-t="${k}"]`); if (e) e.textContent = v }; t("out", f(X.out) + " %"); t("in", f(X.inp) + " %")
}
// ===== экран обмена =====
function xDraw() {
  if ($("v19").hidden && X.s === "done") return;
  const x1 = $("x1"), x2 = $("x2"), me = xav(pfN() || "Я", pfC(), "l"), p = X.peer, ot = p ? xav(p.n, p.c, "l") : "", nm = p ? esc(p.n) : "";
  let h = "", t = "Обмен продуктами", sub = "", b1 = null, b2 = null;
  const meRow = `<div class="grp"><button class="row" onclick="pfOpen(1)">${pfN() ? xav(pfN(), pfC()) : `<span class="ic">${ic("user")}</span>`}<span class="tx">${pfN() ? esc(pfN()) : "Как вас назвать?"}<small>${pfN() ? "Так вас видят на другом телефоне" : "Имя и цвет увидит второй телефон"}</small></span><span class="ch">${ic("chevR")}</span></button></div>`;
  const pair = mv => `<div class="xp"><div>${me}Вы</div><span class="ln_${mv ? " mv" : ""}"></span><div>${ot}${nm}</div></div>`;
  if (X.s === "web") h = `<div class="fst no">${ic("info")}<div><b>Обмен работает в приложении на Android</b><small>Телефоны находят друг друга по Bluetooth и передают продукты по Wi‑Fi напрямую. В браузере это недоступно — откройте приложение БЖУ на телефоне.</small></div></div>`;
  else if (X.s === "intro") {
    h = `<div class="xt" style="margin-top:4px"><small>Вы отправляете свои продукты, вам — чужие. Одновременно, прямо в приложении.</small></div>${meRow}
    <div class="gh">Как это работает</div><div class="grp"><div class="row"><span class="ic">${ic("bt")}</span><span class="tx">Bluetooth — чтобы найти<small>Телефоны видят друг друга в нескольких метрах</small></span></div><div class="row"><span class="ic">${ic("wifi")}</span><span class="tx">Wi‑Fi напрямую — чтобы передать<small>Между телефонами, без роутера и интернета</small></span></div><div class="row"><span class="ic">${ic("shield")}</span><span class="tx">Только продукты и блюда<small>Дневник, цели и настройки не передаются</small></span></div></div>
    <div class="hint">Android один раз спросит разрешение «Устройства поблизости». Больше спрашивать не будет.</div>`;
    b1 = [pfN() ? "Продолжить" : "Указать имя", () => pfN() ? xGo() : pfOpen(1)]
  } else if (X.s === "perm") { h = `<div class="fst no">${ic("shield")}<div><b>Нет разрешения</b><small>Без разрешения «Устройства поблизости» телефоны не найдут друг друга. Включите его в настройках приложения — это один переключатель.</small></div></div>`; b2 = ["Ещё раз", xGo]; b1 = ["Открыть настройки", () => XN().openSettings().catch(() => { })] }
  else if (X.s === "nobt") h = `<div class="fst bad">${ic("bt")}<div><b>На этом телефоне нет Bluetooth</b><small>Обмен с телефоном рядом недоступен. Можно обменяться файлом: «Настройки › Файл данных».</small></div></div>`;
  else if (X.s === "bt") { h = `<div class="fst no">${ic("bt")}<div><b>Bluetooth выключен</b><small>Без него телефоны не найдут друг друга. Android спросит «Включить Bluetooth?»</small></div></div><div class="xr st"><i></i><i></i><i></i>${xav(pfN(), pfC())}</div><div class="gh">Вас видят как</div>${meRow}`; b1 = ["Включить Bluetooth", xBt] }
  else if (X.s === "search") {
    const L = [...X.found.values()];
    h = `<div class="xr"><i></i><i></i><i></i>${xav(pfN(), pfC())}</div><div class="xt"><b>Ищем телефоны рядом</b><small>На втором телефоне откройте «Обмен продуктами» — он появится здесь</small></div>` +
      (L.length ? `<div class="gh">Рядом</div><div class="grp">${L.map(q => `<button class="row" onclick="xConnect('${esc(q.id)}')">${xav(q.n, q.c)}<span class="tx">${esc(q.n)}<small>${q.m ? esc(q.m) + " · " : ""}${nP(q.p, "продукт", "продукта", "продуктов")}</small></span><span class="xg">Обменяться</span></button>`).join("")}</div>` : "") +
      (X.none ? `<div class="fst no xw">${ic("info")}<div><b>Никого не нашли за минуту</b><small>Проверьте, что на втором телефоне открыт обмен и телефоны рядом. Поиск продолжается.</small></div></div>` : "") +
      (!X.wifi ? `<div class="hint">Wi‑Fi выключен — найти можно, но передача пойдёт медленнее.</div>` : "") +
      `<div class="gh">Вас видят как</div>${meRow}`
  } else if (X.s === "wait") { h = pair(1) + `<div class="xt"><b>Подключаемся…</b><small>${nm} увидит запрос — подтвердите код на обоих телефонах</small></div>`; b2 = ["Отмена", () => xBack()] }
  else if (X.s === "code") {
    t = "Подключение";
    h = pair(0) + `<div class="xt"><b>Сверьте код</b><small>На телефоне «${nm}» должны быть те же цифры</small></div><div class="xcd" role="img" aria-label="Код ${esc(X.code.split("").join(" "))}">${X.code.split("").map(d => `<b>${esc(d)}</b>`).join("")}</div>` +
      (X.meOk ? `<div class="xst"><i></i>Ждём подтверждения: ${nm}</div>` : "");
    if (!X.meOk) { b2 = ["Не совпадает", xCodeNo]; b1 = ["Совпадает", xCodeOk] } else b2 = ["Отмена", xCodeNo]
  } else if (X.s === "choose") {
    t = "Обмен: " + p.n; const r = X.peerReady;
    h = pair(0) + `<div class="xst ok" style="margin:-6px 0 6px"><i></i>Подключено · код совпал</div>
    <div class="gh">Вы отправите</div><div class="grp${X.meReady ? " xlk" : ""}">${srow("xop", "list", "Продукты", nP(myP(), "продукт", "продукта", "продуктов") + " с БЖУ и единицами", null, "xOpt('p')", { sw: !!X.opt.p })}${myD() ? srow("xod", "dish", "Блюда", nP(myD(), "блюдо", "блюда", "блюд") + " с составом", null, "xOpt('d')", { sw: !!X.opt.d }) : ""}</div>
    <div class="xn">${ic("lock")}<span>Дневник, цели и настройки не передаются никогда</span></div>
    <div class="gh">${nm} отправит</div>${r ? `<div class="grp"><div class="row"><span class="ic">${ic("list")}</span><span class="tx">Продукты</span><span class="v">${r.p}</span></div><div class="row"><span class="ic">${ic("dish")}</span><span class="tx">Блюда</span><span class="v">${r.d}</span></div></div>` : `<div class="xst"><i></i>${nm} ещё выбирает</div>`}
    <div class="hint">Полученное сразу откроется на экране импорта: вы решите, что добавить.</div>`;
    b1 = X.meReady ? null : [X.opt.p || X.opt.d ? "Обменяться" : "Только получить", xReady];
    if (X.meReady) h += `<div class="xst xw"><i></i>Начнём, когда ${nm} тоже нажмёт «Обменяться»</div>`
  } else if (X.s === "go") {
    h = pair(1) + `<div class="xt"><b>Обмениваемся</b><small>Держите телефоны рядом и не закрывайте приложение</small></div>
    <div class="xb"><div><div class="h">Отправляем: ${nm}<span data-t="out">0 %</span></div><div class="br"><i data-x="out" style="width:0"></i></div></div><div><div class="h">Получаем: ${nm}<span data-t="in">0 %</span></div><div class="br"><i class="in" data-x="in" style="width:0"></i></div></div></div>`;
    b1 = ["Отменить", () => { xStop(); cl(); toast("Обмен отменён — ничего не сохранено") }]
  } else if (X.s === "lost") { h = pair(0) + `<div class="xt"><b>Связь прервалась</b><small>Ничего не сохранено — ваш список не изменился</small></div><div class="fst bad">${ic("warn")}<div><b>Обмен не завершён</b><small>Подойдите ближе и попробуйте ещё раз. На втором телефоне полученное тоже не сохранится.</small></div></div>`; b2 = ["Закрыть", () => { xStop(); cl() }]; b1 = ["Повторить", () => { xStop(); xGo() }] }
  else if (X.s === "err") { h = `<div class="fst bad">${ic("warn")}<div><b>Не получилось</b><small>${esc(X.err)}</small></div></div>`; b1 = ["Ещё раз", () => { xStop(); xGo() }] }
  const btn = (el, b, cls) => { el.hidden = !b; if (b) { el.textContent = b[0]; el.onclick = b[1]; el.className = cls } };
  btn(x1, b1, X.s === "go" ? "pb g" : "pb"); btn(x2, b2, "pb g");
  const el = $("v19"), same = !el.hidden && el.dataset.s === X.s;
  el.dataset.s = X.s; const put = () => { el.innerHTML = h; xBars() };
  if (same) shResize(put); else { put(); sv(19, t, sub) } show()
}
function xOpt(k) { if (X.meReady) return; X.opt[k] = X.opt[k] ? 0 : 1; vib("ui"); xDraw() }
// лист закрыли — обмен останавливается
const closeUI0 = closeUI; closeUI = function () { if (X.on) xStop(); return closeUI0() };
