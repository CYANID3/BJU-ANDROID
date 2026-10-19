// Формат файла v3, основной файл в APK (мок SAF), виджет, ярлыки
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day } from './helpers.mjs';

test('формат v3: запись и обратное чтение без потерь', async () => {
  const a = await openApp({ native: true });
  await a.ev(() => {
    S.d[today] = [{ m: 0, n: 'Яблоко', g: 55, q: 1, ul: 'шт', p: .22, f: .22, c: 5.39 }, { m: 2, n: 'Рис', g: 100, p: 7, f: 1, c: 74 }];
    S.db.unshift(['Салат', 2, 5, 6, [['порция', 300]], { w: 300, i: [{ n: 'Огурец', g: 200, p: 1.6, f: .2, c: 5 }] }]);
    S.db[1][4] = [['шт', 180]];
    S.set = { th: 'dark', sw: 'prod', dw: 'cal', hp: 'nodays', sl: 'long', ac: '#22a06b', tn: 'soft', wt: 'off' };
    S.uc = { 'Рис': 3 }; S.fav = { 'Рис (сухой)': 1 }; S.rc = ['Рис', 'Яблоко']; S.wt = { [today]: 72.4 };
    save(); render();
  });
  await a.wait(400);
  const j = JSON.parse(await a.ev(() => __P.local));
  assert.equal(j.format, 'bju-diary'); assert.equal(j.version, 3);
  assert.deepEqual(Object.keys(j), ['format', 'version', 'savedAt', 'goals', 'products', 'diary', 'weight', 'settings', 'stats']);
  assert.deepEqual(j.diary[day()].breakfast[0].unit, { name: 'шт', count: 1 });
  assert.equal(j.products[0].dish.cookedWeight, 300);
  assert.equal(j.products.find(p => p.name === 'Рис (сухой)').favorite, true);
  assert.deepEqual(j.weight, { [day()]: 72.4 });
  assert.equal(j.settings.weightTracking, 'off'); assert.equal(j.settings.swipeLength, 'long'); assert.equal(j.settings.backgroundTint, 'soft');
  assert.deepEqual(j.stats.recent, ['Рис', 'Яблоко']);
  const same = await a.ev(() => {
    const b = parseData(ser()), norm = x => Array.isArray(x) ? x.map(norm) : x && typeof x === 'object' ? Object.keys(x).sort().filter(k => x[k] !== undefined).reduce((o, k) => (o[k] = norm(x[k]), o), {}) : x;
    const pick = o => JSON.stringify(norm({ g: o.g, db: o.db, d: Object.fromEntries(Object.entries(o.d).filter(([, v]) => v.length)), set: o.set, uc: o.uc, lg: o.lg || {}, fav: o.fav, rc: o.rc, wt: o.wt }));
    return pick(b) === pick(S) || [pick(b), pick(S)];
  });
  assert.equal(same, true);
  await a.close();
});

