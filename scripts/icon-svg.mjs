// Исходник иконки приложения: три дуги Б / Ж / У одним кольцом (как кольцо на карточке дня).
// Всё рисуется кодом — правьте цвета/толщину здесь, `npm run icons` пересоберёт все размеры.
//   variant: 'dark' (по умолчанию) | 'light' | 'accent'
export const VARIANTS = {
  dark:   { bg: '#0F1724', bg2: '#16233A', arcs: ['#2FBF7A', '#F4B740', '#4C8DF0'] },
  light:  { bg: '#F4F7F5', bg2: '#FFFFFF', arcs: ['#22A565', '#EDA21C', '#3A7FF0'] },
  accent: { bg: '#1C9E5F', bg2: '#25B56E', arcs: ['#FFFFFF', 'rgba(255,255,255,.72)', 'rgba(255,255,255,.46)'] }
};

// Дуги кольца: центр (512,512), радиус r, толщина w; ровные зазоры gap° между дугами.
function arcs(r, w, gapDeg) {
  const cap = 0, span = 120 - gapDeg - 2 * cap, pt = a => {
    const t = (a - 90) * Math.PI / 180; return [512 + r * Math.cos(t), 512 + r * Math.sin(t)].map(v => v.toFixed(2)).join(' ');
  };
  // зазоры симметрично: один снизу, два вверху слева и справа (верхняя дуга — Б, справа — Ж, слева — У)
  return [0, 1, 2].map(i => { const a0 = -60 + i * 120 + gapDeg / 2 + cap, a1 = a0 + span; return `M ${pt(a0)} A ${r} ${r} 0 0 1 ${pt(a1)}`; });
}

/** Слой переднего плана (прозрачный фон). scale — доля размера, которую занимает кольцо. */
export function foreground(variant = 'dark', { mono = false } = {}) {
  const V = VARIANTS[variant], r = 168, w = 66, d = arcs(r, w, 5);
  const col = i => (mono ? '#FFFFFF' : V.arcs[i]);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">` +
    d.map((p, i) => `<path d="${p}" fill="none" stroke="${col(i)}" stroke-width="${w}"/>`).join('') +
    `<circle cx="512" cy="512" r="30" fill="${mono ? '#FFFFFF' : variant === 'accent' ? '#FFFFFF' : variant === 'light' ? '#1B2433' : '#E9EEF5'}"/></svg>`;
}

/** Фон: мягкий вертикальный градиент. */
export function background(variant = 'dark') {
  const V = VARIANTS[variant];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${V.bg2}"/><stop offset="1" stop-color="${V.bg}"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#g)"/></svg>`;
}

/** Готовая квадратная иконка (фон + кольцо), кольцо уменьшено до k (для web/legacy/splash). */
export function full(variant = 'dark', k = 0.78) {
  const fg = foreground(variant).replace(/^<svg[^>]*>|<\/svg>$/g, ''), o = 512 * (1 - k);
  return background(variant).replace('</svg>', `<g transform="translate(${o} ${o}) scale(${k})">${fg}</g></svg>`);
}

/** Векторный монохромный слой для Android 13+ («тематические значки»): то же кольцо, 108×108 dp. */
export function monoVector() {
  const s = 108 / 1024, r = 168 * s, w = 66 * s, c = 54;
  const cap = 0, gap = 5, span = 120 - gap - 2 * cap;
  const pt = a => { const t = (a - 90) * Math.PI / 180; return `${(c + r * Math.cos(t)).toFixed(2)},${(c + r * Math.sin(t)).toFixed(2)}`; };
  const paths = [0, 1, 2].map(i => { const a0 = -60 + i * 120 + gap / 2 + cap, a1 = a0 + span;
    return `    <path android:strokeColor="#FFFFFFFF" android:strokeWidth="${w.toFixed(2)}" android:fillColor="#00000000" android:pathData="M${pt(a0)} A${r.toFixed(2)},${r.toFixed(2)} 0 0,1 ${pt(a1)}" />`; });
  const dot = (30 * s).toFixed(2);
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- Монохромный слой иконки (Android 13+, «Тематические значки»): система сама красит его в цвета обоев и темы. Создаётся scripts/icons.mjs -->
<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108">
${paths.join('\n')}
    <path android:fillColor="#FFFFFFFF" android:pathData="M${c},${c}m-${dot},0a${dot},${dot} 0 1,0 ${2 * dot},0a${dot},${dot} 0 1,0 -${2 * dot},0" />
</vector>
`;
}
