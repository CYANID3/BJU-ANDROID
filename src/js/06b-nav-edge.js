// Линия под шапкой с датой — только когда записи прокручены под неё. Класс меняется лишь при пересечении порога,
// поэтому при прокрутке нет лишних перерисовок
(() => { let on = -1; const f = () => { const v = scrollY > 4 ? 1 : 0; if (v !== on) { on = v; const n = document.querySelector("header.nav"); if (n) n.classList.toggle("sc", !!v) } };
  addEventListener("scroll", f, { passive: true }); addEventListener("DOMContentLoaded", f); f() })();
