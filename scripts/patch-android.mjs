// Донастройка сгенерированной папки android/ (её создаёт `npx cap add android` в CI).
// Идемпотентно: можно запускать повторно.
//   APP_VERSION_CODE — целое, растёт с каждой сборкой (иначе Android не даст обновиться)
//   APP_VERSION_NAME — строка версии, видна в настройках Android
import { readFile, writeFile, copyFile, readdir, mkdir, cp } from 'node:fs/promises';

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

// 3. Ресурсы: виджет, ярлыки быстрых действий, иконки (имена с префиксом bju_, чтобы не пересекаться с шаблоном)
await cp('native/android/res', 'android/app/src/main/res', { recursive: true });
console.log('copied  native/android/res -> android/app/src/main/res');

// 3b. Тематический значок (Android 13+): монохромный слой в адаптивной иконке
for (const f of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
  const file = `android/app/src/main/res/mipmap-anydpi-v26/${f}`;
  try {
    await patch(file, s => s.includes('<monochrome') ? s : s.replace('</adaptive-icon>', '    <monochrome android:drawable="@drawable/bju_ic_mono" />\n</adaptive-icon>'));
  } catch (e) { if (e.code !== 'ENOENT') throw e; console.log('нет    ' + file); }
}

// 4. Манифест
await patch('android/app/src/main/AndroidManifest.xml', s => {
  // Клавиатура: окно не сдвигается (adjustPan) — страница сама поднимает лист по отступам из BjuNative
  if (!s.includes('windowSoftInputMode')) s = s.replace('android:name=".MainActivity"', 'android:name=".MainActivity"\n            android:windowSoftInputMode="adjustResize"');
  if (!s.includes('screenOrientation')) s = s.replace('android:name=".MainActivity"', 'android:name=".MainActivity"\n            android:screenOrientation="portrait"');
  // Быстрые действия при долгом нажатии на иконку
  if (!s.includes('android.app.shortcuts')) s = s.replace('</activity>', '    <meta-data android:name="android.app.shortcuts" android:resource="@xml/bju_shortcuts" />\n        </activity>');
  // Виджет рабочего стола
  if (!s.includes('.BjuWidget')) s = s.replace('</application>', `    <receiver android:name=".BjuWidget" android:exported="false" android:label="БЖУ за сегодня">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data android:name="android.appwidget.provider" android:resource="@xml/bju_widget_info" />
        </receiver>
    </application>`);
  return s;
});

console.log(`version ${name} (${code})`);
