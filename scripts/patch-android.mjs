// Донастройка сгенерированной папки android/ (её создаёт `npx cap add android` в CI).
// Идемпотентно: можно запускать повторно.
//   APP_VERSION_CODE — целое, растёт с каждой сборкой (иначе Android не даст обновиться)
//   APP_VERSION_NAME — строка версии, видна в настройках Android
import { readFile, writeFile, copyFile, readdir, mkdir, cp, rm, rmdir } from 'node:fs/promises';

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

// 1b. Обмен продуктами с телефоном рядом: Google Nearby Connections (BjuExchangePlugin.java)
await patch('android/app/build.gradle', s => {
  if (s.includes('play-services-nearby')) return s;
  if (!/\ndependencies\s*\{/.test(s)) throw new Error('блок dependencies не найден в build.gradle');
  return s.replace(/\ndependencies\s*\{/, m => m + "\n    implementation 'com.google.android.gms:play-services-nearby:19.2.0'");
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

// 3b. Адаптивная иконка (Android 8+): свои векторные слои вместо картинок @capacitor/assets. Его разметка ставит картинку
// 48 dp в слой со сдвигом inset 16,7 % — лаунчер растягивал её в 1,5 раза, и значок был размытым; монохромный слой
// (тематические значки Android 13+) подключён там же. Неиспользуемые векторы шаблона Capacitor (робот Android) удаляются
const ADAPTIVE = `<?xml version="1.0" encoding="utf-8"?>
<!-- Создано scripts/patch-android.mjs: слои — векторные (scripts/icons.mjs) -->
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/bju_ic_bg" />
    <foreground android:drawable="@drawable/bju_ic_fg" />
    <monochrome android:drawable="@drawable/bju_ic_mono" />
</adaptive-icon>
`;
await mkdir('android/app/src/main/res/mipmap-anydpi-v26', { recursive: true });
for (const f of ['ic_launcher.xml', 'ic_launcher_round.xml']) await patch(`android/app/src/main/res/mipmap-anydpi-v26/${f}`, () => ADAPTIVE).catch(async e => {
  if (e.code !== 'ENOENT') throw e; await writeFile(`android/app/src/main/res/mipmap-anydpi-v26/${f}`, ADAPTIVE); console.log('created android/app/src/main/res/mipmap-anydpi-v26/' + f);
});
for (const f of ['drawable-v24/ic_launcher_foreground.xml', 'drawable/ic_launcher_background.xml']) {
  const p = `android/app/src/main/res/${f}`;
  try { await rm(p); console.log('removed ' + p) } catch (e) { if (e.code !== 'ENOENT') throw e }
}
try { await rmdir('android/app/src/main/res/drawable-v24') } catch (e) { } // только если пустая

// 3c. Заставка: вместо растягиваемой картинки splash.png — фон и значок по центру (bju_splash); на Android 12+ — тот же значок и фон
await patch('android/app/src/main/res/values/styles.xml', s => {
  s = s.replace(/(<style name="AppTheme\.NoActionBarLaunch"[^>]*>[\s\S]*?)@drawable\/splash</, '$1@drawable/bju_splash<');
  const m = s.match(/<style name="AppTheme\.NoActionBarLaunch"[^>]*parent="([^"]*)"[^>]*>/);
  if (m && /Theme\.SplashScreen/.test(m[1]) && !s.includes('windowSplashScreenAnimatedIcon'))
    s = s.replace(m[0], m[0] + '\n        <item name="windowSplashScreenBackground">@color/bju_splash_bg</item>\n        <item name="windowSplashScreenAnimatedIcon">@drawable/bju_splash_icon</item>');
  return s;
});

// 4. Манифест
await patch('android/app/src/main/AndroidManifest.xml', s => {
  // Клавиатура: окно не сдвигается (adjustPan) — страница сама поднимает лист по отступам из BjuNative
  if (!s.includes('windowSoftInputMode')) s = s.replace('android:name=".MainActivity"', 'android:name=".MainActivity"\n            android:windowSoftInputMode="adjustResize"');
  if (!s.includes('screenOrientation')) s = s.replace('android:name=".MainActivity"', 'android:name=".MainActivity"\n            android:screenOrientation="portrait"');
  // Быстрые действия при долгом нажатии на иконку
  if (!s.includes('android.app.shortcuts')) s = s.replace('</activity>', '    <meta-data android:name="android.app.shortcuts" android:resource="@xml/bju_shortcuts" />\n        </activity>');
  // Обмен с телефоном рядом (Nearby Connections): поиск по Bluetooth, передача по Wi‑Fi. Разрешения — по списку из документации Google;
  // во время работы спрашивается только нужное для версии Android (BjuExchangePlugin.neededAliases)
  // Местоположение объявлено без maxSdk: на Android 12L+ оно не нужно по документации и не спрашивается заранее, но если
  // Сервисы Google Play всё же отклонят поиск с кодом 8034, приложение попросит его отдельно (BjuExchangePlugin.requestPrecise)
  const NEAR = [['ACCESS_WIFI_STATE', ''], ['CHANGE_WIFI_STATE', ''], ['BLUETOOTH', ' android:maxSdkVersion="30"'], ['BLUETOOTH_ADMIN', ' android:maxSdkVersion="30"'],
    ['ACCESS_COARSE_LOCATION', ''], ['ACCESS_FINE_LOCATION', ''], ['BLUETOOTH_ADVERTISE', ''], ['BLUETOOTH_CONNECT', ''], ['BLUETOOTH_SCAN', ''],
    ['NEARBY_WIFI_DEVICES', '']];
  for (const [p, extra] of NEAR) if (!s.includes(`android.permission.${p}"`)) s = s.replace('<application', `<uses-permission android:name="android.permission.${p}"${extra} />\n    <application`);
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
