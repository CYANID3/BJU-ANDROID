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

test('вес: чип под итогом дня, запись своей клавиатурой, разница с прошлой, отключение в «Ещё»', async () => {
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: {}, wt: { [day(-3)]: 73 } } });
  const card = a.pg.locator('#app .wtl');
  assert.match(await card.textContent(), /^ВесЗаписатьбыло 73$/, 'за этот день не записан — «Записать», прошлый вес мелко');
  assert.equal(await a.ev(() => { const t = document.querySelector('#app .wtl'), s = document.querySelector('#app .sum'); return t.parentElement.classList.contains('duo') && t.getBoundingClientRect().top > s.getBoundingClientRect().bottom; }), true, 'чип — сразу под итогом дня');
  await card.click(); await a.wait(400);
  assert.equal(await a.ev(() => !$('v10').hidden && !$('kp').hidden), true);
  assert.match(await a.pg.textContent('#ss'), /Прошлая запись: 73 кг/);
  for (const k of ['7', '2', ',', '4']) await a.pg.click(`#kp [data-k="${k}"]`);
  assert.match(await a.pg.textContent('#wpv'), /−0,6 кг/);
  await a.pg.click('#wsb'); await a.wait(400);
  assert.equal(await a.ev(() => S.wt[cur]), 72.4);
  assert.match(await card.textContent(), /72,4кг−0,6/);
  // кнопки ±0,1
  await card.click(); await a.wait(300);
  await a.pg.click('.vf .pm.r'); assert.equal(await a.pg.inputValue('#wv'), '72,5');
  await a.ev(() => cl()); await a.wait(300);
  // неверное значение не сохраняется, поле вздрагивает
  await card.click(); await a.wait(300); await a.pg.fill('#wv', '5'); await a.ev(() => wSave());
  assert.equal(await a.ev(() => S.wt[cur]), 72.4); assert.equal(await a.ev(() => $('wv').classList.contains('bad')), true); await a.ev(() => cl()); await a.wait(300);
  // будущий день — без веса
  await a.ev(() => { cur = shiftDay(today, 1); render(); });
  assert.equal(await a.pg.locator('#app .wtl').count(), 0);
  await a.ev(() => { cur = today; render(); });
  // отключение
  await a.ev(() => sets()); await a.wait(300);
  assert.equal(await a.ev(() => $('wtm').getAttribute('aria-checked')), 'true', 'переключатель «Отслеживать вес» включён');
  await a.pg.click('#wtm'); await a.wait(500); // чип сжимается плавно, затем убирается
  assert.equal(await a.ev(() => $('wtm').getAttribute('aria-checked')), 'false');
  assert.equal(await a.pg.locator('#app .wtl').count(), 0);
  assert.equal(await a.ev(() => S.wt[cur]), 72.4, 'записи не удаляются');
  assert.deepEqual(a.errors, []);
  await a.close();
});
test('статистика: средний день с долями, дни, серия, в норме / перебор / недобор, графики калорий, БЖУ и веса', async () => {
  const d = {}, wt = {};
  for (let i = 0; i < 5; i++) d[day(-i)] = [entry(2, 'Рис', 200, 14, 2, 148), entry(4, 'Лосось', 150, 30, 19.5, 0)];
  wt[day(-4)] = 74; wt[day(-2)] = 73.6; wt[day(0)] = 73.1;
  const a = await openApp({ data: { g: { p: 120, f: 70, c: 250 }, d, wt } });
  await a.ev(() => stats()); await a.wait(400);
  // месяц мог начаться меньше 5 дней назад — смотрим, что попало в текущий
  const n = await a.ev(() => stData().filter(x => x.n).length);
  assert.ok(n >= 1);
  assert.match(await a.pg.textContent('#stc .stt'), new RegExp(`${n}из`));
  assert.match(await a.pg.textContent('#st'), /^[А-Я][а-я]+ \d{4}$/, 'месяц — в заголовке листа');
  assert.deepEqual(await a.ev(() => [...document.querySelectorAll('#stc .stt')[1].querySelectorAll('.l')].map(e => e.textContent)), ['в норме ±10%', 'перебор', 'недобор']);
  assert.equal(await a.ev(() => [...document.querySelectorAll('#stc .stt')[1].querySelectorAll('.v')].reduce((s, e) => s + +e.textContent, 0)), n, 'каждый день — в одном из трёх счётчиков');
  assert.equal(await a.pg.locator('#ch1 g[data-i]').count(), n);
  assert.ok(await a.pg.locator('#ch1 g[data-i] [fill="var(--p)"]').count() >= 1, 'столбцы сложены из Б / Ж / У');
  assert.equal(await a.pg.locator('#stc .sthero .mcol').count(), 3, 'средний день — три столбца как на главном');
  assert.match(await a.pg.textContent('#stc .sthero .mcol .r'), /ещё .* г\d+%/, 'с долей калорий');
  assert.equal(await a.pg.locator('#ch2 polyline, #ch2 circle').count() >= 3, true);
  const wn = await a.ev(() => stData().filter(x => x.w).length);
  assert.equal(await a.pg.locator('#ch3 circle[data-i]').count(), wn);
  if (wn > 1) assert.match(await a.pg.textContent('#rd3'), /→ 73,1 кг/);
  assert.match(await a.pg.textContent('#stc .sttop'), /Рис\d+ раз(а)? · ≈ 666 ккал за раз/);
  // касание точки веса — значение дня в табло
  await a.ev(() => document.getElementById('ch3').scrollIntoView({ block: 'center' })); await a.wait(200);
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
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: {}, set: { sw: 'stat', sf: 'end' } } });
  const pullUp = async () => { await a.ev(() => scrollTo(0, 1e6)); await a.wait(150); await a.drag(200, 600, 200, 420, { steps: 14, ms: 30 }); await a.wait(500); };
  await pullUp();
  assert.equal(await a.ev(() => isOpen && !$('v9').hidden), true, 'открылась статистика');
  await a.ev(() => cl()); await a.wait(300);
  await a.ev(() => pick('sw')); await a.wait(300);
  assert.deepEqual(await a.ev(() => [...document.querySelectorAll('#pko .row .tx')].map(b => b.firstChild.textContent)), ['Приём пищи по времени', 'Новый продукт', 'Новое блюдо', 'Записать вес', 'Статистика', 'К сегодняшнему дню', 'Продукты', 'Выключено']);
  assert.equal(await a.ev(() => document.querySelector('#pko .row.on .tx').firstChild.textContent), 'Статистика', 'выбранный — с галочкой');
  await a.pg.click('#pko .row:nth-child(4)'); await a.wait(100);
  assert.equal(await a.ev(() => document.querySelector('#pko .row.on .tx').firstChild.textContent), 'Записать вес');
  assert.equal(await a.ev(() => toFile(S).settings.pullUpAction), 'weight');
  assert.equal(await a.ev(() => parseData(ser()).set.sw), 'wt');
  assert.equal(await a.ev(() => BJU_onBack()), true); await a.wait(300);
  assert.equal(await a.ev(() => isOpen && !$('v7').hidden), true, '«Назад» — в «Настройки»');
  assert.match(await a.pg.textContent('#v7'), /Потянуть вверхв конце дня или от панелиЗаписать вес/);
  await a.ev(() => cl()); await a.wait(300);
  assert.equal(await a.pg.locator('#app .wtl').count(), 0, '«Записать» скрыта, вес пишется жестом');
  await pullUp();
  assert.equal(await a.ev(() => isOpen && !$('v10').hidden), true, 'открылся ввод веса');
  await a.pg.fill('#wv', '70'); await a.pg.press('#wv', 'Enter'); await a.wait(400);
  assert.match(await a.pg.textContent('#app .wtl'), /70кг/, 'записанный вес виден');
  // вес выключен — пункта «Вес» нет, жест не срабатывает
  await a.ev(() => { S.set = { ...S.set, wt: 'off' }; pick('sw'); }); await a.wait(300);
  assert.equal(await a.pg.locator('#pko .row').count(), 7);
  assert.equal(await a.ev(() => swAct()), 'off');
  await a.ev(() => cl()); await a.wait(300);
  assert.deepEqual(a.errors, []);
  await a.close();
});
test('чипы под итогом: вес и неделя — одной высоты, рядом; без одного — второй на всю ширину', async () => {
  const d = {}; for (let i = 1; i < 4; i++) d[day(-i)] = [entry(2, 'Рис', 100, 7, 1, 74)];
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d, wt: { [day(-1)]: 81 } } });
  const geo = () => a.ev(() => [...document.querySelectorAll('#app .duo > *')].map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.height), Math.round(r.width)]; }));
  let g = await geo();
  assert.equal(g.length, 2); assert.equal(g[0][0], g[1][0]); assert.equal(g[0][1], g[1][1], 'одна высота'); assert.ok(Math.abs(g[0][2] - g[1][2]) <= 1, 'одна ширина');
  assert.ok(g[0][1] >= 48, 'зона касания не меньше 48');
  assert.match(await a.ev(() => document.querySelector('#app .duo .dtl:not(.wtl)').innerText.replace(/\s+/g, ' ')), /^(В среднем за 7 дн\.|Среднее за 7 дн\.) 333 ?ккал( Б 7 г)?$/);
  await a.pg.click('#app .wtl'); await a.wait(300); await a.pg.fill('#wv', '80'); await a.pg.press('#wv', 'Enter'); await a.wait(300);
  const g2 = await geo(); assert.deepEqual(g2.map(x => x[1]), g.map(x => x[1]), 'после записи высота та же');
  assert.match(await a.pg.textContent('#app .wtl'), /80кг−1/);
  await a.pg.click('#app .duo .dtl:not(.wtl)'); await a.wait(300);
  assert.equal(await a.ev(() => isOpen && !$('v9').hidden), true, 'неделя открывает статистику');
  await a.ev(() => { cl(); S.set = { ...S.set, wt: 'off' }; render(); }); await a.wait(300);
  g = await geo(); const card = await a.pg.locator('#app .sum').boundingBox();
  assert.equal(g.length, 1); assert.ok(Math.abs(g[0][2] - card.width) <= 1, 'один чип — на всю ширину');
  assert.match(await a.pg.textContent('#app .duo .dtl'), /Б 7 · Ж 1 · У 74 г$/, 'один чип — все три');
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
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: { [day()]: [entry(0, 'Яйцо', 50, 6, 5, .5)] }, db: [['Яблоко', .4, .4, 9.8, [['шт', 150]]]], set: { sn: 'tap' } } });
  await a.ev(() => { op(0); pc(0) }); await a.wait(400);
  const x0 = await a.ev(() => $('un').style.getPropertyValue('--skx'));
  await a.ev(() => $('un').querySelectorAll('button')[0].click()); await a.wait(80);
  const st = await a.ev(() => ({ sk: $('un').classList.contains('sk'), x: $('un').style.getPropertyValue('--skx'), b: $('un').querySelector('button.on').offsetLeft + 'px' }));
  assert.ok(st.sk && st.x === st.b && st.x !== x0, JSON.stringify(st));
  await a.ev(() => cl()); await a.wait(400);
  const kf = () => { const an = document.querySelector('#app .snk').getAnimations()[0]; return an ? an.effect.getKeyframes().map(k => k.height) : null; };
  assert.deepEqual(await a.ev(k => { snToggle(0); return new Function('return (' + k + ')()')(); }, kf.toString()), ['0px', '46px'], 'выезжает: высота от нуля до своей');
  await a.wait(500);
  assert.deepEqual(await a.ev(k => { snToggle(0); return [document.querySelectorAll('#app .snk').length, new Function('return (' + k + ')()')()]; }, kf.toString()), [1, ['46px', '0px']], 'уезжает: строка ещё на месте и сжимается');
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
  assert.equal(await a.ev(() => [am, $('st').textContent].join()), '3,Добавить в перекус 2');
  await a.pg.locator('#ls .pk').first().click(); await a.wait(350);
  assert.equal(await a.ev(() => !$('em').hidden && $('em').querySelector('.on').textContent), 'Перекус 2', 'и на экране количества');
  assert.equal(await a.pg.textContent('#st'), 'Творог 5%', 'название продукта — в заголовке');
  await a.pg.click('#em button:has-text("Ужин")');
  await a.pg.fill('#gr', '150'); await a.pg.click('#ab'); await a.wait(450);
  assert.equal(await a.ev(() => isOpen && !$('v1').hidden && $('q').value === ''), true, 'вернулись в список');
  assert.equal(await a.ev(() => S.d[cur].length === 1 && S.d[cur][0].m), 4);
  await a.ev(() => undo()); await a.wait(300);
  assert.equal(await a.ev(() => S.d[cur].length), 0, 'отмена убирает добавленное');
  await a.ev(() => cl()); await a.wait(300);
  await a.ev(() => { S.d[cur] = [{ m: 0, n: 'Банан', g: 100, p: 1.5, f: .2, c: 21.8 }]; render(); ee(0); }); await a.wait(350);
  assert.equal(await a.pg.textContent('#ab'), 'Сохранить');
  assert.equal(await a.ev(() => $('hb').hidden), true, 'у изменения записи нет «назад» к списку');
  await a.pg.fill('#gr', '120'); await a.pg.click('#ab'); await a.wait(400);
  assert.equal(await a.ev(() => isOpen), false, 'изменение записи закрывает лист');
  // пустое количество — поле вздрагивает, запись не добавляется
  await a.ev(() => { op(0); pc(0); $('gr').value = ''; }); await a.wait(300);
  await a.pg.click('#ab'); await a.wait(100);
  assert.equal(await a.ev(() => $('gr').classList.contains('bad') && S.d[cur].length), 1);
  assert.deepEqual(a.errors, []);
  await a.close();
});
test('длина свайпа — ползунок: касание подписи и перетаскивание', async () => {
  const a = await openApp();
  await a.ev(() => pick('sl')); await a.wait(400);
  assert.equal(await a.ev(() => $('slm').style.getPropertyValue('--slv')), '0.5');
  const r2 = await a.ev(() => { const b = $('slm').querySelector('.sldt').getBoundingClientRect(); return { x: b.left, y: b.top + b.height / 2, w: b.width }; });
  await a.pg.mouse.move(r2.x + r2.w / 2, r2.y); await a.pg.mouse.down(); await a.pg.mouse.move(r2.x + r2.w * .9, r2.y, { steps: 5 }); await a.pg.mouse.up(); await a.wait(200);
  assert.equal(await a.ev(() => slv()), 'long', 'перетаскивание вправо — «Длинная»');
  await a.pg.click('#slm .sldl button:nth-child(1)'); await a.wait(100);
  assert.equal(await a.ev(() => [slv(), $('slm').style.getPropertyValue('--slv'), $('slm').querySelector('.sldl .on').textContent].join()), 'short,0,Короткая');
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

test('свой цвет: экран выбора — квадрат, оттенок, код; «Готово» применяет, «Назад» — к выбору цвета', async () => {
  const a = await openApp();
  await a.ev(() => pick('ac')); await a.wait(400);
  await a.pg.click('#pkx .cc'); await a.wait(400);
  assert.equal(await a.ev(() => !$('v11').hidden && $('st').textContent), 'Свой цвет');
  await a.pg.fill('#cpx', '#7c3aed'); await a.wait(50);
  const r = await a.ev(() => { const b = $('cph').getBoundingClientRect(); return { x: b.left, y: b.top + b.height / 2, w: b.width }; });
  assert.equal(await a.ev(() => hsv2hex(cpH, cpS, cpV)), '#7c3aed');
  await a.pg.mouse.click(r.x + r.w * 0, r.y); await a.wait(50);
  assert.equal(await a.ev(() => Math.round(cpH)), 0, 'полоса оттенка — к красному');
  await a.ev(() => cpSet('#0891b2'));
  await a.pg.click('#cpok'); await a.wait(400);
  assert.equal(await a.ev(() => [S.set.ac, !$('v13').hidden].join()), '#0891b2,true');
  assert.equal(await a.ev(() => $('cpn').textContent), '#0891B2', 'виден код своего цвета');
  await a.pg.click('#pkx .cc'); await a.wait(350);
  await a.ev(() => BJU_onBack()); await a.wait(350);
  assert.equal(await a.ev(() => isOpen && !$('v13').hidden), true, '«Назад» возвращает к выбору цвета');
  await a.ev(() => BJU_onBack()); await a.wait(350);
  assert.equal(await a.ev(() => isOpen && !$('v7').hidden), true, 'ещё раз — в «Настройки»');
  assert.deepEqual(a.errors, []);
  await a.close();
});
test('«Настройки»: все настройки одной страницей, в группах по порядку; крестик закрывает, «‹» возвращает', async () => {
  const a = await openApp();
  await a.ev(() => sets()); await a.wait(400);
  assert.deepEqual(await a.ev(() => [...document.querySelectorAll('#v7 .gh')].map(e => e.textContent)), ['Питание', 'Панель и жесты', 'Дневник и продукты', 'Оформление', 'Данные']);
  const rows = await a.ev(() => [...document.querySelectorAll('#v7 .row .tx')].map(e => e.firstChild.textContent));
  for (const t of ['Норма на день', 'Отслеживать вес', 'Нижняя панель', 'Потянуть вниз', 'Потянуть вверх', 'Длина свайпа', 'Вибрация', 'Карточка дня', 'Пустые перекусы', 'Кнопки создания в списке', 'Запоминать единицу', 'Тема и фон', 'Цвет акцента', 'Файл данных'])
    assert.ok(rows.includes(t), 'есть «' + t + '»');
  for (const t of ['Подсказки к жестам', 'Показывать «Добавить продукты из файла»', 'Добавить продукты из файла', 'Кнопка «＋» в панели', 'Тема', 'Оттенок фона']) assert.ok(!rows.includes(t), 'нет «' + t + '»');
  assert.equal(await a.ev(() => $('hb').hidden), true, 'у «Настроек» нет «назад»');
  await a.ev(() => pick('dw')); await a.wait(300);
  assert.equal(await a.ev(() => !$('hb').hidden && $('st').textContent), 'Потянуть вниз');
  await a.pg.click('#hb'); await a.wait(400);
  assert.equal(await a.ev(() => isOpen && !$('v7').hidden), true);
  await a.pg.click('.hd > .x'); await a.wait(400);
  assert.equal(await a.ev(() => isOpen), false, 'крестик закрывает');
  await a.close();
});
test('подсказки к жестам: всегда на экранах включённых жестов, без отдельного переключателя', async () => {
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: {}, set: { gh: 'off' } } });
  await a.ev(() => { setSw('stat'); setDw('cal'); pick('sw'); }); await a.wait(300);
  assert.equal(await a.ev(() => getComputedStyle($('sgh').querySelector('u')).animationName), 'puF', 'старое «выключено» не прячет подсказку');
  assert.match(await a.ev(() => $('sgh').textContent), /от нижней панели.*в конце дня/);
  assert.equal(await a.ev(() => !!$('sfm')), false, 'выбора «Откуда тянуть» нет');
  await a.ev(() => pick('dw')); await a.wait(300);
  assert.equal(await a.ev(() => getComputedStyle($('dwh').querySelector('u')).animationName), 'pdF');
  await a.ev(() => { setDw('off'); }); await a.wait(100);
  assert.equal(await a.ev(() => !!$('dwh')), false, 'жест выключен — его подсказки нет');
  assert.deepEqual(a.errors, []);
  await a.close();
});
test('длинный список продуктов: первый экран сразу, остальное следом; поиск не получает чужие строки', async () => {
  const a = await openApp();
  await a.ev(() => { for (let i = 0; i < 200; i++) S.db.push(['Продукт ' + i, 10, 5, 20]); saveq(); });
  const n0 = await a.ev(() => { op(0); return $('ls').querySelectorAll('.pk').length; });
  assert.equal(n0, 24, 'сразу — только первый экран');
  await a.wait(500);
  assert.ok(await a.ev(() => $('ls').querySelectorAll('.pk').length) >= 80, 'следом — весь список');
  const r = await a.ev(async () => { closeUI(); op(0); $('q').value = 'Продукт 19'; lst(); await new Promise(r => setTimeout(r, 500)); return [...$('ls').querySelectorAll('.pk .n')].map(e => e.textContent).every(t => t.startsWith('Продукт 19')); });
  assert.equal(r, true);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('«К сегодня» под датой: возвращает на сегодня и обновляет шапку без ошибок', async () => {
  const a = await openApp();
  await a.ev(() => go(-1)); await a.wait(500);
  await a.pg.click('#dt [data-t]'); await a.wait(500);
  assert.deepEqual(await a.ev(() => [cur === today, $('dt').querySelector('[data-t]') === null, /Сегодня/.test($('dt').textContent)]), [true, true, true]);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('потянуть вверх — от панели в любом месте списка и в конце списка; кнопки панели не нажимаются', async () => {
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: {}, set: { sw: 'stat' } } });
  await a.ev(() => { S.d[today] = Array.from({ length: 30 }, (_, i) => ({ m: i % 5, n: 'Продукт ' + i, g: 100, p: 10, f: 5, c: 20 })); render(); }); await a.wait(300);
  const reset = async () => { await a.ev(() => { if (isOpen) closeUI(); scrollTo(0, 0); }); await a.wait(400); };
  assert.equal(await a.ev(() => atBot()), false, 'день длинный — мы не в конце списка');
  // тянем вверх от панели (с кнопки) — статистика, кнопка не нажата
  const bt = await a.ev(() => { const r = document.querySelector('.bt > button:nth-child(2)').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await a.drag(bt[0], bt[1], bt[0], bt[1] - 220, { steps: 16, ms: 30 }); await a.wait(500);
  assert.equal(await a.ev(() => isOpen && !$('v9').hidden), true, 'от панели — статистика');
  await reset();
  // и от «＋» в центре
  const fb = await a.ev(() => { const r = $('fab').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await a.drag(fb[0], fb[1], fb[0], fb[1] - 220, { steps: 16, ms: 30 }); await a.wait(500);
  assert.equal(await a.ev(() => isOpen && !$('v9').hidden), true, 'от «＋» — тоже жест, а не добавление');
  await reset();
  // обычное касание кнопки панели работает
  await a.pg.tap('.bt > button:nth-child(2)'); await a.wait(400);
  assert.equal(await a.ev(() => isOpen && $('v9').hidden && !$('v1').hidden), true, 'касание — своя кнопка, не жест');
  await reset();
  // прокрутка из середины экрана — не жест
  await a.drag(200, 600, 200, 300, { steps: 12, ms: 20 }); await a.wait(400);
  assert.equal(await a.ev(() => isOpen), false, 'прокрутка из середины — не жест ');
  await reset();
  // в конце списка тоже работает — одновременно с панелью (даже если в старом файле было «В конце списка»)
  await a.ev(() => { S.set = { ...S.set, sf: 'end' } }); await a.ev(() => scrollTo(0, 1e6)); await a.wait(200);
  await a.drag(200, 500, 200, 300, { steps: 14, ms: 30 }); await a.wait(500);
  assert.equal(await a.ev(() => isOpen && !$('v9').hidden), true, 'в конце списка — как раньше');
  await reset();
  await a.drag(bt[0], bt[1], bt[0], bt[1] - 220, { steps: 16, ms: 30 }); await a.wait(500);
  assert.equal(await a.ev(() => isOpen && !$('v9').hidden), true, 'и от панели — тоже');
  assert.deepEqual(a.errors, []);
  await a.close();
});
test('смена экрана в листе: содержимое меняется на месте (без сдвига вбок), едет только край листа; копии убираются', async () => {
  const a = await openApp();
  await a.ev(() => sets()); await a.wait(500);
  // «Ещё» (высокий) → «Цвет акцента» (низкий): снимок старого экрана поверх, фон старой высоты под листом, новое — без сдвига
  const f = await a.ev(async () => { pick('ac'); await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    const L = document.querySelector('#ov > .svl'), E = document.querySelector('#ov > .sve'), tf = [$('v13'), document.querySelector('#ov .hd .ht')].flatMap(el => el.getAnimations().flatMap(x => x.effect.getKeyframes().map(k => k.transform).filter(Boolean)));
    return { snap: !!L && L.textContent.includes('Норма на день'), edge: !!E, under: E && E.nextElementSibling === shEl(), tf } });
  assert.ok(f.snap, 'снимок прежнего экрана'); assert.ok(f.edge && f.under, 'фон старой высоты — под листом');
  assert.deepEqual(f.tf, [], 'новое содержимое не едет вбок');
  await a.wait(500);
  assert.equal(await a.ev(() => document.querySelectorAll('#ov > .svl, #ov > .sve').length), 0, 'после перехода копии убраны');
  // «назад» в высокий экран: лист поднимается целиком со старой высоты (только transform — плавно на видеокарте)
  const b = await a.ev(async () => { backStep(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); return shEl().getAnimations().filter(x => !x.effect.pseudoElement).flatMap(x => x.effect.getKeyframes().map(k => k.transform).filter(Boolean)) });
  assert.match(b[0], /^translateY\(\d+(\.\d+)?px\)/, 'край листа едет'); assert.equal(b[1], 'none');
  assert.equal(await a.ev(() => document.getAnimations().filter(x => x.effect.getKeyframes().some(k => k.clipPath)).length), 0, 'без анимаций clip-path');
  // закрытие посреди перехода не оставляет копий
  await a.ev(async () => { pick('th'); await Promise.resolve(); await Promise.resolve(); cl() }); await a.wait(400);
  await a.ev(() => sets()); await a.wait(100);
  assert.equal(await a.ev(() => document.querySelectorAll('#ov > .svl, #ov > .sve').length), 0);
  assert.deepEqual(a.errors, []);
  await a.close();
});
