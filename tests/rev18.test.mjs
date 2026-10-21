// Ревизия 18: файл с настройками из другой версии (или правленый вручную) — «Настройки» не пустые, экраны открываются без ошибок
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp } from './helpers.mjs';
test('настройки из файла с неожиданными значениями: «Настройки» и все экраны выбора открываются (200 случайных наборов)', async () => {
  const a = await openApp();
  const r = await a.ev(() => {
    const bad = []; const vals = [null, 0, 1, -5, '', 'x', 'system', 'on', 'off', 'hidden', true, false, [], [1, 2], {}, { n: 5 }, { s: 'a' }, { s: [1, 'zz'], n: 9, big: 'yes' }, { n: '', c: 'red' }, 'light', 'dark', 'auto'];
    const names = Object.values(STM).map(x => x[0]); let seed = 3; const rnd = n => (seed = (seed * 1103515245 + 12345) % 2147483648) % n;
    for (let i = 0; i < 200; i++) {
      const st = {}; names.forEach(nm => { if (rnd(3)) st[nm] = vals[rnd(vals.length)] });
      let D; try { D = parseData(JSON.stringify({ format: 'bju-diary', version: 3, settings: st })) } catch (e) { continue }
      S.set = D.set;
      for (const f of ['sets()', 'lookOpen()', 'navOpen()', 'navPick(-1)', 'pfOpen()', "pick('sw')", "pick('dw')", "pick('dc')", "pick('sn')", "pick('nb')", "pick('ac')", "pick('sl')", 'vibOpen()', 'render()', 'barSync()']) {
        try { eval(f); svKill() } catch (e) { bad.push(f + ': ' + e.message + ' ' + JSON.stringify(st)); break }
      }
      try { sets(); if ($('v7').querySelectorAll('.row').length < 10) bad.push('пусто ' + JSON.stringify(st)) } catch (e) { bad.push('sets: ' + e.message + ' ' + JSON.stringify(st)) }
      if (bad.length > 4) break;
    }
    return bad });
  assert.deepEqual(r, []);
  await a.close();
});
