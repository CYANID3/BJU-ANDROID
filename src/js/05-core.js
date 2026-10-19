// Даты, $(), экранирование, калории, вибрация, перелистывание дня
const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
let today = iso(new Date()); let cur = today;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const r1 = x => Math.round(x * 10) / 10, f1 = x => String(r1(x)).replace(".", ","), kc = (p, f, c) => Math.round(p * 4 + f * 9 + c * 4), dk = E => kc(E.reduce((a, e) => a + e.p, 0), E.reduce((a, e) => a + e.f, 0), E.reduce((a, e) => a + e.c, 0));
function shiftDay(c, n) { const d = new Date(c + "T12:00:00"); d.setDate(d.getDate() + n); return iso(d) }

// ===== Вибрация =====
// Общий выключатель (S.set.hp: on / off; старое «nodays» = включено, кроме листания дней), сила (S.set.vs) и отдельные случаи (S.set.ve).
// В APK — системные виброотклики Android (нажатие клавиши, подтверждение, отказ, порог жеста), в браузере — navigator.vibrate.
const VIB = [
  ["kb", "Нажатия своей клавиатуры", "", "key"],
  ["save", "Добавление и сохранение", "", "confirm"],
  ["del", "Удаление и отмена", "", "long"],
  ["days", "Листание дней и месяцев", "", "tick"],
  ["pull", "Жесты «потянуть» и смахивание листа", "Отклик на пороге срабатывания", "threshold"],
  ["ui", "Переключатели, вкладки, избранное", "", "tick"],
  ["err", "Ошибки ввода", "Пустое количество, вес вне диапазона", "reject"]];
const VSS = { light: ["Лёгкая", 5], normal: ["Обычная", 10], strong: ["Сильная", 20] };
const hpv = () => { const v = S.set && S.set.hp; return v === "off" || v === "nodays" ? v : "on" };
const vbOn = () => hpv() !== "off";
const vss = () => { const v = S.set && S.set.vs; return VSS[v] ? v : "normal" };
// включён ли случай: по умолчанию — да; «Листание дней» выключено и при старом «Кроме дней»
function veOn(k) { const e = (S.set && S.set.ve) || {}; if (typeof e[k] === "boolean") return e[k]; return !(k === "days" && hpv() === "nodays") }
function vib(k) {
  if (!vbOn() || !veOn(k)) return; const t = (VIB.find(x => x[0] === k) || [])[3] || "tick", s = vss();
  try { const N = window.BJU_NATIVE; if (N && N.native) { (N.feedback ? N.feedback(t, s) : N.haptic(VSS[s][1])); return } navigator.vibrate && navigator.vibrate(VSS[s][1] * (t === "long" ? 2 : 1)) } catch (e) { }
}
function go(n) { if (!GQ) vib("days"); if (!NABS) { NP = shiftDay(NP || cur, n); head(NP) } slide($("app"), n, () => { cur = shiftDay(cur, n) }) }
