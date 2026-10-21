// Ревизия 16 (одобренный проект): настраиваемая нижняя панель, «Ещё» → «Настройки» с новыми группами, «Тема и фон»
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp } from './helpers.mjs';

const bar = a => a.ev(() => [...document.querySelectorAll('.bt>button')].map(b => b.id === 'fab' ? '[' + b.getAttribute('aria-label') + ']' : b.textContent).join(' | '));

test('совместимость: старые настройки «＋» дают ту же панель, что раньше; новое имя «Настройки»', async () => {
  const want = { meal: '[Приём пищи по времени]', prod: '[Новый продукт]', dish: '[Новое блюдо]', wt: '[Записать вес]' };
  for (const fa of ['meal', 'prod', 'dish', 'wt', 'hide', undefined]) {
    const a = await openApp({ data: { g: { p: 140, f: 70, c: 230 }, d: {}, set: { fa, wt: 'on' } } });
    assert.equal(await bar(a), fa === 'hide' ? 'Календарь | Продукты | Статистика | Настройки' : `Календарь | Продукты | ${want[fa || 'meal']} | Статистика | Настройки`, String(fa));
    assert.deepEqual(a.errors, []);
    await a.close();
  }
});

test('правила панели: с кнопкой 2–4 пункта по бокам, без кнопки 2–5; без повторов; обязательные всегда; 10 000 случайных изменений', async () => {
  const a = await openApp();
  const r = await a.ev(() => {
    const bad = []; let seed = 11, steps = 0; const rnd = n => (seed = (seed * 1103515245 + 12345) % 2147483648) % n;
    for (let run = 0; run < 400 && bad.length < 5; run++) {
      S.set = { wt: rnd(2) ? 'on' : 'off', fa: ['meal', 'hide', 'prod', 'wt'][rnd(4)] }; barSync();
      for (let i = 0; i < 25; i++) {
        steps++; const op = rnd(6), v0 = navGet();
        const ks = Object.keys(NA); if (op === 0) (rnd(2) ? navRm : navAdd)(ks[rnd(ks.length)]); else if (op === 1) { navSlot = -1; navSet(rnd(4) ? ks[rnd(ks.length)] : '') } else if (op === 2) { navSlot = rnd(v0.n); navSet(ks[rnd(ks.length)]) }
        else if (op === 3) setWt(rnd(2) ? 'on' : 'off'); else if (op === 4) setFa(['meal', 'prod', 'dish', 'wt', 'hide'][rnd(5)]); else undo();
        const v = navGet(), m = navMid(v), dom = [...document.querySelectorAll('.bt>button')], e = [];
        const sides = v.n - (v.big ? 1 : 0); if (sides < 2 || sides > (v.big ? 4 : 5) || v.s.length !== v.n) e.push('count'); if (v.big && m !== Math.ceil(sides / 2)) e.push('mid');
        if (new Set(v.s).size !== v.n) e.push('dup'); if (!v.s.includes('prod') || !v.s.includes('set')) e.push('req');
        if (m >= 0 && ['prod', 'set'].includes(v.s[m])) e.push('center'); if (v.s.some(k => !nOk(k))) e.push('unavail');
        if (dom.length !== v.n || !!document.getElementById('fab') !== v.big) e.push('dom');
        if (S.set.nav && JSON.stringify(navFix(S.set.nav).s) !== JSON.stringify(v.s)) e.push('unstable');
        if (e.length) bad.push(e.join(',') + ' ' + JSON.stringify(v));
      }
    }
    return { bad, steps };
  });
  assert.deepEqual(r.bad, []); assert.ok(r.steps >= 10000);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('экран «Нижняя панель»: убрать и добавить пункт, кнопка в центре (выбор, скрыть), обмен местами, «Отменить»; панель меняется сразу', async () => {
  const a = await openApp();
  await a.ev(() => { sets(); navOpen() }); await a.wait(500);
  assert.equal(await a.ev(() => [$('st').textContent, document.querySelectorAll('.pbv>button').length, document.querySelectorAll('#nvl .nrow').length, !!document.querySelector('#nvl .ctr'), !!document.querySelector('.lyo')].join()), 'Нижняя панель,5,4,true,false');
  // убрать пункт: панель сразу меняется, кнопка остаётся точно в центре; «Отменить» возвращает
  await a.ev(() => navRm('stat')); await a.wait(400);
  assert.equal(await bar(a), 'Календарь | Продукты | [Приём пищи по времени] | Настройки');
  const mid = await a.ev(() => { const f = $('fab').getBoundingClientRect(); return Math.abs(f.left + f.width / 2 - innerWidth / 2) });
  assert.ok(mid < 1.5, `кнопка по центру и при трёх пунктах (${mid})`);
  assert.equal(await a.ev(() => document.querySelector('#nva [data-a="stat"]') !== null), true, '«Статистика» — в «Можно добавить»');
  await a.pg.click('#tt button'); await a.wait(400);
  assert.equal(await bar(a), 'Календарь | Продукты | [Приём пищи по времени] | Статистика | Настройки');
  // с кнопкой — не больше четырёх пунктов
  await a.ev(() => navAdd('today')); assert.match(await a.ev(() => $('tm').textContent), /не больше четырёх/);
  // скрыть кнопку → 4 пункта, теперь можно пятый
  await a.ev(() => { navPick(-1) }); await a.wait(400);
  assert.equal(await a.ev(() => [...document.querySelectorAll('#v16 .gh')].map(g => g.textContent).join()), 'Добавить,Открыть', 'для кнопки — без обязательных');
  await a.ev(() => navSet('')); await a.wait(400);
  assert.equal(await bar(a), 'Календарь | Продукты | Статистика | Настройки');
  assert.equal(await a.ev(() => !$('v15').hidden && document.querySelector('#nvl .ctr small').textContent.startsWith('Скрыта')), true);
  await a.ev(() => navAdd('today')); await a.wait(300);
  assert.equal(await bar(a), 'Календарь | Продукты | Статистика | Сегодня | Настройки');
  // показать кнопку с действием «Новое блюдо»: пунктов 5 → крайний необязательный уходит, «Отменить»
  await a.ev(() => { navPick(-1); navSet('dish') }); await a.wait(400);
  assert.equal(await bar(a), 'Календарь | Продукты | [Новое блюдо] | Статистика | Настройки');
  assert.match(await a.ev(() => $('tm').textContent), /Убрано: Сегодня/);
  // выбор для места 1: занятое — «поменяются местами»; вес выключен — неактивен
  await a.ev(() => { setWt('off'); navPick(0) }); await a.wait(400);
  assert.equal(await a.ev(() => !$('v16').hidden && $('st').textContent), 'Место 1 из 5');
  assert.match(await a.ev(() => document.querySelector('#v16 .row.used').textContent), /поменяются местами/);
  assert.equal(await a.ev(() => document.querySelector('#v16 .row.dis .tx').firstChild.textContent), 'Записать вес');
  await a.ev(() => navSet('stat')); await a.wait(400);
  assert.equal(await bar(a), 'Статистика | Продукты | [Новое блюдо] | Календарь | Настройки');
  assert.equal(await a.ev(() => !$('v15').hidden), true, 'после выбора — снова экран панели');
  await a.ev(() => navPick(-1)); await a.wait(300);
  await a.ev(() => BJU_onBack()); await a.wait(300); assert.equal(await a.ev(() => !$('v15').hidden), true, '«Назад» — к панели');
  await a.ev(() => BJU_onBack()); await a.wait(300); assert.equal(await a.ev(() => !$('v7').hidden && $('st').textContent), 'Настройки');
  // обязательный пункт выбрать нельзя — подсказка
  await a.ev(() => navPick(1)); assert.match(await a.ev(() => $('tm').textContent), /обязательный пункт/);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('переходы без рывков: заголовок нового экрана едет вместе с краем листа, строки панели — плавно', async () => {
  const a = await openApp();
  await a.ev(() => sets()); await a.wait(600);
  // «Настройки» → «Норма» (лист становится ниже): в первом кадре заголовок там же, где был старый
  const r = await a.ev(async () => { const y0 = $('st').getBoundingClientRect().top; goals(1); await new Promise(r => setTimeout(r, 0));
    document.getAnimations().forEach(x => { try { x.pause(); x.currentTime = 0 } catch (e) { } }); await new Promise(r => requestAnimationFrame(r));
    const y1 = $('st').getBoundingClientRect().top; document.getAnimations().forEach(x => { try { x.finish() } catch (e) { } }); await new Promise(r => setTimeout(r, 400));
    return { y0, y1, y2: $('st').getBoundingClientRect().top } });
  assert.ok(Math.abs(r.y1 - r.y0) < 12, `заголовок не прыгает (разница — только из-за подписи под ним): ${r.y0} → ${r.y1}`); assert.ok(r.y2 - r.y0 > 100, 'и доезжает до нового края');
  // убрать пункт: строки ниже съезжают плавно, группа меняет высоту плавно
  await a.ev(() => { cl(); sets(); navOpen() }); await a.wait(700);
  const q = await a.ev(async () => { const s0 = document.querySelector('#nvl [data-k="set"]').getBoundingClientRect().top; navRm('stat'); await new Promise(r => setTimeout(r, 0));
    const an = $('v15').getAnimations({ subtree: true }).length; document.getAnimations().forEach(x => { try { x.pause(); x.currentTime = 0 } catch (e) { } }); await new Promise(r => requestAnimationFrame(r));
    const s1 = document.querySelector('#nvl [data-k="set"]').getBoundingClientRect().top; document.getAnimations().forEach(x => { try { x.finish() } catch (e) { } }); return { s0, s1, an } });
  assert.ok(q.an >= 2, 'есть анимации строк и высоты'); assert.ok(Math.abs(q.s1 - q.s0) < 2, `«Настройки» начинает со старого места: ${q.s0} → ${q.s1}`);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('перетаскивание пунктов по бокам: строка за пальцем, порядок — при отпускании; обязательные переставляются', async () => {
  const a = await openApp();
  await a.ev(() => { sets(); navOpen() }); await a.wait(500);
  const cdp = await a.pg.context().newCDPSession(a.pg);
  const g = await a.ev(() => { const r = document.querySelectorAll('#nvl .gp'), b0 = r[0].getBoundingClientRect(), b3 = r[3].getBoundingClientRect(); return { x: b0.left + b0.width / 2, y: b0.top + b0.height / 2, y3: b3.top + b3.height / 2 } });
  const T = (type, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: g.x, y, id: 1 }] });
  await T('touchStart', g.y);
  for (let i = 1; i <= 8; i++) { await a.wait(16); await T('touchMove', g.y + (g.y3 - g.y) * i / 8 + 4) }
  assert.equal(await a.ev(() => document.querySelector('#nvl .nrow.drg') !== null && isOpen), true, 'строка поднята, лист не смахнулся');
  await T('touchEnd', g.y3); await a.wait(400);
  assert.equal(await bar(a), 'Продукты | Статистика | [Приём пищи по времени] | Настройки | Календарь');
  assert.equal(await a.ev(() => [...document.querySelectorAll('#nvl .nrow')].map(r => r.dataset.k).join()), 'prod,stat,set,cal');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('«Настройки»: группы по смыслу, «Тема и фон» одним экраном в прежнем виде выбора; файл и перезапуск', async () => {
  const a = await openApp();
  await a.ev(() => sets()); await a.wait(400);
  assert.equal(await a.ev(() => $('st').textContent), 'Настройки');
  assert.deepEqual(await a.ev(() => [...document.querySelectorAll('#v7 .gh')].map(e => e.textContent)), ['Питание', 'Панель и жесты', 'Дневник и продукты', 'Оформление', 'Данные']);
  assert.equal(await a.ev(() => document.querySelectorAll('#v7 .nmini i').length), 5, 'мини-копия панели в строке');
  await a.ev(() => lookOpen()); await a.wait(400);
  assert.deepEqual(await a.ev(() => [...document.querySelectorAll('#v17 .row .tx')].map(e => e.firstChild.textContent)), ['Как в системе', 'Светлая', 'Тёмная', 'Выключен', 'Лёгкий', 'Заметный']);
  await a.pg.click('#v17 .row[data-v="light"]'); await a.wait(500);
  assert.equal(await a.ev(() => [document.documentElement.dataset.theme, document.querySelector('#v17 .row.on .tx').firstChild.textContent].join()), 'light,Светлая');
  await a.ev(() => BJU_onBack()); await a.wait(300);
  assert.match(await a.pg.textContent('#v7'), /Тема и фонСветлая · /);
  // потянуть вверх: свой список без «Нормы», «Карточки дня», «Календаря»
  await a.ev(() => pick('sw')); await a.wait(300);
  assert.deepEqual(await a.ev(() => [...document.querySelectorAll('#pko .row .tx')].map(e => e.firstChild.textContent)),
    ['Приём пищи по времени', 'Новый продукт', 'Новое блюдо', 'Записать вес', 'Статистика', 'К сегодняшнему дню', 'Продукты', 'Выключено']);
  // файл: navBar и fabAction для старых версий; чтение обратно
  await a.ev(() => { navSave({ n: 5, big: true, s: ['today', 'prod', 'goal', 'cal', 'set'] }) });
  const f = await a.ev(() => JSON.parse(ser()).settings);
  assert.deepEqual([f.navBar.s, f.fabAction], [['today', 'prod', 'goal', 'cal', 'set'], 'meal']);
  assert.deepEqual(await a.ev(() => navGet().s), ['today', 'prod', 'goal', 'cal', 'set']);
  assert.deepEqual(await a.ev(() => { const d = parseData(ser()); return navFix(d.set.nav).s }), ['today', 'prod', 'goal', 'cal', 'set']);
  // холодный запуск: то же
  await a.ev(() => save()); await a.wait(1200); await a.pg.reload(); await a.pg.waitForSelector('#app .sum');
  assert.equal(await bar(a), 'Сегодня | Продукты | [Норма на день] | Календарь | Настройки');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('узкий экран 360 px: подписи помещаются; на панели действия работают', async () => {
  const a = await openApp({ viewport: { width: 360, height: 760 }, data: { g: { p: 140, f: 70, c: 230 }, d: {}, set: { nav: { n: 5, big: true, s: ['stat', 'prod', 'meal', 'cal', 'set'] } } } });
  assert.equal(await a.ev(() => [...document.querySelectorAll('.bt>button')].every(b => b.scrollWidth <= b.clientWidth + 1)), true);
  await a.pg.click('.bt>button:nth-child(4)'); await a.wait(400);
  assert.equal(await a.ev(() => isOpen && !$('v6').hidden), true, 'Календарь');
  await a.ev(() => cl()); await a.wait(300); await a.pg.click('.bt>button:nth-child(5)'); await a.wait(400);
  assert.equal(await a.ev(() => isOpen && !$('v7').hidden), true, 'Настройки');
  assert.deepEqual(a.errors, []);
  await a.close();
});
