// Имитация датчиков движения для тестов «Движение телефоном»: 60 Гц, телефон в руке экраном к себе (сила тяжести в основном по +z)
window.__sim = (kind, o = {}) => {
  const S = [], G0 = [0, 6.9, 6.9];
  const add = (ms, f) => { for (let t = 0; t < ms; t += 16) S.push(f(t / 1000)); };
  const A = (a, r = [0, 0, 0], g = G0) => ({ a, r, g });
  const still = ms => add(ms, () => A([0, 0, 0]));
  still(500);
  // дважды крутнуть: вращение вокруг длинной оси (γ) туда-обратно-туда-обратно
  if (kind === 'tw') { const r = o.r || 320, n = o.n || 4, ax = o.ax ?? 1; for (let i = 0; i < n; i++) add(o.ms || 150, () => { const R = [20, 30, 25], d = i % 2 ? -1 : 1; if (ax === 'd') { R[0] = d * r * .7; R[1] = d * r * .7; } else R[ax] = d * r; return A([0.5, 0, 0.5], R); }); }
  if (kind === 'tw1') add(220, () => A([0, 0, 0], [10, 320, 20]));
  // дважды рубануть: два коротких сильных толчка
  if (kind === 'ch') { const g = o.g || 22; for (let i = 0; i < (o.n || 2); i++) { add(70, () => A([0, -g, -g * .3])); add(o.gap || 300, () => A([0, 0, 0])); } }
  // рубануть по-настоящему: каждый взмах — рывок и удар при остановке (два пика в разные стороны)
  if (kind === 'ch2') { const g = o.g || 24; for (let i = 0; i < 2; i++) { add(80, () => A([0, -g, -g * .3], [0, 0, 300])); add(40, () => A([0, 0, 0])); add(70, () => A([0, g * .9, g * .2], [0, 0, -200])); add(o.gap || 320, () => A([0, 0, 0])); } }
  // рубануть кистью через угол: резкий поворот вокруг диагонали и возврат, дважды (почти без толчка)
  if (kind === 'chr') { const r = o.r || 560; for (let i = 0; i < 2; i++) { add(120, () => A([1, 1, 0], [r, -r, 60])); add(110, () => A([0, 0, 0], [-r * .7, r * .7, -40])); add(o.gap || 260, () => A([0, 0, 0])); } }
  // тряска: 6 толчков подряд
  if (kind === 'shake') for (let i = 0; i < 6; i++) { add(60, () => A([0, i % 2 ? 20 : -20, 0])); add(60, () => A([0, 0, 0])); }
  // наклонить: телефон держат под 45° (G0), наклоняют на deg° и возвращают; tlslow — держат наклонённым 2,6 с; tlstay — оставили наклонённым
  if (kind.startsWith('tl')) {
    const G = th => [0, 9.81 * Math.sin(th), 9.81 * Math.cos(th)], b = Math.PI / 4, e = b - (o.deg ?? (kind === 'tlsmall' ? 22 : 70)) * Math.PI / 180;
    const turn = (f, to, ms) => add(ms, t => A([0, 0, 0], [(to < f ? -1 : 1) * 200, 0, 0], G(f + (to - f) * Math.min(1, t * 1000 / ms))));
    turn(b, e, 300); add(kind === 'tlslow' ? 2600 : kind === 'tlstay' ? 4000 : 150, () => A([0, 0, 0], [0, 0, 0], G(e))); if (kind !== 'tlstay') turn(e, b, 300);
  }
  // ходьба: покачивание и толчки по всем осям, лёгкое вращение
  if (kind === 'walk') add(4000, t => A([1.5 * Math.sin(2 * Math.PI * 1.7 * t), 5 * Math.sin(2 * Math.PI * 2 * t), 2.5 * Math.sin(2 * Math.PI * t)], [40 * Math.sin(2 * Math.PI * 1.1 * t), 60 * Math.sin(2 * Math.PI * .9 * t), 30 * Math.sin(2 * Math.PI * t)]));
  still(2300);
  window.__T = (window.__T || 1e7) + 1000; let T = window.__T;
  for (const s of S) { T += 16; skMotion({ timeStamp: T, acceleration: { x: s.a[0], y: s.a[1], z: s.a[2] }, accelerationIncludingGravity: { x: s.a[0] + s.g[0], y: s.a[1] + s.g[1], z: s.a[2] + s.g[2] }, rotationRate: { beta: s.r[0], gamma: s.r[1], alpha: s.r[2] } }); }
  window.__T = T;
};
