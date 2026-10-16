// Донастройка сгенерированной папки android/ (её создаёт `npx cap add android` в CI).
// Идемпотентно: можно запускать повторно.
//   APP_VERSION_CODE — целое, растёт с каждой сборкой (иначе Android не даст обновиться)
//   APP_VERSION_NAME — строка версии, видна в настройках Android
import { readFile, writeFile, copyFile, readdir, mkdir } from 'node:fs/promises';

const code = parseInt(process.env.APP_VERSION_CODE || '1', 10);
const name = process.env.APP_VERSION_NAME || '1.0.' + code;
const appId = JSON.parse(await readFile('capacitor.config.json', 'utf8')).appId;

async function patch(file, fn) {
  const before = await readFile(file, 'utf8');
  const after = fn(before);
  if (after !== before) await writeFile(file, after);
  console.log((after !== before ? 'patched ' : 'ok      ') + file);
}

// 1. Версия
await patch('android/app/build.gradle', s => {
  if (!/versionCode\s+\d+/.test(s) || !/versionName\s+"[^"]*"/.test(s)) throw new Error('versionCode/versionName не найдены в build.gradle');
  return s.replace(/versionCode\s+\d+/, `versionCode ${code}`).replace(/versionName\s+"[^"]*"/, `versionName "${name}"`);
});

// 2. Нативный код (MainActivity + плагин BjuNative)
const javaDir = `android/app/src/main/java/${appId.replace(/\./g, '/')}`;
await mkdir(javaDir, { recursive: true });
for (const f of await readdir('native/android')) {
  if (!f.endsWith('.java')) continue;
  await copyFile(`native/android/${f}`, `${javaDir}/${f}`);
  console.log('copied  ' + `${javaDir}/${f}`);
}

// 3. Манифест
await patch('android/app/src/main/AndroidManifest.xml', s => {
  // Клавиатура: окно не сдвигается (adjustPan) — страница сама поднимает лист по отступам из BjuNative
  if (!s.includes('windowSoftInputMode')) s = s.replace('android:name=".MainActivity"', 'android:name=".MainActivity"\n            android:windowSoftInputMode="adjustResize"');
  if (!s.includes('screenOrientation')) s = s.replace('android:name=".MainActivity"', 'android:name=".MainActivity"\n            android:screenOrientation="portrait"');
  return s;
});

console.log(`version ${name} (${code})`);
