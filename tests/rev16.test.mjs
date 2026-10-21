// Ревизия 16 (одобренный проект): настраиваемая нижняя панель, «Ещё» → «Настройки» с новыми группами, «Тема и фон»
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp } from './helpers.mjs';

const bar = a => a.ev(() => [...document.querySelectorAll('.bt>button')].map(b => b.id === 'fab' ? '[' + b.getAttribute('aria-label') + ']' : b.textContent).join(' | '));

test('совместимость: старые настройки «＋» дают ту же панель, что раньше; новое имя «Настройки»', async () => {
  const want = { meal: '[Приём пищи по времени]', prod: '[Новый продукт]', dish: '[Новое блюдо]', wt: '[Записать вес]' };
  for (const fa of ['meal', 'prod', 'dish', 'wt', 'hide', undefined]) {
    const a = await openApp({ data: { g: { p: 140, f: 70, c: 230 }, d: {}, set: { fa, wt: 'on' } } });
    assert.equal(await bar(a), fa === 'hide' ? 'Календарь | Продукты | Статистика | Настройки' : `Календарь | Продукты | ${want[fa || 'meal']} | Статистика | Настройки`, String(fa));
    assert.deepEqual(a.errors, []);
    await a.close();
  }
});

test('правила панели: с кнопкой 3 или 5 мест, без — 2 или 4; без повторов; обязательные всегда; 10 000 случайных изменений', async () => {
  const a = await openApp();
  const r = await a.ev(() => {
    const bad = []; let seed = 11, steps = 0; const rnd = n => (seed = (seed * 1103515245 + 12345) % 2147483648) % n;
    for (let run = 0; run < 400 && bad.length < 5; run++) {
      S.set = { wt: rnd(2) ? 'on' : 'off', fa: ['meal', 'hide', 'prod', 'wt'][rnd(4)] }; barSync();
      for (let i = 0; i < 25; i++) {
        steps++; const op = rnd(6), v0 = navGet();
        if (op === 0) navFull(!!rnd(2)); else if (op === 1) navBig(); else if (op === 2) { navSlot = rnd(v0.n); const ks = Object.keys(NA); navSet(ks[rnd(ks.length)]) }
        else if (op === 3) setWt(rnd(2) ? 'on' : 'off'); else if (op === 4) setFa(['meal', 'prod', 'dish', 'wt', 'hide'][rnd(5)]); else undo();
        const v = navGet(), m = navMid(v), dom = [...document.querySelectorAll('.bt>button')], e = [];
        if (!(v.big ? [3, 5] : [2, 4]).includes(v.n) || v.s.length !== v.n) e.push('count');
        if (new Set(v.s).size !== v.n) e.push('dup'); if (!v.s.includes('prod') || !v.s.includes('set')) e.push('req');
        if (m >= 0 && ['prod', 'set'].includes(v.s[m])) e.push('center'); if (v.s.some(k => !nOk(k))) e.push('unavail');
        if (dom.length !== v.n || !!document.getElementById('fab') !== v.big) e.push('dom');
        if (S.set.nav && JSON.stringify(navFix(S.set.nav).s) !== JSON.stringify(v.s)) e.push('unstable');
        if (e.length) bad.push(e.join(',') + ' ' + JSON.stringify(v));
      }
    }
    return { bad, steps };
  });
  assert.deepEqual(r.bad, []); assert.ok(r.steps >= 10000);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('экран «Нижняя панель»: кнопка, состав, выбор действия с обменом местами, «Отменить»; панель меняется сразу', async () => {
  const a = await openApp();
  await a.ev(() => { sets(); navOpen() }); await a.wait(500);
  assert.equal(await a.ev(() => [$('st').textContent, document.querySelectorAll('.pbv>button').length, document.querySelectorAll('#nvl .nrow').length].join()), 'Нижняя панель,5,4');
  // компактная: остаются обязательные и кнопка; «Отменить» возвращает как было
  await a.ev(() => navFull(false)); await a.wait(300);
  assert.equal(await bar(a), 'Продукты | [Приём пищи по времени] | Настройки');
  assert.match(await a.ev(() => $('tm').textContent), /Убрано: Календарь, Статистика/);
  await a.pg.click('#tt button'); await a.wait(300);
  assert.equal(await bar(a), 'Календарь | Продукты | [Приём пищи по времени] | Статистика | Настройки');
  // выключить кнопку → 4 места; включить → её действие вернулось
  await a.pg.click('#nbig'); await a.wait(300);
  assert.equal(await bar(a), 'Календарь | Продукты | Статистика | Настройки');
  await a.ev(() => setFa('dish')); await a.wait(200);
  assert.equal(await bar(a), 'Календарь | Продукты | [Новое блюдо] | Статистика | Настройки');
  await a.ev(() => navBig()); await a.ev(() => navBig()); await a.wait(200);
  assert.equal(await bar(a), 'Календарь | Продукты | [Новое блюдо] | Статистика | Настройки', 'выключили и включили — то же действие');
  // выбор для места 1: занятое действие — «поменяются местами»; обязательное в центр нельзя; вес выключен — неактивен
  await a.ev(() => { setWt('off'); navPick(0) }); await a.wait(400);
  assert.equal(await a.ev(() => !$('v16').hidden && $('st').textContent), 'Место 1 из 5');
  assert.match(await a.ev(() => document.querySelector('#v16 .row.used').textContent), /поменяются местами/);
  assert.equal(await a.ev(() => document.querySelector('#v16 .row.dis .tx').firstChild.textContent), 'Записать вес');
  await a.ev(() => navSet('stat')); await a.wait(400);
  assert.equal(await bar(a), 'Статистика | Продукты | [Новое блюдо] | Календарь | Настройки');
  assert.equal(await a.ev(() => !$('v15').hidden), true, 'после выбора — снова экран панели');
  await a.ev(() => navPick(2)); await a.wait(300);
  assert.equal(await a.ev(() => [...document.querySelectorAll('#v16 .gh')].map(g => g.textContent).join()), 'Добавить,Открыть', 'для кнопки — без обязательных');
  await a.ev(() => BJU_onBack()); await a.wait(300); assert.equal(await a.ev(() => !$('v15').hidden), true, '«Назад» — к панели');
  await a.ev(() => BJU_onBack()); await a.wait(300); assert.equal(await a.ev(() => !$('v7').hidden && $('st').textContent), 'Настройки');
  // обязательный пункт выбрать нельзя — подсказка
  await a.ev(() => navPick(1)); assert.match(await a.ev(() => $('tm').textContent), /обязательный пункт/);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('перетаскивание пунктов по бокам: строка за пальцем, порядок — при отпускании; обязательные переставляются', async () => {
  const a = await openApp();
  await a.ev(() => { sets(); navOpen() }); await a.wait(500);
  const cdp = await a.pg.context().newCDPSession(a.pg);
  const g = await a.ev(() => { const r = document.querySelectorAll('#nvl .gp'), b0 = r[0].getBoundingClientRect(), b3 = r[3].getBoundingClientRect(); return { x: b0.left + b0.width / 2, y: b0.top + b0.height / 2, y3: b3.top + b3.height / 2 } });
  const T = (type, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: g.x, y, id: 1 }] });
  await T('touchStart', g.y);
  for (let i = 1; i <= 8; i++) { await a.wait(16); await T('touchMove', g.y + (g.y3 - g.y) * i / 8 + 4) }
  assert.equal(await a.ev(() => document.querySelector('#nvl .nrow.drg') !== null && isOpen), true, 'строка поднята, лист не смахнулся');
  await T('touchEnd', g.y3); await a.wait(400);
  assert.equal(await bar(a), 'Продукты | Статистика | [Приём пищи по времени] | Настройки | Календарь');
  assert.equal(await a.ev(() => [...document.querySelectorAll('#nvl .nrow')].map(r => r.dataset.k).join()), 'prod,stat,set,cal');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('«Настройки»: группы по смыслу, «Тема и фон» одним экраном в прежнем виде выбора; файл и перезапуск', async () => {
  const a = await openApp();
  await a.ev(() => sets()); await a.wait(400);
  assert.equal(await a.ev(() => $('st').textContent), 'Настройки');
  assert.deepEqual(await a.ev(() => [...document.querySelectorAll('#v7 .gh')].map(e => e.textContent)), ['Питание', 'Панель и жесты', 'Дневник и продукты', 'Оформление', 'Данные']);
  assert.equal(await a.ev(() => document.querySelectorAll('#v7 .nmini i').length), 5, 'мини-копия панели в строке');
  await a.ev(() => lookOpen()); await a.wait(400);
  assert.deepEqual(await a.ev(() => [...document.querySelectorAll('#v17 .row .tx')].map(e => e.firstChild.textContent)), ['Как в системе', 'Светлая', 'Тёмная', 'Выключен', 'Лёгкий', 'Заметный']);
  await a.pg.click('#v17 .row[data-v="light"]'); await a.wait(500);
  assert.equal(await a.ev(() => [document.documentElement.dataset.theme, document.querySelector('#v17 .row.on .tx').firstChild.textContent].join()), 'light,Светлая');
  await a.ev(() => BJU_onBack()); await a.wait(300);
  assert.match(await a.pg.textContent('#v7'), /Тема и фонСветлая · /);
  // потянуть вверх: свой список без «Нормы», «Карточки дня», «Календаря»
  await a.ev(() => pick('sw')); await a.wait(300);
  assert.deepEqual(await a.ev(() => [...document.querySelectorAll('#pko .row .tx')].map(e => e.firstChild.textContent)),
    ['Приём пищи по времени', 'Новый продукт', 'Новое блюдо', 'Записать вес', 'Статистика', 'К сегодняшнему дню', 'Продукты', 'Выключено']);
  // файл: navBar и fabAction для старых версий; чтение обратно
  await a.ev(() => { navSave({ n: 5, big: true, s: ['today', 'prod', 'goal', 'cal', 'set'] }) });
  const f = await a.ev(() => JSON.parse(ser()).settings);
  assert.deepEqual([f.navBar.s, f.fabAction], [['today', 'prod', 'goal', 'cal', 'set'], 'meal']);
  assert.deepEqual(await a.ev(() => navGet().s), ['today', 'prod', 'goal', 'cal', 'set']);
  assert.deepEqual(await a.ev(() => { const d = parseData(ser()); return navFix(d.set.nav).s }), ['today', 'prod', 'goal', 'cal', 'set']);
  // холодный запуск: то же
  await a.ev(() => save()); await a.wait(1200); await a.pg.reload(); await a.pg.waitForSelector('#app .sum');
  assert.equal(await bar(a), 'Сегодня | Продукты | [Норма на день] | Календарь | Настройки');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('узкий экран 360 px: подписи помещаются; на панели действия работают', async () => {
  const a = await openApp({ viewport: { width: 360, height: 760 }, data: { g: { p: 140, f: 70, c: 230 }, d: {}, set: { nav: { n: 5, big: true, s: ['stat', 'prod', 'meal', 'cal', 'set'] } } } });
  assert.equal(await a.ev(() => [...document.querySelectorAll('.bt>button')].every(b => b.scrollWidth <= b.clientWidth + 1)), true);
  await a.pg.click('.bt>button:nth-child(4)'); await a.wait(400);
  assert.equal(await a.ev(() => isOpen && !$('v6').hidden), true, 'Календарь');
  await a.ev(() => cl()); await a.wait(300); await a.pg.click('.bt>button:nth-child(5)'); await a.wait(400);
  assert.equal(await a.ev(() => isOpen && !$('v7').hidden), true, 'Настройки');
  assert.deepEqual(a.errors, []);
  await a.close();
});
