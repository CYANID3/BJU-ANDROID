// Имитация датчиков движения для тестов «Движение телефоном»: 60 Гц, телефон в руке экраном к себе (сила тяжести в основном по +z)
window.__sim = (kind, o = {}) => {
  const S = [], G0 = [0, 6.9, 6.9];
  const add = (ms, f) => { for (let t = 0; t < ms; t += 16) S.push(f(t / 1000)); };
  const A = (a, r = [0, 0, 0], g = G0) => ({ a, r, g });
  const still = ms => add(ms, () => A([0, 0, 0]));
  still(500);
  // дважды крутнуть: вращение вокруг длинной оси (γ) туда-обратно-туда-обратно
  if (kind === 'tw') { const r = o.r || 320, n = o.n || 4; for (let i = 0; i < n; i++) add(o.ms || 150, () => A([0.5, 0, 0.5], [20, i % 2 ? -r : r, 30])); }
  if (kind === 'tw1') add(220, () => A([0, 0, 0], [10, 320, 20]));
  // дважды рубануть: два коротких сильных толчка
  if (kind === 'ch') { const g = o.g || 22; for (let i = 0; i < (o.n || 2); i++) { add(70, () => A([0, -g, -g * .3])); add(o.gap || 300, () => A([0, 0, 0])); } }
  // тряска: 6 толчков подряд
  if (kind === 'shake') for (let i = 0; i < 6; i++) { add(60, () => A([0, i % 2 ? 20 : -20, 0])); add(60, () => A([0, 0, 0])); }
  // перевернуть: экран к себе → экраном вниз → обратно (сила тяжести плавно поворачивается)
  if (kind === 'fl' || kind === 'flslow' || kind === 'fldown') {
    const turn = (from, to, ms) => add(ms, t => { const u = Math.min(1, t * 1000 / ms), ang = from + (to - from) * u; return A([0, 0, 0], [180, 0, 0], [0, 9.81 * Math.sin(ang), 9.81 * Math.cos(ang)]); });
    const hold = (ang, ms) => add(ms, () => A([0, 0, 0], [0, 0, 0], [0, 9.81 * Math.sin(ang), 9.81 * Math.cos(ang)]));
    turn(Math.PI / 4, Math.PI, 400); hold(Math.PI, kind === 'flslow' ? 3500 : 300); if (kind !== 'fldown') turn(Math.PI, Math.PI / 4, 400); else hold(Math.PI, 4000);
  }
  // ходьба: покачивание и толчки по всем осям, лёгкое вращение
  if (kind === 'walk') add(4000, t => A([1.5 * Math.sin(2 * Math.PI * 1.7 * t), 5 * Math.sin(2 * Math.PI * 2 * t), 2.5 * Math.sin(2 * Math.PI * t)], [40 * Math.sin(2 * Math.PI * 1.1 * t), 60 * Math.sin(2 * Math.PI * .9 * t), 30 * Math.sin(2 * Math.PI * t)]));
  still(2300);
  window.__T = (window.__T || 1e7) + 1000; let T = window.__T;
  for (const s of S) { T += 16; skMotion({ timeStamp: T, acceleration: { x: s.a[0], y: s.a[1], z: s.a[2] }, accelerationIncludingGravity: { x: s.a[0] + s.g[0], y: s.a[1] + s.g[1], z: s.a[2] + s.g[2] }, rotationRate: { beta: s.r[0], gamma: s.r[1], alpha: s.r[2] } }); }
  window.__T = T;
};
