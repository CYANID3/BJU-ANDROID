// Ревизия 28: поиск продуктов — опечатки, латиница ↔ кириллица, внутри слова, лучшие совпадения сверху, выделение найденного
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp } from './helpers.mjs';

const NAMES = ['Кыргыз Курут копчёный', 'Творог 1% Савушкин', 'Творог 5%', 'Шаурма говядина', 'TEOS Греческий йогурт со вкусом', 'Pepsi Zero', 'KitKat Double Chocolate', 'RedBull Персик', 'Банан', 'Coca-Cola', 'Snickers', 'Гречка', 'Рис', 'Хлебцы рисовые', 'Рисовая каша', 'Чизбургер', 'Куриная грудка', 'Курица гриль', 'Экспонента', 'Кефир 1%', 'Йогурт греческий', 'Сникерс мини', 'Хачапури', 'Персик'];
const data = { g: { p: 120, f: 70, c: 250 }, d: {}, db: NAMES.map((n, i) => [n, i % 20, i % 7, i % 30]) };
const find = (a, q) => a.ev(q => { $('q').value = q; lst(); return [...document.querySelectorAll('#ls .pk .n')].map(e => e.textContent) }, q);

test('поиск: примеры из документа', async () => {
  const a = await openApp({ data });
  await a.ev(() => { mng(); return 0 }); await a.wait(500);
  const E = {
    'грчека': ['Гречка'], 'тварог': ['Творог 1% Савушкин', 'Творог 5%'],
    'пепси': ['Pepsi Zero'], 'pepsi': ['Pepsi Zero'], 'exponenta': ['Экспонента'], 'кока': ['Coca-Cola'], 'snikers': ['Snickers', 'Сникерс мини'],
    'xachapuri': ['Хачапури'], 'редбул': ['RedBull Персик'], 'jogurt': ['TEOS Греческий йогурт со вкусом', 'Йогурт греческий'],
    'бургер': ['Чизбургер'], 'cola': ['Coca-Cola', 'KitKat Double Chocolate'],
    'кур': ['Куриная грудка', 'Курица гриль', 'Кыргыз Курут копчёный'], 'йогурт': ['Йогурт греческий', 'TEOS Греческий йогурт со вкусом'],
    'рис': ['Рис', 'Рисовая каша', 'Хлебцы рисовые'], '1%': ['Творог 1% Савушкин', 'Кефир 1%'], 'ка': ['Рисовая каша'], 'греч йог': ['Йогурт греческий', 'TEOS Греческий йогурт со вкусом'],
  };
  for (const [q, want] of Object.entries(E)) assert.deepEqual(await find(a, q), want, q);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('поиск: всё, что находилось раньше, находится и сейчас (по началу слов)', async () => {
  const a = await openApp({ data });
  await a.ev(() => { mng(); return 0 }); await a.wait(500);
  const old = (n, q) => { const W = s => s.toLowerCase().replace(/ё/g, 'е').split(/[\s,()%.\-]+/).filter(Boolean); const t = W(q); return t.every(x => W(n).some(w => w.startsWith(x))) };
  for (const q of ['к', 'кур', 'тв', 'р', 'гре', 'pe', 'со вкус', 'творог сав', 'ё', 'chocolate', '5']) {
    const got = await find(a, q); for (const n of NAMES.filter(n => old(n, q))) assert.ok(got.includes(n), `${q}: пропал ${n}`);
  }
  await a.close();
});

test('поиск: найденное выделено цветом (только совпавшие буквы), при добавлении — избранное выше внутри группы', async () => {
  const a = await openApp({ data: { ...data, fav: { 'Курица гриль': 1 } } });
  await a.ev(() => { mng(); return 0 }); await a.wait(500);
  await find(a, 'кур');
  assert.deepEqual(await a.ev(() => [...document.querySelectorAll('#ls .pk .n')].slice(0, 3).map(e => e.innerHTML)), ['<b class="hl">Кур</b>иная грудка', '<b class="hl">Кур</b>ица гриль', 'Кыргыз <b class="hl">Кур</b>ут копчёный']);
  assert.equal(await a.ev(() => { $('q').value = 'пепси'; lst(); return document.querySelector('#ls .pk .n').innerHTML }), 'Pepsi Zero', 'латинская запись — без выделения');
  const st = await a.ev(() => { $('q').value = 'кур'; lst(); const b = document.querySelector('#ls .pk .n .hl'), cs = getComputedStyle(b); return [cs.fontWeight, cs.color !== getComputedStyle(b.parentElement).color] });
  assert.deepEqual(st, ['800', true]);
  await a.ev(() => { closeUI(); return 0 }); await a.wait(400);
  await a.ev(() => { op(0); return 0 }); await a.wait(500);
  assert.deepEqual((await find(a, 'кур')).slice(0, 3), ['Курица гриль', 'Куриная грудка', 'Кыргыз Курут копчёный'], 'избранное выше, но точные — раньше примерных');
  await a.close();
});

test('поиск: 600 продуктов — быстро на каждое нажатие', async () => {
  const db = Array.from({ length: 600 }, (_, i) => [NAMES[i % NAMES.length] + ' ' + i, 1, 1, 1]);
  const a = await openApp({ data: { ...data, db } });
  await a.ev(() => { mng(); return 0 }); await a.wait(500);
  const ms = await a.ev(() => { const t = performance.now(); for (const q of ['к', 'ку', 'кур', 'кури', 'тварог', 'pepsi', 'грчека', 'zzzz']) { $('q').value = q; lst() } return (performance.now() - t) / 8 });
  console.log(`# поиск: ${ms.toFixed(1)} мс на нажатие`); assert.ok(ms < 40, `в среднем ${ms.toFixed(1)} мс на нажатие`);
  await a.close();
});

test('поиск: числа не склеиваются («19» не находит «119»), двойные буквы — да (snikkers = snickers)', async () => {
  const a = await openApp({ data: { ...data, db: [['Продукт 19', 1, 1, 1], ['Продукт 119', 1, 1, 1], ['Snickers', 1, 1, 1]] } });
  await a.ev(() => { mng(); return 0 }); await a.wait(500);
  assert.deepEqual(await find(a, 'продукт 19'), ['Продукт 19']);
  assert.deepEqual(await find(a, 'сникерс'), ['Snickers']);
  await a.close();
});
