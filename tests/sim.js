// Имитация датчиков движения для тестов «Движение телефоном»: 60 Гц, телефон в руке под 45° экраном к себе (G0)
//  tl2 — дважды наклонить и вернуть (deg — угол, pause — пауза между наклонами); tl — один раз; tlslow — второй наклон держат 2,6 с;
//  tlstay — наклонили и оставили; tlsmall — небольшие наклоны (22°); tw — покрутить кистью; ch — два толчка; shake — тряска; walk — ходьба
window.__sim = (kind, o = {}) => {
  const S = [], b = Math.PI / 4, G = th => [0, 9.81 * Math.sin(th), 9.81 * Math.cos(th)], G0 = G(b);
  const add = (ms, f) => { for (let t = 0; t < ms; t += 16) S.push(f(t / 1000)); };
  const A = (a, r = [0, 0, 0], g = G0) => ({ a, r, g });
  const still = ms => add(ms, () => A([0, 0, 0]));
  const turn = (f, to, ms) => add(ms, t => A([0, 0, 0], [(to < f ? -1 : 1) * 200, 0, 0], G(f + (to - f) * Math.min(1, t * 1000 / ms))));
  const tilt = (deg, hold) => { const e = b - deg * Math.PI / 180; turn(b, e, 280); add(hold, () => A([0, 0, 0], [0, 0, 0], G(e))); turn(e, b, 280); };
  still(500);
  const deg = o.deg ?? (kind === 'tlsmall' ? 22 : 70);
  if (kind === 'tl2' || kind === 'tlsmall') { tilt(deg, 120); still(o.pause ?? 200); tilt(deg, 120); }
  if (kind === 'tl') tilt(deg, 120);
  if (kind === 'tlslow') { tilt(deg, 120); still(200); tilt(deg, 2600); }
  if (kind === 'tlstay') { const e = b - deg * Math.PI / 180; turn(b, e, 280); add(4000, () => A([0, 0, 0], [0, 0, 0], G(e))); }
  if (kind === 'tw') for (let i = 0; i < 4; i++) add(150, () => A([0.5, 0, 0.5], [20, i % 2 ? -320 : 320, 30]));
  if (kind === 'ch') for (let i = 0; i < 2; i++) { add(70, () => A([0, -22, -7])); still(300); }
  if (kind === 'shake') for (let i = 0; i < 6; i++) { add(60, () => A([0, i % 2 ? 20 : -20, 0])); still(60); }
  if (kind === 'walk') add(4000, t => A([1.5 * Math.sin(2 * Math.PI * 1.7 * t), 5 * Math.sin(2 * Math.PI * 2 * t), 2.5 * Math.sin(2 * Math.PI * t)], [40 * Math.sin(2 * Math.PI * 1.1 * t), 60 * Math.sin(2 * Math.PI * .9 * t), 30 * Math.sin(2 * Math.PI * t)], G(b + .25 * Math.sin(2 * Math.PI * 2 * t))));
  still(o.after ?? 600);
  window.__T = (window.__T || 1e7) + 1000; let T = window.__T;
  for (const s of S) { T += 16; skMotion({ timeStamp: T, acceleration: { x: s.a[0], y: s.a[1], z: s.a[2] }, accelerationIncludingGravity: { x: s.a[0] + s.g[0], y: s.a[1] + s.g[1], z: s.a[2] + s.g[2] }, rotationRate: { beta: s.r[0], gamma: s.r[1], alpha: s.r[2] } }); }
  window.__T = T;
};
