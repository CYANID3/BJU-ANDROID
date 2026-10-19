// Ревизия 4: запоминание единицы, тост с количеством, взмахи внутри листа, палитра тёмной темы и тоста, экран «Файл данных»
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day, entry } from './helpers.mjs';

// взмах пальцем внутри страницы: события касания с точным темпом (CDP слишком медленный для быстрого взмаха)
const flick = (a, sel, dx, ms) => a.ev(async ([sel, dx, ms]) => {
  const el = document.querySelector(sel), r = el.getBoundingClientRect(), x0 = r.left + r.width / 2 + (dx < 0 ? 60 : -60), y = r.top + Math.min(r.height / 2, 120);
  const mk = (type, x) => { const t = new Touch({ identifier: 1, target: el, clientX: x, clientY: y }); el.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: type === 'touchend' ? [] : [t], changedTouches: [t] })) };
  const n = Math.max(6, Math.round(ms / 12)); mk('touchstart', x0);
  for (let i = 1; i <= n; i++) { await new Promise(r => setTimeout(r, ms / n)); mk('touchmove', x0 + dx * i / n) }
  mk('touchend', x0 + dx); await new Promise(r => setTimeout(r, 650));
}, [sel, dx, ms]);

const db = [['Банан', 1.1, .3, 22.8, [['шт', 120]]], ['Консервы', 20, 10, 0, [['банка', 250], ['ложка', 15]]], ['Гречка', 12.6, 3.3, 57]];

