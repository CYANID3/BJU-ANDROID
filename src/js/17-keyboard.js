// Системная клавиатура (только для текстовых полей: поиск, названия, код цвета): лист поднимается вместе с ней (CSS --kb),
// поле ввода остаётся видимым. Числа вводятся своей клавиатурой (05b-input.js) — системная для них не открывается.
function ensureVis() {
  const a = document.activeElement, s = shBody(); if (!a || a.tagName !== "INPUT" || !s.contains(a)) return; const r = a.getBoundingClientRect(), q = s.getBoundingClientRect();
  if (r.bottom > q.bottom - 12) s.scrollBy({ top: r.bottom - q.bottom + 28, behavior: "smooth" }); else if (r.top < q.top + 8) s.scrollBy({ top: r.top - q.top - 28, behavior: "smooth" })
}
let kbH = 0;
window.BJU_onKeyboard = (h, d) => {
  kbH = h;
  // системная клавиатура начала подниматься — своя панель (если ещё видна) уходит сразу
  if (h > 0 && !isNum(document.activeElement) && shEl().classList.contains("kpo")) { clearTimeout(kpHide); kpShow(false) }
  if (d >= 0 && h > 0) setTimeout(ensureVis, d + 20)
};
// Закрытие клавиатуры: перед тем как скрыться, Android на мгновение показывает полную (более высокую) раскладку —
// пока поле окончательно потеряло фокус, высота клавиатуры для страницы может только уменьшаться
let kbCap = -1, kbCapT = 0; window.BJU_kbFilter = h => { if (kbCap >= 0) { if (Date.now() > kbCapT || h <= 0) kbCap = -1; else { kbCap = Math.min(kbCap, h); return kbCap } } return h };
document.addEventListener("focusout", e => { if (e.target.tagName !== "INPUT") return; setTimeout(() => { const a = document.activeElement; if (!(a && a.tagName === "INPUT") && kbH > 0) { kbCap = kbH; kbCapT = Date.now() + 900 } }, 0) }, true);
// Пока в листе фокус в поле, нажатия по кнопкам и строкам листа не забирают у него фокус —
// клавиатура (своя или системная) не закрывается и не открывается заново при переходах внутри листа
const keepKb = e => { const a = document.activeElement; if (!a || a.tagName !== "INPUT" || a.type === "file" || !shEl().contains(a)) return; if (e.target.closest("input,label,textarea,select")) return; e.preventDefault() };
shEl().addEventListener("mousedown", keepKb, true); $("dg").addEventListener("mousedown", keepKb, true);
document.addEventListener("focusin", () => { if (kbH > 0) requestAnimationFrame(ensureVis) });
// Запасной путь (браузер): если система всё же меняет размер окна под клавиатуру — лист доезжает плавно, а не прыжком
let lastIH = innerHeight; addEventListener("resize", () => {
  const h = innerHeight, d = h - lastIH; lastIH = h; if (!isOpen || document.documentElement.classList.contains("native") || window.visualViewport && !NATIVE || RM() || Math.abs(d) < 60) return;
  try { shEl().animate([{ transform: `translateY(${-d}px)` }, { transform: "none" }], { duration: MO.t2, easing: "cubic-bezier(.2,0,0,1)" }) } catch (e) { }
});
const vv = NATIVE ? null : window.visualViewport; function fit() { if (!vv) return; const o = $("ov"); o.style.top = vv.offsetTop + "px"; o.style.height = vv.height + "px" }
if (vv) { vv.addEventListener("resize", fit); vv.addEventListener("scroll", fit) }
