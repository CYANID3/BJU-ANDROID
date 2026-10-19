// Диалоги и запуск приложения
// ask(текст, кнопка, опасное действие, только одна кнопка, заголовок) → Promise<boolean>
function ask(m, y, dg, one, title) {
  return new Promise(ok => {
    const e = $("dg"), Y = $("dgy"), N = $("dgn"), k = ev => { if (ev.key === "Escape") f(false) }, f = v => { e.classList.remove("on"); Y.onclick = N.onclick = null; document.removeEventListener("keydown", k); ok(v) };
    $("dgt").textContent = title || ""; $("dgm").textContent = m; Y.textContent = y || "ОК"; Y.classList.toggle("dg", !!dg); N.style.display = one ? "none" : "";
    Y.onclick = () => f(true); N.onclick = () => f(false); document.addEventListener("keydown", k); e.classList.add("on"); if (dg) vib("ui");
    const a = document.activeElement; if (!(a && a.tagName === "INPUT")) Y.focus()
  })
}
const say = m => ask(m, "ОК", 0, 1);
document.addEventListener("visibilitychange", () => { if (document.hidden) return; const n = iso(new Date()); if (n !== today) { const f = cur === today; today = n; if (f) cur = n; if (isOpen) cl(); render() } });
// касание затемнения закрывает лист — только если и нажатие началось на затемнении (лист мог сместиться под пальцем)
let ovDown = 0; $("ov").addEventListener("pointerdown", e => { ovDown = e.target === $("ov") }); $("ov").addEventListener("click", e => { if (e.target === $("ov") && ovDown && Date.now() - oa > 450) xcl() }); addEventListener("keydown", e => { if (e.key === "Escape" && isOpen && !$("dg").classList.contains("on")) xcl() }, true);
try { matchMedia("(prefers-color-scheme:dark)").addEventListener("change", () => applyAc()) } catch (e) { }
// локальная копия была повреждена — восстановить резервную (в APK затем ещё сверяются файлы)
if (LOCAL_BAD) { try { const b = localStorage.getItem("bju2bak"); if (b && adopt(parseData(b), false)) { store(); setTimeout(() => toast("Данные в памяти были повреждены — восстановлена резервная копия", 0, 6000), 800) } } catch (e) { } }
applyAc(); render(); Promise.resolve(initH()).finally(() => scSync());
{ const m = new URLSearchParams(location.search).get("m"); if (/^[0-5]$/.test(m || "")) { try { history.replaceState(history.state, "", location.pathname) } catch (e) { } op(+m) } }
