// Исходник иконки приложения: вилка, у которой три зубца — Б, Ж и У (зелёный, жёлтый, синий — цвета нутриентов на экранах).
// Вилка — «еда», три цветных зубца — «белки, жиры, углеводы»: один простой силуэт без мелких деталей, узнаётся и в 32 px.
// Зубцы — те же капсулы, что полоски Б / Ж / У в приложении.
// Всё рисуется кодом: правьте цвета и пропорции здесь, `npm run icons` пересоберёт все размеры.
//   variant: 'accent' (индиго — акцент приложения, выбран в package.json) | 'dark' (графит) | 'light' (белый)
export const VARIANTS = {
  accent: { bg: '#4034BC', bg2: '#5F53DF', fork: '#FFFFFF', tines: ['#3DD68C', '#FFC24D', '#7DB0FF'] },
  dark:   { bg: '#171A27', bg2: '#2B2F45', fork: '#FFFFFF', tines: ['#3DD68C', '#FFC24D', '#7DB0FF'] },
  light:  { bg: '#EEF1F6', bg2: '#FFFFFF', fork: '#1F2433', tines: ['#22A565', '#EDA21C', '#3A7FF0'] }
};

// Геометрия в квадрате 1024×1024. Весь квадрат — видимая часть значка: лаунчер обрезает его своей маской (круг, «капля»,
// скруглённый квадрат). Вилка — около 58 % высоты: крупно, но с запасом до края круга. В векторных слоях Android
// (fgVector, monoVector) квадрат ставится в видимую середину слоя 108 dp.
const C = 512, K = 0.96, CY = 520;
const TW = 58, GAP = 38, TOP = 210, TB = 468, HEAD_B = 606, NECK = 52, H_END = 80, HB = 830;
const f = n => (Math.round(n * 10) / 10).toString();
// точка исходного рисунка → в квадрат иконки (уменьшение относительно центра)
const X = x => f(C + (x - C) * K), Y = y => f(C + (y - CY) * K), S = v => f(v * K);

/** Три зубца-капсулы (снизу заходят в голову вилки, чтобы между ними и головой не было щели). */
function tinePaths() {
  const r = TW / 2;
  return [-1, 0, 1].map(i => {
    const x = C + i * (TW + GAP);
    return `M${X(x - r)} ${Y(TB + 30)}V${Y(TOP + r)}A${S(r)} ${S(r)} 0 0 1 ${X(x + r)} ${Y(TOP + r)}V${Y(TB + 30)}Z`;
  });
}
/** Голова (чаша, плавно сходящаяся в шейку) и ручка, расширяющаяся к скруглённому концу. */
function headPath() {
  const L = C - (TW + GAP) - TW / 2, R = C + (TW + GAP) + TW / 2, n = NECK / 2, e = H_END / 2;
  return `M${X(L)} ${Y(TB)}H${X(R)}V${Y(TB + 24)}C${X(R)} ${Y(HEAD_B - 20)} ${X(C + n)} ${Y(HEAD_B - 10)} ${X(C + n)} ${Y(HEAD_B + 60)}` +
    `L${X(C + e)} ${Y(HB - e)}A${S(e)} ${S(e)} 0 0 1 ${X(C - e)} ${Y(HB - e)}L${X(C - n)} ${Y(HEAD_B + 60)}` +
    `C${X(C - n)} ${Y(HEAD_B - 10)} ${X(L)} ${Y(HEAD_B - 20)} ${X(L)} ${Y(TB + 24)}Z`;
}
/** Квадрат вокруг вилки (для заставки): x, y, сторона — в координатах иконки. */
export const BOUNDS = (() => { const top = +Y(TOP), bottom = +Y(HB), side = Math.ceil((bottom - top) * 1.08), y = Math.round((top + bottom) / 2 - side / 2); return { x: Math.round(C - side / 2), y, side } })();

/** Слой переднего плана (прозрачный фон). mono — одноцветный силуэт вилки. */
export function foreground(variant = 'accent', { mono = false } = {}) {
  const V = VARIANTS[variant], t = tinePaths();
  const open = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">`;
  if (mono) return open + `<path fill="#FFFFFF" d="${headPath()} ${t.join(' ')}"/></svg>`;
  return open + `<path fill="${V.fork}" d="${headPath()}"/>` + t.map((p, i) => `<path fill="${V.tines[i]}" d="${p}"/>`).join('') + `</svg>`;
}

/** Фон: мягкий вертикальный градиент (сверху светлее). */
export function background(variant = 'accent') {
  const V = VARIANTS[variant];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${V.bg2}"/><stop offset="1" stop-color="${V.bg}"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#g)"/></svg>`;
}

/** Готовая квадратная иконка (фон + вилка), рисунок уменьшен до k (для web/legacy). */
export function full(variant = 'accent', k = 1) {
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
${paths.map(([c, d]) => `        <path android:fillColor="${c}" android:pathData="${d}" />`).join('\n')}
    </group>
</vector>
`;
}
const argb = c => '#FF' + c.slice(1).toUpperCase();

/** Передний план адаптивной иконки (Android 8+): вилка цветом варианта. */
export function fgVector(variant = 'accent') {
  const V = VARIANTS[variant];
  return layerVector('Передний план иконки приложения (вилка с зубцами Б / Ж / У)', [[argb(V.fork), headPath()], ...tinePaths().map((d, i) => [argb(V.tines[i]), d])]);
}
/** Фон адаптивной иконки: вертикальный градиент (сверху светлее), как background(). */
export function bgShape(variant = 'accent') {
  const V = VARIANTS[variant];
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- Фон иконки приложения. Создаётся scripts/icons.mjs из scripts/icon-svg.mjs -->
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <gradient android:angle="270" android:startColor="${argb(V.bg2)}" android:endColor="${argb(V.bg)}" />
</shape>
`;
}
/** Монохромный слой для Android 13+ («тематические значки»): тот же силуэт вилки; система сама красит его в цвета обоев и темы. */
export function monoVector() {
  return layerVector('Монохромный слой иконки (Android 13+, «Тематические значки»)', [['#FFFFFFFF', headPath()], ...tinePaths().map(d => ['#FFFFFFFF', d])]);
}
