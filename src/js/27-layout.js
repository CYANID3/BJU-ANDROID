// Главный экран: кнопка «＋» в нижней панели, кнопки «Новый продукт» / «Новое блюдо» (сверху / снизу списка),
// пустые перекусы (ссылкой / по двойному касанию), карточка дня (тройное касание / строка в итоге дня)

// ===== кнопка «＋» в центре нижней панели: одно действие на выбор, значок — под действие =====
const FAB = [["meal", "Приём пищи по времени", "plus", "Список продуктов, приём выбран по времени суток"], ["prod", "Новый продукт", "box", "Сразу открыть создание продукта"],
  ["dish", "Новое блюдо", "dish", "Сразу открыть создание блюда"], ["wt", "Вес", "scale", "Записать вес за открытый день"], ["hide", "Скрыть кнопку", "close", "Панель из четырёх пунктов"]];
// «Вес» — только когда вес отслеживается; иначе кнопка ведёт себя как «Приём пищи»
function fabAct() { const v = S.set && S.set.fa; return !FAB.some(x => x[0] === v) || v === "wt" && !wton() ? "meal" : v }
function fabSync() { const a = fabAct(), b = $("fab"), it = FAB.find(x => x[0] === a); document.querySelector(".bt").classList.toggle("nofab", a === "hide"); if (b._a === a) return; b._a = a; b.innerHTML = ic(it[2]); b.setAttribute("aria-label", it[1]) }
function fabDo() {
  const a = fabAct(); vib("ui"); if (isOpen) closeUI();
  if (a === "prod") { mode = "mng"; drawMc(); nw(); show() }
  else if (a === "dish") { mode = "mng"; drawMc(); dbt(); show() }
  else if (a === "wt") { if (cur > today) { cur = today; render() } wtOpen() }
  else op(autoMeal())
}
function setFa(v) { S.set = Object.assign({}, S.set, { fa: v }); saveq(); fabSync(); drawSet(); vib("ui") }

// ===== кнопки «Новый продукт» / «Новое блюдо»: сверху (под поиском, по умолчанию) или снизу (под списком) =====
const nbv = () => S.set && S.set.nb === "bottom" ? "bottom" : "top";
function applyLay() { const lr = document.querySelector("#v1 .lr"); if (lr) { if (nbv() === "top") document.getElementById("q").parentElement.after(lr); else document.getElementById("ls").after(lr); lr.classList.toggle("top", nbv() === "top") } try { fabSync() } catch (e) { } }
function setNb(v) { S.set = Object.assign({}, S.set, { nb: v }); saveq(); applyLay(); drawSet(); vib("ui") }

// ===== карточка дня: тройное касание по итогу дня (по умолчанию) или строка «Карточка дня ›» внизу итога =====
const dcv = () => S.set && S.set.dc === "row" ? "row" : "tap";
function setDc(v) { S.set = Object.assign({}, S.set, { dc: v }); saveq(); vib("ui"); vtx(() => { drawSet(); render() }) }

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
function setSn(v) { S.set = Object.assign({}, S.set, { sn: v }); saveq(); snOpen.clear(); vib("ui"); vtx(() => { drawSet(); render() }) }
// двойное касание по шапке основного приёма (не по кнопкам)
(() => {
  let t = 0, m = -1; addEventListener("pointerup", e => {
    if (isOpen || REP || snv() !== "tap" || e.button > 0) return; const h = e.target.closest && e.target.closest("#app .meal>.mh"); if (!h || e.target.closest("button")) return;
    const mi = +h.parentElement.dataset.m, n = Date.now(); if (m === mi && n - t < 420) { t = 0; m = -1; snToggle(mi) } else { t = n; m = mi }
  })
})();
