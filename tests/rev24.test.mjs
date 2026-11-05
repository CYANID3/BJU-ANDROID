// Ревизия 24: «Файл данных» — «Новый файл», «Начать дневник заново» (новый файл без записей, что взять с собой,
// удалить ли старый), «Переключиться на другой файл»; «Отключить файл» с выбором, что останется в приложении.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day } from './helpers.mjs';

const DATA = {
  g: { p: 140, f: 70, c: 230 }, d: { [day(0)]: [{ m: 0, n: 'Овсянка', g: 60, p: 7, f: 3, c: 36 }], [day(-1)]: [{ m: 2, n: 'Рис', g: 100, p: 7, f: 1, c: 78 }] },
  db: [['Рис', 7, 1, 78], ['Овсянка', 12, 6, 60]], wt: { [day(0)]: 80 }, nt: { [day(0)]: 'Был в гостях' }, set: { th: 'light', pf: { n: 'Данил', c: '#3d74d9' } }, fav: { 'Рис': 1 }
};
const old = () => async () => { const f = await BJU_NATIVE.file.create('old.json'); setMF(f); await nativeFlush(); return 0 };
const rows = () => [...document.querySelectorAll('#v5 .row:not([hidden]) .tx')].map(e => e.firstChild.textContent);

test('«Файл данных» в APK: четыре действия, без пояснялок', async () => {
  const a = await openApp({ native: true, data: DATA });
  await a.ev(old()); await a.ev(() => fp()); await a.wait(400);
  assert.deepEqual(await a.ev(rows), ['Новый файл', 'Начать дневник заново', 'Переключиться на другой файл', 'Добавить продукты из файла']);
  assert.equal(await a.ev(() => $('foff').hidden), false);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('«Начать дневник заново»: новый файл без записей, продукты и норма с собой, старый файл удалён', async () => {
  const a = await openApp({ native: true, data: DATA });
  await a.ev(old()); await a.ev(() => fp()); await a.wait(400); await a.pg.click('#rsb'); await a.wait(400);
  assert.equal(await a.ev(() => !$('v21').hidden), true);
  assert.equal(await a.ev(() => $('rsok').textContent), 'Выбрать, где сохранить');
  assert.match(await a.ev(() => $('v21').textContent), /2 продукта.*Удалить старый файл.*old\.json · 2 дня с записями/s);
  // «Настройки и профиль» не берём, «Удалить старый файл» — отмечаем
  await a.pg.click('#v21 .row:nth-child(3)'); await a.pg.click('#v21 .dgc');
  assert.deepEqual(await a.ev(() => ({ ...RS })), { p: 1, g: 1, s: 0, del: 1 });
  await a.ev(() => { rsGo(); return 0 }); await a.wait(600);
  const r = await a.ev(() => ({ mf: MF && MF.name, files: Object.keys(__P.files), f: __P.files['content://x/bju-data.json'], d: S.d, wt: S.wt, nt: S.nt, set: S.set, db: S.db.map(p => p[0]), g: S.g, open: isOpen, tm: $('tm').textContent }));
  assert.equal(r.mf, 'bju-data.json');
  assert.deepEqual(r.files, ['content://x/bju-data.json'], 'старый файл удалён');
  const F = JSON.parse(r.f);
  assert.deepEqual(F.diary, {}); assert.deepEqual(F.weight, {}); assert.equal(F.notes, undefined); assert.deepEqual(F.settings, {});
  assert.deepEqual(F.products.map(p => p.name), ['Рис', 'Овсянка']); assert.equal(F.products[0].favorite, true);
  assert.deepEqual(F.goals, { protein: 140, fat: 70, carbs: 230 });
  assert.deepEqual(r.d, {}); assert.deepEqual(r.wt, {}); assert.deepEqual(r.nt, {}); assert.deepEqual(r.set, {}); assert.deepEqual(r.g, { p: 140, f: 70, c: 230 });
  assert.equal(r.open, false); assert.match(r.tm, /Дневник начат заново · «bju-data\.json» · старый файл удалён/);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('«Начать дневник заново» без галочек: старый файл остаётся как был, отмена выбора файла ничего не меняет', async () => {
  const a = await openApp({ native: true, data: DATA });
  await a.ev(old()); const before = await a.ev(() => __P.files['content://x/old.json']);
  // отмена системного окна — всё как было
  await a.ev(() => { BJU_NATIVE.file.create0 = BJU_NATIVE.file.create; BJU_NATIVE.file.create = async () => { throw Error('Отменено') }; rsOpen(); rsGo(); return 0 }); await a.wait(400);
  assert.equal(await a.ev(() => dnc(S.d)), 2); assert.equal(await a.ev(() => MF.name), 'old.json');
  await a.ev(() => { BJU_NATIVE.file.create = BJU_NATIVE.file.create0; RS = { p: 0, g: 0, s: 1, del: 0 }; rsGo(); return 0 }); await a.wait(600);
  const r = await a.ev(() => ({ old: __P.files['content://x/old.json'], db: S.db.length, base: BASE.length, g: S.g, th: S.set.th, mf: MF.name }));
  assert.equal(r.old, before, 'старый файл не тронут');
  assert.equal(r.db, 0, 'продуктов нет — как после установки'); assert.deepEqual(r.g, { p: 120, f: 70, c: 250 }); assert.equal(r.th, 'light'); assert.equal(r.mf, 'bju-data.json');
  await a.close();
});

test('«Отключить файл»: выбор — оставить данные или очистить приложение (продукты можно оставить); файл не меняется', async () => {
  for (const [m, p] of [['keep', 1], ['clear', 1], ['clear', 0]]) {
    const a = await openApp({ native: true, data: DATA });
    await a.ev(old()); const before = await a.ev(() => __P.files['content://x/old.json']);
    await a.ev(() => fp()); await a.wait(400); await a.pg.click('#foff'); await a.wait(400);
    assert.equal(await a.ev(() => [$('ofok').textContent, $('ofp').hidden].join()), 'Отключить,true');
    if (m === 'clear') { await a.pg.click('#v22 [data-m="clear"]'); assert.equal(await a.ev(() => [$('ofok').textContent, $('ofp').hidden].join()), 'Отключить и очистить,false'); if (!p) await a.pg.click('#ofp .row') }
    await a.pg.click('#ofok'); await a.wait(600);
    const r = await a.ev(() => ({ mf: MF, f: __P.files['content://x/old.json'], days: dnc(S.d), db: S.db.length, base: BASE.length, local: JSON.parse(__P.local), saved: localStorage.getItem('bju_file') }));
    assert.equal(r.mf, null); assert.equal(r.saved, null); assert.equal(r.f, before, 'файл не изменился');
    if (m === 'keep') { assert.equal(r.days, 2); assert.equal(r.db, 2) }
    else { assert.equal(r.days, 0); assert.equal(r.db, p ? 2 : 0); assert.deepEqual(r.local.diary, {}) }
    assert.deepEqual(a.errors, []);
    await a.close();
  }
});

test('запуск в APK: заставку убирает страница — после чтения данных и системных отступов, один раз', async () => {
  const a = await openApp({ native: true, data: DATA });
  // отступов от системы в моке нет — страница ждёт их до 1,5 с, потом всё равно отпускает заставку
  await a.wait(1800);
  assert.equal(await a.ev(() => window.__R), 1);
  // с отступами — сразу
  await a.ctx.addInitScript(() => { window.BJU_insetsOk = true });
  await a.pg.reload(); await a.pg.waitForFunction(() => window.__R === 1, null, { timeout: 1000 });
  assert.deepEqual(a.errors, []);
  await a.close();
});
