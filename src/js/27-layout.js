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
  xch: ["Обмен продуктами", "Обмен", "xch", "go", "С телефоном рядом, без интернета", "naRun('xch')"],
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
  else if (k === "xch") xOpen();
  else if (k === "card") { if (cur > today) { cur = today; head() } if (!REP) togRep(1) }
  else if (k === "today") { if (REP) togRep(0); if (cur !== today) { const d = today > cur ? 1 : -1; NABS = 1; slide($("app"), d, () => { cur = today }) } }
  else ({ cal, stat: stats, prod: mng, set: sets })[k]()
}
// Настройка панели: { n — мест, big — большая кнопка в центре, s — действия слева направо, c — действие кнопки, когда она скрыта }.
// С кнопкой — 2–4 пункта по бокам (всего 3–5 мест), без кнопки — 2–5 пунктов. «Продукты» и «Настройки» — всегда на панели, не в центре.
// Старая настройка (только действие «＋» или «Скрыть кнопку») переводится без потерь: панель та же, что была.
const FA2N = { meal: "meal", prod: "pnew", dish: "dish", wt: "wt" };
function navGet() {
  let v = S.set && S.set.nav;
  if (!v || typeof v !== "object" || !Array.isArray(v.s)) { const fa = S.set && S.set.fa; v = fa === "hide" ? { n: 4, big: false, s: ["cal", "prod", "stat", "set"], c: "meal" } : { n: 5, big: true, s: ["cal", "prod", FA2N[fa] || "meal", "stat", "set"] } }
  return navFix(v)
}
// пункты слева от кнопки: при нечётном числе пунктов слева на один больше
const navLeft = k => Math.ceil(k / 2);
// приведение к правильному виду — при чтении, после каждого изменения и после загрузки файла
function navFix(v) {
  const big = !!v.big, raw = Array.isArray(v.s) ? v.s : [], n0 = raw.length, m0 = big ? navLeft(n0 - 1) : -1;
  // центр: прежнее действие, если оно доступно и не обязательное; иначе — «Приём пищи» и дальше по списку
  let c = null; if (big) { const r = raw[m0]; c = nOk(r) && !NREQ.includes(r) ? r : NCEN.find(k => nOk(k) && (k === r || !raw.includes(k))) || NCEN.find(nOk) }
  const side = []; raw.forEach((k, i) => { if (big && i === m0) return; if (nOk(k) && k !== c && !side.includes(k)) side.push(k) });
  NREQ.forEach(k => { if (!side.includes(k)) side.push(k) });
  const max = big ? 4 : 5;
  while (side.length > max) { let i = -1; for (let j = side.length - 1; j >= 0; j--) if (!NREQ.includes(side[j])) { i = j; break } side.splice(i, 1) }
  const L = navLeft(side.length), s = big ? [...side.slice(0, L), c, ...side.slice(L)] : side, o = { n: s.length, big, s };
  if (NA[v.c]) o.c = v.c; return o
}
const navMid = v => v.big ? navLeft(v.n - 1) : -1;
const navCols = (v, w) => { if (!v.big) return `repeat(${v.n},1fr)`; const L = navLeft(v.n - 1), R = v.n - 1 - L, f = k => `${(L * R || 1) / k}fr`; return `repeat(${L},${f(L)}) ${w || 84}px repeat(${R},${f(R)})` };
// старое поле fabAction пишется по-прежнему — файл открывается и в старой версии приложения
function navSave(v, msg, old) {
  v = navFix(v); const m = navMid(v), fa = m >= 0 ? (Object.keys(FA2N).find(k => FA2N[k] === v.s[m]) || "meal") : "hide";
  S.set = Object.assign({}, S.set, { nav: v, fa }); saveq(); barSync(); vib("ui");
  if (!$("v15").hidden) { if (navQuiet) drawNav(); else navRedraw() } if (!$("v16").hidden) drawNavPick();
  if (msg) { navUndo = old ? { v: old, m: msg } : null; toast(msg, !!old, old ? 6000 : 3000) }
}
let navUndo = null, navQuiet = 0;
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
  if (x === "hide") { if (v.big) navSave({ ...v, big: false, s: v.s.filter((k, i) => i !== m), c: v.s[m] }); return }
  navCenter(FA2N[x] || "meal")
}
// поставить действие на большую кнопку (показать её, если скрыта). Если действие стоит сбоку — переезжает в центр;
// если по бокам уже 5 пунктов — крайний справа необязательный уходит (вернуть — «Отменить»)
function navCenter(k, msg) {
  const v = navGet(), m = navMid(v), old = JSON.parse(JSON.stringify(v));
  if (v.big) { const s = v.s.slice(), j = s.indexOf(k); if (j === m) return; if (j >= 0) s[j] = s[m]; s[m] = k; return navSave({ ...v, s }, msg && (j >= 0 ? `«${NA[k][1]}» и «${NA[s[j]][1]}» поменялись местами` : `Большая кнопка: ${NA[k][1]}`), msg && old) }
  const side = v.s.filter(x => x !== k), cut = [];
  while (side.length > 4) { let i = -1; for (let j = side.length - 1; j >= 0; j--) if (!NREQ.includes(side[j])) { i = j; break } cut.push(side.splice(i, 1)[0]) }
  const L = navLeft(side.length);
  navSave({ ...v, big: true, s: [...side.slice(0, L), k, ...side.slice(L)] }, msg && (cut.length ? `Большая кнопка: ${NA[k][1]}. Убрано: ${cut.map(x => NA[x][1]).join(", ")}` : `Большая кнопка: ${NA[k][1]}`), msg && old)
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
