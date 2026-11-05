// Ревизия 23: хранение в APK — в памяти WebView только рабочая копия; резервная — во внутреннем файле; внутренний файл
// без отступов, файл пользователя — читаемый, как раньше; повреждённая рабочая копия восстанавливается из внутреннего файла.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day } from './helpers.mjs';

const DATA = { g: { p: 140, f: 70, c: 230 }, d: { [day(0)]: [{ m: 0, n: 'Овсянка', g: 60, p: 7, f: 3, c: 36 }] }, db: [['Рис', 7, 1, 78]] };

test('APK: внутренний файл — без отступов, файл пользователя — с отступами; запасной копии в памяти WebView нет', async () => {
  const a = await openApp({ native: true, data: DATA });
  await a.ev(() => { localStorage.setItem('bju2bak', 'старая копия'); S.d[cur].push({ m: 2, n: 'Гречка', g: 100, p: 12, f: 3, c: 57 }); save(); return nativeFlush() });
  const r = await a.ev(() => ({ local: __P.local, bak: localStorage.getItem('bju2bak') }));
  assert.ok(r.local && !r.local.includes('\n'), 'внутренний файл одной строкой');
  assert.equal(JSON.parse(r.local).diary[day(0)].lunch[0].name, 'Гречка');
  // файл пользователя
  await a.ev(async () => { const f = await BJU_NATIVE.file.create('bju.json'); setMF(f); await nativeFlush() });
  const f = await a.ev(() => __P.files['content://x/bju.json']);
  assert.ok(f.includes('\n  "format"'), 'файл пользователя читаемый, с отступами');
  // резервная копия перед заменой данных — не в памяти WebView
  await a.ev(() => { bk(); return 0 });
  assert.equal(await a.ev(() => localStorage.getItem('bju2bak')), 'старая копия', 'bk() в APK не пишет в память WebView');
  // при запуске старая копия из памяти WebView удаляется
  await a.pg.reload(); await a.pg.waitForFunction(() => document.querySelector('#app .sum')); await a.wait(600);
  assert.equal(await a.ev(() => localStorage.getItem('bju2bak')), null);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('APK: повреждённая рабочая копия — данные восстанавливаются из внутреннего файла', async () => {
  const a = await openApp({ native: true, data: DATA });
  await a.ev(() => nativeFlush());
  await a.ev(() => { localStorage.setItem('bju2', '{испорчено'); return 0 });
  await a.pg.reload(); await a.pg.waitForFunction(() => document.querySelector('#app .sum')); await a.wait(1500);
  assert.equal(await a.ev(() => (S.d[cur] || []).map(e => e.n).join()), 'Овсянка');
  assert.match(await a.ev(() => $('tm') ? $('tm').textContent : ''), /восстановлены из внутреннего файла/);
  assert.equal(await a.ev(() => JSON.parse(localStorage.getItem('bju2')).d[cur][0].n), 'Овсянка', 'рабочая копия снова целая');
  await a.close();
});
