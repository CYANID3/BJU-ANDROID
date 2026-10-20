// Иконки, база продуктов, приёмы пищи, состояние S, проверка данных и загрузка из localStorage
const ICP = {
  ruler: '<rect x="3" y="8" width="18" height="8" rx="2"/><path d="M7 8v3M11 8v4M15 8v3M19 8v2"/>',
  chevL: '<path d="M15 5l-7 7 7 7"/>', chevR: '<path d="M9 5l7 7-7 7"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  cal: '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/>', today: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  box: '<path d="M4.5 8L12 4l7.5 4v8L12 20l-7.5-4z"/><path d="M12 12v8M4.5 8L12 12l7.5-4"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  dish: '<path d="M3.5 11h17a8.5 8.5 0 0 1-17 0z"/><path d="M8.5 7.5c0-1.4 1-1.6 1-3M12.5 7.5c0-1.4 1-1.6 1-3"/><path d="M9 20h6"/>',
  layout: '<rect x="4" y="3.5" width="16" height="17" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/>', chart: '<path d="M4.5 19.5h15"/><path d="M7.5 16v-5M12 16V7M16.5 16v-3"/>',
  star: '<path d="M12 3.8l2.5 5.1 5.6.8-4.05 3.95.95 5.6L12 16.6l-5 2.65.95-5.6L3.9 9.7l5.6-.8z"/>',
  scale: '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M8 9.2a5.6 5.6 0 0 1 8 0M12 9.6l1.3-2"/>',
  collapse: '<path d="M8 4l4 4 4-4M8 20l4-4 4 4M5 12h14"/>', expand: '<path d="M8 8l4-4 4 4M8 16l4 4 4-4M5 12h14"/>',
  back: '<path d="M20 7H9l-5 5 5 5h11a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1z"/><path d="M12.5 10l4 4M16.5 10l-4 4"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
  merge: '<path d="M7 4v6a5 5 0 0 0 5 5h5"/><path d="M14 12l3 3-3 3"/><path d="M7 20v-4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>', rise: '<path d="M3 18.5h18M7 18.5a5 5 0 0 1 10 0M12 6.5v3M5.6 10.6l1.6 1.6M18.4 10.6l-1.6 1.6"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  auto: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor"/>',
  pal: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.2-1-1.6-1-2.6 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1" fill="currentColor"/><circle cx="10" cy="7.2" r="1" fill="currentColor"/><circle cx="14.5" cy="7.2" r="1" fill="currentColor"/>',
  tint: '<path d="M12 3.5s6 6.2 6 10.5a6 6 0 0 1-12 0c0-4.3 6-10.5 6-10.5z"/>',
  vib: '<rect x="8" y="4" width="8" height="16" rx="2"/><path d="M4 9v6M20 9v6"/>', down: '<path d="M12 5v14M6 13l6 6 6-6"/>', up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  swipe: '<path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  tap: '<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10l4.2.9a2 2 0 0 1 1.6 2.2l-.6 4.4A3 3 0 0 1 14.2 20H11a3 3 0 0 1-2.4-1.2L5.6 15a1.5 1.5 0 0 1 2.2-2L9 14"/>',
  btn: '<rect x="3.5" y="7" width="17" height="10" rx="5"/><path d="M9 12h6"/>', snack: '<circle cx="12" cy="13" r="7"/><path d="M12 6c0-2 1-3 3-3"/>',
  hint: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M12 15V8M9.5 10.5L12 8l2.5 2.5"/>', fab: '<rect x="4" y="4" width="16" height="16" rx="5"/><path d="M12 8.5v7M8.5 12h7"/>',
  ok: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>', warn: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" stroke-width="3"/>', import: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5"/><path d="M5 19.5h14"/>'
};
const ic = (n, c) => `<svg class="${c || "i"}" viewBox="0 0 24 24" aria-hidden="true">${ICP[n]}</svg>`;
const BASE = [["Куриная грудка (сырая)", 23.6, 1.9, .4], ["Говядина (сырая)", 18.9, 12.4, 0], ["Лосось", 20, 13, 0], ["Минтай", 16, .9, 0], ["Яйцо куриное", 12.7, 11.5, .7], ["Творог 5%", 17, 5, 1.8], ["Молоко 2,5%", 2.8, 2.5, 4.7], ["Кефир 1%", 3, 1, 4], ["Йогурт натуральный", 5, 3.2, 3.5], ["Сметана 15%", 2.6, 15, 3], ["Сыр твёрдый", 23, 30, 0], ["Гречка (сухая)", 12.6, 3.3, 62.1], ["Рис (сухой)", 7, 1, 74], ["Овсяные хлопья", 12.3, 6.1, 59.5], ["Макароны (сухие)", 11, 1.3, 70], ["Хлеб пшеничный", 8.1, 1, 48.8], ["Картофель", 2, .4, 16.3], ["Морковь", 1.3, .1, 6.9], ["Огурец", .8, .1, 2.5], ["Помидор", .9, .2, 3.8], ["Яблоко", .4, .4, 9.8], ["Банан", 1.5, .2, 21.8], ["Масло оливковое", 0, 99.8, 0], ["Масло сливочное 82,5%", .5, 82.5, .8], ["Миндаль", 18.6, 57.7, 13.6], ["Сахар", 0, 0, 99.7]];
const MEALS = ["Завтрак", "Перекус", "Обед", "Перекус", "Ужин", "Перекус"], SN = [0, 1, 0, 1, 0, 1];
const NATIVE = !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()); if (NATIVE) document.documentElement.classList.add("native");
// STATE_VER — версия внутреннего состояния S (в памяти и localStorage); формат файла данных — отдельно, версия 3 (04-file-format.js)
const STATE_VER = 2, BUILD = (document.querySelector('meta[name="build"]') || {}).content || "dev";
let S = { g: { p: 120, f: 70, c: 250 }, db: BASE.map(x => x.slice()), d: {}, dirty: 0, saved: 0 };

