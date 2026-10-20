// Ревизия 12: новая иконка (вилка с зубцами Б / Ж / У) — векторные слои адаптивной иконки без растягивания;
// виджет 1×2 и новая раскладка 1×3 (что каждая раскладка содержит заполняемые элементы — проверяет data.test.mjs)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const JAVA = fs.readFileSync('native/android/BjuWidget.java', 'utf8');
const arr = name => { const m = JAVA.match(new RegExp(`static final \\w+(?:\\[\\])+ ${name} = \\{([\\s\\S]*?)\\};`)); assert.ok(m, name); return m[1] };
const bools = name => arr(name).split(',').map(s => s.trim() === 'true');
const LAYOUT = [...arr('LAYOUT').matchAll(/R\.layout\.(\w+)/g)].map(m => m[1]);
const BASE = arr('BASE').split(',').map(Number), RING = arr('RING').split(',').map(Number);
const MIN = [...arr('MIN').matchAll(/\{\s*([\d.]+),\s*([\d.]+)\s*\}/g)].map(m => [+m[1], +m[2]]);
const F = Object.fromEntries(['KCAL', 'HEAD', 'BARS', 'ADD', 'CAP'].map(k => [k, bools(k)]));

test('виджет: таблицы раскладок одной длины, у узких высоких — свои раскладки (1×2 — v2, 1×3 и выше — v3)', () => {
  for (const [k, a] of Object.entries({ BASE, RING, MIN, ...F })) assert.equal(a.length, LAYOUT.length, k);
  const v2 = LAYOUT.indexOf('bju_widget_v2'), v3 = LAYOUT.indexOf('bju_widget_v3');
  assert.ok(v2 >= 0 && v3 >= 0);
  // как BjuWidget.pick: самая крупная раскладка, которая помещается
  const pick = (w, h) => { let best = 0, area = 0; MIN.forEach(([a, b], k) => { if (w >= a && h >= b && a * b > area) { best = k; area = a * b } }); return best };
  for (const [w, h] of [[70, 160], [75, 190], [80, 220]]) assert.equal(LAYOUT[pick(w, h)], 'bju_widget_v2', `${w}×${h}`);
  for (const [w, h] of [[70, 250], [75, 290], [80, 340], [75, 400]]) assert.equal(LAYOUT[pick(w, h)], 'bju_widget_v3', `${w}×${h}`);
  assert.equal(LAYOUT[pick(75, 100)], 'bju_widget_t1');
});

test('виджет 1×2 и 1×3: кольцо — в слоте с весом (уменьшается при нехватке места), запас высоты делят распорки между блоками', () => {
  for (const n of ['bju_widget_v2', 'bju_widget_v3']) {
    const x = fs.readFileSync(`native/android/res/layout/${n}.xml`, 'utf8');
    assert.match(x, /android:id="@\+id\/bju_w_ring" android:layout_width="match_parent" android:layout_height="0dp"[^>]*android:layout_weight=/, n);
    const sp = [...x.matchAll(/<View android:layout_width="match_parent" android:layout_height="0dp" android:layout_weight="([\d.]+)"\/>/g)].map(m => +m[1]);
    assert.ok(sp.length >= 1, n);
  }
  // в 1×3 распорки есть и между строками, а не только по краям
  const v3 = fs.readFileSync('native/android/res/layout/bju_widget_v3.xml', 'utf8');
  assert.equal((v3.match(/<View android:layout_width="match_parent" android:layout_height="0dp" android:layout_weight=/g) || []).length, 4);
  assert.match(v3, /bju_w_cap/);
});

test('иконка: адаптивная — векторные слои без растягивания картинок, монохромный слой того же размера; шаблон Capacitor удаляется', async () => {
  const { VARIANTS, fgVector, monoVector, bgShape } = await import('../scripts/icon-svg.mjs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')), v = VARIANTS[pkg.icon];
  assert.ok(v, `вариант «${pkg.icon}»`);
  const fg = fs.readFileSync('native/android/res/drawable/bju_ic_fg.xml', 'utf8'), mono = fs.readFileSync('native/android/res/drawable/bju_ic_mono.xml', 'utf8'), bg = fs.readFileSync('native/android/res/drawable/bju_ic_bg.xml', 'utf8');
  // файлы совпадают с исходником (npm run icons выполнен после правок)
  assert.equal(fg, fgVector(pkg.icon)); assert.equal(mono, monoVector()); assert.equal(bg, bgShape(pkg.icon));
  for (const c of [v.fork, ...v.tines]) assert.ok(fg.includes('#FF' + c.slice(1).toUpperCase()), c);
  // слой 108 dp, видна середина 72 dp: рисунок уменьшен до 2/3 в обоих слоях одинаково
  for (const x of [fg, mono]) { assert.match(x, /android:width="108dp"/); assert.match(x, /android:scaleX="0\.6667" android:scaleY="0\.6667"/) }
  assert.equal((fg.match(/<path/g) || []).length, 4); assert.equal((mono.match(/<path/g) || []).length, 4);
  const patch = fs.readFileSync('scripts/patch-android.mjs', 'utf8');
  assert.match(patch, /<background android:drawable="@drawable\/bju_ic_bg" \/>/);
  assert.match(patch, /<foreground android:drawable="@drawable\/bju_ic_fg" \/>/);
  assert.match(patch, /<monochrome android:drawable="@drawable\/bju_ic_mono" \/>/);
  assert.doesNotMatch(patch.slice(patch.indexOf('const ADAPTIVE'), patch.indexOf('</adaptive-icon>')), /inset/);
  assert.match(patch, /drawable-v24\/ic_launcher_foreground\.xml', 'drawable\/ic_launcher_background\.xml/);
});
