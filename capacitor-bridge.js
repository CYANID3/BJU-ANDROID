import { Capacitor, registerPlugin } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { App } from '@capacitor/app';
// Шрифт интерфейса — внутри приложения (без сети): Manrope, мягкий геометрический, с кириллицей и табличными цифрами
import '@fontsource-variable/manrope';

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
// Системный виброотклик Android: type — key (нажатие клавиши), confirm (сохранение), long (удаление), tick (листание,
// переключатели), threshold (порог жеста), reject (ошибка ввода); strength — light / normal / strong.
// Если система не выполнила отклик (например, старая версия Android) — обычная вибрация той же силы.
const STRENGTH_MS = { light: 5, normal: 10, strong: 20 };
async function feedback(type, strength = 'normal') {
  if (!native) return false;
  if (hasBju) { try { const r = await Bju.feedback({ type, strength }); if (r && r.ok) return true; } catch { } }
  return haptic((STRENGTH_MS[strength] || 10) * (type === 'long' ? 2 : 1));
}

// Системные отступы и клавиатура → CSS-переменные
function applyInsets(i) {
  if (!i || i.top == null) return;
  const r = document.documentElement.style;
  r.setProperty('--sat', i.top + 'px');
  r.setProperty('--sab', i.bottom + 'px');
  // "live" — кадр анимации клавиатуры: значение ставится сразу, без CSS-перехода (лист идёт вместе с клавиатурой);
  // "set" — изменение без анимации от системы: плавный CSS-переход
  const live = i.mode === 'live' || i.mode === 'end';
  r.setProperty('--kbd', live ? '0ms' : (i.duration || 250) + 'ms');
  // страница может «придержать» значение (например, не дать окну подскочить при закрытии клавиатуры)
  const kb = window.BJU_kbFilter ? window.BJU_kbFilter(i.keyboard, i.mode) : i.keyboard;
  r.setProperty('--kb', kb + 'px');
  window.BJU_onKeyboard?.(i.keyboard, i.mode === 'live' ? -1 : live ? 0 : i.duration || 220);
}
if (hasBju) {
  document.documentElement.classList.add('native');
  Bju.addListener('insets', applyInsets);
  Bju.getInsets().then(applyInsets).catch(() => {});
}
const bars = (color, light) => (hasBju ? Bju.setBars({ color, light }).catch(() => {}) : Promise.resolve());
// Виджет рабочего стола: остаток калорий на сегодня
const widget = data => (hasBju ? Bju.updateWidget(data).catch(() => {}) : Promise.resolve());
// Ярлык «Вес» в меню долгого нажатия на иконку (есть, только когда вес включён)
const shortcuts = o => (hasBju ? Bju.setShortcuts(o).catch(() => {}) : Promise.resolve());

// Системная кнопка / жест «Назад»
if (native) {
  App.addListener('backButton', () => {
    if (!(window.BJU_onBack && window.BJU_onBack())) App.minimizeApp();
  });
  App.addListener('pause', () => window.BJU_onPause?.());
  // Ярлыки быстрых действий и кнопка «+» виджета открывают bju://add?m=… (и bju://weight)
  App.addListener('appUrlOpen', e => window.BJU_onUrl?.(e.url));
  App.getLaunchUrl().then(r => r && r.url && window.BJU_onUrl?.(r.url)).catch(() => {});
}

window.BJU_NATIVE = { native, readLocal, writeLocal, writeBackup, readLegacy, file, haptic, feedback, bars, widget, shortcuts };
window.BJU_NATIVE_READY_RESOLVE?.();
