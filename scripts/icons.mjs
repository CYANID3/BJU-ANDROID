// Генерирует все иконки приложения из исходника scripts/icon-svg.mjs (вилка с зубцами Б / Ж / У).
// Запуск: npm run icons   (выполняется автоматически в GitHub Actions)
// Вариант оформления: "icon" в package.json → accent | dark | light; можно задать ICON_VARIANT.
//  - public/icon-*.png, favicon.png        — иконки PWA / favicon / apple-touch-icon / подвал карточки дня
//  - assets/*.png                          — исходники для @capacitor/assets (иконка и splash Android)
//  - native/android/res/drawable/bju_ic_fg.xml, bju_ic_bg.xml, bju_ic_mono.xml — слои адаптивной иконки Android 8+
//    (передний план, фон, монохромный слой для «тематических значков» Android 13+)
import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { foreground, background, full, monoVector, fgVector, bgShape, VARIANTS, BOUNDS } from './icon-svg.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const variant = process.env.ICON_VARIANT || pkg.icon || 'accent';
if (!VARIANTS[variant]) throw new Error(`неизвестный вариант иконки «${variant}» (можно: ${Object.keys(VARIANTS).join(', ')})`);
const pub = path.join(root, 'public'), assets = path.join(root, 'assets');
await mkdir(pub, { recursive: true });
await mkdir(assets, { recursive: true });

const png = (svg, size, file) => sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png({ compressionLevel: 9 }).toFile(file);

// Web / PWA: квадрат с фоном (скругляет система / браузер); вилка внутри безопасной зоны maskable-иконки (круг 80 %)
for (const s of [180, 192, 512]) await png(full(variant, 1), s, path.join(pub, `icon-${s}.png`));
await png(full(variant, 1.15), 48, path.join(pub, 'favicon.png'));

// Android: картинки для @capacitor/assets — значки Android 6–7 (ic_launcher.png, ic_launcher_round.png); на Android 8+
// используются векторные слои ниже
await png(foreground(variant), 1024, path.join(assets, 'icon-foreground.png'));
await png(background(variant), 1024, path.join(assets, 'icon-background.png'));
// значок Android 6–7 (там нет масок лаунчера): скруглённый квадрат с прозрачными углами
await png(full(variant, 1).replace('<rect width="1024" height="1024" fill="url(#g)"/>', '<rect width="1024" height="1024" rx="224" fill="url(#g)"/>'), 1024, path.join(assets, 'icon-only.png'));
// Splash: рисунок поменьше по центру
for (const f of ['splash.png', 'splash-dark.png']) await png(full(variant, 0.36), 2732, path.join(assets, f));

// Заставка при запуске: сам рисунок (без фона, обрезано по краям) — Android ставит его по центру фиксированного размера,
// поэтому на любых экранах и версиях оно не растягивается (раньше растягивалась картинка splash.png на весь экран)
// квадрат вокруг вилки (BOUNDS из icon-svg.mjs)
const B = BOUNDS, ring = foreground(variant).replace('viewBox="0 0 1024 1024"', `viewBox="${B.x} ${B.y} ${B.side} ${B.side}"`).replace('width="1024" height="1024"', `width="${B.side}" height="${B.side}"`);
await mkdir(path.join(root, 'native/android/res/drawable-nodpi'), { recursive: true });
await png(ring, 480, path.join(root, 'native/android/res/drawable-nodpi/bju_splash_logo.png'));
await writeFile(path.join(root, 'native/android/res/values/bju_splash.xml'),
  `<?xml version="1.0" encoding="utf-8"?>\n<!-- Сгенерировано scripts/icons.mjs: фон заставки (как у иконки) -->\n<resources>\n    <color name="bju_splash_bg">${VARIANTS[variant].bg}</color>\n</resources>\n`);

// Адаптивная иконка Android 8+ — векторные слои (чёткие на любой плотности): передний план, фон-градиент и монохромный
// слой для тематических значков Android 13+. Подключает их scripts/patch-android.mjs (mipmap-anydpi-v26/ic_launcher*.xml)
const dr = path.join(root, 'native/android/res/drawable');
await writeFile(path.join(dr, 'bju_ic_fg.xml'), fgVector(variant));
await writeFile(path.join(dr, 'bju_ic_bg.xml'), bgShape(variant));
await writeFile(path.join(dr, 'bju_ic_mono.xml'), monoVector());

const bg = VARIANTS[variant].bg;
await writeFile(path.join(assets, 'bg-color.txt'), bg);
console.log(`Иконки сгенерированы: вариант «${variant}», фон ${bg}`);
