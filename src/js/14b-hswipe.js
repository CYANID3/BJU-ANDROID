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
  zone.addEventListener("touchend", end); zone.addEventListener("touchcancel", () => { dx = 0; end() })
}
// перелистывание: текущее уходит в сторону взмаха, change() меняет содержимое, новое въезжает с другой стороны
function hFlip(el, dir, from, change) {
  const w = el.offsetWidth || 360, op = parseFloat(el.style.opacity) || 1; el.style.transform = el.style.opacity = "";
  if (!moOk(el)) { change(); return }
  el.getAnimations().forEach(a => a.cancel());
  const out = el.animate([{ transform: `translateX(${from}px)`, opacity: op }, { transform: `translateX(${-dir * w * .4}px)`, opacity: 0 }], { duration: Math.max(80, 140 * (1 - Math.abs(from) / w)), easing: MO.EI, fill: "forwards" });
  out.onfinish = () => { change(); out.cancel(); el.animate([{ transform: `translateX(${dir * w * .4}px)`, opacity: 0 }, { transform: "none", opacity: 1 }], { duration: MO.t3, easing: MO.E }) }
}
hSwipe($("v6"), () => $("cg"), () => true, (dir, dx, el) => { calFlip(el, dir, dx, parseFloat(el.style.opacity) || 1); return 1 });
hSwipe($("v9"), () => $("stc"), e => !e.target.closest(".chw"), (dir, dx, el) => { hFlip(el, dir, dx, () => { stM[1] += dir; if (stM[1] < 0) { stM[1] = 11; stM[0]-- } if (stM[1] > 11) { stM[1] = 0; stM[0]++ } drawStats() }); return 1 });
// вкладки продуктов: взмах в любом месте листа, и по пустому месту под коротким списком
hSwipe(shBody(), () => $("ls"), e => !$("v1").hidden && !$("pf").hidden && !e.target.closest(".seg,#mc,.fs,.lr"), (dir, dx, el) => { const n = pFl + dir; if (n < 0 || n > 2) return 0; hFlip(el, dir, dx, () => { pFl = n; lst() }); return 1 });
