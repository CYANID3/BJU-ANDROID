// Исходник иконки приложения: три кольца-шкалы — белки, жиры, углеводы (зелёный, жёлтый, синий — цвета нутриентов на экранах).
// Иконка про подсчёт: каждое кольцо — шкала «съедено из нормы», как кольца прогресса в приложениях здоровья и фитнеса.
// Всё рисуется кодом: правьте цвета и пропорции здесь, `npm run icons` пересоберёт все размеры.
//   variant: 'dark' (графит, выбран в package.json) | 'accent' (индиго — акцент приложения) | 'light' (белый)
export const VARIANTS = {
  dark:   { bg: '#0F121B', bg2: '#313A57', rings: ['#3DD68C', '#FFC24D', '#6AA6FF'], track: 0.2 },
  accent: { bg: '#221A78', bg2: '#4C41D6', rings: ['#3DD68C', '#FFC24D', '#8CBBFF'], track: 0.24 },
  light:  { bg: '#E9EDF4', bg2: '#FFFFFF', rings: ['#1FA463', '#E9A11B', '#3A7FF0'], track: 0.16 }
};

// Геометрия в квадрате 1024×1024. Весь квадрат — видимая часть значка: лаунчер обрезает его своей маской (круг, «капля»,
// скруглённый квадрат). Внешнее кольцо с толщиной доходит до радиуса 350 — с запасом до края круга (512).
// В векторных слоях Android (fgVector, monoVector) квадрат ставится в видимую середину слоя 108 dp.
const C = 512, SW = 76;
// радиус и заполнение каждого кольца (Б — внешнее, Ж — среднее, У — внутреннее); шкала начинается сверху, по часовой
export const RINGS = [{ r: 312, p: 0.78 }, { r: 220, p: 0.62 }, { r: 128, p: 0.86 }];
const f = n => (Math.round(n * 10) / 10).toString();
const pt = (deg, r) => [C + r * Math.cos(deg * Math.PI / 180), C + r * Math.sin(deg * Math.PI / 180)];

/** Полная окружность (дорожка шкалы) — две полуокружности. */
function circlePath(r) { return `M${C} ${f(C - r)}A${r} ${r} 0 1 1 ${C} ${f(C + r)}A${r} ${r} 0 1 1 ${C} ${f(C - r)}`; }
/** Дуга шкалы от верха по часовой на долю p. */
function arcPath(r, p) { const [x, y] = pt(-90 + 360 * p, r); return `M${C} ${f(C - r)}A${r} ${r} 0 ${p > 0.5 ? 1 : 0} 1 ${f(x)} ${f(y)}`; }

/** Квадрат вокруг колец (для заставки): x, y, сторона — в координатах иконки. */
export const BOUNDS = (() => { const side = Math.ceil((RINGS[0].r + SW / 2) * 2 * 1.04); return { x: Math.round(C - side / 2), y: Math.round(C - side / 2), side } })();

const stroke = (d, color, op = 1) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${SW}" stroke-linecap="round"${op < 1 ? ` stroke-opacity="${op}"` : ''}/>`;

/** Слой переднего плана (прозрачный фон). mono — одноцветный силуэт (только шкалы). */
export function foreground(variant = 'dark', { mono = false } = {}) {
  const V = VARIANTS[variant], open = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">`;
  if (mono) return open + RINGS.map(R => stroke(arcPath(R.r, R.p), '#FFFFFF')).join('') + `</svg>`;
  return open + RINGS.map((R, i) => stroke(circlePath(R.r), V.rings[i], V.track) + stroke(arcPath(R.r, R.p), V.rings[i])).join('') + `</svg>`;
}

/** Фон: мягкий вертикальный градиент (сверху светлее). */
export function background(variant = 'dark') {
  const V = VARIANTS[variant];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${V.bg2}"/><stop offset="1" stop-color="${V.bg}"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#g)"/></svg>`;
}

/** Готовая квадратная иконка (фон + кольца), рисунок уменьшен до k (для web/legacy). */
export function full(variant = 'dark', k = 1) {
  const fg = foreground(variant).replace(/^<svg[^>]*>|<\/svg>$/g, ''), o = 512 * (1 - k);
  return background(variant).replace('</svg>', `<g transform="translate(${o} ${o}) scale(${k})">${fg}</g></svg>`);
}

// Векторные слои адаптивной иконки Android (вместо картинок): чёткие на любой плотности экрана.
// Слой — 108 dp, лаунчер показывает середину 72 dp, поэтому рисунок квадрата 1024 уменьшен до 2/3 вокруг центра.
function layerVector(comment, paths) {
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- ${comment}. Создаётся scripts/icons.mjs из scripts/icon-svg.mjs -->
<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="1024" android:viewportHeight="1024">
    <group android:pivotX="512" android:pivotY="512" android:scaleX="0.6667" android:scaleY="0.6667">
${paths.map(([c, d, a]) => `        <path android:strokeColor="${c}" android:strokeWidth="${SW}" android:strokeLineCap="round"${a != null && a < 1 ? ` android:strokeAlpha="${a}"` : ''} android:pathData="${d}" />`).join('\n')}
    </group>
</vector>
`;
}
const argb = c => '#FF' + c.slice(1).toUpperCase();

/** Передний план адаптивной иконки (Android 8+): дорожки и шкалы трёх колец. */
export function fgVector(variant = 'dark') {
  const V = VARIANTS[variant];
  return layerVector('Передний план иконки приложения (кольца-шкалы Б / Ж / У)',
    RINGS.flatMap((R, i) => [[argb(V.rings[i]), circlePath(R.r), V.track], [argb(V.rings[i]), arcPath(R.r, R.p)]]));
}
/** Фон адаптивной иконки: вертикальный градиент (сверху светлее), как background(). */
export function bgShape(variant = 'dark') {
  const V = VARIANTS[variant];
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- Фон иконки приложения. Создаётся scripts/icons.mjs из scripts/icon-svg.mjs -->
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <gradient android:angle="270" android:startColor="${argb(V.bg2)}" android:endColor="${argb(V.bg)}" />
</shape>
`;
}
/** Монохромный слой для Android 13+ («тематические значки»): три шкалы без дорожек; система сама красит его в цвета обоев и темы. */
export function monoVector() {
  return layerVector('Монохромный слой иконки (Android 13+, «Тематические значки»)', RINGS.map(R => ['#FFFFFFFF', arcPath(R.r, R.p)]));
}
