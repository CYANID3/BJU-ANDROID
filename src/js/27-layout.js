// Главный экран: кнопка «＋» в нижней панели, кнопки «Новый продукт» / «Новое блюдо» (сверху / снизу списка),
// пустые перекусы (ссылкой / по двойному касанию), карточка дня (тройное касание / строка в итоге дня)

// ===== нижняя панель: места и большая кнопка в центре (Настройки › Нижняя панель) =====
// Каталог действий: [полное название, подпись на панели, значок, группа (add — добавить, go — открыть, req — обязательный), пояснение, onclick].
// Подписи короткие — пять мест помещаются и на экране 360 px.
const NA = {
  meal: ["Приём пищи по времени", "Добавить", "plus", "add", "Список продуктов, приём выбран по времени суток", "naRun('meal')"],
  pnew: ["Новый продукт", "Продукт", "box", "add", "Сразу открыть создание продукта", "naRun('pnew')"],
  dish: ["Новое блюдо", "Блюдо", "dish", "add", "Сразу открыть создание блюда", "naRun('dish')"],
  wt: ["Записать вес", "Вес", "scale", "add", "Вес за открытый день", "naRun('wt')"],
  cal: ["Календарь", "Календарь", "cal", "go", "Выбрать день", "cal()"],
  stat: ["Статистика", "Статистика", "chart", "go", "Месяц: калории, БЖУ, вес", "stats()"],
  goal: ["Норма на день", "Норма", "target", "go", "Изменить норму Б / Ж / У", "naRun('goal')"],
  card: ["Карточка дня", "Итог дня", "layout", "go", "Сводка дня для скриншота", "naRun('card')"],
  today: ["К сегодняшнему дню", "Сегодня", "today", "go", "Вернуться к сегодня из любого дня", "naRun('today')"],
  prod: ["Продукты", "Продукты", "list", "req", "Список продуктов и блюд", "mng()"],
  set: ["Настройки", "Настройки", "sld", "req", "Все настройки приложения", "sets()"]
};
const NREQ = ["prod", "set"], NSUG = ["cal", "stat", "meal", "today", "goal", "card", "pnew", "dish", "wt"], NCEN = ["meal", "pnew", "dish", "cal", "stat", "today", "goal", "card", "wt"];
const nOk = k => !!NA[k] && (k !== "wt" || wton());
function naRun(k) {
  vib("ui"); if (isOpen) closeUI();
  if (k === "meal") op(autoMeal());
  else if (k === "pnew") { mode = "mng"; drawMc(); nw(); show() }
  else if (k === "dish") { mode = "mng"; drawMc(); dbt(); show() }
  else if (k === "wt") { if (cur > today) { cur = today; render() } wtOpen() }
  else if (k === "goal") goals();
  else if (k === "card") { if (cur > today) { cur = today; head() } if (!REP) togRep(1) }
  else if (k === "today") { if (REP) togRep(0); if (cur !== today) { const d = today > cur ? 1 : -1; NABS = 1; slide($("app"), d, () => { cur = today }) } }
  else ({ cal, stat: stats, prod: mng, set: sets })[k]()
}
// Настройка панели: { n — мест, big — большая кнопка в центре, s — действия слева направо, c — действие кнопки, когда она выключена,
// x — пункты, убранные при переходе на компактную панель (вернутся при «Полная») }.
// По бокам пункты идут парами: с кнопкой 3 или 5 мест, без кнопки — 2 или 4. «Продукты» и «Настройки» — всегда на панели, не в центре.
// Старая настройка (только действие «＋» или «Скрыть кнопку») переводится без потерь: панель та же, что была.
const FA2N = { meal: "meal", prod: "pnew", dish: "dish", wt: "wt" };
function navGet() {
  let v = S.set && S.set.nav;
  if (!v || typeof v !== "object" || !Array.isArray(v.s)) { const fa = S.set && S.set.fa; v = fa === "hide" ? { n: 4, big: false, s: ["cal", "prod", "stat", "set"], c: "meal" } : { n: 5, big: true, s: ["cal", "prod", FA2N[fa] || "meal", "stat", "set"] } }
  return navFix(v)
}
// приведение к правильному виду — при чтении, после каждого изменения и после загрузки файла
function navFix(v) {
  const big = !!v.big, ok = big ? [3, 5] : [2, 4], n = ok.includes(v.n) ? v.n : ok[1], m = (n - 1) / 2, raw = Array.isArray(v.s) ? v.s : [];
  // центр: прежнее действие, если оно доступно и не обязательное; иначе — «Приём пищи» и дальше по списку
  let c = null; if (big) { const r = raw[m]; c = nOk(r) && !NREQ.includes(r) ? r : NCEN.find(k => nOk(k) && (k === r || !raw.includes(k))) || NCEN.find(nOk) }
  const side = []; raw.forEach((k, i) => { if (big && i === m) return; if (nOk(k) && k !== c && !side.includes(k)) side.push(k) });
  NREQ.forEach(k => { if (!side.includes(k)) side.push(k) });
  const need = n - (big ? 1 : 0);
  while (side.length > need) { let i = -1; for (let j = side.length - 1; j >= 0; j--) if (!NREQ.includes(side[j])) { i = j; break } side.splice(i, 1) }
  while (side.length < need) side.splice(side.length - 1, 0, NSUG.find(k => nOk(k) && !side.includes(k) && k !== c));
  const h = side.length / 2, s = big ? [...side.slice(0, h), c, ...side.slice(h)] : side, o = { n, big, s };
  if (NA[v.c]) o.c = v.c; if (Array.isArray(v.x)) o.x = v.x.filter(k => NA[k]).slice(0, 2); return o
}
const navMid = v => v.big ? (v.n - 1) / 2 : -1;
const navCols = (v, w) => v.big ? `repeat(${(v.n - 1) / 2},1fr) ${w || 84}px repeat(${(v.n - 1) / 2},1fr)` : `repeat(${v.n},1fr)`;
// старое поле fabAction пишется по-прежнему — файл открывается и в старой версии приложения
function navSave(v, msg, old) {
  v = navFix(v); const m = navMid(v), fa = m >= 0 ? (Object.keys(FA2N).find(k => FA2N[k] === v.s[m]) || "meal") : "hide";
  S.set = Object.assign({}, S.set, { nav: v, fa }); saveq(); barSync(); vib("ui");
  if (!$("v15").hidden) drawNav(); if (!$("v16").hidden) drawNavPick();
  if (msg) { navUndo = old ? { v: old, m: msg } : null; toast(msg, !!old, old ? 6000 : 3000) }
}
let navUndo = null;
// панель на главном экране; пересобирается только при изменении
function barSync() {
  const nav = document.querySelector(".bt"), v = navGet(), m = navMid(v), key = JSON.stringify(v.s) + m;
  if (nav._k === key) return; nav._k = key;
  nav.innerHTML = v.s.map((k, i) => i === m ? `<button id="fab" class="fab" onclick="fabDo()" aria-label="${NA[k][0]}">${ic(NA[k][2])}</button>` : `<button onclick="${NA[k][5]}">${ic(NA[k][2])}${NA[k][1]}</button>`).join("");
  nav.style.gridTemplateColumns = navCols(v); nav.classList.toggle("nofab", m < 0)
}
function fabSync() { barSync() }
// действие большой кнопки в старых значениях (для виджета и файла): meal | prod | dish | wt | hide
function fabAct() { const v = navGet(), m = navMid(v); if (m < 0) return "hide"; return Object.keys(FA2N).find(k => FA2N[k] === v.s[m]) || "other" }
function fabDo() { const v = navGet(), m = navMid(v); naRun(m >= 0 ? v.s[m] : "meal") }
// старый способ задать кнопку (meal | prod | dish | wt | hide) — тоже работает
function setFa(x) {
  const v = navGet(), m = navMid(v);
  if (x === "hide") { if (v.big) navSave({ ...v, big: false, n: v.n - 1, s: v.s.filter((k, i) => i !== m), c: v.s[m] }) }
  else { const k = FA2N[x] || "meal"; if (v.big) { const s = v.s.slice(), j = s.indexOf(k); if (j >= 0) s[j] = s[m]; s[m] = k; navSave({ ...v, s }) } else { const h = v.s.length / 2; navSave({ ...v, big: true, n: v.n + 1, s: [...v.s.slice(0, h), k, ...v.s.slice(h)] }) } }
}

