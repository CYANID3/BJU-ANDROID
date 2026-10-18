// Избранное и недавние, вес, статистика, карточка дня
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day, entry } from './helpers.mjs';
import { readFileSync } from 'node:fs';

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
  assert.equal(await a.ev(() => $('wtm').getAttribute('aria-checked')), 'true', 'переключатель «Отслеживать вес» включён');
  await a.pg.click('#wtm'); await a.wait(100);
  assert.equal(await a.ev(() => $('wtm').getAttribute('aria-checked')), 'false');
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
  assert.equal(await a.pg.locator('#ch1 g[data-i]').count(), n);
  assert.ok(await a.pg.locator('#ch1 g[data-i] [fill="var(--p)"]').count() >= 1, 'столбцы сложены из Б / Ж / У');
  assert.equal(await a.pg.locator('#stc .sthero .mtl').count(), 3, 'средний день — три плитки как на главном');
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

test('компактная карточка дня целиком помещается на экран (разные экраны, до 25 продуктов)', async () => {
  const E = Array.from({ length: 25 }, (_, i) => entry(i % 6, 'Продукт номер ' + i, 100 + i, 5, 3, 10));
  const a = await openApp({ data: { g: { p: 120, f: 70, c: 250 }, d: { [day()]: E }, wt: { [day()]: 72.4 } } });
  for (const [w, h] of [[412, 915], [412, 780], [360, 700], [360, 640]]) {
    await a.pg.setViewportSize({ width: w, height: h });
    await a.ev(() => { togRep(false); togRep(true); setRepMode(1); }); await a.wait(450);
    const r = await a.ev(() => { const c = document.querySelector('#app .rep').getBoundingClientRect(); return { b: c.bottom, ih: innerHeight, z: parseFloat(document.querySelector('#app .rep').style.zoom || 1) }; });
    assert.ok(r.b <= r.ih - 4, `${w}×${h}: низ карточки ${Math.round(r.b)} при высоте экрана ${r.ih}`);
    assert.ok(r.z >= 0.68, `${w}×${h}: не мельче 68 % (сейчас ${r.z.toFixed(2)})`);
  }
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('изменение записи без выбора приёма; значки акцентом читаемы при любом акценте; удаление — плавно', async () => {
  for (const scheme of ['dark', 'light']) for (const ac of ['#64748b', '#8b5cf6', '#f5c518']) {
    const a = await openApp({ scheme, data: { g: { p: 100, f: 60, c: 200 }, d: {}, db: [], set: { ac, tn: 'strong' } } });
    const c = await a.ev(() => { const cs = getComputedStyle(document.documentElement), v = k => cs.getPropertyValue(k).trim(), d = isDark();
      return Math.min(...[v('--card'), v('--sub'), v('--bar')].map(b => crt(v('--act'), hexMix(v('--ac') || (d ? '#5b9cf0' : '#2f7de1'), b, d ? .18 : .14)))); });
    assert.ok(c >= 4.5, `${scheme} ${ac}: контраст значков ${c.toFixed(2)}`);
    await a.close();
  }
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: { [day()]: [entry(0, 'Яйцо', 50, 6, 5, .5), entry(0, 'Хлеб', 30, 2, 1, 15)] }, db: [] } });
  await a.ev(() => ee(0)); await a.wait(300);
  assert.equal(await a.ev(() => $('em').hidden), true, 'при изменении приём пищи не переключается');
  await a.ev(() => cl()); await a.wait(300);
  const g = await a.ev(() => { const n = document.body.children.length; del(0); return document.body.children.length - n; });
  assert.equal(g, 1, 'удалённая запись тает на своём месте');
  await a.wait(500);
  assert.equal(await a.ev(() => document.querySelectorAll('#app .it').length), 1);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('карточка дня по умолчанию открывается в компактном виде', async () => {
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: { [day()]: [entry(0, 'Яйцо', 50, 6, 5, .5)] }, db: [] } });
  await a.ev(() => togRep(true)); await a.wait(400);
  assert.equal(await a.ev(() => repMode === 1 && !!document.querySelector('#app .rep.dense')), true);
  await a.ev(() => setRepMode(2)); await a.wait(300);
  assert.equal(await a.ev(() => !!document.querySelector('#app .rep.dense')), false);
  await a.close();
});