test('формат: понятные ошибки при ручной правке, старый формат открывается', async () => {
  const a = await openApp();
  const err = f => a.ev(f => { const o = toFile(S); new Function('f', f)(o); try { parseData(JSON.stringify(o)); return 'нет ошибки'; } catch (e) { return e.message; } }, f.toString().replace(/^[^{]*{|}$/g, ''));
  assert.match(await err(f => { f.diary['2026-10-01'] = { lanch: [{ name: 'X', grams: 1 }] }; }), /неизвестный приём пищи «lanch»/);
  assert.match(await err(f => { f.diary['2026-10-01'] = { lunch: [{ name: 'X' }] }; }), /нет массы/);
  assert.match(await err(f => { f.products.push({ per100g: {} }); }), /нет названия/);
  assert.match(await err(f => { f.weight = { '2026-10-01': 'много' }; }), /вес за 2026-10-01/);
  assert.match(await err(f => { f.weight = { 'вчера': 70 }; }), /неверная дата/);
  assert.equal(await err(f => { f.products.push({ name: 'Без чисел' }); }), 'нет ошибки');
  assert.equal(await a.ev(() => parseData(JSON.stringify({ g: { p: 1, f: 2, c: 3 }, d: { '2026-01-01': [{ m: 0, n: 'A', g: 1, p: 1, f: 1, c: 1 }] }, db: [['A', 1, 1, 1]] })).d['2026-01-01'].length), 1);
  await a.close();
});

test('APK: открытый файл становится основным и остаётся им после перезапуска', async () => {
  const a = await openApp({ native: true });
  await a.ev(() => { __P.files['content://x/my.json'] = JSON.stringify({ g: { p: 100, f: 60, c: 200 }, d: { '2026-10-10': [{ m: 0, n: 'X', g: 100, p: 0, f: 0, c: 200 }] }, saved: Date.now() - 1000, db: [] }); window.__pick = 'content://x/my.json'; });
  const p = a.ev(() => fo2()); await a.wait(300);
  if (await a.ev(() => $('dg').classList.contains('on'))) await a.ev(() => $('dgy').click());
  await p; await a.wait(300);
  assert.equal(await a.ev(() => MF && MF.name), 'my.json');
  await a.ev(() => { S.d['2026-10-12'] = [{ m: 2, n: 'Z', g: 100, p: 10, f: 1, c: 1 }]; save(); }); await a.wait(500);
  assert.ok(JSON.parse(await a.ev(() => __P.files['content://x/my.json'])).diary['2026-10-12'].lunch, 'изменения пишутся в основной файл');
  await a.pg.reload(); await a.pg.waitForFunction(() => document.querySelector('#app .sum')); await a.wait(600);
  assert.equal(await a.ev(() => MF && MF.name), 'my.json');
  assert.equal(await a.ev(() => mfOk), true);
  assert.ok(await a.ev(() => S.d['2026-10-12'] && S.d['2026-10-10']));
  await a.close();
});

test('виджет получает итоги дня, ярлыки открывают нужный приём пищи', async () => {
  const a = await openApp({ native: true });
  await a.ev(() => { S.d[today] = [{ m: 2, n: 'Рис', g: 100, p: 7, f: 1, c: 74 }]; save(); render(); }); await a.wait(300);
  const w = await a.ev(() => __W[__W.length - 1]);
  assert.equal(w.date, day()); assert.equal(w.eaten, 333); assert.equal(w.p, 7); assert.equal(w.c, 74);
  assert.ok(w.goal > 0 && /^#|^\d/.test(String(w.accent)));
  await a.ev(() => BJU_onUrl('bju://add?m=4')); await a.wait(300);
  assert.equal(await a.ev(() => isOpen && $('st').textContent), 'Добавить в ужин');
  await a.ev(() => { cl(); lastU = ''; cur = shiftDay(today, -3); render(); }); await a.wait(300);
  await a.ev(() => BJU_onUrl('bju://add?m=0')); await a.wait(300);
  assert.equal(await a.ev(() => cur === today), true, 'ярлык всегда добавляет на сегодня');
  await a.close();
});

test('ярлык «Вес» у иконки: есть, только когда вес включён; bju://weight открывает ввод', async () => {
  const a = await openApp({ native: true });
  await a.ev(() => { window.__SC = []; const N = window.BJU_NATIVE; N.shortcuts = o => { window.__SC.push(o.weight); return Promise.resolve(); }; window.__scL = undefined; scSync(); });
  assert.deepEqual(await a.ev(() => __SC), [true]);
  await a.ev(() => BJU_onUrl('bju://weight')); await a.wait(400);
  assert.equal(await a.ev(() => isOpen && !$('v10').hidden && cur === today), true);
  await a.ev(() => cl()); await a.wait(300);
  await a.ev(() => setWt('off')); await a.ev(() => setWt('off'));
  assert.deepEqual(await a.ev(() => __SC), [true, false], 'без повторных вызовов');
  await a.ev(() => { lastU = ''; BJU_onUrl('bju://weight'); }); await a.wait(300);
  assert.equal(await a.ev(() => isOpen), false, 'вес выключен — ярлык ничего не открывает');
  await a.ev(() => setWt('on'));
  assert.deepEqual(await a.ev(() => __SC), [true, false, true]);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('виджет: превью в списке виджетов — тёмное, с подписями Б / Ж / У и правдоподобным днём', async () => {
  const fs = await import('node:fs');
  const info = fs.readFileSync('native/android/res/xml/bju_widget_info.xml', 'utf8');
  assert.match(info, /previewLayout="@layout\/bju_widget_preview"/);
  const x = fs.readFileSync('native/android/res/layout/bju_widget_preview.xml', 'utf8');
  for (const t of ['Белки', 'Жиры', 'Углеводы', '964 ккал', '102 / 120 г']) assert.ok(x.includes(`"${t}"`), t);
  assert.match(x, /bju_widget_shape_preview/);
  assert.match(fs.readFileSync('native/android/res/drawable/bju_widget_shape_preview.xml', 'utf8'), /#F51A202B/);
  const base = fs.readFileSync('native/android/res/layout/bju_widget.xml', 'utf8');
  assert.ok(base.includes('"Жиры"') && base.includes('"Углеводы"'), 'до первого обновления — верные подписи');
});

test('слияние баз: тот же продукт склеивается, похожие — на выбор, новые добавляются, дневник не меняется', async () => {
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: { [day()]: [{ m: 0, n: 'Мой', g: 100, p: 1, f: 1, c: 1 }] }, db: [
    ['Творог 5%', 17, 5, 1.8], ['Творог 5% Савушкин', 16, 5, 3], ['Куриная грудка', 23.6, 1.9, .4], ['Молоко 2,5%', 2.9, 2.5, 4.7],
    ['Яйцо (варёное)', 12.6, 10.6, 1.1, [['Штук', 50]]], ['Яйцо жареное', 13.6, 15, .9], ['Яйцо сырое', 12.7, 10.9, .7], ['Хлеб белый', 7.6, 2.9, 50]] } });
  const file = await a.ev(() => { const o = toFile(S); o.diary = { '2026-01-01': { breakfast: [{ name: 'Её запись', grams: 100, per100g: { protein: 1, fat: 1, carbs: 1 } }] } };
    o.products = [
      { name: 'творог 5 %', per100g: { protein: 17, fat: 5, carbs: 1.8 } },
      { name: 'Грудка куриная', per100g: { protein: 23.5, fat: 2, carbs: .4 }, units: [{ name: 'Филе', grams: 200 }] },
      { name: 'Молоко 3,2%', per100g: { protein: 2.9, fat: 3.2, carbs: 4.7 } },
      { name: 'Яйцо', per100g: { protein: 12.7, fat: 10.9, carbs: .7 }, units: [{ name: 'штук', grams: 55 }, { name: 'Десяток', grams: 550 }] },
      { name: 'Хлеб', per100g: { protein: 7.5, fat: 3, carbs: 49.5 } },
      { name: 'Гречка', per100g: { protein: 12.6, fat: 3.3, carbs: 62 } }];
    return JSON.stringify(o); });
  await a.ev(f => mgRun(f, 'другой.json'), file); await a.wait(400);
  assert.equal(await a.ev(() => isOpen && !$('v12').hidden), true, 'открылся экран «Похожие продукты»');
  const pairs = await a.ev(() => [...document.querySelectorAll('#mgl .mgp')].map(p => [...p.querySelectorAll('.mgr b')].map(b => b.textContent).join(' ↔ ')));
  assert.deepEqual(pairs, ['Яйцо ↔ Яйцо сырое', 'Хлеб ↔ Хлеб белый'], 'похожее — самое близкое по БЖУ');
  assert.equal(await a.ev(() => S.db.length), 8, 'до «Готово» список не меняется');
  await a.pg.click('#mgl .mgp:nth-child(2) button:has-text("Это одно")');
  await a.pg.click('.ft[data-v="12"] .pb'); await a.wait(300);
  const r = await a.ev(() => ({ names: S.db.map(p => p[0]), bread: S.db.find(p => p[0] === 'Хлеб белый')[4], days: Object.keys(S.d), toast: $('tm').textContent, v5: !$('v5').hidden }));
  assert.deepEqual(r.names, ['Творог 5%', 'Творог 5% Савушкин', 'Куриная грудка', 'Молоко 2,5%', 'Яйцо (варёное)', 'Яйцо жареное', 'Яйцо сырое', 'Хлеб белый', 'Молоко 3,2%', 'Яйцо', 'Гречка']);
  assert.equal(r.bread, undefined, 'у «Хлеба» из файла мер не было');
  assert.deepEqual(await a.ev(() => S.db.find(p => p[0] === 'Куриная грудка')[4]), [['Филе', 200]], 'тот же набор слов — склеено, мера добавлена');
  assert.deepEqual(r.days, [day()], 'дневник не меняется');
  assert.match(r.toast, /Добавлено продуктов: 3 .* новых мер: 1/);
  assert.equal(r.v5, true, 'после «Готово» — снова «Файл»');
  await a.ev(() => undo());
  assert.equal(await a.ev(() => S.db.length), 8, '«Отменить» возвращает прежний список');
  await a.ev(() => { mgRun(ser(), 'свой'); }); await a.wait(300);
  assert.match(await a.ev(() => $('dgm').textContent), /нет новых продуктов/);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('настройка «Импорт продуктов из файла»: выключена — кнопки нет; сохраняется в файле', async () => {
  const a = await openApp();
  await a.ev(() => fp()); await a.wait(300);
  assert.equal(await a.ev(() => $('mgb').hidden), false);
  await a.ev(() => cl()); await a.wait(400); await a.ev(() => sets()); await a.wait(400);
  await a.pg.click('#mgm'); await a.wait(100);
  assert.equal(await a.ev(() => [S.set.mg, $('mgm').getAttribute('aria-checked')].join()), 'off,false');
  assert.equal(await a.ev(() => JSON.parse(ser()).settings.productImport), 'off');
  await a.ev(() => cl()); await a.wait(400); await a.ev(() => fp()); await a.wait(400);
  assert.equal(await a.ev(() => $('mgb').hidden), true);
  await a.close();
});
