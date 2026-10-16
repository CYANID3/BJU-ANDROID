// Донастройка сгенерированной папки android/ (её создаёт `npx cap add android` в CI).
// Идемпотентно: можно запускать повторно.
//   APP_VERSION_CODE — целое, растёт с каждой сборкой (иначе Android не даст обновиться)
//   APP_VERSION_NAME — строка версии, видна в настройках Android
import { readFile, writeFile } from 'node:fs/promises';

const code = parseInt(process.env.APP_VERSION_CODE || '1', 10);
const name = process.env.APP_VERSION_NAME || '1.0.' + code;

async function patch(file, fn) {
  const before = await readFile(file, 'utf8');
  const after = fn(before);
  if (after !== before) await writeFile(file, after);
  console.log((after !== before ? 'patched ' : 'ok      ') + file);
}

await patch('android/app/build.gradle', s => {
  if (!/versionCode\s+\d+/.test(s) || !/versionName\s+"[^"]*"/.test(s)) throw new Error('versionCode/versionName не найдены в build.gradle');
  return s.replace(/versionCode\s+\d+/, `versionCode ${code}`).replace(/versionName\s+"[^"]*"/, `versionName "${name}"`);
});

// Android ≤ 10 требует разрешение на запись в общий каталог Documents.
await patch('android/app/src/main/AndroidManifest.xml', s => {
  const perms = [
    '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />',
    '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />'
  ].filter(p => !s.includes(p.split('"')[1]));
  if (perms.length) s = s.replace('</manifest>', '    ' + perms.join('\n    ') + '\n</manifest>');
  if (!s.includes('requestLegacyExternalStorage')) s = s.replace('<application', '<application\n        android:requestLegacyExternalStorage="true"');
  return s;
});

console.log(`version ${name} (${code})`);
