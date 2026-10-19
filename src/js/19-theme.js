// Тема, акцент, оттенок фона, системные панели
function lum(h) { const n = parseInt(h.slice(1), 16), f = c => { c /= 255; return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4) }; return .2126 * f(n >> 16 & 255) + .7152 * f(n >> 8 & 255) + .0722 * f(n & 255) }
// контраст по WCAG; цвет подтягивается к белому (тёмная тема) или к чёрному (светлая), пока не станет читаемым на всех фонах
const crt = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05) };
function ensC(c, bgs, t, dark) { let r = c; for (let k = 1; k <= 20 && Math.min(...bgs.map(b => crt(r, b))) < t; k++) r = hexMix(dark ? "#ffffff" : "#000000", c, k * .05); return r }
const isDark = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light")) === "dark";
// акцент по умолчанию — индиго (не совпадает с цветами Б / Ж / У); свой выбранный цвет сохраняется
const AC0 = { dark: "#7c70f0", light: "#5b4fd6" }, acDef = () => AC0[isDark() ? "dark" : "light"];
const acCur = () => (S.set && /^#[0-9a-f]{6}$/i.test(S.set.ac || "") && S.set.ac) || acDef();
// Оттенок фона: фон, карточки, подложки и линии с едва заметной примесью акцента (Выкл. / Лёгкий / Заметный).
// В тёмной теме три ступени глубины: фон → карточка → блок внутри карточки (светлее), чтобы элементы не сливались
const TNB = { light: { bg: "#eef1f5", card: "#ffffff", sub: "#f2f4f8", bd: "#e3e7ec" }, dark: { bg: "#10141c", card: "#1a202b", sub: "#232a37", bd: "#2a3241" } },
  TNK = { soft: { bg: .06, card: .035, sub: .06, bd: .12 }, strong: { bg: .12, card: .075, sub: .12, bd: .22 } };
const tnv = () => { const v = S.set && S.set.tn; return TNK[v] ? v : "off" };
const hexMix = (a, b, t) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); return "#" + [16, 8, 0].map(k => Math.round(((A >> k) & 255) * t + ((B >> k) & 255) * (1 - t)).toString(16).padStart(2, "0")).join("") };
function applyTint() { const r = document.documentElement, v = tnv(), a = acCur(), base = TNB[isDark() ? "dark" : "light"]; for (const k in base) { if (v === "off") r.style.removeProperty("--" + k); else r.style.setProperty("--" + k, hexMix(a, base[k], TNK[v][k])) } }
function setTn(v) { S.set = Object.assign({}, S.set, { tn: v }); saveq(); applyAc(); drawSet(); vib("ui") }
function applyTh() { const t = S.set && S.set.th, r = document.documentElement; if (t === "light" || t === "dark") r.dataset.theme = t; else delete r.dataset.theme }
function setTh(v) { S.set = Object.assign({}, S.set, { th: v }); saveq(); applyAc(); drawSet(); vib("ui") }
// акцент и производные от него цвета: --act — значки и текст акцентом (на мягкой подложке --acs читаются на любом фоне),
// --on — текст на заливке акцентом, --bar — тон нижней панели. Считаются для любого акцента и оттенка фона.
function applyAc() {
  applyTh(); applyTint(); applyLay(); try { scSync() } catch (e) { }
  const r = document.documentElement, c = S.set && S.set.ac, cu = c && /^#[0-9a-f]{6}$/i.test(c), dark = isDark(), a = acCur();
  if (cu) r.style.setProperty("--ac", a); else r.style.removeProperty("--ac");
  const cs = getComputedStyle(r), gv_ = (k, d) => { const v = cs.getPropertyValue(k).trim(); return /^#[0-9a-f]{6}$/i.test(v) ? v : d }, card = gv_("--card", dark ? "#1a202b" : "#ffffff"), sub = gv_("--sub", dark ? "#232a37" : "#f2f4f8"),
    bar = dark ? hexMix("#ffffff", card, .03) : card; r.style.setProperty("--bar", bar);
  r.style.setProperty("--act", ensC(a, [card, sub, bar].map(b => hexMix(a, b, dark ? .18 : .14)), 4.5, dark));
  r.style.setProperty("--on", crt("#ffffff", a) >= 3.1 ? "#fff" : "#141922"); tc()
}
// цвет строки состояния и стиль значков системных панелей (снизу под панелью приложения — её же тон)
function tc() { const m = document.querySelector('meta[name="theme-color"]'), cs = getComputedStyle(document.documentElement), bg = cs.getPropertyValue("--bg").trim() || "#eef1f5"; if (m) m.setAttribute("content", bg); const N = NX(); if (N && /^#[0-9a-f]{6}$/i.test(bg)) N.bars(bg, lum(bg) > .5); try { wUpd() } catch (e) { } }
