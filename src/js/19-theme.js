// Тема, акцент, оттенок фона, системные панели
function lum(h) { const n = parseInt(h.slice(1), 16), f = c => { c /= 255; return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4) }; return .2126 * f(n >> 16 & 255) + .7152 * f(n >> 8 & 255) + .0722 * f(n & 255) }
// контраст по WCAG; цвет подтягивается к белому (тёмная тема) или к чёрному (светлая), пока не станет читаемым на всех фонах
const crt = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05) };
function ensC(c, bgs, t, dark) { let r = c; for (let k = 1; k <= 20 && Math.min(...bgs.map(b => crt(r, b))) < t; k++) r = hexMix(dark ? "#ffffff" : "#000000", c, k * .05); return r }
const isDark = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light")) === "dark";
// акцент по умолчанию — индиго (не совпадает с цветами Б / Ж / У); свой выбранный цвет сохраняется
const AC0 = { dark: "#7c70f0", light: "#5b4fd6" }, acDef = () => AC0[isDark() ? "dark" : "light"];
const acCur = () => (S.set && /^#[0-9a-f]{6}$/i.test(S.set.ac || "") && S.set.ac) || acDef();
// Палитра поверхностей считается в OKLCH: светлота каждой ступени задана, а оттенок и насыщенность берутся от акцента.
// Так «тёплый» акцент (оранжевый, жёлтый, красный) даёт тёплый графит, а не грязно-коричневый фон, как при смешивании в RGB.
const s2l = c => (c /= 255) <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4), l2s = c => Math.round(255 * Math.min(1, Math.max(0, c <= .0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - .055)));
function toOk(h) {
  const n = parseInt(h.slice(1), 16), r = s2l(n >> 16 & 255), g = s2l(n >> 8 & 255), b = s2l(n & 255);
  const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b), m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b), q = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
  const A = 1.9779984951 * l - 2.428592205 * m + .4505937099 * q, B = .0259040371 * l + .7827717662 * m - .808675766 * q;
  return [.2104542553 * l + .793617785 * m - .0040720468 * q, Math.hypot(A, B), (Math.atan2(B, A) * 180 / Math.PI + 360) % 360]
}
function okRgb(L, C, H) {
  const a = C * Math.cos(H * Math.PI / 180), b = C * Math.sin(H * Math.PI / 180), l = (L + .3963377774 * a + .2158037573 * b) ** 3, m = (L - .1055613458 * a - .0638541728 * b) ** 3, q = (L - .0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + .2309699292 * q, -1.2684380046 * l + 2.6097574011 * m - .3413193965 * q, -.0041960863 * l - .7034186147 * m + 1.707614701 * q]
}
// цвет из OKLCH; если не помещается в sRGB — насыщенность снижается, оттенок и светлота сохраняются
function okHex(L, C, H) { let c = C, v; for (let i = 0; i < 30; i++) { v = okRgb(L, c, H); if (v.every(x => x >= -.0005 && x <= 1.0005)) break; c *= .85 } return "#" + v.map(x => l2s(x).toString(16).padStart(2, "0")).join("") }
// ступени: светлота поверхностей; ch — насыщенность «нейтрального» (оттенок фона выключен) и двух уровней оттенка
const PAL = {
  dark: { L: { bg: .245, card: .29, sub: .33, bd: .365, key: .37, keyp: .43, kbg: .262, dlg: .32 }, ch: { off: .011, soft: .015, strong: .022 } },
  light: { L: { bg: .956, card: 1, sub: .968, bd: .918, key: 1, keyp: .895, kbg: .925, dlg: 1 }, ch: { off: .006, soft: .011, strong: .024 } }
};
const tnv = () => { const v = S.set && S.set.tn; return v === "soft" || v === "strong" ? v : "off" };
const hexMix = (a, b, t) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); return "#" + [16, 8, 0].map(k => Math.round(((A >> k) & 255) * t + ((B >> k) & 255) * (1 - t)).toString(16).padStart(2, "0")).join("") };
// палитра одной темы — без записи на страницу (её же получает виджет: светлая и тёмная, чтобы он сам следовал теме телефона)
const acFor = dark => (S.set && /^#[0-9a-f]{6}$/i.test(S.set.ac || "") && S.set.ac) || AC0[dark ? "dark" : "light"];
function palette(dark) {
  const P = PAL[dark ? "dark" : "light"], v = tnv(), a = acFor(dark), [, aC, aH] = toOk(a), T = {};
  // оттенок фона выключен — холодный нейтральный графит; иначе — оттенок акцента, тёплые тона приглушены вдвое
  const warm = aH > 20 && aH < 120 ? .55 : 1, H = v === "off" ? 262 : aH, C = v === "off" ? P.ch.off : Math.min(P.ch[v] * warm, aC * .5);
  for (const k in P.L) T[k] = P.L[k] >= 1 && v === "off" ? "#ffffff" : okHex(P.L[k] >= 1 ? .995 : P.L[k], P.L[k] >= 1 ? C * .5 : C, H);
  // мягкая заливка акцентом (кнопки «+», плашки, выбранное) — сплошным цветом нужной светлоты, а не прозрачностью поверх фона
  T.acs = dark ? okHex(.37, Math.min(aC * .42, .075), aH) : okHex(.935, Math.min(aC * .3, .05), aH);
  T.tx = dark ? "#eef2f7" : "#151a21";
  // приглушённый текст в тёмной теме — светлее, чтобы подписи на блоках (--sub) читались не хуже 4,5 : 1
  T.mu = dark ? okHex(.76, .012, H) : "#5f6877";
  // уведомление: в светлой теме — белая плашка с тенью, в тёмной — на ступень светлее карточек; кнопка — цветом акцента
  T.tst = dark ? okHex(.42, C || .011, H) : "#ffffff"; T.tsx = dark ? "#f1f2f5" : "#1a1c22";
  T.tsa = dark ? okHex(.84, Math.min(aC, .13), aH) : ensC(a, ["#ffffff"], 4.5, false);
  T.ac = a; T.on = crt("#ffffff", a) >= 3.1 ? "#ffffff" : "#141922";
  return T
}
function applyTint() {
  const r = document.documentElement, dark = isDark(), T = palette(dark);
  for (const k of [...Object.keys(PAL.dark.L), "acs", "tst", "tsx", "tsa"]) r.style.setProperty("--" + k, T[k]);
  if (dark) r.style.setProperty("--mu", T.mu); else r.style.removeProperty("--mu");
}
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
  r.style.setProperty("--on", palette(dark).on); tc()
}
// цвет строки состояния и стиль значков системных панелей (снизу под панелью приложения — её же тон)
function tc() { const m = document.querySelector('meta[name="theme-color"]'), cs = getComputedStyle(document.documentElement), bg = cs.getPropertyValue("--bg").trim() || "#eef1f5"; if (m) m.setAttribute("content", bg); const N = NX(); if (N && /^#[0-9a-f]{6}$/i.test(bg)) N.bars(bg, lum(bg) > .5); try { wUpd() } catch (e) { } }
