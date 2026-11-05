// Заметка к дню: пара слов о дне — «был в гостях, БЖУ на глаз», «плохо спал». S.nt = { "ГГГГ-ММ-ДД": "текст" }.
// В конце дня (после ужина): есть заметка — карточка с текстом, нет — тихая подсказка-поле. Касание открывает лист с полем.
// Выключается в «Настройках» (S.set.nt = "off"): строка пропадает, сами заметки остаются и снова видны при включении.
const ntOn = () => !(S.set && S.set.nt === "off");
const ntGet = k => { const v = S.nt && S.nt[k]; return typeof v === "string" ? v : "" };
const ntDay = k => new Date(k + "T12:00:00").toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "long" });
function ntHTML() {
  if (!ntOn()) return "";
  const t = ntGet(cur);
  return t ? `<button class="card nte" data-fk="nt" onclick="ntOpen()"><b>Заметка</b><span>${esc(t)}</span></button>`
    : `<button class="ntq" data-fk="nt" onclick="ntOpen()">${ic("pen")}<span>Заметка к дню: что-то съел без БЖУ, был в гостях…</span></button>`;
}
function ntOpen() {
  SUB = 0; const t = ntGet(cur), x = $("ntx"); x.value = t; $("ntd").hidden = !t;
  sv(20, "Заметка", ntDay(cur)); show(); fIn("ntx");
  requestAnimationFrame(() => { try { x.setSelectionRange(x.value.length, x.value.length) } catch (e) { } })
}
function ntPut(t) { const nt = Object.assign({}, S.nt); if (t) nt[cur] = t; else delete nt[cur]; S.nt = nt }
function ntSave() {
  const t = $("ntx").value.trim().slice(0, 1000);
  if (t === ntGet(cur)) { cl(); return }
  ntPut(t); vib("save"); save(); try { document.activeElement.blur() } catch (e) { } cl(); render()
}
function ntDel() { ntPut(""); vib("del"); save(); try { document.activeElement.blur() } catch (e) { } cl(); render() }
// включение и выключение — строка появляется или уходит плавно, как чип веса
function setNt(v) {
  S.set = Object.assign({}, S.set, { nt: v }); saveq(); vib("ui"); drawSet();
  const old = document.querySelector('#app [data-fk="nt"]');
  if (v === "off") mainMorph(old ? [old] : [], () => render()); else mainMorph([], () => render(), () => { const n = document.querySelector('#app [data-fk="nt"]'); return n ? [n] : [] })
}
