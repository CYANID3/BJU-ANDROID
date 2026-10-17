// Избранное и недавние, вес, статистика, карточка дня
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day, entry } from './helpers.mjs';

const sections = a => a.ev(() => [...document.querySelectorAll('#ls .lh')].map(e => e.textContent));
const names = a => a.ev(() => [...document.querySelectorAll('#ls .pk .n')].map(e => e.textContent));

test('избранное: звёздочка не открывает продукт, избранные — первыми', async () => {
  const a = await openApp();
  await a.ev(() => { S.rc = []; op(0); }); await a.wait(350);
  assert.deepEqual(await sections(a), [], 'без избранного и недавних — обычный список');
  const target = (await names(a))[5];
  await a.pg.locator('#ls .pk').nth(5).locator('.fv').click(); await a.wait(100);
  assert.equal(await a.ev(() => $('v1').hidden), false, 'касание звёздочки не выбирает продукт');
  assert.equal(await a.ev(n => isFav(n), target), true);
  await a.ev(() => cl()); await a.wait(300);
  await a.ev(() => op(0)); await a.wait(350);
  assert.deepEqual(await sections(a), ['Избранное', 'Все продукты']);
  assert.equal((await names(a))[0], target);
  // в поиске избранное тоже выше
  await a.pg.fill('#q', target.split(' ')[0]);
  assert.equal((await names(a))[0], target);
  assert.deepEqual(await sections(a), [], 'при поиске разделов нет');
  await a.close();
});

test('недавние: последний добавленный — первым, без повторов', async () => {
  const a = await openApp();
  for (const q of ['Гречка', 'Кефир', 'Гречка']) {
    await a.ev(() => op(0)); await a.wait(300);
    await a.pg.fill('#q', q); await a.pg.locator('#ls .pk').first().click(); await a.wait(300);
    await a.pg.fill('#gr', '100'); await a.pg.click('#ab'); await a.wait(350);
  }
  await a.ev(() => op(2)); await a.wait(300);
  assert.deepEqual(await sections(a), ['Недавние', 'Все продукты']);
  const n = await names(a);
  assert.match(n[0], /^Гречка/); assert.match(n[1], /^Кефир/);
  assert.equal(n.filter(x => /^Гречка/.test(x)).length, 1, 'продукт не повторяется в «Все продукты»');
  await a.close();
});

test('недавние собираются из дневника, переименование сохраняет избранное', async () => {
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: { [day(-1)]: [entry(0, 'Яйцо куриное', 50, 6, 6, 0)] }, db: [['Яйцо куриное', 12.7, 11.5, .7], ['Банан', 1.5, .2, 21.8]], fav: { 'Банан': 1 } } });
  await a.ev(() => op(0)); await a.wait(300);
  assert.deepEqual(await sections(a), ['Избранное', 'Недавние'], '«Все продукты» — только если есть остальные');
  assert.deepEqual(await names(a), ['Банан', 'Яйцо куриное']);
  await a.ev(() => { mng(); }); await a.wait(300);
  await a.ev(() => edit(S.db.findIndex(p => p[0] === 'Банан'))); await a.wait(300);
  await a.pg.fill('#nn', 'Банан спелый'); await a.ev(() => mk()); await a.wait(300);
  assert.equal(await a.ev(() => isFav('Банан спелый') && !isFav('Банан')), true);
  await a.close();
});

