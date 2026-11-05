// Диагностика касаний: длинные случайные серии действий (листы, диалоги, уведомления, взмахи дней, профиль, файл данных,
// удаление и «Отменить») на медленном процессоре. После каждой серии: закрытый лист и диалог не перехватывают касаний,
// экран дня откликается (касание попадает в день), ничего не осталось сдвинутым, нет ошибок.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day } from './helpers.mjs';

const ACTS = ["sets()", "pfOpen()", "pfDraft&&pfMode('w')", "pfDraft&&pfMode('c')", "pfDraft&&pfMode('l')", "xOpen()", "ntOpen()", "wtOpen()", "navOpen()", "lookOpen()", "fp(1)",
  "MF={uri:'content://x/f.json',name:'f.json'};fp();nfOff()", "MF={uri:'content://x/f.json',name:'f.json'};fp();rsOpen()", "ofSet&&OF&&ofSet('clear')",
  "op(0)", "mng()", "setPf(1)", "cal()", "stats()", "togRep(1)", "togRep(0)", "toast('Привет',1)", "ask('Вопрос?','Да').then(()=>0);0", "$('dgn').click()",
  "backStep()", "closeUI()", "xcl()", "S.d[cur]&&S.d[cur].length&&del(0)", "undo()", "slide($('app'),1,()=>{cur=iso(new Date(Date.parse(cur)+864e5))})", "pd(today)"];
const check = a => a.ev(() => {
  const bad = [];
  ['#ov > .svl', '#ov > .sve', '#ov > .hsg', '#ov > .smh'].forEach(q => { if (document.querySelector(q)) bad.push('остался слой ' + q) });
  const dg = $('dg').classList.contains('on');
  if (!dg && !$('dg').inert) bad.push('диалог закрыт, но не inert');
  if (!isOpen) {
    if ($('ov').classList.contains('on')) bad.push('лист закрыт, а подложка видна');
    if (!$('ov').inert) bad.push('закрытый лист не inert');
    if (document.documentElement.classList.contains('lk')) bad.push('прокрутка заблокирована (lk) без листа');
    if (!dg && !REP) { const s = document.querySelector('#app .sum'), r = s && s.getBoundingClientRect(); const h = r && document.elementFromPoint(r.left + r.width / 2, r.top + 20);
      if (!h || !h.closest('#app')) bad.push('касание итога дня попадает в ' + (h ? (h.id || h.className || h.tagName) : 'ничего')) }
    const t = $('app').style.transform; if (t && t !== 'none') bad.push('день сдвинут: ' + t);
  }
  if (document.body.style.pointerEvents === 'none' || $('app').style.pointerEvents === 'none') bad.push('касания отключены');
  return bad });

test('длинные случайные серии действий: экран всегда откликается, слои не зависают', async () => {
  const a = await openApp({ native: true, data: { g: { p: 200, f: 80, c: 350 }, d: { [day()]: [{ m: 0, n: 'Рис', g: 100, p: 7, f: 1, c: 74 }, { m: 2, n: 'Гречка', g: 150, p: 18, f: 5, c: 90 }] }, wt: { [day()]: 80 }, set: { pf: { n: 'Тест', c: '#0d7f70' } }, db: [['Рис', 7, 1, 74], ['Гречка', 12, 3, 62]] } });
  const c = await a.ctx.newCDPSession(a.pg); await c.send('Emulation.setCPUThrottlingRate', { rate: 3 });
  let seed = +(process.env.SEED || 11); const rnd = n => { seed = (seed * 16807) % 2147483647; return seed % n };
  const problems = [];
  for (let round = 0; round < 60; round++) {
    const seq = Array.from({ length: 2 + rnd(5) }, () => [ACTS[rnd(ACTS.length)], [0, 16, 50, 120, 300][rnd(5)]]);
    for (const [act, w] of seq) { await a.ev(act).catch(e => problems.push(act + ': ' + e.message.split('\n')[0])); if (w) await a.wait(w) }
    // незакрытый диалог закрываем, как пользователь
    await a.wait(1200); await a.ev(() => { if ($('dg').classList.contains('on')) $('dgn').click(); return 0 }); await a.wait(300);
    const bad = await check(a); if (bad.length) problems.push(seq.map(x => x[0].slice(0, 30) + '+' + x[1]).join(' → ') + ' ⇒ ' + bad.join('; '));
  }
  assert.deepEqual(problems, []); assert.deepEqual(a.errors, []);
  await a.close();
});
