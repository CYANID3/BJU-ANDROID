import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const native = Capacitor.isNativePlatform();
const dataPath = 'BJU/bju-data.json';
const backupPath = 'BJU/bju-backup.json';

async function ensureDir() {
  try { await Filesystem.mkdir({ path: 'BJU', directory: Directory.Documents, recursive: true }); }
  catch (e) { /* directory may already exist */ }
}
async function readData() {
  if (!native) return null;
  try {
    const result = await Filesystem.readFile({ path: dataPath, directory: Directory.Documents, encoding: 'utf8' });
    return typeof result.data === 'string' ? result.data : null;
  } catch { return null; }
}
async function writeData(text) {
  if (!native) return false;
  await ensureDir();
  await Filesystem.writeFile({
    path: dataPath, directory: Directory.Documents, data: text,
    encoding: 'utf8', recursive: true
  });
  return true;
}
async function writeBackup(text) {
  if (!native) return false;
  await ensureDir();
  await Filesystem.writeFile({ path: backupPath, directory: Directory.Documents, data: text, encoding: 'utf8', recursive: true });
  return true;
}
async function haptic(ms) {
  if (!native) return false;
  const style = ms >= 20 ? ImpactStyle.Heavy : ms >= 10 ? ImpactStyle.Medium : ImpactStyle.Light;
  try { await Haptics.impact({ style }); return true; } catch { return false; }
}
window.BJU_NATIVE = { native, readData, writeData, writeBackup, haptic };
window.BJU_NATIVE_READY_RESOLVE?.();