// ===== кнопки «Новый продукт» / «Новое блюдо»: сверху (под поиском, по умолчанию) или снизу (под списком) =====
const nbv = () => S.set && S.set.nb === "bottom" ? "bottom" : "top";
function applyLay() { const lr = document.querySelector("#v1 .lr"); if (lr) { if (nbv() === "top") document.getElementById("q").parentElement.after(lr); else document.getElementById("ls").after(lr); lr.classList.toggle("top", nbv() === "top") } try { barSync() } catch (e) { } }
function setNb(v) { S.set = Object.assign({}, S.set, { nb: v }); saveq(); applyLay(); drawSet(); vib("ui") }

// ===== карточка дня: тройное касание по итогу дня (по умолчанию) или строка «Карточка дня ›» внизу итога =====
const dcv = () => S.set && S.set.dc === "row" ? "row" : "tap";
function setDc(v) {
  S.set = Object.assign({}, S.set, { dc: v }); saveq(); vib("ui"); drawSet();
  // строка «Карточка дня» в итоге дня раскрывается или сжимается плавно
  mainMorph(v === "row" ? [] : [document.querySelector("#app .crow")], render, () => v === "row" ? [document.querySelector("#app .crow")].filter(Boolean) : [])
}

// ===== пустые перекусы: «Ссылкой» — «＋ Перекус N» внизу карточки приёма; «По двойному касанию» — пустых не видно,
// два касания по названию основного приёма показывают ссылку, ещё два — убирают. Открытый пустой перекус прячется при смене дня
const snv = () => S.set && (S.set.sn === "tap" || S.set.sn === "hide") ? "tap" : "row";
let snOpen = new Set(), snDay = "";
function snToggle(mi) {
  const s = mi + 1; if (!SN[s]) return; vib("ui"); const q = () => document.querySelector(`#app .snk[data-m="${s}"]`), rr = () => { flipSkip = 1; render(); flipSkip = 0 };
  // уезжает: строка плавно сжимается, соседи подтягиваются вслед; выезжает — наоборот
  if (snOpen.has(s)) { snOpen.delete(s); const b = q(); if (b && !b._sh) { b._sh = 1; moH(b, 0, rr) } else rr(); return }
  snOpen.add(s); rr(); const b = q(); if (b) moH(b, 1)
}
function setSn(v) {
  S.set = Object.assign({}, S.set, { sn: v }); saveq(); snOpen.clear(); vib("ui"); drawSet();
  // ссылки «＋ Перекус» плавно сжимаются (по двойному касанию) или раскрываются (ссылкой) — карточки подтягиваются вслед
  const old = new Set([...document.querySelectorAll("#app .snk")].map(e => e.dataset.m));
  mainMorph(v === "tap" ? [...document.querySelectorAll("#app .snk")] : [], render, () => [...document.querySelectorAll("#app .snk")].filter(e => !old.has(e.dataset.m)))
}
// двойное касание по шапке основного приёма (не по кнопкам)
(() => {
  let t = 0, m = -1; addEventListener("pointerup", e => {
    if (isOpen || REP || snv() !== "tap" || e.button > 0) return; const h = e.target.closest && e.target.closest("#app .meal>.mh"); if (!h || e.target.closest("button")) return;
    const mi = +h.parentElement.dataset.m, n = Date.now(); if (m === mi && n - t < 420) { t = 0; m = -1; snToggle(mi) } else { t = n; m = mi }
  })
})();
