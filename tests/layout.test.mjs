// Расположение: закреплённая нижняя панель, кнопки «Новый продукт»/«Новое блюдо», блюда в списке
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day, entry } from './helpers.mjs';

const many = () => { const d = {}; d[day()] = Array.from({ length: 12 }, (_, i) => entry(i % 6, 'Продукт ' + i, 100, 5, 5, 10)); return d; };
const dish = ['Салат', 1.2, 4.8, 4, [['порция', 300]], { w: 300, i: [{ n: 'Огурец', g: 200, p: 1.6, f: .2, c: 5 }] }];

test('нижняя панель: внизу страницы или закреплена у края экрана', async () => {
  const a = await openApp({ data: { g: { p: 120, f: 70, c: 250 }, d: many() } });
  const vh = await a.ev(() => innerHeight);
  const pos = () => a.ev(() => { const r = document.querySelector('.bt').getBoundingClientRect(); return { top: r.top, bottom: r.bottom, fixed: getComputedStyle(document.querySelector('.bt')).position === 'fixed' }; });
  let p = await pos();
  assert.equal(p.fixed, false); assert.ok(p.top > vh, 'по умолчанию — после приёмов пищи, за экраном');
  await a.ev(() => sets()); await a.wait(300);
  await a.pg.click('#bbm button:nth-child(2)'); await a.ev(() => cl()); await a.wait(400);
  await a.ev(() => scrollTo(0, 0)); await a.wait(100);
  p = await pos();
  assert.equal(p.fixed, true); assert.ok(p.bottom <= vh && p.bottom > vh - 60, 'видна у нижнего края в начале страницы');
  // в конце страницы последний элемент не прячется под панелью
  await a.ev(() => scrollTo(0, 1e6)); await a.wait(100);
  const last = await a.ev(() => [...document.querySelectorAll('#app > *')].pop().getBoundingClientRect().bottom);
  p = await pos(); assert.ok(last <= p.top, `последний блок (${last}) выше панели (${p.top})`);
  // жест «потянуть вверх» в конце страницы работает и с закреплённой панелью
  await a.ev(() => { S.set = { ...S.set, sw: 'meal' }; scrollTo(0, 1e6); }); await a.wait(150);
  await a.drag(200, 600, 200, 380, { steps: 14, ms: 30 }); await a.wait(500);
  assert.equal(await a.ev(() => isOpen), true);
  await a.ev(() => cl()); await a.wait(300);
  // тост — над панелью
  await a.ev(() => toast('Проверка')); await a.wait(400);
  const tt = await a.ev(() => document.querySelector('.tt').getBoundingClientRect().bottom);
  p = await pos(); assert.ok(tt <= p.top, 'тост не перекрывает панель');
  // карточка дня прячет панель
  await a.ev(() => togRep(true)); await a.wait(200);
  assert.equal(await a.ev(() => getComputedStyle(document.querySelector('.bt')).display), 'none');
  await a.ev(() => togRep(false)); await a.wait(200);
  // обратно
  await a.ev(() => setBb('page')); await a.wait(100); await a.ev(() => scrollTo(0, 0));
  assert.equal((await pos()).fixed, false);
  assert.equal(await a.ev(() => toFile({ ...S, set: { ...S.set, bb: 'fix' } }).settings.bottomBar), 'fixed');
  assert.equal(await a.ev(() => parseData(JSON.stringify(toFile({ ...S, set: { ...S.set, bb: 'fix', nb: 'top' } }))).set.bb), 'fix');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('кнопки «Новый продукт»/«Новое блюдо»: под списком или под поиском — во всех списках', async () => {
  const a = await openApp();
  const where = () => a.ev(() => { const lr = document.querySelector('#v1 .lr'); return lr.previousElementSibling.id === 'q' || lr.previousElementSibling.id === 'pf' && lr.previousElementSibling.previousElementSibling.id === 'q' ? 'top' : lr.previousElementSibling.id === 'ls' ? 'bottom' : '?'; });
  await a.ev(() => op(0)); await a.wait(300);
  assert.equal(await where(), 'bottom');
  const yb = (await a.pg.locator('#v1 .lr').boundingBox()).y, yl = (await a.pg.locator('#ls').boundingBox()).y;
  assert.ok(yb > yl, 'по умолчанию — после списка');
  await a.ev(() => cl()); await a.wait(300);
  await a.ev(() => setNb('top'));
  for (const open of [() => op(2), () => mng(), () => { dbt(); dring(); }]) {
    await a.ev(open); await a.wait(400);
    assert.equal(await a.ev(() => !$('v1').hidden), true);
    const b = (await a.pg.locator('#v1 .lr').boundingBox()).y, q = (await a.pg.locator('#q').boundingBox()).y, l = (await a.pg.locator('#ls').boundingBox()).y;
    assert.ok(q < b && b < l, 'между поиском и списком');
    await a.ev(() => closeUI()); await a.wait(300);
  }
  // кнопки работают из нового места
  await a.ev(() => mng()); await a.wait(300);
  await a.pg.click('#v1 .lr button:first-child'); await a.wait(300);
  assert.equal(await a.ev(() => !$('v3').hidden), true);
  assert.equal(await a.ev(() => toFile(S).settings.newButtons), 'top');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('блюда в списке: значок, подпись и фильтр «Все / Продукты / Блюда»', async () => {
  const a = await openApp({ data: { g: { p: 120, f: 70, c: 250 }, d: {}, db: [dish, ['Творог 5%', 17, 5, 1.8], ['Банан', 1.5, .2, 21.8]] } });
  await a.ev(() => mng()); await a.wait(300);
  assert.equal(await a.pg.locator('#ls .pk.dish').count(), 1);
  assert.equal(await a.pg.locator('#ls .pk.dish .dk').count(), 1);
  assert.match(await a.pg.textContent('#ls .pk.dish .mu'), /^Блюдо · /);
  assert.equal(await a.pg.locator('#ls .pk:not(.dish) .dk').count(), 0, 'у обычных продуктов значка нет');
  assert.equal(await a.ev(() => $('pf').hidden), false);
  await a.pg.click('#pf button:nth-child(3)');
  assert.deepEqual(await a.ev(() => [...document.querySelectorAll('#ls .pk .n')].map(e => e.textContent)), ['Салат']);
  await a.pg.click('#pf button:nth-child(2)');
  assert.equal(await a.pg.locator('#ls .pk.dish').count(), 0);
  await a.pg.fill('#q', 'сал'); await a.pg.dispatchEvent('#q', 'input');
  assert.match(await a.pg.textContent('#ls'), /не найдено/);
  // при следующем открытии фильтр сброшен; при добавлении (не «Все продукты») фильтра нет
  await a.ev(() => cl()); await a.wait(300); await a.ev(() => mng()); await a.wait(300);
  assert.equal(await a.pg.locator('#ls .pk').count(), 3);
  await a.ev(() => cl()); await a.wait(300); await a.ev(() => op(0)); await a.wait(300);
  assert.equal(await a.ev(() => $('pf').hidden), true);
  assert.equal(await a.pg.locator('#ls .pk.dish').count(), 1, 'значок блюда и при добавлении');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('без блюд фильтра нет', async () => {
  const a = await openApp({ data: { g: { p: 120, f: 70, c: 250 }, d: {}, db: [['Творог 5%', 17, 5, 1.8]] } });
  await a.ev(() => mng()); await a.wait(300);
  assert.equal(await a.ev(() => $('pf').hidden), true);
  await a.close();
});
