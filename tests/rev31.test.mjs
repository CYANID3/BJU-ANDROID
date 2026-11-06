// Ревизия 31: «Что нового» после обновления и экран первого запуска (только APK)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day } from './helpers.mjs';

const vis = a => a.ev(() => [isOpen, ...[23, 24].map(i => isOpen && !$('v' + i).hidden)]);

test('чистая установка (APK): экран первого запуска; «У меня есть файл данных» → данные из файла, экран закрыт', async () => {
  const a = await openApp({ native: true, wn: true, empty: true });
  await a.wait(900);
  assert.deepEqual(await vis(a), [true, true, false]);
  assert.match(await a.ev(() => $('v23').textContent), /У меня есть файл данных.*Начать с чистого листа/s);
  assert.equal(await a.ev(() => localStorage.getItem('bju_wn')), await a.ev(() => String(WN_LAST)));
  // отмена системного окна — экран остаётся
  await a.ev(() => { BJU_NATIVE.file.open = async () => { throw Error('Отменено') }; return 0 });
  await a.pg.click('#v23 .wlo.pri'); await a.wait(400);
  assert.deepEqual(await vis(a), [true, true, false]);
  // выбрали файл с данными
  await a.ev(() => { const f = toFile({ g: { p: 140, f: 70, c: 230 }, d: { [new Date().toISOString().slice(0, 10)]: [{ m: 0, n: 'Рис', g: 100, p: 7, f: 1, c: 74 }] }, db: [['Рис', 7, 1, 74]] });
    __P.files['content://x/bju-data.json'] = JSON.stringify(f); __P.perm['content://x/bju-data.json'] = 1;
    BJU_NATIVE.file.open = async () => ({ uri: 'content://x/bju-data.json', name: 'bju-data.json', writable: true }); return 0 });
  await a.pg.click('#v23 .wlo.pri'); await a.wait(800);
  const r = await a.ev(() => ({ open: isOpen, mf: MF && MF.name, db: S.db.length, tm: $('tm').textContent }));
  assert.deepEqual([r.open, r.mf, r.db], [false, 'bju-data.json', 1]);
  assert.match(r.tm, /Данные из «bju-data\.json» · дней с записями: \d+ · автосохранение включено/);
  // перезапуск — ничего не показывается
  await a.pg.reload(); await a.pg.waitForSelector('#app .sum'); await a.wait(1000);
  assert.deepEqual(await vis(a), [false, false, false]);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('чистая установка: «Начать с чистого листа» и «Назад» просто закрывают экран', async () => {
  for (const how of ['btn', 'back']) {
    const a = await openApp({ native: true, wn: true, empty: true });
    await a.wait(900);
    if (how === 'btn') await a.pg.click('#v23 .wlo:not(.pri)'); else await a.ev(() => { BJU_onBack(); return 0 });
    await a.wait(500);
    assert.deepEqual(await vis(a), [false, false, false], how);
    await a.close();
  }
});

test('обновление с данными: «Что нового» один раз; из настроек — снова, «Понятно» возвращает в настройки', async () => {
  const a = await openApp({ native: true, wn: true, data: { g: { p: 120, f: 70, c: 250 }, d: { [day()]: [{ m: 0, n: 'Рис', g: 100, p: 7, f: 1, c: 74 }] } } });
  await a.wait(1200);
  assert.deepEqual(await vis(a), [true, false, true]);
  assert.match(await a.ev(() => $('v24').textContent), /Обновления ставятся поверх/);
  assert.match(await a.ev(() => $('st').textContent + ' ' + $('ss').textContent), /Что нового.*Версия/);
  await a.pg.click('.ft[data-v="24"] .pb'); await a.wait(500);
  assert.deepEqual(await vis(a), [false, false, false]);
  await a.pg.reload(); await a.pg.waitForSelector('#app .sum'); await a.wait(1200);
  assert.deepEqual(await vis(a), [false, false, false], 'второй раз не показывается');
  // из настроек
  await a.ev(() => { sets(); return 0 }); await a.wait(500);
  assert.match(await a.ev(() => $('v7').textContent), /Что новогоВерсия/);
  await a.ev(() => { wnShow(); return 0 }); await a.wait(500);
  assert.deepEqual(await vis(a), [true, false, true]);
  await a.pg.click('.ft[data-v="24"] .pb'); await a.wait(500);
  assert.equal(await a.ev(() => !$('v7').hidden), true, 'вернулись в настройки');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('пропущено несколько записей — одно окно: последняя подробно, остальные в «Раньше»; браузер — ничего', async () => {
  const a = await openApp({ native: true, wn: true, data: { g: { p: 120, f: 70, c: 250 }, d: { [day()]: [{ m: 0, n: 'Рис', g: 100, p: 7, f: 1, c: 74 }] } } });
  await a.wait(1200); await a.ev(() => { closeUI(); return 0 }); await a.wait(400);
  await a.ev(() => { WN.unshift({ n: -2, d: '1', t: [['ok', 'Старое А', 'а']] }, { n: -1, d: '2', t: [['ok', 'Старое Б', 'б']] }); wnOpen(WN.filter(e => e.n > -5)); return 0 }); await a.wait(500);
  assert.match(await a.ev(() => $('v24').textContent), /Обновления ставятся поверх.*Раньше.*Старое Б.*Старое А/s);
  await a.close();
  const b = await openApp({ wn: true, empty: true }); await b.wait(1000);
  assert.deepEqual(await vis(b), [false, false, false]);
  await b.close();
});

test('память очищена, но во внутреннем файле есть данные — экрана первого запуска нет', async () => {
  const a = await openApp({ native: true, wn: true, empty: true });
  // система очистила память приложения (всё в localStorage), внутренний файл остался
  await a.ev(() => { __P.local = JSON.stringify(toFile({ g: { p: 1, f: 1, c: 1 }, d: {}, db: [['Рис', 7, 1, 74]], saved: Date.now() })); sessionStorage.setItem('phone', JSON.stringify(__P)); localStorage.clear(); return 0 });
  await a.pg.reload(); await a.pg.waitForSelector('#app .sum'); await a.wait(1200);
  assert.equal(await a.ev(() => S.db.length), 1, 'данные восстановлены из внутреннего файла');
  const v = await vis(a); assert.equal(v[1], false, 'не экран первого запуска');
  await a.close();
});
