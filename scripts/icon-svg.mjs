// Исходник иконки приложения: миска, наполненная тремя слоями Б / Ж / У (зелёный, жёлтый, синий — как на экране).
// Миска — «еда», горка и слои — «состав»: читается как приложение для подсчёта БЖУ и остаётся узнаваемой даже в 48 px.
// Всё рисуется кодом: правьте цвета и пропорции здесь, `npm run icons` пересоберёт все размеры.
//   variant: 'dark' (по умолчанию) | 'light' | 'accent'
export const VARIANTS = {
  dark:   { bg: '#171B26', bg2: '#262C3D', bowl: '#F3F5F9', bands: ['#34C77F', '#F4B63E', '#4F8FF2'] },
  light:  { bg: '#E9EEF5', bg2: '#FFFFFF', bowl: '#1F2533', bands: ['#22A565', '#EDA21C', '#3A7FF0'] },
  accent: { bg: '#4B3FC6', bg2: '#6458E0', bowl: '#FFFFFF', bands: ['#34C77F', '#F4B63E', '#7FB2FF'] }
};

// Геометрия в квадрате 1024×1024 (безопасная зона адаптивной иконки — круг ≈ 626 px по центру).
// Миска — нижняя половина круга (центр CX, CY, радиус R) с кромкой толщиной RIM; под ней ножка.
const CX = 512, CY = 486, R = 286, RIM = 34, GAP = 18, DOME = 150;
const f = n => n.toFixed(1);
// горизонтальная полоса [y1, y2] внутри нижнего полукруга радиуса r
function band(r, y1, y2) {
  const x = y => Math.sqrt(Math.max(0, r * r - (y - CY) ** 2));
  const a = x(y1), b = x(y2);
  return `M${f(CX - a)} ${f(y1)}H${f(CX + a)}A${r} ${r} 0 0 1 ${f(CX + b)} ${f(y2)}H${f(CX - b)}A${r} ${r} 0 0 1 ${f(CX - a)} ${f(y1)}Z`;
}
// миска: полукруг, ножка — скруглённый прямоугольник
const bowlPath = () => `M${CX - R} ${CY}H${CX + R}A${R} ${R} 0 0 1 ${CX - R} ${CY}Z`;
const footPath = () => { const w = 210, h = 34, y = CY + R + 12, x = CX - w / 2, r = 15; return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z` };
// три слоя: Б — горка над кромкой миски, Ж и У — слои внутри миски (внутренний радиус — с кромкой)
function bandPaths() {
  const ri = R - RIM, w = ri - 8, top = CY + 26, bottom = CY + ri - 6, h = (bottom - top - GAP) / 2;
  const dome = `M${CX - w} ${CY - GAP}A${w} ${DOME} 0 0 1 ${CX + w} ${CY - GAP}Z`;
  return [dome, band(ri, top, top + h), band(ri, top + h + GAP, bottom)];
}

/** Слой переднего плана (прозрачный фон). mono — одноцветный силуэт (слои вырезаны из миски). */
export function foreground(variant = 'dark', { mono = false } = {}) {
  const V = VARIANTS[variant], b = bandPaths();
  if (mono) return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><path fill="#FFFFFF" d="${bowlPath()} ${footPath()}"/></svg>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">` +
    `<path fill="${V.bowl}" d="${bowlPath()}"/><path fill="${V.bowl}" d="${footPath()}"/>` +
    b.map((p, i) => `<path fill="${V.bands[i]}" d="${p}"/>`).join('') + `</svg>`;
}

/** Фон: мягкий вертикальный градиент. */
export function background(variant = 'dark') {
  const V = VARIANTS[variant];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${V.bg2}"/><stop offset="1" stop-color="${V.bg}"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#g)"/></svg>`;
}

/** Готовая квадратная иконка (фон + миска), рисунок уменьшен до k (для web/legacy/splash). */
export function full(variant = 'dark', k = 0.78) {
  const fg = foreground(variant).replace(/^<svg[^>]*>|<\/svg>$/g, ''), o = 512 * (1 - k);
  return background(variant).replace('</svg>', `<g transform="translate(${o} ${o}) scale(${k})">${fg}</g></svg>`);
}

/** Векторный монохромный слой для Android 13+ («тематические значки»): миска со слоями-прорезями, 108×108 dp. */
export function monoVector() {
  // слои — «прорези» в силуэте миски (evenOdd), чтобы одноцветный значок тоже показывал три слоя
  const d = [bowlPath(), ...bandPaths()].join(' ');
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- Монохромный слой иконки (Android 13+, «Тематические значки»): система сама красит его в цвета обоев и темы. Создаётся scripts/icons.mjs -->
<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="1024" android:viewportHeight="1024">
    <path android:fillColor="#FFFFFFFF" android:fillType="evenOdd" android:pathData="${d}" />
    <path android:fillColor="#FFFFFFFF" android:pathData="${footPath()}" />
</vector>
`;
}
