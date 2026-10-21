// Новое в редизайне: своя клавиатура, кнопка «＋», карточка дня строкой, вибрация, восстановление повреждённых данных
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openApp, day, entry } from './helpers.mjs';

const key = (a, k) => a.pg.click(`#kp [data-k="${k}"]`);

test('своя клавиатура: режим замены, запятая, ведущий ноль, лимит знаков, ⌫ и удержание ⌫', async () => {
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: {}, db: [['Банан', 1.5, .2, 21.8]], lg: { 'Банан': 120 } } });
  await a.ev(() => { op(0); pc(0) }); await a.wait(400);
  assert.equal(await a.ev(() => [$('gr').value, $('gr').classList.contains('rp'), document.activeElement.id].join()), '120,true,gr', 'значение в режиме замены');
  assert.equal(await a.ev(() => $('gr').inputMode), 'none', 'системная клавиатура для чисел не открывается');
  await key(a, '8');
  assert.equal(await a.pg.inputValue('#gr'), '8', 'первая цифра заменила значение');
  await key(a, ','); await key(a, '5'); await key(a, '5'); await key(a, '5');
  assert.equal(await a.pg.inputValue('#gr'), '8,55', 'не больше двух знаков после запятой');
  await key(a, ',');
  assert.equal(await a.pg.inputValue('#gr'), '8,55', 'вторая запятая не ставится');
  await key(a, 'bk');
  assert.equal(await a.pg.inputValue('#gr'), '8,5');
  await a.ev(() => { $('gr').value = ''; });
  await key(a, '0'); await key(a, '7');
  assert.equal(await a.pg.inputValue('#gr'), '7', 'ведущий ноль убирается');
  await a.ev(() => { $('gr').value = ''; }); await key(a, ',');
  assert.equal(await a.pg.inputValue('#gr'), '0,', 'запятая в начале — «0,»');
  await a.ev(() => { $('gr').value = '1234'; $('gr').setSelectionRange(4, 4) }); await key(a, '5');
  assert.equal(await a.pg.inputValue('#gr'), '1234', 'не больше четырёх цифр до запятой');
  // удержание ⌫ — стереть всё
  const b = await a.pg.locator('#kp [data-k="bk"]').boundingBox();
  await a.pg.mouse.move(b.x + 10, b.y + 10); await a.pg.mouse.down(); await a.wait(650); await a.pg.mouse.up();
  assert.equal(await a.pg.inputValue('#gr'), '');
  // физическая клавиатура: цифры, точка становится запятой, буквы не вводятся
  await a.pg.keyboard.type('2.5x');
  assert.equal(await a.pg.inputValue('#gr'), '2,5');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('форма продукта: название — системной клавиатурой, Б / Ж / У — своей; одна клавиатура за раз; «Далее» по полям', async () => {
  const a = await openApp();
  await a.ev(() => { mode = 'mng'; nw(); show() }); await a.wait(400);
  assert.equal(await a.ev(() => [document.activeElement.id, $('kp').hidden, $('nn').inputMode || 'text'].join()), 'nn,true,text', 'название: своей клавиатуры нет');
  assert.equal(await a.pg.textContent('#mkb'), 'Далее · Белки');
  await a.pg.fill('#nn', 'Сырники');
  await a.pg.click('#mkb');
  assert.equal(await a.ev(() => [document.activeElement.id, $('kp').hidden].join()), 'np,false', 'число: своя клавиатура появилась');
  await key(a, '1'); await key(a, '2'); await a.pg.click('#mkb');
  await key(a, '7'); await a.pg.click('#mkb');
  await key(a, '2'); await key(a, '1');
  assert.equal(await a.pg.textContent('#mkb'), 'Сохранить продукт');
  assert.match(await a.pg.textContent('#nk'), /≈ 195 ккал/);
  await a.pg.click('#nn'); await a.wait(100);
  assert.equal(await a.ev(() => $('kp').hidden), true, 'вернулись к названию — своя клавиатура убрана');
  await a.pg.click('#nc'); await a.pg.click('#mkb'); await a.wait(300);
  assert.deepEqual(await a.ev(() => S.db[0]), ['Сырники', 12, 7, 21]);
  assert.equal(await a.ev(() => isOpen), false, 'открыто не из списка — после сохранения лист закрывается');
  // единица измерения — строка появляется только по кнопке
  await a.ev(() => { mode = 'mng'; nw(); show() }); await a.wait(300);
  assert.equal(await a.pg.locator('#unr .ur').count(), 0);
  await a.pg.click('#v3 .ln.lft'); assert.equal(await a.pg.locator('#unr .ur').count(), 1);
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('большая кнопка (старый способ задать — setFa): приём по времени, новый продукт, новое блюдо, вес, скрыть; значок и файл', async () => {
  const a = await openApp();
  const go = async v => { await a.ev(v => { setFa(v); cl() }, v); await a.wait(350); await a.pg.click('#fab'); await a.wait(400); };
  await go('prod'); assert.equal(await a.ev(() => isOpen && !$('v3').hidden), true, 'новый продукт');
  assert.equal(await a.ev(() => $('fab').getAttribute('aria-label')), 'Новый продукт');
  await go('dish'); assert.equal(await a.ev(() => isOpen && !$('v8').hidden), true, 'новое блюдо');
  await go('wt'); assert.equal(await a.ev(() => isOpen && !$('v10').hidden), true, 'вес');
  assert.equal(await a.ev(() => toFile(S).settings.fabAction), 'weight');
  await a.ev(() => { cl(); setWt('off') });
  assert.equal(await a.ev(() => fabAct()), 'meal', 'вес выключен — кнопка снова добавляет еду');
  await a.ev(() => { setWt('on'); setFa('hide'); cl() }); await a.wait(300);
  assert.equal(await a.ev(() => [document.querySelector('.bt').classList.contains('nofab'), !!$('fab'), document.querySelectorAll('.bt>button').length].join()), 'true,false,4', 'панель из четырёх пунктов');
  assert.equal(await a.ev(() => parseData(ser()).set.fa), 'hide');
  assert.equal(await a.ev(() => JSON.parse(ser()).settings.fabAction), 'hidden');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('карточка дня: режим «Строка в итоге дня» — строка открывает, ✕ и «Назад» закрывают, тройное касание не работает', async () => {
  const a = await openApp({ data: { g: { p: 120, f: 70, c: 250 }, d: { [day()]: [entry(0, 'Овсяные хлопья', 60, 7.4, 3.7, 35.7)] }, set: { dc: 'row' } } });
  assert.equal(await a.pg.locator('#app .sum .crow').count(), 1);
  await a.tapN('#app .sum .big', 3); await a.wait(500);
  assert.equal(await a.ev(() => !!REP), false, 'тройное касание выключено');
  await a.pg.click('#app .sum .crow'); await a.wait(400);
  assert.equal(await a.ev(() => !!REP && !!document.querySelector('.rp-x')), true);
  await a.pg.click('.rp-x'); await a.wait(400);
  assert.equal(await a.ev(() => !!REP), false);
  await a.pg.click('#app .sum .crow'); await a.wait(400);
  assert.equal(await a.ev(() => BJU_onBack()), true);
  assert.equal(await a.ev(() => !!REP), false, '«Назад» закрывает');
  await a.ev(() => setDc('tap')); await a.wait(200);
  assert.equal(await a.pg.locator('#app .sum .crow').count(), 0, 'в режиме тройного касания строки нет');
  assert.equal(await a.ev(() => JSON.parse(ser()).settings.dayCard), 'tripleTap');
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('вибрация: старое «Кроме дней» переносится; выключатель, сила и случаи сохраняются в файле совместимо', async () => {
  const a = await openApp({ native: true, data: { g: { p: 100, f: 60, c: 200 }, d: {}, set: { hp: 'nodays' } } });
  const fb = [];
  await a.ev(() => { window.__FB = []; BJU_NATIVE.feedback = (t, s) => { __FB.push(t + ':' + s); return Promise.resolve(true) } });
  assert.deepEqual(await a.ev(() => VIB.map(([k]) => veOn(k))), [true, true, true, false, true, true, true], '«Кроме дней» — выключено только листание');
  await a.ev(() => { vib('days'); vib('save'); });
  assert.deepEqual(await a.ev(() => __FB), ['confirm:normal']);
  await a.ev(() => vibOpen()); await a.wait(300);
  assert.equal(await a.ev(() => $('ve-days').getAttribute('aria-checked')), 'false');
  await a.pg.click('#vsm button:nth-child(3)');
  await a.pg.click('#ve-kb');
  assert.equal(await a.ev(() => JSON.stringify(JSON.parse(ser()).settings)), JSON.stringify({ vibration: 'exceptDays', vibrationStrength: 'strong', vibrationEvents: { kb: false, save: true, del: true, days: false, pull: true, ui: true, err: true } }));
  await a.ev(() => { __FB.length = 0; vib('kb'); vib('del') });
  assert.deepEqual(await a.ev(() => __FB), ['long:strong'], 'выключенный случай не вибрирует, сила — из настройки');
  await a.pg.click('#vbm');
  assert.equal(await a.ev(() => [JSON.parse(ser()).settings.vibration, $('vsm') === null].join()), 'off,true', 'общий выключатель');
  await a.ev(() => { __FB.length = 0; vib('save') }); assert.deepEqual(await a.ev(() => __FB), []);
  // чтение из файла: неизвестные ключи и не-«да/нет» отбрасываются
  assert.deepEqual(await a.ev(() => { const o = toFile(S); o.settings.vibrationEvents = { kb: false, x: true, del: 'yes' }; return parseData(JSON.stringify(o)).set.ve }), { kb: false });
  assert.deepEqual(a.errors, []);
  await a.close();
});

test('повреждённые данные в памяти: восстанавливается резервная копия', async () => {
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: { [day()]: [entry(0, 'Рис', 100, 7, 1, 74)] } } });
  await a.ev(() => { bk(); localStorage.setItem('bju2', JSON.stringify({ g: { p: 'много' }, d: {} })) });
  await a.pg.reload(); await a.pg.waitForFunction(() => document.querySelector('#app .sum')); await a.wait(1200);
  assert.equal(await a.ev(() => (S.d[today] || []).length && S.d[today][0].n), 'Рис');
  assert.match(await a.pg.textContent('#tm'), /восстановлена резервная копия/);
  await a.close();
});

test('старые настройки, которых больше нет в интерфейсе, сохраняются в файле без изменений', async () => {
  const a = await openApp({ data: { g: { p: 100, f: 60, c: 200 }, d: {}, set: { bb: 'fix', nb: 'bottom' } } });
  const st = await a.ev(() => JSON.parse(ser()).settings);
  assert.equal(st.bottomBar, 'fixed'); assert.equal(st.newButtons, 'bottom');
  assert.equal(await a.ev(() => nbv()), 'bottom', 'явно выбранное «Снизу» сохраняется');
  await a.ev(() => { S.set = {}; }); assert.equal(await a.ev(() => nbv()), 'top', 'по умолчанию — «Сверху»');
  await a.close();
});