test('вес: плитка под итогом дня, запись, разница с прошлой, отключение в настройках', async () => {
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: {}, wt: { [day(-3)]: 73 } } });
  const card = a.pg.locator('#app .wtl');
  assert.match(await card.textContent(), /^ВесЗаписатьбыло 73 кг$/, 'за этот день не записан — «Записать», прошлый вес мелко');
  assert.equal(await a.ev(() => { const t = document.querySelector('#app .wtl'), s = document.querySelector('#app .sum'); return t.parentElement.classList.contains('duo') && t.getBoundingClientRect().top > s.getBoundingClientRect().bottom; }), true, 'плитка — сразу под итогом дня');
  await card.click(); await a.wait(400);
  assert.equal(await a.ev(() => !$('v10').hidden), true);
  assert.match(await a.pg.textContent('#wpv'), /Прошлая запись: 73 кг/);
  await a.pg.fill('#wv', '72,4');
  await a.pg.press('#wv', 'Enter'); await a.wait(400);
  assert.equal(await a.ev(() => S.wt[cur]), 72.4);
  assert.match(await card.textContent(), /72,4кг−0,6 кг с /);
  // кнопки ±0,1
  await card.click(); await a.wait(300);
  await a.pg.click('.wst >> nth=1'); assert.equal(await a.pg.inputValue('#wv'), '72,5');
  await a.ev(() => cl()); await a.wait(300);
  // неверное значение не сохраняется
  await card.click(); await a.wait(300); await a.pg.fill('#wv', '5'); await a.ev(() => wSave());
  assert.equal(await a.ev(() => S.wt[cur]), 72.4); await a.ev(() => cl()); await a.wait(300);
  // будущий день — без строки веса
  await a.ev(() => { cur = shiftDay(today, 1); render(); });
  assert.equal(await a.pg.locator('#app .wtl').count(), 0);
  await a.ev(() => { cur = today; render(); });
  // отключение
  await a.ev(() => sets()); await a.wait(300);
  assert.equal(await a.pg.locator('#wtm button').count(), 2, 'два пункта');
  const bw = await a.pg.locator('#wtm button').evaluateAll(b => b.map(x => Math.round(x.getBoundingClientRect().width)));
  assert.ok(Math.abs(bw[0] - bw[1]) <= 1, 'по 50%');
  await a.pg.click('#wtm button:nth-child(2)'); await a.wait(100);
  assert.equal(await a.pg.locator('#app .wtl').count(), 0);
  assert.equal(await a.ev(() => S.wt[cur]), 72.4, 'записи не удаляются');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('статистика: плитки, графики калорий, БЖУ и веса', async () => {
  const d = {}, wt = {};
  for (let i = 0; i < 5; i++) d[day(-i)] = [entry(2, 'Рис', 200, 14, 2, 148), entry(4, 'Лосось', 150, 30, 19.5, 0)];
  wt[day(-4)] = 74; wt[day(-2)] = 73.6; wt[day(0)] = 73.1;
  const a = await openApp({ data: { g: { p: 120, f: 70, c: 250 }, d, wt } });
  await a.ev(() => stats()); await a.wait(400);
  // месяц мог начаться меньше 5 дней назад — смотрим, что попало в текущий
  const n = await a.ev(() => stData().filter(x => x.n).length);
  assert.ok(n >= 1);
  assert.match(await a.pg.textContent('#stc .stt'), new RegExp(`${n}из`));
  assert.equal(await a.pg.locator('#ch1 path[data-i]').count(), n);
  assert.equal(await a.pg.locator('#ch2 polyline, #ch2 circle').count() >= 3, true);
  const wn = await a.ev(() => stData().filter(x => x.w).length);
  assert.equal(await a.pg.locator('#ch3 circle[data-i]').count(), wn);
  if (wn > 1) assert.match(await a.pg.textContent('#rd3'), /→ 73,1 кг/);
  // касание точки веса — значение дня в табло
  const pt = await a.pg.locator('#ch3 circle[data-i]').last().boundingBox();
  await a.pg.mouse.move(pt.x + pt.width / 2, pt.y + pt.height / 2); await a.pg.mouse.down();
  assert.match(await a.pg.textContent('#rd3'), /73,1 кг/);
  await a.pg.mouse.up();
  // вес выключен — графика нет
  await a.ev(() => { S.set = { ...S.set, wt: 'off' }; drawStats(); });
  assert.equal(await a.pg.locator('#ch3').count(), 0);
  // пустой месяц
  await a.ev(() => { S.set.wt = 'on'; stMv(-3); });
  assert.match(await a.pg.textContent('#stc'), /записей нет/);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('карточка дня: тройное касание, двойное не включает, «Назад» выходит', async () => {
  const a = await openApp({ data: { g: { p: 120, f: 70, c: 250 }, d: { [day()]: [entry(0, 'Овсяные хлопья', 60, 7.4, 3.7, 35.7), entry(2, 'Гречка (сухая)', 80, 10.1, 2.6, 49.7)] } } });
  await a.tapN('#app .sum', 2); await a.wait(600);
  assert.equal(await a.ev(() => !!REP), false);
  await a.tapN('#app .sum', 3); await a.wait(500);
  assert.equal(await a.ev(() => !!REP), true);
  assert.equal(await a.pg.locator('#app .rep').count(), 1);
  assert.equal(await a.pg.locator('#app .rp-w').count(), 0, 'без записи веса плашки нет');
  await a.ev(() => { S.wt = { [today]: 72.4, [shiftDay(today, -2)]: 72.9 }; render(); });
  assert.match(await a.pg.textContent('#app .rp-w'), /72,4 кг−0,5/);
  await a.ev(() => { delete S.wt[today]; render(); });
  assert.equal(await a.pg.locator('#app .rp-w').count(), 0, 'нет записи за день — нет плашки');
  await a.ev(() => { S.set = { ...S.set, wt: 'off' }; render(); });
  assert.equal(await a.pg.locator('#app .rp-w').count(), 0);
  assert.equal(await a.ev(() => BJU_onBack()), true);
  assert.equal(await a.ev(() => !!REP), false);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('жест вверх: статистика и вес; при жесте «Вес» кнопка «+ вес» скрыта', async () => {
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: {}, set: { sw: 'stat' } } });
  const pullUp = async () => { await a.ev(() => scrollTo(0, 1e6)); await a.wait(150); await a.drag(200, 700, 200, 520, { steps: 14, ms: 30 }); await a.wait(500); };
  await pullUp();
  assert.equal(await a.ev(() => isOpen && !$('v9').hidden), true, 'открылась статистика');
  await a.ev(() => cl()); await a.wait(300);
  await a.ev(() => sets()); await a.wait(300);
  assert.deepEqual(await a.ev(() => [...document.querySelectorAll('#sgm button b')].map(b => b.textContent)), ['Приём пищи', 'Новый продукт', 'Статистика', 'Вес', 'Выключено']);
  assert.equal(await a.pg.locator('#sgm button:visible').count(), 1, 'список свёрнут до выбранного');
  await a.pg.click('#sgm button.on'); await a.wait(250);
  assert.equal(await a.pg.locator('#sgm button:visible').count(), 5, 'касание раскрывает');
  await a.pg.click('#sgm button:nth-child(4)'); await a.wait(100);
  assert.equal(await a.pg.locator('#sgm button:visible').count(), 1, 'выбор сворачивает');
  assert.equal(await a.pg.textContent('#sgm .on b'), 'Вес');
  assert.equal(await a.ev(() => toFile(S).settings.pullUpAction), 'weight');
  assert.equal(await a.ev(() => parseData(ser()).set.sw), 'wt');
  await a.ev(() => cl()); await a.wait(300);
  assert.equal(await a.pg.locator('#app .wtl').count(), 0, '«Записать» скрыта, вес пишется жестом');
  await pullUp();
  assert.equal(await a.ev(() => isOpen && !$('v10').hidden), true, 'открылся ввод веса');
  await a.pg.fill('#wv', '70'); await a.pg.press('#wv', 'Enter'); await a.wait(400);
  assert.match(await a.pg.textContent('#app .wtl'), /70кг/, 'записанный вес виден');
  // вес выключен — пункта «Вес» нет, жест не срабатывает
  await a.ev(() => { S.set = { ...S.set, wt: 'off' }; sets(); }); await a.wait(300);
  assert.equal(await a.pg.locator('#sgm button').count(), 4);
  assert.equal(await a.ev(() => swAct()), 'off');
  await a.ev(() => cl()); await a.wait(300);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('плитки под итогом: вес и неделя — одной высоты, рядом; без одной — вторая на всю ширину', async () => {
  const d = {}; for (let i = 1; i < 4; i++) d[day(-i)] = [entry(2, 'Рис', 100, 7, 1, 74)];
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d, wt: { [day(-1)]: 81 } } });
  const geo = () => a.ev(() => [...document.querySelectorAll('#app .duo > *')].map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.height), Math.round(r.width)]; }));
  let g = await geo();
  assert.equal(g.length, 2); assert.equal(g[0][0], g[1][0]); assert.equal(g[0][1], g[1][1], 'одна высота'); assert.ok(Math.abs(g[0][2] - g[1][2]) <= 1, 'одна ширина');
  assert.match(await a.pg.textContent('#app .duo .dtl:not(.wtl)'), /В среднем · 3 дн\.333ккалбелок 7 г$/);
  await a.pg.click('#app .wtl'); await a.wait(300); await a.pg.fill('#wv', '80'); await a.pg.press('#wv', 'Enter'); await a.wait(300);
  const g2 = await geo(); assert.deepEqual(g2.map(x => x[1]), g.map(x => x[1]), 'после записи высота та же');
  assert.match(await a.pg.textContent('#app .wtl'), /80кг−1 кг с /);
  await a.pg.click('#app .duo .dtl:not(.wtl)'); await a.wait(300);
  assert.equal(await a.ev(() => isOpen && !$('v9').hidden), true, 'неделя открывает статистику');
  await a.ev(() => { cl(); S.set = { ...S.set, wt: 'off' }; render(); }); await a.wait(300);
  g = await geo(); const card = await a.pg.locator('#app .sum').boundingBox();
  assert.equal(g.length, 1); assert.ok(Math.abs(g[0][2] - card.width) <= 1, 'одна плитка — на всю ширину');
  await a.close();
});
