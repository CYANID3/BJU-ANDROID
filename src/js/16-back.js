// «Назад»: шаги внутри листа, системная кнопка, popstate
const vt = () => mode === "mng" ? "Продукты" : mode === "ing" ? "Ингредиент" : "Добавить в " + LBLIN[am];
const listBack = () => { $("q").value = ""; lst(); drawMc(); sv(1, vt(), mode === "mng" ? prodSub() : "") };
// куда ведёт «Назад» с текущего экрана листа: функция шага или null (тогда лист закрывается)
function stepTo() {
  const on = i => !$("v" + i).hidden;
  if (on(2)) { if (ik >= 0) return () => { ik = -1; drawDish() }; if (ei >= 0) return null; return listBack }
  if (on(3)) return v3from ? listBack : null;
  if (on(1) && mode === "ing") return () => drawDish();
  if (on(8) && dfrom) return () => { mode = pmode; listBack() };
  if (on(11)) return () => pick("ac");
  if (on(12)) return () => { const a = mgS && mgS.after; mgS = null; (a || fp)() };
  if (on(18)) return pfFrom ? () => xOpen(X.sub) : SUB ? () => sets(1) : null;
  if (on(19) && SUB) return () => { xStop(); sets(1) };
  if (on(6) && cv) return () => { cv = cb === 1 && cv === 2 ? 1 : 0; drawCal(); fade($("cg")) };
  if (on(16)) return () => navBack();
  if ((on(13) || on(14) || on(15) || on(17) || on(4) || on(5)) && SUB) return () => sets(1);
  return null;
}
// снимок экрана — до шага: сам шаг может успеть что-то спрятать (кнопку, клавиатуру), а переход должен начинаться с того, что было видно
function step() { const t = stepTo(); if (!t) return 0; svPre(); try { t() } finally { svSnapPending = null } return 1 }
addEventListener("popstate", async () => {
  if (popSkip) { popSkip--; return }
  if (!isOpen) return;
  if (!$("v8").hidden && !dfrom && dirtyDish()) { if (await ask("Закрыть без сохранения блюда?", "Закрыть", 1)) closeUI(); else try { history.pushState({ o: 1 }, "") } catch (e) { } return }
  if (step()) { try { history.pushState({ o: 1 }, "") } catch (e) { } return }
  closeUI()
});
// Системная кнопка/жест «Назад» в APK: диалог → шаг назад внутри листа → закрыть лист → закрыть карточку дня →
// вернуться к сегодняшнему дню → свернуть приложение
window.BJU_onBack = () => {
  if ($("dg").classList.contains("on")) { ($("dgn").style.display === "none" ? $("dgy") : $("dgn")).click(); return true }
  if (isOpen) { backStep(); return true }
  if (REP) { togRep(false); return true }
  if (cur !== today) { const d = today > cur ? 1 : -1; NABS = 1; slide($("app"), d, () => { cur = today }); return true }
  return false
};
async function backStep() {
  if (!$("v3").hidden && v3sig() !== v3snap && !await ask("Продукт не сохранён. Выйти без сохранения?", "Выйти", 1)) return;
  if (!$("v8").hidden && dirtyDish() && !await ask("Блюдо не сохранено. Выйти без сохранения?", "Выйти", 1)) return;
  v3ok = 1; try { if (!step()) cl() } finally { v3ok = 0 }
}