test('сегменты: таблетка переезжает к выбранному; перекус по двойному касанию выезжает и уезжает плавно', async () => {
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: { [day()]: [entry(0, 'Яйцо', 50, 6, 5, .5)] }, db: [], set: { sn: 'tap' } } });
  await a.ev(() => sets()); await a.wait(400);
  const x0 = await a.ev(() => $('thm').style.getPropertyValue('--skx'));
  await a.ev(() => $('thm').querySelectorAll('button')[2].click()); await a.wait(80);
  const st = await a.ev(() => ({ sk: $('thm').classList.contains('sk'), x: $('thm').style.getPropertyValue('--skx'), b: $('thm').querySelector('button.on').offsetLeft + 'px' }));
  assert.ok(st.sk && st.x === st.b && st.x !== x0, JSON.stringify(st));
  await a.ev(() => cl()); await a.wait(400);
  const kf = () => { const an = document.querySelector('#app .snk').getAnimations()[0]; return an ? an.effect.getKeyframes().map(k => k.height) : null; };
  assert.deepEqual(await a.ev(k => { snToggle(0); return new Function('return (' + k + ')()')(); }, kf.toString()), ['0px', '42px'], 'выезжает: высота от нуля до своей');
  await a.wait(500);
  assert.deepEqual(await a.ev(k => { snToggle(0); return [document.querySelectorAll('#app .snk').length, new Function('return (' + k + ')()')()]; }, kf.toString()), [1, ['42px', '0px']], 'уезжает: строка ещё на месте и сжимается');
  await a.wait(700);
  assert.equal(await a.pg.locator('#app .snk').count(), 0);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('добавление: можно сменить приём; после добавления — снова список, «Отменить» убирает запись', async () => {
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: {}, db: [['Творог 5%', 17, 5, 1.8], ['Банан', 1.5, .2, 21.8]] } });
  await a.ev(() => op(2)); await a.wait(350);
  assert.equal(await a.ev(() => !$('mc').hidden && $('mc').querySelector('.on').textContent), 'Обед');
  await a.pg.click('#mc button:has-text("Перекус 2")'); await a.wait(100);
  assert.equal(await a.ev(() => [am, $('st').textContent].join()), '3,Добавить: Перекус 2');
  await a.pg.locator('#ls .pk').first().click(); await a.wait(350);
  assert.equal(await a.ev(() => !$('em').hidden && $('em').querySelector('.on').textContent), 'Перекус 2', 'и на экране количества');
  await a.pg.click('#em button:has-text("Ужин")');
  await a.pg.fill('#gr', '150'); await a.pg.click('#ab'); await a.wait(450);
  assert.equal(await a.ev(() => isOpen && !$('v1').hidden && $('q').value === ''), true, 'вернулись в список');
  assert.equal(await a.ev(() => S.d[cur].length === 1 && S.d[cur][0].m), 4);
  await a.ev(() => undo()); await a.wait(300);
  assert.equal(await a.ev(() => S.d[cur].length), 0, 'отмена убирает добавленное');
  await a.ev(() => cl()); await a.wait(300);
  await a.ev(() => { S.d[cur] = [{ m: 0, n: 'Банан', g: 100, p: 1.5, f: .2, c: 21.8 }]; render(); ee(0); }); await a.wait(350);
  await a.pg.fill('#gr', '120'); await a.pg.click('#ab'); await a.wait(400);
  assert.equal(await a.ev(() => isOpen), false, 'изменение записи закрывает лист');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('длина свайпа — ползунок: касание подписи и перетаскивание', async () => {
  const a = await openApp();
  await a.ev(() => sets()); await a.wait(400);
  assert.equal(await a.ev(() => $('slm').style.getPropertyValue('--slv')), '0.5');
  const r = await a.ev(() => { const b = $('slm').querySelector('.sldt').getBoundingClientRect(); return { x: b.left, y: b.top + b.height / 2, w: b.width }; });
  await a.ev(() => $('slm').querySelector('.sldt').scrollIntoView({ block: 'center' })); await a.wait(200);
  const r2 = await a.ev(() => { const b = $('slm').querySelector('.sldt').getBoundingClientRect(); return { x: b.left, y: b.top + b.height / 2, w: b.width }; });
  await a.pg.mouse.move(r2.x + r2.w / 2, r2.y); await a.pg.mouse.down(); await a.pg.mouse.move(r2.x + r2.w * .9, r2.y, { steps: 5 }); await a.pg.mouse.up(); await a.wait(200);
  assert.equal(await a.ev(() => slv()), 'long', 'перетаскивание вправо — «Длинный»');
  await a.pg.click('#slm .sldl button:nth-child(1)'); await a.wait(100);
  assert.equal(await a.ev(() => [slv(), $('slm').style.getPropertyValue('--slv'), $('slm').querySelector('.sldl .on').textContent].join()), 'short,0,Короткий');
  assert.ok(r.w > 0);
  await a.close();
});

