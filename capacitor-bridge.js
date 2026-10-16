import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const native = Capacitor.isNativePlatform();
const DIR = 'BJU';
const dataPath = `${DIR}/bju-data.json`;
const backupPath = `${DIR}/bju-backup.json`;
// Documents — видно пользователю (можно скопировать файл). Data — приватная папка приложения:
// туда запись проходит всегда, даже если Android запретил доступ к Documents
// (например, файл создан прошлой установкой приложения).
const PLACES = [Directory.Documents, Directory.Data];

async function read(path, directory) {
  try {
    const r = await Filesystem.readFile({ path, directory, encoding: Encoding.UTF8 });
    return typeof r.data === 'string' ? r.data : null;
  } catch { return null; }
}
async function write(path, directory, data) {
  await Filesystem.writeFile({ path, directory, data, encoding: Encoding.UTF8, recursive: true });
}
const savedAt = t => { try { return JSON.parse(t).saved || 0; } catch { return -1; } };

// Возвращает самую свежую из найденных копий
async function readData() {
  if (!native) return null;
  const all = (await Promise.all(PLACES.map(d => read(dataPath, d)))).filter(Boolean);
  if (!all.length) return null;
  return all.reduce((a, b) => (savedAt(b) > savedAt(a) ? b : a));
}
// Пишет во все места; ошибка — только если не удалось записать никуда.
// Возвращает true, если удалось записать в Documents.
async function writeAll(path, text) {
  if (!native) return false;
  const res = await Promise.allSettled(PLACES.map(d => write(path, d, text)));
  if (res.every(r => r.status === 'rejected')) throw res[0].reason;
  return res[0].status === 'fulfilled';
}
const writeData = text => writeAll(dataPath, text);
const writeBackup = text => writeAll(backupPath, text);

async function haptic(ms) {
  if (!native) return false;
  const style = ms >= 20 ? ImpactStyle.Heavy : ms >= 10 ? ImpactStyle.Medium : ImpactStyle.Light;
  try { await Haptics.impact({ style }); return true; } catch { return false; }
}

window.BJU_NATIVE = { native, readData, writeData, writeBackup, haptic };
window.BJU_NATIVE_READY_RESOLVE?.();
