// Иконка и splash для Android через @capacitor/assets — цвет фона берётся из выбранного варианта иконки.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const bg = readFileSync('assets/bg-color.txt', 'utf8').trim();
execSync(`npx capacitor-assets generate --android --iconBackgroundColor "${bg}" --iconBackgroundColorDark "${bg}" --splashBackgroundColor "${bg}" --splashBackgroundColorDark "${bg}"`, { stdio: 'inherit' });
