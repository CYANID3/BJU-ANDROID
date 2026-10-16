import { Capacitor, registerPlugin } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { App } from '@capacitor/app';

const native = Capacitor.isNativePlatform();
// Собственный нативный плагин (native/android/BjuNativePlugin.java)
const Bju = registerPlugin('BjuNative');
const hasBju = native && Capacitor.isPluginAvailable('BjuNative');

const DIR = 'BJU';
const dataPath = `${DIR}/bju-data.json`;
const backupPath = `${DIR}/bju-backup.json`;

async function read(path, directory) {
  try {
    const r = await Filesystem.readFile({ path, directory, encoding: Encoding.UTF8 });
    return typeof r.data === 'string' ? r.data : null;
  } catch { return null; }
}
const write = (path, data) =>
  Filesystem.writeFile({ path, directory: Directory.Data, data, encoding: Encoding.UTF8, recursive: true });

// Внутренняя копия в приватной папке приложения — пишется всегда.
const readLocal = () => (native ? read(dataPath, Directory.Data) : Promise.resolve(null));
const writeLocal = text => (native ? write(dataPath, text) : Promise.resolve());
const writeBackup = text => (native ? write(backupPath, text) : Promise.resolve());
// Файл из старых версий приложения (Documents/BJU) — только чтение, для переноса данных.
const readLegacy = () => (native ? read(dataPath, Directory.Documents) : Promise.resolve(null));

// Основной файл, выбранный пользователем через системный диалог (постоянный доступ).
const file = {
  available: hasBju,
  create: name => Bju.createFile({ name }),
  open: () => Bju.openFile(),
  read: uri => Bju.readFile({ uri }).then(r => r.data),
  write: (uri, data) => Bju.writeFile({ uri, data }),
  check: uri => Bju.checkFile({ uri }),
  release: uri => Bju.releaseFile({ uri })
};

async function haptic(ms) {
  if (!native) return false;
  const style = ms >= 20 ? ImpactStyle.Heavy : ms >= 10 ? ImpactStyle.Medium : ImpactStyle.Light;
  try { await Haptics.impact({ style }); return true; } catch { return false; }
}

// Системные отступы и клавиатура → CSS-переменные
function applyInsets(i) {
  if (!i || i.top == null) return;
  const r = document.documentElement.style;
  r.setProperty('--sat', i.top + 'px');
  r.setProperty('--sab', i.bottom + 'px');
  r.setProperty('--kbd', (i.duration || 220) + 'ms');
  r.setProperty('--kb', i.keyboard + 'px');
  window.BJU_onKeyboard?.(i.keyboard, i.duration || 220);
}
if (hasBju) {
  document.documentElement.classList.add('native');
  Bju.addListener('insets', applyInsets);
  Bju.getInsets().then(applyInsets).catch(() => {});
}
const bars = (color, light) => (hasBju ? Bju.setBars({ color, light }).catch(() => {}) : Promise.resolve());
// Виджет рабочего стола: остаток калорий на сегодня
const widget = data => (hasBju ? Bju.updateWidget(data).catch(() => {}) : Promise.resolve());

// Системная кнопка / жест «Назад»
if (native) {
  App.addListener('backButton', () => {
    if (!(window.BJU_onBack && window.BJU_onBack())) App.minimizeApp();
  });
  App.addListener('pause', () => window.BJU_onPause?.());
  // Ярлыки быстрых действий и кнопка «+» виджета открывают bju://add?m=…
  App.addListener('appUrlOpen', e => window.BJU_onUrl?.(e.url));
  App.getLaunchUrl().then(r => r && r.url && window.BJU_onUrl?.(r.url)).catch(() => {});
}

window.BJU_NATIVE = { native, readLocal, writeLocal, writeBackup, readLegacy, file, haptic, bars, widget };
window.BJU_NATIVE_READY_RESOLVE?.();
