// Расположение: закреплённая нижняя панель, кнопки «Новый продукт»/«Новое блюдо», блюда в списке
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day, entry } from './helpers.mjs';

const many = () => { const d = {}; d[day()] = Array.from({ length: 12 }, (_, i) => entry(i % 6, 'Продукт ' + i, 100, 5, 5, 10)); return d; };
const dish = ['Салат', 1.2, 4.8, 4, [['порция', 300]], { w: 300, i: [{ n: 'Огурец', g: 200, p: 1.6, f: .2, c: 5 }] }];

test('нижняя панель: в конце дня (по умолчанию) или всегда видна', async () => {
  const a = await openApp({ data: { g: { p: 120, f: 70, c: 250 }, d: many() } });
  const vh = await a.ev(() => innerHeight);
  const pos = () => a.ev(() => { const b = document.querySelector('.bt'), r = b.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, fixed: getComputedStyle(b).position === 'fixed' }; });
  let p = await pos();
  assert.equal(p.fixed, false); assert.ok(p.top > vh, 'по умолчанию — после приёмов пищи');
  await a.ev(() => sets()); await a.wait(300);
  assert.equal(await a.ev(() => $('bbm').getAttribute('aria-checked')), 'false', '«Закрепить нижнюю панель» выключено');
  await a.pg.click('#bbm'); await a.ev(() => cl()); await a.wait(400);
  for (const y of [0, 300, 1e6]) {
    await a.ev(y => scrollTo(0, y), y); await a.wait(150);
    p = await pos(); assert.equal(p.fixed, true); assert.ok(p.bottom <= vh && p.bottom > vh - 60, 'видна у края при любой прокрутке');
  }
  const last = await a.ev(() => [...document.querySelectorAll('#app > *')].pop().getBoundingClientRect().bottom);
  assert.ok(last <= p.top, `последний блок (${last}) выше панели (${p.top})`);
  await a.ev(() => { S.set = { ...S.set, sw: 'meal' }; scrollTo(0, 1e6); }); await a.wait(150);
  await a.drag(200, 600, 200, 380, { steps: 14, ms: 30 }); await a.wait(500);
  assert.equal(await a.ev(() => isOpen), true, 'жест «потянуть вверх» работает');
  await a.ev(() => cl()); await a.wait(300);
  await a.ev(() => toast('Проверка')); await a.wait(400);
  const tt = await a.ev(() => document.querySelector('.tt').getBoundingClientRect().bottom);
  p = await pos(); assert.ok(tt <= p.top, 'тост не перекрывает панель');
  await a.ev(() => togRep(true)); await a.wait(200);
  assert.equal(await a.ev(() => getComputedStyle(document.querySelector('.bt')).display), 'none');
  await a.ev(() => togRep(false)); await a.wait(200);
  await a.ev(() => setBb('page')); await a.wait(100); await a.ev(() => scrollTo(0, 0));
  assert.equal((await pos()).fixed, false);
  // сохранённое раньше «floating» открывается как «В конце дня»
  assert.equal(await a.ev(() => { S.set = { ...S.set, bb: 'float' }; return bbv(); }), 'page');
  assert.equal(await a.ev(() => toFile({ ...S, set: { ...S.set, bb: 'fix' } }).settings.bottomBar), 'fixed');
  assert.equal(await a.ev(() => parseData(JSON.stringify(toFile({ ...S, set: { ...S.set, bb: 'fix' } }))).set.bb), 'fix');
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

test('закреплённая панель не закрывает конец дня — в «Удобном» и «Компактном» виде, с системным отступом', async () => {
  const E = Array.from({ length: 12 }, (_, i) => entry(i % 6, 'Продукт ' + i, 100, 5, 3, 10));
  for (const ui of ['comfy', 'compact']) for (const sab of [0, 24]) {
    const a = await openApp({ data: { g: { p: 120, f: 70, c: 250 }, d: { [day()]: E }, wt: { [day()]: 82 }, set: { bb: 'fix', ui } } });
    await a.ev(s => document.documentElement.style.setProperty('--sab', s + 'px'), sab); await a.wait(200);
    await a.ev(() => scrollTo(0, 1e6)); await a.wait(200);
    const r = await a.ev(() => { const bt = document.querySelector('.bt').getBoundingClientRect(), els = [...document.querySelectorAll('#app > *')], last = els[els.length - 1].getBoundingClientRect(); return [last.bottom, bt.top]; });
    assert.ok(r[0] <= r[1] - 8, `${ui}, отступ ${sab}: низ дня ${Math.round(r[0])}, верх панели ${Math.round(r[1])}`);
    await a.close();
  }
});

test('настройки: четыре раздела, переключатели «да / нет», почти без пояснений', async () => {
  const a = await openApp();
  await a.ev(() => sets()); await a.wait(300);
  assert.deepEqual(await a.ev(() => [...document.querySelectorAll('#v7 .sgt')].map(e => e.firstChild.nextSibling.textContent)), ['Оформление', 'Главный экран', 'Жесты и вибрация', 'Данные']);
  assert.equal(await a.ev(() => [...document.querySelectorAll('#v7 .sd')].filter(e => !e.hidden && e.textContent.trim()).length), 0, 'по умолчанию без пояснительных абзацев');
  assert.equal(await a.ev(() => document.querySelectorAll('#v7 .tg').length), 4);
  await a.pg.click('#nbm'); assert.equal(await a.ev(() => nbv()), 'top');
  await a.pg.click('#nbm'); assert.equal(await a.ev(() => nbv()), 'bottom');
  await a.pg.click('#snm button:nth-child(2)');
  assert.equal(await a.ev(() => !$('snd').hidden && $('snd').textContent.length < 80), true, 'короткая подсказка — только для двойного касания');
  assert.deepEqual(a.errors, []);
  await a.close();
});