// Проверка данных (из localStorage, файла или старого формата): понятная ошибка, если что-то не так
const isN = x => typeof x === "number" && isFinite(x) && x >= 0;
function chk(o) {
  if (!o || typeof o !== "object" || !o.g || !o.d || typeof o.d !== "object") throw Error("нет данных дневника");
  if (o.v > STATE_VER) throw Error("файл создан в более новой версии приложения");
  ["p", "f", "c"].forEach(k => { if (!isN(o.g[k])) throw Error("неверная норма") });
  for (const k in o.d) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !Array.isArray(o.d[k])) throw Error("неверная дата " + k);
    o.d[k].forEach(e => { if (!e || typeof e.n !== "string" || !(e.m >= 0 && e.m < 6) || ![e.g, e.p, e.f, e.c].every(isN)) throw Error("неверная запись за " + k) });
  }
  if (o.db && (!Array.isArray(o.db) || !o.db.every(p => Array.isArray(p) && typeof p[0] === "string" && [p[1], p[2], p[3]].every(isN) && (p[4] == null || Array.isArray(p[4]) && p[4].every(u => Array.isArray(u) && typeof u[0] === "string" && u[1] > 0)) && (p[5] == null || Array.isArray(p[5].i)))))
    throw Error("неверный список продуктов");
  if (o.set != null && typeof o.set !== "object") throw Error("неверные настройки");
  return o;
}
// принять данные как текущие (apply=false — без применения темы: при запуске тема применяется позже, один раз)
function adopt(o, apply = true) {
  if (!o || !o.d || !o.g) return false;
  if (!o.db) o.db = [...(o.cu || []), ...BASE.map(x => x.slice())];
  S = Object.assign({ g: { p: 120, f: 70, c: 250 }, db: [], d: {}, saved: 0 }, o); S.v = STATE_VER; S.dirty = 0;
  if (apply) applyAc();
  return true;
}
// Запуск: локальная копия проверяется. Если она повреждена — при запуске берётся резервная копия (99-init.js),
// в APK после этого ещё сверяются внутренний и основной файлы (02-storage-native.js)
let LOCAL_BAD = 0;
try { const r = localStorage.getItem("bju2"); if (r) adopt(chk(JSON.parse(r)), false) } catch (e) { LOCAL_BAD = 1 }
let serr = 0, stT = 0; const store = () => { stCancel(); try { localStorage.setItem("bju2", JSON.stringify(S)); serr = 0 } catch (e) { if (!serr) try { toast("Не удалось сохранить данные!") } catch (x) { } serr = 1 } };
// Копия в памяти браузера после правки — не в кадре нажатия: за год записей это ~250 КБ JSON, на слабом телефоне 20–40 мс.
// Несколько правок подряд дают одну запись; при уходе из приложения отложенная запись делается сразу. Основное хранилище APK —
// файл (queueNativeSave), его это не касается.
// Запись — после того как отыграют анимации нажатия (лист, смена темы — до 0,35 с), в свободное время браузера.
const stCancel = () => { if (stT) { clearTimeout(stT.t); if (stT.i && window.cancelIdleCallback) cancelIdleCallback(stT.i); stT = 0 } };
const storeSoon = () => { if (stT) return; const run = () => { stT = 0; store() }; stT = { t: setTimeout(() => { if (window.requestIdleCallback) stT.i = requestIdleCallback(run, { timeout: 400 }); else run() }, 380) } };
const storeNow = () => { if (stT) store() };
document.addEventListener("visibilitychange", () => { if (document.hidden) storeNow() }); addEventListener("pagehide", storeNow);
let H = null, perm = true, tm, mode = "add", ed = -1, IX = [], am = 0, sel = null;
