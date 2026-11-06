// Ревизии 31–32: «Что нового» после обновления и приветствие на чистой установке (только APK) — на весь экран,
// выключатель «Показывать после обновления»
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day } from './helpers.mjs';

// [лист открыт, приветствие на экране, «Что нового» на экране]
const vis = a => a.ev(() => { const t = fsOn ? $('fs').textContent : ''; return [isOpen, /Добро пожаловать/.test(t), /Что нового/.test(t)] });
const DAY = () => ({ g: { p: 120, f: 70, c: 250 }, d: { [day()]: [{ m: 0, n: 'Рис', g: 100, p: 7, f: 1, c: 74 }] } });

test('чистая установка (APK): приветствие на весь экран; «У меня есть файл данных» → данные из файла, экран закрыт', async () => {
  const a = await openApp({ native: true, wn: true, empty: true });
  await a.wait(900);
  assert.deepEqual(await vis(a), [false, true, false]);
  assert.match(await a.ev(() => $('fs').textContent), /Добро пожаловать.*Дневник питания БЖУ.*У меня есть файл данных.*Начать с чистого листа/s);
  const box = await a.ev(() => { const r = $('fs').getBoundingClientRect(); return [r.top, r.left, r.width === innerWidth, r.height === innerHeight] });
  assert.deepEqual(box, [0, 0, true, true], 'на весь экран');
  assert.equal(await a.ev(() => localStorage.getItem('bju_wn')), await a.ev(() => String(WN_LAST)));
  // отмена системного окна — экран остаётся
  await a.ev(() => { BJU_NATIVE.file.open = async () => { throw Error('Отменено') }; return 0 });
  await a.pg.click('#fs .fsi.pri'); await a.wait(400);
  assert.deepEqual(await vis(a), [false, true, false]);
  // выбрали файл с данными
  await a.ev(() => { const f = toFile({ g: { p: 140, f: 70, c: 230 }, d: { [new Date().toISOString().slice(0, 10)]: [{ m: 0, n: 'Рис', g: 100, p: 7, f: 1, c: 74 }] }, db: [['Рис', 7, 1, 74]] });
    __P.files['content://x/bju-data.json'] = JSON.stringify(f); __P.perm['content://x/bju-data.json'] = 1;
    BJU_NATIVE.file.open = async () => ({ uri: 'content://x/bju-data.json', name: 'bju-data.json', writable: true }); return 0 });
  await a.pg.click('#fs .fsi.pri'); await a.wait(800);
  const r = await a.ev(() => ({ fs: fsOn, hid: $('fs').hidden, mf: MF && MF.name, db: S.db.length, tm: $('tm').textContent }));
  assert.deepEqual([r.fs, r.hid, r.mf, r.db], [0, true, 'bju-data.json', 1]);
  assert.match(r.tm, /Данные из «bju-data\.json» · дней с записями: \d+ · автосохранение включено/);
  await a.pg.reload(); await a.pg.waitForSelector('#app .sum'); await a.wait(1000);
  assert.deepEqual(await vis(a), [false, false, false], 'перезапуск — ничего');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('чистая установка: «Начать с чистого листа» и «Назад» закрывают приветствие; под ним ничего не нажимается', async () => {
  for (const how of ['btn', 'back']) {
    const a = await openApp({ native: true, wn: true, empty: true });
    await a.wait(900);
    assert.equal(await a.ev(() => document.elementFromPoint(200, 400).closest('#fs') !== null), true, 'касание попадает в слой');
    if (how === 'btn') await a.pg.click('#fs .fsi:not(.pri)'); else await a.ev(() => { BJU_onBack(); return 0 });
    await a.wait(500);
    assert.deepEqual(await vis(a), [false, false, false], how);
    assert.deepEqual(await a.ev(() => [$('fs').hidden, $('fs').inert, document.elementFromPoint(200, 400).closest('#fs') === null]), [true, true, true]);
    await a.close();
  }
});

test('обновление с данными: «Что нового» на весь экран один раз; крестик, «Понятно», «Назад»; из настроек — лист настроек остаётся', async () => {
  const a = await openApp({ native: true, wn: true, data: DAY() });
  await a.wait(1200);
  assert.deepEqual(await vis(a), [false, false, true]);
  assert.match(await a.ev(() => $('fs').textContent), /Что нового.*Версия .* · 6 ноября 2026.*Новое приветствие.*Раньше:.*Обновления ставятся поверх/s);
  await a.pg.click('#fs .fsok'); await a.wait(500);
  assert.deepEqual(await vis(a), [false, false, false]);
  await a.pg.reload(); await a.pg.waitForSelector('#app .sum'); await a.wait(1200);
  assert.deepEqual(await vis(a), [false, false, false], 'второй раз не показывается');
  // из настроек: крестик и «Назад» возвращают к настройкам
  await a.ev(() => { sets(); return 0 }); await a.wait(500);
  assert.match(await a.ev(() => $('v7').textContent), /Что новогоВерсия.*Показывать после обновления/s);
  for (const how of ['x', 'back']) {
    await a.ev(() => { wnShow(); return 0 }); await a.wait(400);
    assert.deepEqual(await vis(a), [true, false, true]);
    if (how === 'x') await a.pg.click('#fs .fsx'); else await a.ev(() => { BJU_onBack(); return 0 });
    await a.wait(400);
    assert.deepEqual(await vis(a), [true, false, false], how);
    assert.equal(await a.ev(() => !$('v7').hidden), true, 'настройки на месте');
  }
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('выключатель «Показывать после обновления»: выкл — окна нет, отметка ставится; в файле whatsNew; включили — старое не всплывает', async () => {
  const a = await openApp({ native: true, wn: true, data: { ...DAY(), set: { wn: 'off' } } });
  await a.wait(1200);
  assert.deepEqual(await vis(a), [false, false, false]);
  assert.equal(await a.ev(() => localStorage.getItem('bju_wn')), await a.ev(() => String(WN_LAST)));
  assert.equal(await a.ev(() => toFile(S).settings.whatsNew), 'off');
  await a.ev(() => { sets(); return 0 }); await a.wait(500);
  assert.equal(await a.ev(() => $('wnt').getAttribute('aria-checked')), 'false');
  await a.pg.click('#wnt'); await a.wait(300);
  assert.equal(await a.ev(() => [$('wnt').getAttribute('aria-checked'), 'wn' in S.set, toFile(S).settings.whatsNew === undefined].join()), 'true,false,true');
  await a.ev(() => { closeUI(); return 0 }); await a.pg.reload(); await a.pg.waitForSelector('#app .sum'); await a.wait(1200);
  assert.deepEqual(await vis(a), [false, false, false], 'включили — уже виденное не показывается');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('пропущено несколько записей — одно окно; браузер — ничего; память очищена при живом внутреннем файле — без приветствия', async () => {
  const a = await openApp({ native: true, wn: true, data: DAY() });
  await a.wait(1200); await a.ev(() => { fsHide(); return 0 }); await a.wait(400);
  await a.ev(() => { WN.unshift({ n: -2, d: '1', t: [['ok', 'Старое А', 'а']] }, { n: -1, d: '2', t: [['ok', 'Старое Б', 'б']] }); wnOpen(WN.filter(e => e.n > -5)); return 0 }); await a.wait(400);
  assert.match(await a.ev(() => $('fs').textContent), /Новое приветствие.*Раньше:.*Обновления ставятся поверх.*Старое Б.*Старое А/s);
  await a.close();
  const b = await openApp({ wn: true, empty: true }); await b.wait(1000);
  assert.deepEqual(await vis(b), [false, false, false]);
  await b.close();
  const c = await openApp({ native: true, wn: true, empty: true });
  await c.ev(() => { __P.local = JSON.stringify(toFile({ g: { p: 1, f: 1, c: 1 }, d: {}, db: [['Рис', 7, 1, 74]], saved: Date.now() })); sessionStorage.setItem('phone', JSON.stringify(__P)); localStorage.clear(); return 0 });
  await c.pg.reload(); await c.pg.waitForSelector('#app .sum'); await c.wait(1200);
  assert.equal(await c.ev(() => S.db.length), 1);
  assert.equal((await vis(c))[1], false);
  await c.close();
});
