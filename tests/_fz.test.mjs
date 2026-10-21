// Диагностика: случайные быстрые переходы между экранами (в том числе прерванные на середине) — после каждой серии
// лист должен прийти в целое состояние: шапка видна и ничем не закрыта, ровно один экран, копии и полосы убраны.
// Ловит «пропавшую шапку», зависшие слои и наложения, которые обычными тестами не видны.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day } from './helpers.mjs';

const ACTS = ["sets()", "pick('th')", "pick('ac')", "pick('dw')", "pick('sn')", "vibOpen()", "fp(1)", "goals()", "cal()", "stats()", "mng()", "op(2)",
  "if(!$('v1').hidden&&IX.length)pc(0)", "edit(0)", "edit(2)", "nw()", "wtOpen()", "backStep()", "backStep()", "closeUI()", "mv(1)", "setPf(2)", "setPf(0)"];
const check = a => a.ev(() => {
  const bad = []; const ov = $('ov');
  ['#ov > .svl', '#ov > .sve', '#ov > .hsg', '#ov > .smh'].forEach(q => { if (document.querySelector(q)) bad.push('остался слой ' + q) });
  if (!isOpen) { if (ov.classList.contains('on')) bad.push('лист закрыт, а подложка видна'); return bad }
  const sh = shEl(), hd = sh.querySelector('.hd'), vis = [...sh.querySelectorAll('.shb > [id^=v]')].filter(v => !v.hidden);
  if (vis.length !== 1) bad.push('видимых экранов: ' + vis.length);
  for (let e = hd; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (+cs.opacity < 1 || cs.visibility !== 'visible' || cs.display === 'none') bad.push('скрыто: ' + (e.className || e.id) + ' op=' + cs.opacity + ' vis=' + cs.visibility + ' disp=' + cs.display + ' ov=' + $('ov').className + ' ovvis=' + getComputedStyle($('ov')).visibility + ' st=' + $('st').textContent + ' chain=' + (() => { const o = []; for (let q = hd; q; q = q.parentElement) o.push((q.id || q.className || q.tagName) + ':' + getComputedStyle(q).visibility + (q.style.cssText ? '[' + q.style.cssText + ']' : '')); return o.join(' < ') })() + ' cv=' + getComputedStyle($('ov')).contentVisibility + ' an=' + document.getAnimations().map(x => (x.effect.target && (x.effect.target.className || x.effect.target.id)) + ':' + x.playState + ':' + (x.effect.pseudoElement||'')).join(','));}
  const x = hd.querySelector('.x'), r = x.getBoundingClientRect(), h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  if (!h || !hd.contains(h)) bad.push('крестик закрыт: ' + (h ? h.className || h.tagName : 'ничего'));
  if (sh.getAnimations({ subtree: true }).some(a => a.playState === 'running' && !(a instanceof CSSTransition) && !(a instanceof CSSAnimation))) bad.push('анимации не закончились');
  const t = getComputedStyle(sh).transform; if (t !== 'none' && t !== 'matrix(1, 0, 0, 1, 0, 0)') bad.push('лист сдвинут: ' + t);
  return bad });

for (const [scheme, rate] of [['dark', Number(process.env.RATE || 4)]]) test(`быстрые переходы (${scheme}, процессор ×${rate}): лист всегда приходит в целое состояние`, async () => {
  const dish = ['Салат', 1.2, 4.8, 4, [['порция', 300]], { w: 300, i: [{ n: 'Огурец', g: 200, p: 1.6, f: .2, c: 5 }] }];
  const a = await openApp({ scheme, data: { g: { p: 200, f: 80, c: 350 }, d: { [day()]: [{ m: 0, n: 'Рис', g: 100, p: 7, f: 1, c: 74 }] }, wt: { [day()]: 80 }, db: [['RedBull Zero', 0, 0, 0, [['Баночка', 250]]], ['Рис', 7, 1, 74], dish] } });
  if (rate > 1) { const c = await a.ctx.newCDPSession(a.pg); await c.send('Emulation.setCPUThrottlingRate', { rate }) }
  let seed = 7 + rate; const rnd = n => { seed = (seed * 16807) % 2147483647; return seed % n };
  const problems = [];
  for (let round = 0; round < 40; round++) {
    const seq = Array.from({ length: 2 + rnd(4) }, () => [ACTS[rnd(ACTS.length)], [0, 16, 40, 90, 160, 300][rnd(6)]]);
    for (const [act, w] of seq) { await a.ev(act).catch(e => problems.push(act + ': ' + e.message)); if (w) await a.wait(w) }
    await a.wait(900 * Math.min(rate, 2));
    const bad = await check(a); if (bad.length) problems.push(seq.map(x => x[0] + '+' + x[1]).join(' → ') + ' ⇒ ' + bad.join('; '));
  }
  assert.deepEqual(problems, []); assert.deepEqual(a.errors, []);
  await a.close();
});
