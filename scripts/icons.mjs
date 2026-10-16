// Генерирует все иконки приложения из logo.png.
// Запуск: npm run icons   (выполняется автоматически в GitHub Actions)
//  - public/icon-*.png        — иконки PWA / favicon / apple-touch-icon
//  - assets/*.png             — исходники для @capacitor/assets (иконка и splash для Android)
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'logo.png');
const pub = path.join(root, 'public');
const assets = path.join(root, 'assets');
await mkdir(pub, { recursive: true });
await mkdir(assets, { recursive: true });

// Цвет фона логотипа (среднее по краям) — им заполняются поля вокруг.
const BG = { r: 9, g: 17, b: 32 };
export const BG_HEX = '#' + [BG.r, BG.g, BG.b].map(v => v.toString(16).padStart(2, '0')).join('');

const logo = sharp(src).removeAlpha();

// Логотип по центру квадрата `size`, занимает долю `scale`; края плавно растворяются в фоне.
async function onCanvas(size, scale, file) {
  const inner = Math.round(size * scale);
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${inner}" height="${inner}"><defs><radialGradient id="g" cx="50%" cy="50%" r="50%">` +
    `<stop offset="62%" stop-color="#fff"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/>` +
    `</radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
  const resized = await logo.clone().resize(inner, inner).ensureAlpha().png().toBuffer();
  const faded = await sharp(resized).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 3, background: BG } })
    .composite([{ input: faded, gravity: 'center' }]).png({ compressionLevel: 9 }).toFile(file);
}

// Web / PWA
for (const s of [180, 192, 512]) {
  await logo.clone().resize(s, s).png({ compressionLevel: 9 }).toFile(path.join(pub, `icon-${s}.png`));
}
await logo.clone().resize(48, 48).png().toFile(path.join(pub, 'favicon.png'));

// Android: legacy-иконка — логотип целиком; adaptive foreground — с полями,
// чтобы кольцо не обрезалось маской лаунчера (видна только центральная 2/3 слоя).
await logo.clone().resize(1024, 1024).png().toFile(path.join(assets, 'icon-only.png'));
await onCanvas(1024, 0.95, path.join(assets, 'icon-foreground.png'));
await sharp({ create: { width: 1024, height: 1024, channels: 3, background: BG } }).png().toFile(path.join(assets, 'icon-background.png'));
await onCanvas(2732, 0.42, path.join(assets, 'splash.png'));
await onCanvas(2732, 0.42, path.join(assets, 'splash-dark.png'));

console.log('Иконки сгенерированы из logo.png, фон', BG_HEX);
