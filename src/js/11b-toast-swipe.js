// Уведомление (тост) можно смахнуть вниз или в сторону, как в обычных приложениях. Касание тоста не листает дни
// и не тянет экран (события дальше не идут); кнопка «Отменить» работает как раньше
{ const T = $("tt"); let x0 = null, y0 = 0, dx = 0, dy = 0, t0 = 0, mv = 0;
  const set = (x, y, o) => { T.style.transform = `translate(${x}px,${y}px)`; T.style.opacity = o };
  const reset = () => { T.style.transition = T.style.transform = T.style.opacity = "" };
  T.addEventListener("touchstart", e => { e.stopPropagation(); if (e.touches.length > 1 || !T.classList.contains("on")) { x0 = null; return } const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; dx = dy = mv = 0; t0 = e.timeStamp; clearTimeout(tmr) }, { passive: true });
  T.addEventListener("touchmove", e => { e.stopPropagation(); if (x0 == null) return; const t = e.touches[0]; dx = t.clientX - x0; dy = t.clientY - y0;
    if (!mv && Math.hypot(dx, dy) > 8) mv = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (!mv) return; if (e.cancelable) e.preventDefault(); T.style.transition = "none";
    // вверх тост почти не тянется (упирается), вниз и в стороны — следом за пальцем
    if (mv === "x") set(dx, 0, Math.max(.2, 1 - Math.abs(dx) / (T.offsetWidth * .9))); else set(0, dy > 0 ? dy : dy / 5, Math.max(.2, 1 - Math.max(0, dy) / 120)) }, { passive: false });
  const end = e => { e.stopPropagation(); if (x0 == null) return; x0 = null; if (!mv) { tmr = setTimeout(() => T.classList.remove("on"), 2500); return }
    const dt = Math.max(1, e.timeStamp - t0), fast = (mv === "x" ? Math.abs(dx) : dy) / dt > .5;
    const gone = mv === "x" ? Math.abs(dx) > T.offsetWidth * .3 || fast && Math.abs(dx) > 24 : dy > 28 || fast && dy > 12;
    T.style.transition = "transform var(--t2) var(--ease),opacity var(--t2)";
    if (!gone) { T.style.transform = T.style.opacity = ""; tmr = setTimeout(() => T.classList.remove("on"), 2500); setTimeout(reset, 220); return }
    vib("ui"); if (mv === "x") set(Math.sign(dx) * (innerWidth + 20), 0, 0); else set(0, T.offsetHeight + 40, 0);
    setTimeout(() => { T.style.transition = "none"; T.classList.remove("on"); void T.offsetWidth; T.style.transform = T.style.opacity = ""; requestAnimationFrame(reset) }, 210) };
  T.addEventListener("touchend", end); T.addEventListener("touchcancel", end);
}
