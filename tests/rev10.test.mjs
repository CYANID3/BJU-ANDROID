// Ревизия 10: цветные подписи (Б / Ж / У, состояния дня) читаются в обеих темах; новый экран листа ничто не делает прозрачным
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day } from './helpers.mjs';

// контраст текста к фону под ним (с учётом полупрозрачных подложек) — только видимые элементы с собственным текстом
const lowContrast = a => a.ev(() => {
  // любой формат цвета (rgb, oklab, color-mix) → rgb через пиксель холста
  const cv = document.createElement('canvas'); cv.width = cv.height = 1; const g = cv.getContext('2d', { willReadFrequently: true });
  const P = c => { if (!c || c === 'transparent' || /^rgba\(0, 0, 0, 0\)$/.test(c)) return { r: 0, g: 0, b: 0, a: 0 }; g.clearRect(0, 0, 1, 1); g.fillStyle = '#000'; g.fillStyle = c; g.fillRect(0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data; return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 } };
  const mix = (t, b) => ({ r: t.r * t.a + b.r * (1 - t.a), g: t.g * t.a + b.g * (1 - t.a), b: t.b * t.a + b.b * (1 - t.a), a: 1 });
  const L = c => { const f = x => { x /= 255; return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4 }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b) };
  const bgOf = el => { const st = []; for (let e = el; e; e = e.parentElement) { const c = P(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { st.push(c); if (c.a >= 1) break } }
    let b = P(getComputedStyle(document.body).backgroundColor); for (let i = st.length - 1; i >= 0; i--) b = st[i].a >= 1 ? st[i] : mix(st[i], b); return b };
  const out = [];
  document.querySelectorAll('.mcol .n, .mtn, .mx, .cd small, .stt .v, .row .tx small, #dgy, #dgn, .tt span, .tt button').forEach(el => {
    const r = el.getBoundingClientRect(); if (!r.width || !el.textContent.trim() || el.closest('[hidden]')) return;
    const cs = getComputedStyle(el), fg = mix(P(cs.color), bgOf(el)), bg = bgOf(el), x = L(fg), y = L(bg), k = (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
    if (k < 4.5) out.push(`${el.className || el.parentElement.className}: «${el.textContent.trim().slice(0, 12)}» ${k.toFixed(2)}`);
  }); return out });

for (const scheme of ['light', 'dark']) test(`цветные подписи читаются (${scheme}): Б / Ж / У, калории дня в календаре, статистика — не ниже 4,5 : 1`, async () => {
  const d = {}; for (let i = 0; i < 12; i++) d[day(-i)] = [{ m: 0, n: 'Рис', g: 100 + i * 60, p: 7, f: 1, c: 74 }];
  for (const ac of ['', '#1f9d55', '#e0567a', '#f2b33d']) {
    const a = await openApp({ scheme, data: { g: { p: 200, f: 80, c: 350 }, d, set: { ac, tn: ac ? 'strong' : 'off' } } });
    const bad = [...await lowContrast(a)];
    await a.ev(() => cal()); await a.wait(500); bad.push(...await lowContrast(a));
    await a.ev(() => { closeUI(); stats() }); await a.wait(600); bad.push(...await lowContrast(a));
    await a.ev(() => { closeUI(); toast('Добавлено: Рис · 100 г', () => { }, 4000); void ask('«Рис» исчезнет из списка.', 'Удалить', 1, 0) }); await a.wait(500); bad.push(...await lowContrast(a));
    assert.deepEqual(bad, [], `акцент ${ac || 'по умолчанию'}`);
    await a.close();
  }
});

test('смена экрана в листе: шапка, содержимое и низ нового экрана не анимируются (ничто не может застыть прозрачным)', async () => {
  const a = await openApp({ data: { g: { p: 200, f: 80, c: 350 }, d: {}, db: [['RedBull Zero', 0, 0, 0, [['Баночка', 250]]]] } });
  await a.ev(() => mng()); await a.wait(500);
  const r = await a.ev(async () => { edit(0); await Promise.resolve(); await Promise.resolve();
    const sh = shEl(), n = [sh.querySelector('.hd'), ...sh.querySelectorAll('.hd *'), $('v3'), sh.querySelector('.shf')].reduce((k, e) => k + e.getAnimations().filter(x => !(x instanceof CSSTransition)).length, 0);
    document.getAnimations().forEach(x => x.pause());
    const hd = sh.querySelector('.hd'), ops = [hd, hd.querySelector('.ht'), hd.querySelector('.x'), $('v3')].map(e => getComputedStyle(e).opacity);
    document.getAnimations().forEach(x => x.play()); return { n, ops, st: $('st').textContent } });
  assert.equal(r.n, 0); assert.deepEqual(r.ops, ['1', '1', '1', '1'], 'даже если анимации застыли в начале, новый экран виден'); assert.equal(r.st, 'Изменить продукт');
  await a.wait(500); assert.equal(await a.ev(() => document.querySelectorAll('#ov .svl, #ov .sve').length), 0);
  assert.deepEqual(a.errors, []);
  await a.close();
});

// Сборка APK падала на разметке виджета: «padding="12dp 12dp"» — в Android одно значение на атрибут (aapt2 здесь не запустить,
// поэтому формат размеров во всех разметках и рисунках проверяется тестом)
test('ресурсы Android: размеры во всех разметках и рисунках — в формате, который принимает aapt2', async () => {
  const fs = await import('node:fs'), path = await import('node:path');
  const DIM = /^(-?\d+(\.\d+)?(dp|sp|px)|match_parent|wrap_content|fill_parent|0|@[\w/+.]+|\?[\w:/.]+)$/;
  const ATTR = /android:(layout_width|layout_height|layout_margin\w*|padding\w*|textSize|maxHeight|maxWidth|minHeight|minWidth|autoSize\w+TextSize|autoSizeStepGranularity|radius|width|height|\w*Radius)="([^"]*)"/g;
  const bad = [];
  for (const dir of ['native/android/res/layout', 'native/android/res/drawable', 'native/android/res/xml']) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.xml'))) {
      const x = fs.readFileSync(path.join(dir, f), 'utf8');
      for (const m of x.matchAll(ATTR)) if (!DIM.test(m[2])) bad.push(`${f}: ${m[1]}="${m[2]}"`);
    }
  }
  assert.deepEqual(bad, []);
});