test('«Запоминать единицу»: продукт открывается в той мере, что в прошлый раз (граммы, шт, банка); выключено — как раньше; в файле', async () => {
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: {}, db } });
  const open = async n => { await a.ev(n => { if (isOpen) closeUI(); op(0); pc(IX.indexOf(S.db.findIndex(p => p[0] === n))) }, n); await a.wait(350); return a.ev(() => [$('gu').textContent, $('gr').value].join()) };
  assert.equal(await open('Консервы'), 'банка,', 'впервые — первая мера');
  await a.ev(() => { su(1); $('gr').value = '2'; ad() }); await a.wait(300);
  assert.equal(await open('Консервы'), 'ложка,2', 'в прошлый раз — 2 ложки');
  await a.ev(() => { su(-1); $('gr').value = '90'; ad() }); await a.wait(300);
  assert.equal(await open('Консервы'), 'г,90', 'в прошлый раз — граммы');
  assert.deepEqual(await a.ev(() => JSON.parse(ser()).stats.lastUnit['Консервы']), { unit: null });
  await a.ev(() => { su(0); $('gr').value = '1'; ad() }); await a.wait(300);
  assert.deepEqual(await a.ev(() => JSON.parse(ser()).stats.lastUnit['Консервы']), { unit: 'банка', amount: 1 });
  assert.deepEqual(await a.ev(() => { const o = parseData(ser()); return o.lu['Консервы'] }), ['банка', 1], 'читается из файла');
  // выключено — первая мера, как раньше
  await a.ev(() => { closeUI(); sets() }); await a.wait(400);
  await a.pg.click('#lum'); await a.wait(150);
  assert.equal(await a.ev(() => JSON.parse(ser()).settings.rememberUnit), 'off');
  await a.ev(() => { su(-1) }).catch(() => { });
  await a.ev(() => { closeUI(); op(0); pc(IX.indexOf(S.db.findIndex(p => p[0] === 'Консервы'))); su(-1); $('gr').value = '50'; ad() }); await a.wait(300);
  assert.equal(await open('Консервы'), 'банка,', 'выключено — первая мера');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('тост после добавления — с количеством; крупные числа с пробелом', async () => {
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: {}, db } });
  await a.ev(() => { op(0); pc(IX.indexOf(0)) }); await a.wait(300);
  await a.ev(() => { $('gr').value = '100'; pv() });
  assert.equal(await a.ev(() => $('ab').textContent), 'Добавить · 11 796 ккал');
  await a.ev(() => ad()); await a.wait(300);
  assert.equal(await a.ev(() => $('tm').textContent), 'Завтрак: Банан · 100 шт · 11 796 ккал', '100 бананов — не ошибка, но видно, сколько');
  await a.ev(() => { pc(IX.indexOf(2)); }); await a.wait(300);
  await a.ev(() => { $('gr').value = '80'; ad() }); await a.wait(300);
  assert.equal(await a.ev(() => $('tm').textContent), 'Завтрак: Гречка · 80 г · 246 ккал');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('взмахи внутри листа: короткий быстрый — листает при любой «Длине свайпа»; медленный короткий — нет', async () => {
  const dsh = [['Салат', 1.2, 4.8, 4, [['порция', 300]], { w: 300, i: [{ n: 'Огурец', g: 200, p: 1.6, f: .2, c: 5 }] }], ['Творог 5%', 17, 5, 1.8]];
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: {}, db: dsh, set: { sl: 'long' } } });
  await a.ev(() => cal()); await a.wait(500);
  const m0 = await a.ev(() => JSON.stringify(cm));
  await flick(a, '#cg', -40, 140);
  const m1 = await a.ev(() => JSON.stringify(cm)); assert.notEqual(m1, m0, 'календарь: 40 px быстро — следующий месяц');
  await flick(a, '#cg', -40, 500);
  assert.equal(await a.ev(() => JSON.stringify(cm)), m1, 'медленно на 40 px — остаётся');
  await flick(a, '#cg', 40, 140);
  assert.equal(await a.ev(() => JSON.stringify(cm)), m0, 'обратно');
  await a.ev(() => { cl(); }); await a.wait(400); await a.ev(() => stats()); await a.wait(500);
  const s0 = await a.ev(() => $('st').textContent);
  await flick(a, '#stc', 50, 140);
  assert.notEqual(await a.ev(() => $('st').textContent), s0, 'статистика: прошлый месяц');
  await a.ev(() => { cl(); }); await a.wait(400); await a.ev(() => mng()); await a.wait(500);
  await flick(a, '#ls', -50, 140);
  assert.equal(await a.ev(() => [pFl, document.querySelector('#pf button.on').textContent.replace(/\d/g, '').trim()].join()), '1,Продукты', 'вкладки продуктов');
  await flick(a, '#ls', -50, 140);
  assert.equal(await a.ev(() => pFl), 2);
  await flick(a, '#ls', -50, 140);
  assert.equal(await a.ev(() => pFl), 2, 'дальше последней — пружинит');
  assert.equal(await a.ev(() => $('ls').style.transform), '', 'список вернулся на место');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('палитра: на 10 цветах, в обеих темах и с любым оттенком фона текст и кнопки читаются; тост в тон', async () => {
  const PRE = ['', '#22a06b', '#14b8a6', '#3b82f6', '#8b5cf6', '#e5589a', '#e5484d', '#f08a24', '#f5c518', '#64748b'];
  for (const scheme of ['dark', 'light']) {
    const a = await openApp({ scheme, data: { g: { p: 100, f: 60, c: 200 }, d: {} } });
    const bad = await a.ev(PRE => {
      const out = [];
      for (const ac of PRE) for (const tn of ['off', 'soft', 'strong']) {
        S.set = { ...S.set, ac, tn }; applyAc();
        const cs = getComputedStyle(document.documentElement), g = k => cs.getPropertyValue(k).trim(), c = (x, y) => crt(g(x), g(y));
        const need = [['--tx', '--card', 7], ['--tx', '--sub', 7], ['--mu', '--card', 4.5], ['--mu', '--sub', 4.5], ['--act', '--acs', 4.5], ['--act', '--card', 4.5], ['--tsa', '--tst', 4.5], ['--tsx', '--tst', 7]];
        for (const [x, y, t] of need) { const v = c(x, y); if (!(v >= t)) out.push(`${ac || 'индиго'} ${tn} ${x}/${y} ${v.toFixed(2)}`) }
        if (crt(g('--on'), g('--ac')) < 3) out.push(`${ac} --on/--ac`);
      }
      return out;
    }, PRE);
    assert.deepEqual(bad, [], scheme);
    if (scheme === 'dark') {
      // тёмная тема светлее прежней: фон и карточки не «уходят во тьму»
      const L = await a.ev(() => { S.set = { ...S.set, ac: '', tn: 'off' }; applyAc(); const cs = getComputedStyle(document.documentElement); return [lum(cs.getPropertyValue('--bg').trim()) > lum('#10141c'), lum(cs.getPropertyValue('--card').trim()) > lum('#1a202b')] });
      assert.deepEqual(L, [true, true]);
    } else {
      assert.equal(await a.ev(() => getComputedStyle(document.documentElement).getPropertyValue('--tst').trim()), '#ffffff', 'светлая тема — белый тост');
    }
    assert.deepEqual(a.errors, []);
    await a.close();
  }
});

test('«Файл данных»: «Открыть существующий файл», импорт — отдельной группой', async () => {
  const a = await openApp();
  await a.ev(() => fp()); await a.wait(400);
  assert.deepEqual(await a.ev(() => [...document.querySelectorAll('#v5 .gh')].map(e => e.textContent)), ['Основной файл', 'Импорт']);
  assert.deepEqual(await a.ev(() => [...document.querySelectorAll('#v5 .row .tx')].map(e => e.firstChild.textContent)), ['Создать новый файл', 'Открыть существующий файл', 'Добавить продукты из файла']);
  await a.close();
});