test('поле количества: режим замены — подсвечено поле, первая цифра заменяет значение; касание — обычное выделение', async () => {
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: {}, db: [['Банан', 1.5, .2, 21.8]], lg: { 'Банан': 120 } } });
  await a.ev(() => op(0)); await a.wait(300);
  await a.pg.locator('#ls .pk').first().click(); await a.wait(400);
  const st = await a.ev(() => { const i = $('gr'); return { v: i.value, rp: i.classList.contains('rp'), s: i.selectionStart, e: i.selectionEnd }; });
  assert.deepEqual(st, { v: '120', rp: true, s: 3, e: 3 }, 'текст не выделен, поле в режиме замены');
  await a.pg.keyboard.press('8');
  assert.equal(await a.ev(() => [$('gr').value, $('gr').classList.contains('rp')].join()), '8,false');
  await a.pg.keyboard.press('0');
  assert.equal(await a.ev(() => $('gr').value), '80', 'дальше — обычный ввод');
  await a.ev(() => qg(150));
  await a.pg.keyboard.press('Backspace');
  assert.equal(await a.ev(() => $('gr').value), '', 'после быстрого значения стереть — очищает');
  await a.ev(() => qg(200)); await a.pg.click('#gr'); await a.wait(100);
  assert.equal(await a.ev(() => { const i = $('gr'); return !i.classList.contains('rp') && i.selectionStart === 0 && i.selectionEnd === 3; }), true, 'касание поля — значение выделено');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('свой цвет: экран выбора — квадрат, оттенок, код; «Готово» применяет, «Назад» — в настройки', async () => {
  const a = await openApp();
  await a.ev(() => sets()); await a.wait(400);
  await a.pg.click('#v7 .cc'); await a.wait(400);
  assert.equal(await a.ev(() => !$('v11').hidden && $('st').textContent), 'Свой цвет');
  await a.pg.fill('#cpx', '#7c3aed'); await a.wait(50);
  const r = await a.ev(() => { const b = $('cph').getBoundingClientRect(); return { x: b.left, y: b.top + b.height / 2, w: b.width }; });
  assert.equal(await a.ev(() => hsv2hex(cpH, cpS, cpV)), '#7c3aed');
  await a.pg.mouse.click(r.x + r.w * 0, r.y); await a.wait(50);
  assert.equal(await a.ev(() => Math.round(cpH)), 0, 'полоса оттенка — к красному');
  await a.ev(() => cpSet('#0891b2'));
  await a.pg.click('#cpok'); await a.wait(400);
  assert.equal(await a.ev(() => [S.set.ac, !$('v7').hidden].join()), '#0891b2,true');
  assert.equal(await a.ev(() => $('cpn').textContent), '#0891B2', 'в настройках виден код своего цвета');
  await a.pg.click('#v7 .cc'); await a.wait(350);
  await a.ev(() => window.BJU_onBack ? BJU_onBack() : step()); await a.wait(350);
  assert.equal(await a.ev(() => isOpen && !$('v7').hidden), true, '«Назад» возвращает в настройки');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('настройки жестов: сначала «вниз в начале дня», потом «вверх в конце дня»; крестик на «Свой цвет» — назад в настройки', async () => {
  const a = await openApp();
  await a.ev(() => sets()); await a.wait(400);
  const order = await a.ev(() => [...document.querySelectorAll('#v7 .sg:nth-child(3) .srl')].map(e => e.textContent));
  assert.deepEqual(order.slice(0, 3), ['Потянуть вниз в начале дня', 'Потянуть вверх в конце дня', 'Движение телефоном']);
  await a.ev(() => cpOpen()); await a.wait(400);
  await a.pg.click('.hd .x'); await a.wait(400);
  assert.equal(await a.ev(() => isOpen && !$('v7').hidden), true);
  await a.pg.click('.hd .x'); await a.wait(400);
  assert.equal(await a.ev(() => isOpen), false, 'из настроек крестик закрывает');
  await a.close();
});


test('движение телефоном: каждое движение срабатывает только на себя; ходьба не срабатывает; сила отсекает слабые', async () => {
  const a = await openApp();
  await a.ev(c => { new Function(c)(); }, readFileSync('tests/sim.js', 'utf8'));
  const r = await a.ev(() => { window.__f = 0; skDo = () => window.__f++; S.set = Object.assign({}, S.set, { sk: 'stat' }); skBind();
    const run = (m, s, g, o) => { S.set.sm = m; S.set.ss = s; skReset(); window.__f = 0; __sim(g, o); return window.__f; }, M = {};
    for (const m of ['ud', 'dn', 'rot', 'wig']) M[m] = ['ud', 'dn', 'rot', 'wig', 'walk'].map(g => run(m, 'norm', g)).join('');
    return { M, flat: run('dn', 'norm', 'dnflat'), rotback: run('rot', 'norm', 'rotback'),
      weakUD: run('ud', 'max', 'ud'), strongUD: run('ud', 'max', 'ud', { g: 30, n: 5 }),
      weakDN: run('dn', 'strong', 'dn', { g: 12 }), strongDN: run('dn', 'strong', 'dn', { g: 20 }),
      weakRot: run('rot', 'max', 'rot'), strongRot: run('rot', 'max', 'rot', { r: 520, deg: 100 }),
      weakWig: run('wig', 'max', 'wig', { r: 260 }), strongWig: run('wig', 'max', 'wig', { r: 520, n: 5 }) }; });
  assert.deepEqual(r.M, { ud: '10000', dn: '01000', rot: '00100', wig: '00010' }, 'строка: вверх-вниз, вниз, поворот, покачивание, ходьба');
  assert.equal(r.flat, 1, '«Резко вниз» и когда телефон лежит экраном вверх');
  assert.equal(r.rotback, 1, 'поворот, потом спокойный возврат — один раз');
  assert.deepEqual([r.weakUD, r.strongUD, r.weakDN, r.strongDN, r.weakRot, r.strongRot, r.weakWig, r.strongWig], [0, 1, 0, 1, 0, 1, 0, 1], 'на большей силе слабое не срабатывает: ' + JSON.stringify(r));
  await a.close();
});

test('движение телефоном: настройки — действие, какое движение, сила; всё сохраняется в файле', async () => {
  const a = await openApp();
  await a.ev(() => sets()); await a.wait(400);
  assert.equal(await a.ev(() => $('ssr').hidden), true, 'действие выключено — выбора движения и силы нет');
  assert.deepEqual(await a.ev(() => SKL.map(x => x[1])), ['Выключено', 'Приём пищи', 'Новый продукт', 'Статистика', 'Вес', 'Карточка дня']);
  await a.ev(() => setSk('rep'));
  assert.equal(await a.ev(() => !$('ssr').hidden && smv() + ':' + ssv()), 'ud:norm');
  assert.deepEqual(await a.ev(() => [...$('smm').querySelectorAll('button')].filter(b => b.offsetParent).map(b => b.querySelector('.ot b').textContent)), ['Вверх-вниз'], 'список свёрнут до выбранного');
  await a.pg.click('#smm button.on'); await a.wait(200);
  await a.pg.click('#smm button:has-text("Поворот")'); await a.wait(200);
  await a.pg.click('#ssm .sldl button:nth-child(2)'); await a.wait(100);
  assert.equal(await a.ev(() => smv() + ':' + ssv()), 'rot:strong');
  assert.equal(await a.ev(() => $('smh').className), 'smh rot', 'подсказка-анимация — под выбранное движение');
  assert.equal(await a.ev(() => getComputedStyle(document.querySelector('#smh .smp i')).animationName), 'smRot');
  await a.ev(() => { setSm('wig'); setSs('max'); });
  assert.match(await a.ev(() => $('smh').textContent), /туда-обратно 4 раза/, 'в подсказке — число покачиваний для выбранной силы');
  await a.ev(() => { setSm('rot'); setSs('strong'); });
  const st = await a.ev(() => JSON.parse(ser()).settings);
  assert.deepEqual([st.shakeAction, st.shakeMotion, st.shakeStrength], ['dayCard', 'twist', 'strong']);
  // карточка дня: открыть движением и тем же движением закрыть
  await a.ev(() => cl()); await a.wait(400);
  await a.ev(c => { new Function(c)(); }, readFileSync('tests/sim.js', 'utf8'));
  await a.ev(() => __sim('rot', { r: 420, deg: 90 })); await a.wait(300);
  assert.equal(await a.ev(() => !!REP), true);
  await a.ev(() => __sim('rot', { r: 420, deg: 90 })); await a.wait(300);
  assert.equal(await a.ev(() => !!REP), false);
  assert.deepEqual(a.errors, []);
  await a.close();
});
