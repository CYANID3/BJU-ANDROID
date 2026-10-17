// Генерирует все иконки приложения из исходника scripts/icon-svg.mjs (кольцо Б / Ж / У).
// Запуск: npm run icons   (выполняется автоматически в GitHub Actions)
// Вариант оформления: "icon" в package.json → dark (по умолчанию) | light | accent; можно задать ICON_VARIANT.
//  - public/icon-*.png, favicon.png        — иконки PWA / favicon / apple-touch-icon / подвал карточки дня
//  - assets/*.png                          — исходники для @capacitor/assets (иконка и splash Android)
//  - native/android/res/drawable/bju_ic_mono.xml — монохромный слой для «тематических значков» Android 13+
import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { foreground, background, full, monoVector, VARIANTS } from './icon-svg.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const variant = process.env.ICON_VARIANT || pkg.icon || 'dark';
if (!VARIANTS[variant]) throw new Error(`неизвестный вариант иконки «${variant}» (можно: ${Object.keys(VARIANTS).join(', ')})`);
const pub = path.join(root, 'public'), assets = path.join(root, 'assets');
await mkdir(pub, { recursive: true });
await mkdir(assets, { recursive: true });

const png = (svg, size, file) => sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png({ compressionLevel: 9 }).toFile(file);

// Web / PWA: квадрат с фоном (скругляет система / браузер)
for (const s of [180, 192, 512]) await png(full(variant, 0.82), s, path.join(pub, `icon-${s}.png`));
await png(full(variant, 0.9), 48, path.join(pub, 'favicon.png'));

// Android: adaptive (фон + передний план; лаунчер сам обрезает до круга/квадрата и т.п.) и legacy
await png(foreground(variant), 1024, path.join(assets, 'icon-foreground.png'));
await png(background(variant), 1024, path.join(assets, 'icon-background.png'));
await png(full(variant, 0.78), 1024, path.join(assets, 'icon-only.png'));
// Splash: кольцо поменьше по центру
for (const f of ['splash.png', 'splash-dark.png']) await png(full(variant, 0.3), 2732, path.join(assets, f));

// Монохромный слой (тематические значки Android 13+): система красит его в цвета обоев и темы
await writeFile(path.join(root, 'native/android/res/drawable/bju_ic_mono.xml'), monoVector());

const bg = VARIANTS[variant].bg;
await writeFile(path.join(assets, 'bg-color.txt'), bg);
console.log(`Иконки сгенерированы: вариант «${variant}», фон ${bg}`);
