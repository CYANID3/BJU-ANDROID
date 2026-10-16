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
  assert.equal(await a.ev(() => isOpen && $('st').textContent), 'Добавить: Ужин');
  await a.ev(() => { cl(); lastU = ''; cur = shiftDay(today, -3); render(); }); await a.wait(300);
  await a.ev(() => BJU_onUrl('bju://add?m=0')); await a.wait(300);
  assert.equal(await a.ev(() => cur === today), true, 'ярлык всегда добавляет на сегодня');
  await a.close();
});
