import { test } from 'node:test';
import { openApp, day } from './helpers.mjs';
test('dbg', async () => {
  const a = await openApp({ scheme: 'dark', data: { g: { p: 200, f: 80, c: 350 }, d: { [day()]: [{ m: 0, n: 'Рис', g: 100, p: 7, f: 1, c: 74 }] }, db: [['Рис', 7, 1, 74]] } });
  const c = await a.ctx.newCDPSession(a.pg); await c.send('Emulation.setCPUThrottlingRate', { rate: 8 });
  for (let k = 0; k < 6; k++) {
    await a.ev('op(2)'); await a.wait(40); await a.ev('goals()'); await a.wait(160); await a.wait(1800);
    console.log(k, JSON.stringify(await a.ev(() => { const ov = $('ov'), cs = getComputedStyle(ov); return { isOpen, cls: ov.className, vis: cs.visibility, op: cs.opacity, hd: getComputedStyle(shEl().querySelector('.hd')).visibility, an: document.getAnimations().map(x => (x.effect.target && (x.effect.target.className || x.effect.target.id)) + ':' + x.playState) } })));
    await a.ev('closeUI()'); await a.wait(800);
  }
  await a.close();
});
