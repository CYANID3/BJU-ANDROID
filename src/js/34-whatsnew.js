// «Что нового» после обновления и экран первого запуска (только APK) — на весь экран, отдельным слоем #fs поверх приложения.
// Список изменений — текст внутри приложения: записи по порядку, новая — в конце. Хранить не больше ~30 последних
// (старые удалять): каждая — около 1 КБ. Номер версии (1.0.N) GitHub присваивает при сборке, поэтому запись
// привязана к своему номеру n, а заголовок показывает версию сборки (BUILD).
// Что уже видели — номер последней показанной записи в памяти приложения (bju_wn), в файл данных не пишется.
// Выключатель «Показывать после обновления» — S.set.wn = "off" (в файле — whatsNew), пишется только когда выключен.
const WN = [
  { n: 1, d: "6 ноября 2026", t: [
    ["up", "Обновления ставятся поверх", "Больше не нужно удалять приложение перед установкой новой версии"],
    ["list", "Окно «Что нового»", "Появляется после каждого обновления. Открыть снова: Настройки → Что нового"],
    ["file", "Быстрый старт", "После переустановки — одно касание, чтобы вернуть данные из файла"],
  ] },
  { n: 2, d: "6 ноября 2026", t: [
    ["up", "Новое приветствие", "Первый запуск и это окно — на весь экран"],
    ["list", "«Что нового» можно отключить", "Настройки → Данные → «Показывать после обновления»"],
    ["xch", "Подсказка для обмена", "Показывает, что выбрать в окне Android, чтобы телефоны нашли друг друга"],
  ] },
];
const WN_LAST = WN[WN.length - 1].n;
const wnSeen = () => { try { return +localStorage.getItem("bju_wn") || 0 } catch (e) { return WN_LAST } };
const wnMark = () => { try { localStorage.setItem("bju_wn", WN_LAST) } catch (e) { } };
const wnOn = () => !(S.set && S.set.wn === "off");
function setWn(v) { S.set = Object.assign({}, S.set, { wn: v }); if (v !== "off") delete S.set.wn; saveq(); vib("ui"); drawSet() }

// после запуска (данные прочитаны, заставка ушла): чистая установка — приветствие; обновление — «Что нового» (если не выключено).
// Отметка «что видели» ставится в любом случае — включат показ снова, старые записи не всплывут
function wnStart() {
  if (!NATIVE) return; const seen = wnSeen(); if (seen >= WN_LAST) return;
  const fresh = !seen && !dnc(S.d) && !S.db.length && !MF && !Object.keys(S.wt || {}).length;
  if (!fresh && !wnOn()) return wnMark();
  setTimeout(() => { if (isOpen || fsOn) return; wnMark(); fresh ? wlOpen() : wnOpen(WN.filter(e => e.n > seen)) }, fresh ? 300 : 700);
}

// ---- полноэкранный слой: появляется проявлением с лёгким подъёмом; «Назад» закрывает (16-back.js)
let fsOn = 0, fsBack = null;
function fsShow(html, back) {
  const F = $("fs"); F.innerHTML = `<div class="fsb">${html}</div>`; fsBack = back; fsOn = 1;
  F.hidden = false; F.inert = false; void F.offsetWidth; F.classList.add("on");
  const b = F.querySelector(".fsb"); b.scrollTop = 0;
}
function fsHide() {
  const F = $("fs"); if (!fsOn) return; fsOn = 0; fsBack = null; F.classList.remove("on"); F.inert = true;
  setTimeout(() => { if (!fsOn) { F.hidden = true; F.innerHTML = "" } }, moOk() ? 260 : 0);
}

// ---- «Что нового»: последняя запись подробно, пропущенные — одной строкой «Раньше»
const wnItem = ([i, t, s]) => `<div class="fsi"><span class="ic">${ic(i)}</span><span class="tx">${esc(t)}<small>${esc(s)}</small></span></div>`;
function wnOpen(list) {
  const last = list[list.length - 1], older = list.slice(0, -1).reverse().flatMap(e => e.t.map(x => x[1]));
  fsShow(`<button class="fsx" aria-label="Закрыть" onclick="fsHide()">${ic("close")}</button>
  <div class="fsm"><div class="fslogo" aria-hidden="true"></div><h2>Что нового</h2><p class="fss">Версия ${esc(BUILD)} · ${esc(last.d)}</p>
  <div class="fsl">${last.t.map(wnItem).join("")}</div>
  ${older.length ? `<p class="fso"><b>Раньше:</b> ${older.map(esc).join(" · ")}</p>` : ""}
  <button class="pb fsok" onclick="fsHide()">Понятно</button></div>`, fsHide);
}
// из настроек: последние записи (до 5); закрытие возвращает к настройкам — лист остаётся под слоем
const wnShow = () => wnOpen(WN.slice(-5));

// ---- приветствие на чистой установке: вернуть данные из файла или начать с чистого листа
function wlOpen() {
  fsShow(`<div class="fsm"><div class="fslogo" aria-hidden="true"></div><h2>Добро пожаловать</h2><p class="fss">Дневник питания БЖУ</p>
  <div class="fsl"><button class="fsi pri" onclick="wlFile()"><span class="ic">${ic("file")}</span><span class="tx">У меня есть файл данных<small>Вернуть всё из файла</small></span></button>
  <button class="fsi" onclick="fsHide()"><span class="ic">${ic("plus")}</span><span class="tx">Начать с чистого листа<small>Файл можно создать потом</small></span></button></div>
  <p class="fso c">Файл подключается и позже в настройках</p></div>`, fsHide);
}
// выбор файла — то же, что «Выбрать существующий файл»; данные загрузились — слой закрывается, отмена или не тот файл — остаётся
async function wlFile() { await nfOpen(); if (MF || dnc(S.d) || S.db.length) fsHide() }
