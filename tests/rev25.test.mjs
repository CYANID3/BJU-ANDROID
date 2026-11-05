// Ревизия 25: список продуктов по умолчанию пуст; разовая уборка неиспользованных стандартных продуктов прежних версий;
// уведомление можно смахнуть вниз или в сторону.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day, SAMPLE } from './helpers.mjs';

test('новая установка: продуктов нет, в списке — подсказка, как их добавить', async () => {
  const a = await openApp({ empty: true });
  assert.equal(await a.ev(() => S.db.length), 0);
  await a.ev(() => { mng(); return 0 }); await a.wait(500);
  assert.match(await a.ev(() => $('ls').textContent), /Список пока пуст.*«Новый продукт».*«Добавить продукты из файла»/);
  await a.ev(() => { $('q').value = 'рис'; lst(); return 0 });
  assert.match(await a.ev(() => $('ls').textContent), /Ничего не найдено/);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('обновление: стандартные продукты, которыми не пользовались, убираются один раз; «Отменить» возвращает', async () => {
  const edited = SAMPLE.find(p => p[0] === 'Лосось').slice(); edited[1] = 22;
  const db = [...SAMPLE.map(p => p[0] === 'Лосось' ? edited : p), ['Мой хлеб', 8, 2, 48], ['Каша', 5, 2, 20, [['порция', 300]], { w: 300, i: [{ n: 'Гречка', g: 100, p: 12, f: 3, c: 62 }] }]];
  const a = await openApp({ b0: true, data: { g: { p: 120, f: 70, c: 250 }, db, d: { [day(-3)]: [{ m: 0, n: 'Творог 5%', g: 100, p: 17, f: 5, c: 3 }] }, uc: { 'Минтай': 2 }, fav: { 'Кефир 1%': 1 } } });
  await a.wait(1200);
  const names = await a.ev(() => S.db.map(p => p[0]));
  const kept = ['Лосось', 'Минтай', 'Творог 5%', 'Кефир 1%', 'Гречка'].filter(n => SAMPLE.some(p => p[0] === n));
  assert.deepEqual(names.filter(n => SAMPLE.some(p => p[0] === n)).sort(), kept.sort(), 'остались изменённые, записанные, избранные и из блюд');
  assert.ok(names.includes('Мой хлеб') && names.includes('Каша'));
  assert.match(await a.ev(() => $('tm').textContent), new RegExp('которыми вы не пользовались: ' + (SAMPLE.length - kept.length)));
  await a.ev(() => { undo(); return 0 });
  assert.equal(await a.ev(() => S.db.length), db.length);
  await a.pg.reload(); await a.pg.waitForFunction(() => document.querySelector('#app .sum')); await a.wait(1200);
  assert.equal(await a.ev(() => S.db.length), db.length, 'второй раз не убирает');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('уведомление смахивается в сторону и вниз; короткое касание — нет', async () => {
  const a = await openApp();
  const box = () => a.ev(() => { const r = $('tt').getBoundingClientRect(); return { x: r.left + 40, y: r.top + r.height / 2 } });
  const on = () => a.ev(() => $('tt').classList.contains('on'));
  await a.ev(() => { toast('Проверка', 0, 9000); return 0 }); await a.wait(400);
  let b = await box(); await a.drag(b.x, b.y, b.x + 6, b.y + 3, { steps: 3 }); await a.wait(400);
  assert.equal(await on(), true, 'короткое касание не убирает');
  await a.drag(b.x, b.y, b.x + 220, b.y + 10); await a.wait(400);
  assert.equal(await on(), false, 'смахнули в сторону');
  await a.ev(() => { toast('Ещё раз', 0, 9000); return 0 }); await a.wait(400);
  b = await box(); assert.equal(await a.ev(() => $('tt').style.transform), '');
  const day0 = await a.ev(() => cur);
  await a.drag(b.x, b.y, b.x, b.y + 60); await a.wait(400);
  assert.equal(await on(), false, 'смахнули вниз');
  assert.equal(await a.ev(() => cur), day0, 'день не перелистнулся');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('«Файл данных» без файла: нет «Начать дневник заново», вместо «Переключиться» — «Выбрать существующий файл»', async () => {
  const a = await openApp({ native: true });
  await a.ev(() => fp()); await a.wait(400);
  const rows = () => a.ev(() => [...document.querySelectorAll('#v5 .row:not([hidden]) .tx')].map(e => e.firstChild.textContent));
  assert.deepEqual(await rows(), ['Новый файл', 'Выбрать существующий файл', 'Добавить продукты из файла']);
  await a.ev(async () => { setMF(await BJU_NATIVE.file.create('bju.json')); fp(); return 0 }); await a.wait(400);
  assert.deepEqual(await rows(), ['Новый файл', 'Начать дневник заново', 'Переключиться на другой файл', 'Добавить продукты из файла']);
  await a.close();
});

test('галочки импорта продуктов: отмеченная — с видимой галкой (стили новых галочек их не задевают)', async () => {
  const a = await openApp();
  const r = await a.ev(() => { const g = document.createElement('div'); g.className = 'grp'; g.innerHTML = `<button class="row mgk on"><span class="tx">Банан</span><span class="cb">${ic('check')}</span></button>`; $('v12').appendChild(g); $('v12').hidden = false;
    const s = g.querySelector('.cb svg'), cs = getComputedStyle(s); return { op: cs.opacity, col: getComputedStyle(g.querySelector('.cb')).color, bg: getComputedStyle(g.querySelector('.cb')).backgroundColor } });
  assert.equal(r.op, '1'); assert.notEqual(r.col, 'rgba(0, 0, 0, 0)'); assert.notEqual(r.col, r.bg);
  await a.close();
});
