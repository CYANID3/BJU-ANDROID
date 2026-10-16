// Главный экран, добавление продуктов, дни, календарь, лист, «Назад», клавиатура, настройки
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day, entry } from './helpers.mjs';

test('запуск без ошибок: итог дня и шесть приёмов пищи', async () => {
  const a = await openApp();
  assert.equal(await a.pg.locator('#app .meal').count(), 6);
  assert.match(await a.pg.textContent('#app .sum'), /из \d+ ккал/);
  assert.equal(await a.pg.locator('.bt button').count(), 5);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('добавить продукт в завтрак: запись и калории', async () => {
  const a = await openApp();
  await a.ev(() => op(0)); await a.wait(350);
  await a.pg.fill('#q', 'творог');
  await a.pg.locator('#ls .pk').first().click(); await a.wait(350);
  assert.equal(await a.ev(() => $('v2').hidden), false);
  await a.pg.fill('#gr', '200');
  await a.pg.click('#ab'); await a.wait(400);
  const e = await a.ev(() => S.d[cur][0]);
  assert.equal(e.n, 'Творог 5%'); assert.equal(e.g, 200); assert.equal(e.p, 34); assert.equal(e.m, 0);
  assert.match(await a.pg.textContent('#app .sum .big b'), /^\d+$/);
  assert.equal(await a.pg.locator('#app .meal').first().locator('.it').count(), 1);
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

test('норма: изменение пересчитывает калории', async () => {
  const a = await openApp();
  await a.ev(() => goals()); await a.wait(300);
  await a.pg.fill('#gp', '100'); await a.pg.fill('#gf', '50'); await a.pg.fill('#gc', '200');
  assert.match(await a.pg.textContent('#gkc'), /1650/);
  await a.ev(() => sg()); await a.wait(300);
  assert.match(await a.pg.textContent('#app .sum'), /из 1650 ккал/);
  await a.close();
});

test('свайп по дню листает на следующий и обратно', async () => {
  const a = await openApp();
  await a.drag(330, 500, 60, 505, { steps: 8 }); await a.wait(700);
  assert.equal(await a.ev(() => cur), day(1));
  await a.drag(60, 500, 330, 505, { steps: 8 }); await a.wait(700);
  assert.equal(await a.ev(() => cur), day(0));
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('календарь: месяц тянется за пальцем, «Назад» по шагам', async () => {
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
  assert.equal(await a.ev(() => BJU_onBack()), false, 'на главном экране «Назад» сворачивает приложение');
  await a.close();
});

test('лист смахивается вниз', async () => {
  const a = await openApp();
  await a.ev(() => mng()); await a.wait(450);
  const sb = await a.pg.locator('#ov .sh').boundingBox();
  await a.drag(200, sb.y + 200, 200, sb.y + 420, { steps: 12, ms: 16 }); await a.wait(500);
  assert.equal(await a.ev(() => isOpen), false);
  await a.close();
});

test('«Назад» из нового продукта возвращает к списку, несохранённое — с вопросом', async () => {
  const a = await openApp();
  await a.ev(() => op(2)); await a.wait(300);
  await a.ev(() => nw()); await a.wait(300);
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

test('клавиатура поднимает лист на её высоту', async () => {
  const a = await openApp();
  await a.ev(() => op(0)); await a.wait(400);
  const b0 = await a.pg.locator('#ov .sh').boundingBox();
  await a.ev(() => { const r = document.documentElement.style; r.setProperty('--kbd', '1ms'); r.setProperty('--kb', '300px'); }); await a.wait(300);
  const b1 = await a.pg.locator('#ov .sh').boundingBox();
  assert.ok(Math.abs((b0.y + b0.height) - (b1.y + b1.height) - 300) < 3, `низ листа сдвинулся на ${(b0.y + b0.height) - (b1.y + b1.height)}`);
  await a.close();
});

test('настройки: длина свайпа, оттенок фона и акцент применяются', async () => {
  const a = await openApp();
  await a.ev(() => sets()); await a.wait(300);
  await a.pg.click('#slm button:nth-child(3)');
  assert.equal(await a.ev(() => slv()), 'long');
  const bg0 = await a.ev(() => getComputedStyle(document.documentElement).getPropertyValue('--bg'));
  await a.pg.click('#tnm button:nth-child(3)');
  const bg1 = await a.ev(() => getComputedStyle(document.documentElement).getPropertyValue('--bg'));
  assert.notEqual(bg0, bg1, 'оттенок фона меняет --bg');
  await a.pg.click('#swc button:nth-child(4)');
  assert.equal(await a.ev(() => S.set.ac), '#6366f1');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('нижняя панель открывает свои экраны', async () => {
  const a = await openApp();
  const want = ['v4', 'v1', 'v9', 'v5', 'v7'];
  for (let i = 0; i < 5; i++) {
    await a.pg.click(`.bt button:nth-child(${i + 1})`); await a.wait(350);
    assert.equal(await a.ev(() => VWS.map(i => 'v' + i).find(id => !$(id).hidden)), want[i]);
    await a.ev(() => cl()); await a.wait(300);
  }
  await a.close();
});

test('длина свайпа: один и тот же жест срабатывает по-разному на трёх уровнях', async () => {
  const a = await openApp();
  // медленное движение (без рывка) на d пикселей: перелистнулся ли день
  const flips = async (lv, d) => {
    await a.ev(v => { cur = today; render(); setSl(v); }, lv); await a.wait(200);
    await a.drag(300, 500, 300 - d, 502, { steps: 12, ms: 45 }); await a.wait(700);
    return a.ev(() => cur !== today);
  };
  assert.deepEqual([await flips('short', 40), await flips('mid', 40), await flips('long', 40)], [true, false, false], '40 px');
  assert.deepEqual([await flips('mid', 90), await flips('long', 90)], [true, false], '90 px');
  assert.equal(await flips('long', 200), true, '200 px');
  // потянуть вверх в конце страницы: порог 21 / 96 / 326 px
  assert.deepEqual(await a.ev(() => ['short', 'mid', 'long'].map(v => { S.set.sl = v; return Math.round(THv()); })), [21, 96, 326]);
  await a.close();
});
