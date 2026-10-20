// Ревизия 15 (одобренный проект): кнопка «Сегодня» в календаре не прыгает, шапка с датой во всю ширину,
// единицы — ровная сетка и подпись под числом, текст на заливке акцентом не ниже 4,5 : 1
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day } from './helpers.mjs';

const btnTop = a => a.ev(() => Math.round(document.querySelector('.ft[data-v="6"] .pb').getBoundingClientRect().top));

test('календарь: лист растёт (5 → 6 недель) и меняет вид «дни / месяцы» — кнопка «Сегодня» стоит на месте, высота меняется плавно', async () => {
  const a = await openApp();
  await a.ev(() => { cur = shiftDay(today, 1); render(); head(); cal(); cm = [2026, 8]; drawCal() }); await a.wait(600);
  const rest = await btnTop(a);
  // кадры анимации: на 0, 60, 120, 200 мс кнопка на месте
  const r = await a.ev(async () => { mv(-1); const out = [], s0 = shEl().getBoundingClientRect().top; document.getAnimations().forEach(x => x.pause());
    for (const t of [0, 60, 120, 200]) { document.getAnimations().forEach(x => { try { x.currentTime = t } catch (e) { } }); await new Promise(r => requestAnimationFrame(r)); out.push(Math.round(document.querySelector('.ft[data-v="6"] .pb').getBoundingClientRect().top)) }
    document.getAnimations().forEach(x => x.finish()); return out });
  for (const y of r) assert.ok(Math.abs(y - rest) <= 1, `кнопка на месте: ${r.join(', ')} при ${rest}`);
  await a.wait(400);
  await a.ev(() => { cm = [2026, 8]; drawCal() }); await a.wait(200); // сентябрь — 5 недель: у вида «месяцы» другая высота
  // смена вида через заголовок — высота листа меняется анимацией (нет скачка верхнего края в первом кадре)
  const v = await a.ev(async () => { const t0 = shEl().getBoundingClientRect().top; calTitle(); const n = shEl().getAnimations().length + document.querySelectorAll('#ov > .sve').length; return { n, top0: t0 } });
  assert.ok(v.n > 0, 'смена вида — с анимацией высоты');
  await a.wait(500); assert.ok(Math.abs(await btnTop(a) - rest) <= 1);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('шапка с датой: фон и линия — во всю ширину экрана, кнопки и дата на прежних местах', async () => {
  for (const vw of [412, 800]) {
    const E = Array.from({ length: 12 }, (_, i) => ({ m: i % 6, n: 'Продукт ' + i, g: 100, p: 5, f: 5, c: 5 }));
    const a = await openApp({ viewport: { width: vw, height: 900 }, data: { g: { p: 140, f: 70, c: 230 }, d: { [day(0)]: E } } });
    const r = await a.ev(() => { scrollTo(0, 300); const n = document.querySelector('header.nav'), b = getComputedStyle(n, '::before'), nr = n.getBoundingClientRect(), app = $('app').getBoundingClientRect();
      return { bg: b.backgroundColor !== 'rgba(0, 0, 0, 0)', w: nr.width, appW: app.width, left: parseFloat(b.left), right: parseFloat(b.right), vw: innerWidth } });
    assert.ok(r.bg, 'у слоя шапки есть фон');
    assert.ok(Math.abs(r.w - r.appW) <= 1, 'сама шапка (кнопки и дата) — по ширине содержимого');
    assert.ok(r.w - r.left - r.right >= r.vw - 1, `слой фона во всю ширину экрана (${vw})`);
    await a.wait(150); assert.equal(await a.ev(() => document.querySelector('header.nav').classList.contains('sc')), true);
    assert.deepEqual(a.errors, []);
    await a.close();
  }
});

test('единицы: ровная сетка, подпись под числом, число целиком при длинном названии', async () => {
  const db = [['Яйцо', 13, 11, 1, [['Штука', 55]]], ['Хлеб', 8, 2, 48, [['Ломтик', 30], ['Батон', 400], ['Горбушка', 25]]],
    ['Пицца', 11, 10, 27, [['Большой кусок с толстым бортиком', 180], ['Целая пицца 30 см', 720], ['Четвертинка', 180], ['Порция', 250]]], ['Сыр', 25, 27, 0, [['Ломтик', 20], ['Кубик', 10], ['Ложка', 8], ['Пачка', 200], ['Брусок', 250]]]];
  const a = await openApp({ data: { g: { p: 140, f: 70, c: 230 }, d: {}, db } });
  const grid = i => a.ev(i => { op(0); pc(i); const bs = [...$('un').children].map(b => b.getBoundingClientRect()); const rows = bs.map(b => b.top).sort((x, y) => x - y).filter((t, i, s) => !i || t - s[i - 1] > 3);
    return { rows: rows.length, w: [...new Set(bs.slice(1).map(b => Math.round(b.width / 2)))], h: [...new Set(bs.slice(1).map(b => Math.round(b.height / 2)))], g0: Math.round(bs[0].width), all: Math.round($('un').getBoundingClientRect().width) } }, i);
  const y = await grid(0); assert.equal(y.rows, 1);
  const h = await grid(1); assert.equal(h.rows, 2, '«Граммы» строкой, 3 единицы — в ряд'); assert.equal(h.w.length, 1, 'три единицы — одной ширины'); assert.equal(h.h.length, 1);
  const p = await grid(2); assert.equal(p.rows, 3, '«Граммы» строкой, 4 единицы — 2 × 2'); assert.equal(p.w.length, 1); assert.equal(p.h.length, 1); assert.ok(p.g0 > p.all - 20, '«Граммы» во всю ширину');
  const s = await grid(3); assert.equal(s.rows, 3, '5 единиц — 3 + 2'); assert.equal(s.w.length, 1, 'и одной ширины');
  // длинное название: число по центру и целиком, подпись — под ним, не наезжает
  const f = await a.ev(() => { pc(2); su(0); const g = $('gr'); g.value = '1250'; pv(); vfUnit(g); const gr = g.getBoundingClientRect(), u = $('gu').getBoundingClientRect(), cs = getComputedStyle(g);
    return { under: u.top > gr.top + gr.height / 2, inside: u.left >= gr.left && u.right <= gr.right + 1, fits: g.scrollWidth <= g.clientWidth + 1, un: g.closest('.vf').classList.contains('un'), text: $('gu').textContent } });
  assert.deepEqual(f, { under: true, inside: true, fits: true, un: true, text: 'Большой кусок с толстым бортиком' });
  // граммы — как раньше: «г» рядом с числом, без подписи снизу
  assert.equal(await a.ev(() => { su(-1); return $('gr').closest('.vf').classList.contains('un') }), false);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('заливка акцентом: текст не ниже 4,5 : 1 на всех акцентах; сам акцент и виджет не меняются', async () => {
  const bad = [];
  for (const scheme of ['dark', 'light']) for (const ac of ['', '#22a06b', '#14b8a6', '#3b82f6', '#8b5cf6', '#e5589a', '#e5484d', '#f08a24', '#f5c518', '#64748b', '#60a5fa']) {
    const a = await openApp({ scheme, data: { g: { p: 140, f: 70, c: 230 }, d: {}, set: { ac } } });
    const r = await a.ev(() => { const cs = getComputedStyle(document.documentElement), f = cs.getPropertyValue('--acf').trim(), on = cs.getPropertyValue('--on').trim();
      const T = palette(isDark()); return { k: crt(on, f), a: cs.getPropertyValue('--ac').trim() || T.ac, onw: T.onw, w: crt(T.onw, T.ac) } });
    if (r.k < 4.5) bad.push(`${scheme} ${ac || 'по умолчанию'}: ${r.k.toFixed(2)}`);
    if (r.w < 2.5) bad.push(`виджет ${scheme} ${ac}: ${r.w.toFixed(2)}`);
    await a.close();
  }
  assert.deepEqual(bad, []);
});
