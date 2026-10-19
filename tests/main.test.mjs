// Главный экран, добавление продуктов, дни, календарь, лист, «Назад», клавиатура, настройки
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day, entry } from './helpers.mjs';

test('запуск без ошибок: итог дня, три карточки приёмов, «＋ Перекус» ссылкой в каждой', async () => {
  const a = await openApp();
  assert.equal(await a.pg.locator('#app .meal').count(), 3);
  assert.deepEqual(await a.ev(() => [...document.querySelectorAll('#app .snk span')].map(e => e.textContent)), ['Перекус 1', 'Перекус 2', 'Перекус 3']);
  assert.ok(await a.ev(() => [...document.querySelectorAll('#app .snk')].every(s => s.parentElement.classList.contains('meal'))), 'ссылка — внутри карточки своего приёма');
  await a.pg.click('#app .snk >> nth=1'); await a.wait(300);
  assert.equal(await a.ev(() => isOpen && am), 3, '«+ Перекус 2» открывает добавление в перекус 2');
  await a.ev(() => cl()); await a.wait(300);
  assert.match(await a.pg.textContent('#app .sum'), /из \d+ ккал/);
  assert.match(await a.pg.textContent('#app .sum .lf'), /осталось\d+/);
  assert.equal(await a.pg.locator('.bt > button').count(), 5);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('добавить продукт в завтрак: своя клавиатура, запись и калории', async () => {
  const a = await openApp();
  await a.ev(() => op(0)); await a.wait(350);
  await a.pg.fill('#q', 'творог');
  await a.pg.locator('#ls .pk').first().click(); await a.wait(350);
  assert.equal(await a.ev(() => $('v2').hidden), false);
  assert.equal(await a.ev(() => !$('kp').hidden && document.querySelector('#ov .sh').classList.contains('kpo')), true, 'своя клавиатура видна сразу');
  for (const k of ['2', '0', '0']) await a.pg.click(`#kp [data-k="${k}"]`);
  assert.equal(await a.pg.inputValue('#gr'), '200');
  assert.match(await a.pg.textContent('#ab'), /^Добавить · 2\d\d ккал$/, 'калории порции на кнопке');
  await a.pg.click('#ab'); await a.wait(400);
  const e = await a.ev(() => S.d[cur][0]);
  assert.equal(e.n, 'Творог 5%'); assert.equal(e.g, 200); assert.equal(e.p, 34); assert.equal(e.m, 0);
  assert.match(await a.pg.textContent('#app .sum .big b'), /^\d+$/);
  assert.equal(await a.pg.locator('#app .meal').first().locator('.it').count(), 1);
  assert.match(await a.pg.textContent('#app .meal .it .mu'), /200 г · Б34 · Ж10 · У3,6/, 'строка БЖУ под записью');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('удаление записи и отмена', async () => {
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: { [day()]: [entry(2, 'Рис', 100, 7, 1, 74)] } } });
  await a.ev(() => del(0)); await a.wait(100);
  assert.equal(await a.ev(() => S.d[cur].length), 0);
  await a.ev(() => undo()); await a.wait(100);
  assert.equal(await a.ev(() => S.d[cur][0].n), 'Рис');
  await a.close();
});

test('норма: «Далее» по полям, пересчёт калорий, «Сохранить»', async () => {
  const a = await openApp();
  await a.ev(() => goals()); await a.wait(300);
  assert.equal(await a.ev(() => document.activeElement.id), 'gp');
  assert.equal(await a.pg.textContent('#sgb'), 'Далее · Жиры');
  await a.pg.click('#kp [data-k="1"]'); await a.pg.click('#kp [data-k="0"]'); await a.pg.click('#kp [data-k="0"]');
  await a.pg.click('#sgb');
  assert.equal(await a.ev(() => document.activeElement.id), 'gf');
  assert.equal(await a.pg.textContent('#sgb'), 'Далее · Углеводы');
  await a.pg.fill('#gf', '50'); await a.pg.click('#sgb');
  await a.pg.fill('#gc', '200');
  assert.equal(await a.pg.textContent('#sgb'), 'Сохранить');
  assert.match(await a.pg.textContent('#ss'), /1650/);
  await a.pg.click('#sgb'); await a.wait(300);
  assert.match(await a.pg.textContent('#app .sum'), /из 1650 ккал/);
  await a.close();
});

test('свайп по дню листает на следующий и обратно; от самого края экрана — нет (там «Назад» Android)', async () => {
  const a = await openApp();
  await a.drag(330, 500, 60, 505, { steps: 8 }); await a.wait(700);
  assert.equal(await a.ev(() => cur), day(1));
  await a.drag(60, 500, 330, 505, { steps: 8 }); await a.wait(700);
  assert.equal(await a.ev(() => cur), day(0));
  await a.drag(8, 500, 300, 505, { steps: 8 }); await a.wait(700);
  assert.equal(await a.ev(() => cur), day(0), 'свайп от левого края не листает');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('календарь: месяц тянется за пальцем, «Назад» по шагам, на прошлом дне «Назад» — к сегодня', async () => {
  const a = await openApp();
  await a.ev(() => cal()); await a.wait(450);
  const m0 = await a.ev(() => cm.join('-'));
  const b = await a.pg.locator('#cg').boundingBox();
  await a.drag(b.x + 300, b.y + 100, b.x + 150, b.y + 105, { end: false });
  assert.match(await a.ev(() => $('cg').style.transform), /translate/);
  await a.touchEnd(); await a.wait(600);
  assert.notEqual(await a.ev(() => cm.join('-')), m0);
  await a.ev(() => vw(2));
  assert.equal(await a.ev(() => BJU_onBack()), true);
  assert.equal(await a.ev(() => [cv, isOpen].join()), '0,true');
  assert.equal(await a.ev(() => BJU_onBack()), true);
  assert.equal(await a.ev(() => isOpen), false);
  assert.equal(await a.ev(() => BJU_onBack()), false, 'на сегодняшнем дне «Назад» сворачивает приложение');
  await a.ev(() => { cur = shiftDay(today, -3); render() });
  assert.equal(await a.ev(() => BJU_onBack()), true); await a.wait(700);
  assert.equal(await a.ev(() => cur === today), true, 'с прошлого дня «Назад» возвращает к сегодня');
  await a.close();
});

test('календарь: калории дня цветом — в норме, перебор, недобор; счётчики месяца', async () => {
  const k = day(-1).slice(0, 8), d = {};
  d[k + '05'] = [entry(2, 'A', 100, 100, 70, 230)]; // 2030 ккал — в норме (норма 2110)
  d[k + '06'] = [entry(2, 'B', 100, 150, 100, 250)]; // 2500 — перебор
  d[k + '07'] = [entry(2, 'C', 100, 50, 20, 100)];   // 780 — недобор
  const a = await openApp({ data: { g: { p: 140, f: 70, c: 230 }, d } });
  await a.ev(() => cal()); await a.wait(400);
  const cls = await a.ev(k => ['05', '06', '07'].map(x => [...document.querySelectorAll('#cg .cd')].find(b => (b.getAttribute('onclick') || '').includes(k + x)).classList.contains('ok') ? 'ok' : [...document.querySelectorAll('#cg .cd')].find(b => (b.getAttribute('onclick') || '').includes(k + x)).className), k);
  assert.equal(cls[0], 'ok'); assert.match(cls[1], /\bo\b/); assert.match(cls[2], /\blo\b/);
  assert.equal(await a.pg.textContent('#cs'), 'в норме 1перебор 1недобор 1');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('лист смахивается вниз; на своей клавиатуре — нет', async () => {
  const a = await openApp();
  await a.ev(() => mng()); await a.wait(450);
  const sb = await a.pg.locator('#ov .sh').boundingBox();
  await a.drag(200, sb.y + 40, 200, sb.y + 300, { steps: 12, ms: 16 }); await a.wait(500);
  assert.equal(await a.ev(() => isOpen), false);
  await a.ev(() => goals()); await a.wait(450);
  const kb = await a.pg.locator('#kp').boundingBox();
  await a.drag(200, kb.y + 20, 200, kb.y + 260, { steps: 12, ms: 16 }); await a.wait(500);
  assert.equal(await a.ev(() => isOpen), true, 'набор на клавиатуре не закрывает лист');
  await a.close();
});

test('«Назад» из нового продукта возвращает к списку, несохранённое — с вопросом', async () => {
  const a = await openApp();
  await a.ev(() => op(2)); await a.wait(300);
  await a.ev(() => nw()); await a.wait(300);
  assert.equal(await a.ev(() => !$('hb').hidden), true, 'в шапке — «‹ назад»');
  assert.equal(await a.ev(() => BJU_onBack()), true); await a.wait(300);
  assert.equal(await a.ev(() => !$('v1').hidden && isOpen), true);
  await a.ev(() => nw()); await a.wait(300);
  await a.pg.fill('#nn', 'Мой продукт');
  await a.ev(() => BJU_onBack()); await a.wait(200);
  assert.equal(await a.ev(() => $('dg').classList.contains('on')), true, 'спрашивает про несохранённый продукт');
  await a.ev(() => $('dgn').click()); await a.wait(200);
  assert.equal(await a.ev(() => !$('v3').hidden), true);
  await a.close();
});

test('системная клавиатура (текст) поднимает лист на её высоту; своя — внутри листа у нижнего края', async () => {
  const a = await openApp();
  await a.ev(() => op(0)); await a.wait(400);
  const b0 = await a.pg.locator('#ov .sh').boundingBox();
  await a.ev(() => { const r = document.documentElement.style; r.setProperty('--kbd', '1ms'); r.setProperty('--kb', '300px'); }); await a.wait(300);
  const b1 = await a.pg.locator('#ov .sh').boundingBox();
  assert.ok(Math.abs((b0.y + b0.height) - (b1.y + b1.height) - 300) < 3, `низ листа сдвинулся на ${(b0.y + b0.height) - (b1.y + b1.height)}`);
  await a.ev(() => { const r = document.documentElement.style; r.setProperty('--kb', '0px'); cl() }); await a.wait(400);
  // своя клавиатура: одна высота и одно место во всех числовых экранах
  const geo = [];
  for (const f of [() => goals(), () => wtOpen(), () => { op(0); pc(0) }]) {
    await a.ev(f); await a.wait(450);
    geo.push(await a.ev(() => { const r = $('kp').getBoundingClientRect(); return [Math.round(r.top), Math.round(r.height), Math.round(innerHeight - r.bottom)] }));
    await a.ev(() => cl()); await a.wait(400);
  }
  assert.ok(geo.every(g => g[0] === geo[0][0] && g[1] === geo[0][1]), 'клавиатура на одном месте: ' + JSON.stringify(geo));
  assert.ok(geo[0][2] < 20, 'у нижнего края');
  await a.close();
});

test('настройки: длина свайпа, оттенок фона и акцент применяются', async () => {
  const a = await openApp();
  await a.ev(() => pick('sl')); await a.wait(300);
  await a.pg.click('#slm .sldl button:nth-child(3)');
  assert.equal(await a.ev(() => slv()), 'long');
  await a.ev(() => pick('tn')); await a.wait(300);
  const bg0 = await a.ev(() => getComputedStyle(document.documentElement).getPropertyValue('--bg'));
  await a.pg.click('#pko .row:nth-child(3)'); await a.wait(450); // смена кадра (View Transition) — асинхронно
  const bg1 = await a.ev(() => getComputedStyle(document.documentElement).getPropertyValue('--bg'));
  assert.notEqual(bg0, bg1, 'оттенок фона меняет --bg');
  await a.ev(() => pick('ac')); await a.wait(300);
  await a.pg.click('#swc button:nth-child(4)');
  assert.equal(await a.ev(() => S.set.ac), '#3b82f6');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('нижняя панель открывает свои экраны; «＋» добавляет в приём по времени', async () => {
  const a = await openApp();
  const want = ['v6', 'v1', null, 'v9', 'v7'];
  for (let i = 0; i < 5; i++) {
    if (!want[i]) continue;
    await a.pg.click(`.bt > button:nth-child(${i + 1})`); await a.wait(350);
    assert.equal(await a.ev(() => VWS.map(i => 'v' + i).find(id => !$(id).hidden)), want[i]);
    await a.ev(() => cl()); await a.wait(300);
  }
  await a.pg.click('#fab'); await a.wait(350);
  assert.equal(await a.ev(() => isOpen && !$('v1').hidden && mode === 'add' && am === autoMeal()), true);
  await a.close();
});

test('длина свайпа: «потянуть вверх/вниз» сильно различается, остальные жесты как раньше', async () => {
  const a = await openApp();
  const lv = f => a.ev(f => ['short', 'mid', 'long'].map(v => { S.set = { ...S.set, sl: v }; return Math.round(eval(f)); }), f);
  // порог «потянуть»: 21 / 96 / 326 px (около трети экрана)
  assert.deepEqual(await lv('THv()'), [21, 96, 326]);
  // листание дней, календарь, смахивание листа — прежние множители
  assert.deepEqual(await lv('56*GF()'), [28, 56, 101]);
  // проверка вживую: медленное движение вверх в конце страницы на 150 px
  const pull = async v => {
    await a.ev(v => { S.set = { ...S.set, sl: v, sw: 'meal', sf: 'end' }; scrollTo(0, 1e6); }, v); await a.wait(200);
    await a.drag(200, 600, 200, 450, { steps: 15, ms: 40 }); await a.wait(500);
    const o = await a.ev(() => isOpen); if (o) { await a.ev(() => cl()); await a.wait(350); } return o;
  };
  assert.deepEqual([await pull('short'), await pull('mid'), await pull('long')], [true, true, false]);
  await a.close();
});

test('«Повторить вчерашний день?»: «Нет» скрывает для этого дня, «Да» копирует', async () => {
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: { [day(-1)]: [entry(0, 'Рис', 100, 7, 1, 74)], [day(-3)]: [entry(0, 'Гречка', 80, 10, 2.6, 50)] } } });
  assert.equal(await a.pg.locator('#app .bn').count(), 1);
  assert.deepEqual(await a.ev(() => [...document.querySelectorAll('#app .bn button')].map(b => b.textContent)), ['Нет', 'Да']);
  await a.pg.click('#app .bn button.no'); await a.wait(350);
  assert.equal(await a.pg.locator('#app .bn').count(), 0, 'скрылось');
  await a.ev(() => { cur = shiftDay(today, -1); render(); cur = today; render(); });
  assert.equal(await a.pg.locator('#app .bn').count(), 0, 'и не возвращается при возврате на день');
  await a.ev(() => { cur = shiftDay(today, -2); render(); });
  assert.equal(await a.pg.locator('#app .bn').count(), 1, 'на другом пустом дне — предлагается');
  await a.pg.click('#app .bn button:not(.no)'); await a.wait(200);
  assert.equal(await a.ev(() => S.d[cur][0].n), 'Гречка');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('перекусы: внутри карточки приёма; «Ссылкой» или «По двойному касанию»', async () => {
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: { [day()]: [entry(3, 'Творог', 150, 25, 7, 3)] } } });
  assert.equal(await a.pg.locator('#app .snk').count(), 2, 'два пустых — ссылками');
  assert.equal(await a.ev(() => document.querySelector('#app .sns[data-m="3"]').closest('.meal').dataset.m), '2', 'перекус 2 с записью — подразделом карточки обеда');
  await a.ev(() => pick('sn')); await a.wait(300);
  await a.pg.click('#pko .row:nth-child(2)'); await a.ev(() => cl()); await a.wait(300);
  assert.equal(await a.pg.locator('#app .snk').count(), 0, 'пустых не видно');
  assert.equal(await a.pg.locator('#app .meal').count(), 3);
  const bf = a.pg.locator('#app .meal[data-m="0"] > .mh .mt');
  await bf.click(); await a.wait(120); await bf.click(); await a.wait(350);
  assert.deepEqual(await a.ev(() => [...document.querySelectorAll('#app .snk')].map(b => b.dataset.m)), ['1'], 'два касания по «Завтрак» — «+ Перекус 1»');
  assert.ok(await a.ev(() => document.querySelector('#app .snk').closest('.meal').dataset.m === '0'), 'в карточке завтрака');
  await bf.click(); await a.wait(120); await bf.click(); await a.wait(350);
  assert.equal(await a.pg.locator('#app .snk').count(), 0, 'ещё два касания — убирают');
  await bf.click(); await a.wait(120); await bf.click(); await a.wait(350);
  await a.ev(() => { cur = shiftDay(today, -1); render(); cur = today; render(); });
  assert.equal(await a.pg.locator('#app .snk').count(), 0, 'пустой выдвинутый перекус прячется при смене дня');
  await a.pg.click('#app .meal[data-m="0"] .add'); await a.wait(300);
  assert.equal(await a.ev(() => isOpen && am), 0, 'кнопка «+» по-прежнему добавляет в сам приём');
  await a.ev(() => cl()); await a.wait(300);
  assert.equal(await a.ev(() => toFile(S).settings.snacks), 'doubleTap');
  assert.equal(await a.ev(() => parseData(ser()).set.sn), 'tap');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('цвета Б / Ж / У заданы во всех темах; акцент по умолчанию — индиго, не цвет углеводов', async () => {
  for (const scheme of ['light', 'dark']) {
    const a = await openApp({ scheme });
    const c = await a.ev(() => ['--p', '--f', '--c', '--ac'].map(k => getComputedStyle($('app')).getPropertyValue(k).trim()));
    for (const v of c) assert.match(v, /^#[0-9a-f]{6}$/i, `${scheme}: ${c}`);
    assert.notEqual(c[3], c[2], 'акцент ≠ углеводы');
    assert.equal(c[3], scheme === 'dark' ? '#7c70f0' : '#5b4fd6');
    assert.notEqual(await a.ev(() => getComputedStyle(document.querySelector('#app .mcol .n')).color), await a.ev(() => getComputedStyle(document.querySelector('#app .sum')).color), 'подпись «Белки» цветная');
    await a.close();
  }
});

test('список продуктов при открытии — всегда с начала, даже если в прошлый раз его прокрутили', async () => {
  const db = Array.from({ length: 60 }, (_, i) => ['Продукт ' + (i + 1), 10, 5, 20]);
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: {}, db } });
  await a.ev(() => op(0)); await a.wait(400);
  await a.ev(() => document.querySelector('#ov .shb').scrollTop = 2000); await a.wait(100);
  assert.ok(await a.ev(() => document.querySelector('#ov .shb').scrollTop) > 500);
  await a.ev(() => cl()); await a.wait(400);
  await a.ev(() => op(2)); await a.wait(400);
  assert.equal(await a.ev(() => document.querySelector('#ov .shb').scrollTop), 0);
  await a.close();
});

test('листы прижаты к низу: под содержимым нет пустого места', async () => {
  const a = await openApp();
  for (const f of [() => goals(), () => wtOpen(), () => cal(), () => fp(), () => pick('dc'), () => vibOpen(), () => sets(), () => mng()]) {
    await a.ev(f); await a.wait(450);
    const r = await a.ev(() => { const sh = document.querySelector('#ov .sh').getBoundingClientRect(), b = document.querySelector('#ov .shb'); return { bottom: Math.round(innerHeight - sh.bottom), gap: b.scrollHeight <= b.clientHeight ? Math.round(b.clientHeight - b.scrollHeight) : 0, name: $('st').textContent } });
    assert.ok(r.bottom <= 1, `${r.name}: лист у нижнего края (${r.bottom})`);
    assert.ok(r.gap <= 1, `${r.name}: пустое место под содержимым ${r.gap}px`);
    await a.ev(() => cl()); await a.wait(350);
  }
  assert.deepEqual(a.errors, []);
  await a.close();
});
