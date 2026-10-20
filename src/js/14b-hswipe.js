// Горизонтальный взмах внутри листа: месяцы календаря и статистики, вкладки «Все / Продукты / Блюда».
// Содержимое идёт за пальцем; срабатывает от короткого быстрого взмаха (скорость за последние 100 мс) или от сдвига
// на четверть ширины. Настройка «Длина свайпа» здесь не действует: в листе нет риска случайно перелистнуть день.
function hSwipe(zone, target, can, flip) {
  let x0 = null, y0 = 0, md = 0, dx = 0, P = [];
  zone.addEventListener("touchstart", e => { if (e.touches.length > 1 || !can(e)) { x0 = null; return } const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; md = 0; dx = 0; P = [[e.timeStamp, x0]] }, { passive: true });
  zone.addEventListener("touchmove", e => {
    if (x0 === null) return; const t = e.touches[0], ddx = t.clientX - x0, ddy = t.clientY - y0, el = target();
    if (!md) { if (Math.abs(ddx) > 8 && Math.abs(ddx) > Math.abs(ddy) * 1.1) { md = 1; el.getAnimations().forEach(a => a.cancel()) } else if (Math.abs(ddy) > 10) { x0 = null; return } else return }
    dx = ddx; P.push([e.timeStamp, t.clientX]); while (P.length > 2 && e.timeStamp - P[0][0] > 100) P.shift();
    // жест наш: браузер не начинает прокрутку (и не «съедает» следующее касание на её остановку)
    if (e.cancelable) e.preventDefault();
    el.style.transform = `translateX(${dx}px)`; el.style.opacity = 1 - Math.min(.5, Math.abs(dx) / ((el.offsetWidth || 400) * 1.2))
  }, { passive: false });
  const end = () => {
    if (x0 === null) return; x0 = null; if (!md) return; md = 0;
    const el = target(), w = el.offsetWidth || 360, a = P[0], b = P[P.length - 1], v = (b[1] - a[1]) / Math.max(16, b[0] - a[0]);
    const go = Math.abs(dx) > w * .25 || (Math.abs(v) > .25 && Math.abs(dx) > 24 && Math.sign(v) === Math.sign(dx));
    if (go && flip(dx < 0 ? 1 : -1, dx, el)) { vib("days"); return }
    const from = { transform: el.style.transform, opacity: el.style.opacity || 1 }; el.style.transform = el.style.opacity = "";
    if (moOk(el)) el.animate([from, { transform: "none", opacity: 1 }], { duration: MO.t2, easing: MO.E })
  };
  zone.addEventListener("touchend", end); zone.addEventListener("touchcancel", () => { dx = 0; end() });
  // касание оборвалось без touchend (приложение свернули посреди взмаха) — содержимое не остаётся сдвинутым и полупрозрачным
  const lost = () => { if (x0 !== null && md) { const el = target(); el.style.transform = el.style.opacity = "" } x0 = null; md = 0 };
  addEventListener("blur", lost); document.addEventListener("visibilitychange", lost)
}
// смена вкладки одним движением, без пустого кадра: копия видимых строк уходит в сторону и гаснет,
// новый список в то же время въезжает с другой стороны. from — где сейчас палец (0 — касание вкладки)
function hSlide(el, dir, from, change) {
  const op = parseFloat(el.style.opacity) || 1; el.style.transform = el.style.opacity = "";
  if (!moOk(el)) { change(); return }
  el.getAnimations().forEach(a => a.cancel()); document.querySelectorAll("#ov > .hsg").forEach(x => x.remove());
  const er = el.getBoundingClientRect(), sb = shBody().getBoundingClientRect(), w = er.width || 360, cs = getComputedStyle(el);
  const box = document.createElement("div"), g = document.createElement("div"); box.className = "svl hsg";
  Object.assign(box.style, { left: sb.left + "px", top: sb.top + "px", width: sb.width + "px", height: sb.height + "px", overflow: "hidden" });
  g.className = el.className; Object.assign(g.style, { position: "absolute", left: er.left - sb.left + "px", top: er.top - sb.top + "px", width: w + "px", color: cs.color, font: cs.font });
  [...el.children].forEach(c => { const r = c.getBoundingClientRect(); if (!r.height || r.bottom < sb.top || r.top > sb.bottom) return;
    const k = noIds(c.cloneNode(true)); Object.assign(k.style, { position: "absolute", left: r.left - er.left + "px", top: r.top - er.top + "px", width: r.width + "px", margin: 0 }); g.appendChild(k) });
  // копия вставляется после change(): иначе её раскладка считалась бы лишний раз внутри change (замеры высоты листа)
  box.appendChild(g); change(); $("ov").appendChild(box);
  const E = MO.E, s = w * .3;
  // старое гаснет за первые ~0,1 с (общие строки «Все» и «Блюда» не двоятся), новое въезжает следом
  g.animate([{ transform: `translateX(${from}px)`, opacity: op }, { opacity: 0, offset: .65 }, { transform: `translateX(${from - dir * s}px)`, opacity: 0 }], { duration: 130, easing: "cubic-bezier(.3,0,.6,1)", fill: "forwards" }).finished.catch(() => { }).then(() => box.remove());
  el.animate([{ transform: `translateX(${dir * s * .8}px)`, opacity: 0, offset: 0 }, { transform: `translateX(${dir * s * .8}px)`, opacity: 0, offset: 40 / 280, easing: E }, { transform: "none", opacity: 1 }], { duration: 280 })
}
hSwipe($("v6"), () => $("cg"), () => true, (dir, dx, el) => { calFlip(el, dir, dx); return 1 });
hSwipe($("v9"), () => $("stc"), e => !e.target.closest(".chw"), (dir, dx, el) => { hSlide(el, dir, dx, () => { stM[1] += dir; if (stM[1] < 0) { stM[1] = 11; stM[0]-- } if (stM[1] > 11) { stM[1] = 0; stM[0]++ } drawStats() }); return 1 });
// вкладки продуктов: взмах в любом месте листа, и по пустому месту под коротким списком
hSwipe(shBody(), () => $("ls"), e => !$("v1").hidden && !$("pf").hidden && !e.target.closest(".seg,#mc,.fs,.lr"), (dir, dx, el) => { const n = pFl + dir; if (n < 0 || n > 2) return 0; hSlide(el, dir, dx, () => { pFl = n; lst() }); return 1 });
