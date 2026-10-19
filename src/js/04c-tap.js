// Нажатие на закреплённые панели не должно теряться.
// Если страница (или список в листе) ещё катится по инерции после прокрутки, Android тратит первое касание на остановку
// прокрутки и не посылает «click» — даже когда палец лёг на нижнюю панель, шапку или низ листа, которые сами не прокручиваются.
// Здесь касание, которое явно было нажатием (короткое, без сдвига, на кнопке закреплённой панели), но не дало «click»,
// нажимает эту кнопку само. Обычные нажатия этот код не трогает: «click» приходит сразу, и подстраховка отменяется.
// Файл подключается раньше остальных: слушатели видят и те «click», которые потом намеренно гасятся (жест от панели).
(() => {
  const FIXED = ".bt button, header.nav button, header.nav [role=button], #ov .hd button, #ov .shf button";
  let s = null, got = 0, tm = 0, synth = 0, late = 0;
  addEventListener("touchstart", e => {
    clearTimeout(tm); late = 0; const t = e.touches[0], b = e.touches.length === 1 && e.target.closest && e.target.closest(FIXED);
    s = b ? { b, el: e.target, x: t.clientX, y: t.clientY, at: e.timeStamp } : null
  }, { capture: true, passive: true });
  addEventListener("click", e => {
    got = 1;
    // браузер всё-таки прислал свой «click» того же касания после подстраховки — второй раз не нажимаем
    if (!synth && Date.now() < late && e.target.closest && e.target.closest(FIXED)) { e.stopPropagation(); e.preventDefault(); late = 0 }
  }, true);
  addEventListener("touchcancel", () => { s = null }, true);
  addEventListener("touchend", e => {
    const q = s; s = null; if (!q || e.touches.length) return; const t = e.changedTouches[0];
    if (e.timeStamp - q.at > 500 || Math.hypot(t.clientX - q.x, t.clientY - q.y) > 10) return;
    got = 0;
    tm = setTimeout(() => {
      if (got || !q.b.isConnected || q.b.disabled || q.b.closest("[hidden],[inert]")) return;
      const r = q.b.getBoundingClientRect(); if (t.clientX < r.left - 4 || t.clientX > r.right + 4 || t.clientY < r.top - 4 || t.clientY > r.bottom + 4) return;
      // клик — по тому элементу, на который лёг палец (обработчики смотрят на event.target: «К сегодня» в шапке)
      const el = q.el.isConnected && q.b.contains(q.el) ? q.el : q.b;
      synth = 1; try { el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window, clientX: t.clientX, clientY: t.clientY, detail: 1 })) } finally { synth = 0 } late = Date.now() + 600
    }, 90)
  }, true)
})();
