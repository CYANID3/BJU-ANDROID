// Имитация датчиков движения для тестов «Движение телефоном»: 60 Гц, телефон вертикально (сила тяжести по +y)
window.__sim = (kind, o = {}) => { const S = []; const add = (ms, f) => { for (let t = 0; t < ms; t += 16) S.push(f(t / 1000)); };
  const A = (x, y, z, r = 0) => ({ a: [x, y, z], r });
  if (kind === 'ud') { const g = o.g || 18, n = o.n || 4, f = 4; add(n / (2 * f) * 1000, t => A(0, g * Math.sin(2 * Math.PI * f * t + .3), 0)); }
  if (kind === 'dn') { const g = o.g || 14; add(90, () => A(0, -g, 0)); add(110, () => A(0, g * .8, 0)); }
  if (kind === 'rot') { const r = o.r || 350, d = o.deg || 75; add(d / r * 1000, () => A(0, 0, 0, r)); }
  if (kind === 'wig') { const r = o.r || 320, n = o.n || 4; for (let i = 0; i < n; i++) add(200, () => A(0, 0, 0, i % 2 ? -r : r)); }
  if (kind === 'rotback') { add(75 / 350 * 1000, () => A(0, 0, 0, 350)); add(80, () => A(0, 0, 0)); add(600, () => A(0, 0, 0, -120)); }
  if (kind === 'dnflat') { const g = o.g || 14; add(90, () => A(0, 0, -g)); add(110, () => A(0, 0, g * .8)); }
  if (kind === 'walk') add(3000, t => A(1.5 * Math.sin(2 * Math.PI * 1.7 * t), 4 * Math.sin(2 * Math.PI * 2 * t), 2 * Math.sin(2 * Math.PI * 1 * t), 40 * Math.sin(2 * Math.PI * 1 * t)));
  add(700, () => A(0, 0, 0)); add(1600, () => A(0, 0, 0));
  window.__T = (window.__T || 1e7) + 1000; let T = window.__T;
  const G = kind === 'dnflat' ? [0, 0, 9.81] : [0, 9.81, 0];
  for (const s of S) { T += 16; skMotion({ timeStamp: T, acceleration: { x: s.a[0], y: s.a[1], z: s.a[2] }, accelerationIncludingGravity: { x: s.a[0] + G[0], y: s.a[1] + G[1], z: s.a[2] + G[2] }, rotationRate: { alpha: s.r, beta: 0, gamma: 0 } }); }
  window.__T = T; };
