// Главный экран: итог дня, чипы «Вес» и «7 дней», карточки приёмов пищи (перекус — внутри карточки своего приёма)
// полоса калорий дня, разделённая на вклад белков / жиров / углеводов: сразу видно и сколько съедено, и из чего.
// Перебор — полоса во всю ширину и красная обводка.
function kbar(t, gk, k) { const part = [t.p * 4, t.f * 9, t.c * 4], sc = gk ? Math.min(1, gk / Math.max(k, 1)) * 100 / gk : 0; return `<div class="bar k km${k > gk && gk ? " ov" : ""}" role="img" aria-label="Съедено ${k} из ${gk} ккал">${part.map((v, i) => `<i style="width:${v * sc}%;background:${["var(--p)", "var(--f)", "var(--c)"][i]}"></i>`).join("")}</div>` }
// «Осталось N ккал» / «Перебор N ккал» — в карточке дня
const leftTxt = l => l >= 0 ? `Осталось <b>${l}</b> ккал` : `Перебор <b>${-l}</b> ккал`;
// плитка нутриента карточки дня: название и доля калорий, «съедено / норма», полоска, остаток
function mtile(l, v, g, col, np, sh) { const over = v > g && g > 0, bad = over && !np; return `<div class="mtl" style="--dot:${col}"><div class="mtn">${l}</div><div class="mtv"><b>${f1(v)}</b><small>/${g}</small></div><div class="bar"><i style="width:${Math.min(100, g ? v / g * 100 : 0)}%;background:${bad ? 'var(--dg)' : col}"></i></div><div class="mtr"><span${bad ? ' class="ov"' : ""}>${!g ? "" : over ? "+" + (v - g >= 100 ? Math.round(v - g) : f1(v - g)) + " г" : "ещё " + (g - v >= 100 ? Math.round(g - v) : f1(g - v))}</span>${sh != null ? `<em title="доля калорий">${sh}%</em>` : ""}</div></div>` }
// столбец нутриента итога дня (и среднего дня в статистике): название цветом, «съедено / норма», полоска, «ещё N г» (и доля калорий)
function mcol(l, v, g, col, np, sh) {
  const over = v > g && g > 0, bad = over && !np, d = Math.abs(g - v), dd = d >= 100 ? Math.round(d) : f1(d);
  return `<div class="mcol" style="--dot:${col}"><div class="n">${l}</div><div class="v">${f1(v)} <small>/ ${g} г</small></div><div class="bar"><i style="width:${Math.min(100, g ? v / g * 100 : 0)}%;background:${bad ? "var(--dg)" : col}"></i></div><div class="r"><span${bad ? ' class="ov"' : ""}>${!g ? "" : over ? "+" + dd + " г" : "ещё " + dd + " г"}</span>${sh != null ? `<em>${sh}%</em>` : ""}</div></div>`
}
const mcols = (t, G, sh = []) => `<div class="mcols">${mcol("Белки", t.p, G.p, "var(--p)", 1, sh[0])}${mcol("Жиры", t.f, G.f, "var(--f)", 0, sh[1])}${mcol("Углеводы", t.c, G.c, "var(--c)", 0, sh[2])}</div>`;
// касание даты в шапке: «К сегодня» — на сегодня, иначе — календарь.
// (не в onclick: там «head» — это document.head, и head() падал — шапка оставалась со старой датой)
function dtTap(e) { if (e.target.dataset.t) { cur = today; render(); head() } else cal() }
// форматтеры даты создаются один раз: toLocaleDateString при каждом листании дня был самой долгой частью перерисовки
const HDW = new Intl.DateTimeFormat("ru-RU", { weekday: "short" }), HDM = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });
// шапка перерисовывается только при изменении: иначе касание «К сегодня» во время листания попадало в уже удалённую надпись
function head(c) { c = c || cur; const dd = new Date(c + "T12:00:00"), df = Math.round((dd - new Date(today + "T12:00:00")) / 864e5), dt = $("dt"), h = cap(HDW.format(dd)) + ", " + HDM.format(dd) + "<small>" + (df !== 0 ? "<span data-t=\"1\">К сегодня</span> · " : "") + (df === 0 ? "Сегодня" : df === -1 ? "Вчера" : df === 1 ? "Завтра" : dd.getFullYear() !== new Date().getFullYear() ? dd.getFullYear() : "&nbsp;") + "</small>"; if (dt._h !== h) { dt.innerHTML = h; dt._h = h } }
// строка записи: название; «60 г · Б · Ж · У» (цветные буквы); ккал; «×». Изменить — двойное касание строки
const entRow = (e, i) => `<div class="it" data-i="${i}"><div><div class="n">${esc(e.n)}</div><div class="mu">${e.ul ? e.q + " " + esc(e.ul) + " · " : ""}${f1(e.g)} г · ${mxl(e.p, e.f, e.c)}</div></div><b>${kc(e.p, e.f, e.c)}<small>ккал</small></b><button class="x" onclick="del(${i})" aria-label="Удалить: ${esc(e.n)}">${ic("close")}</button></div>`;
// шапка приёма: название, сумма, «копировать в другой день», «＋»
const mealHead = (mi, sk, n) => `<div class="mh"><div class="mt"><b>${LBL[mi]}</b>${sk ? `<span class="kp">${sk} ккал</span>` : ""}</div><div class="ma">${n ? `<button class="x" onclick="cm1(${mi})" aria-label="Копировать «${LBL[mi]}» в другой день">${ic("copy")}</button>` : ""}<button class="add" onclick="op(${mi})" aria-label="Добавить: ${LBL[mi]}">${ic("plus")}</button></div></div>`;
function render() {
  if (RDEF) return; if (REP) { head(); $("app").innerHTML = repHTML(); repFit(); wUpd(); return }
  const E = S.d[cur] || [], t = sumE(E), G = S.g, gk = kc(G.p, G.f, G.c), k = kc(t.p, t.f, t.c), left = gk - k;
  head(); fabSync();
  let h = "";
  { const q = new Date(cur + "T12:00:00"); q.setDate(q.getDate() - 1); const pk = iso(q); if (!E.length && (S.d[pk] || []).length && !(S.ncp || []).includes(cur)) h += `<div class="bn" data-fk="bn"><span>Повторить вчерашний день?</span><span class="bnb"><button class="no" onclick="ncp()">Нет</button><button class="y" onclick="cpy('${pk}')">Да</button></span></div>` }
  if (serr) h += `<div class="bn er"><span>Не удалось сохранить данные в памяти телефона</span><button onclick="fp()">В файл</button></div>`;
  else if (NATIVE) { if (MF && !mfOk) h += `<div class="bn er"><span>Нет доступа к файлу «${esc(MF.name)}»</span><button onclick="fo2()">Выбрать</button></div>` }
  else if (H && !perm && S.dirty > 0) h += `<div class="bn"><span>Автосохранение на паузе · не в файле: ${S.dirty} изм.</span><button onclick="resume()">Продолжить</button></div>`;
  else if (!H && S.dirty >= 10) h += `<div class="bn"><span>Не сохранено в файл: ${S.dirty} изм.</span><button onclick="${window.showSaveFilePicker ? "fp()" : "sh()"}">${window.showSaveFilePicker ? "Настроить" : "Сохранить"}</button></div>`;
  // итог дня; в режиме «Строка в итоге дня» внизу — «Карточка дня ›»
  h += `<div class="card sum" data-fk="sum"><div class="sumt"><div class="big"><b>${k}</b><span class="mu">из ${gk} ккал</span></div><div class="lf${left < 0 ? " ov" : ""}">${left < 0 ? "перебор" : "осталось"}<b>${Math.abs(left)}</b></div></div>${kbar(t, gk, k)}${mcols(t, G)}${dcv() === "row" ? `<button class="crow" onclick="togRep(true)">${ic("layout")}<span>Карточка дня</span><small>для скриншота</small><i class="ch">${ic("chevR")}</i></button>` : ""}</div>`;
  // под итогом: вес и неделя — два чипа (один на всю ширину, если второго нет)
  { const w = wtTile(), wd = wkD(), wkt = wd ? `<button class="dtl" onclick="stats()" aria-label="В среднем за 7 дней: ${wd.k} ккал, белки ${wd.p} г, жиры ${wd.f} г, углеводы ${wd.c} г (дней с записями: ${wd.n}). Открыть статистику"><span class="ti">${ic("chart")}</span><span class="tx"><small><span class="l1">В среднем за 7 дн.</span><span class="l2">Среднее за 7 дн.</span><span class="l3">7 дней, ср.</span></small><b>${wd.k}<i>ккал</i></b></span><em>${w ? `Б ${wd.p} г` : `Б ${wd.p} · Ж ${wd.f} · У ${wd.c} г`}</em></button>` : ""; if (w || wkt) h += `<div class="duo" data-fk="duo">${w}${wkt}</div>` }
  if (snDay !== cur) { snDay = cur; snOpen.clear() }
  // основные приёмы — карточки; перекус после приёма — внутри его карточки: с записями — подразделом, пустой — ссылкой «＋ Перекус N»
  // (при настройке «По двойному касанию» пустой перекус появляется двойным касанием по названию приёма)
  const items = mi => E.map((e, i) => [e, i]).filter(x => x[0].m === mi);
  [0, 2, 4].forEach(mi => {
    const it = items(mi), sk = dk(it.map(x => x[0])), s = mi + 1, si = items(s), ssk = dk(si.map(x => x[0]));
    h += `<section class="card meal" data-m="${mi}" data-fk="m${mi}">${mealHead(mi, sk, it.length)}` + (it.length ? `<div class="il">${it.map(([e, i]) => entRow(e, i)).join("")}</div>` : `<div class="emp">Пока пусто</div>`);
    if (si.length) h += `<div class="sns" data-m="${s}" data-fk="s${s}">${mealHead(s, ssk, si.length)}<div class="il">${si.map(([e, i]) => entRow(e, i)).join("")}</div></div>`;
    else if (snv() === "row" || snOpen.has(s)) h += `<button class="snk${snv() === "tap" ? " tap" : ""}" data-m="${s}" data-fk="k${s}" onclick="op(${s})" aria-label="Добавить: ${LBL[s]}">${ic("plus")}<span>${LBL[s]}</span></button>`;
    h += `</section>`
  });
  wUpd(); if (dgd) undrag(1); const y = scrollY, old = [...document.querySelectorAll("#app .bar i")].map(i => { const w = i.parentElement.getBoundingClientRect().width; return w ? i.getBoundingClientRect().width / w * 100 : 0 }); flipGrab(); $("app").innerHTML = h; scrollTo(0, y); flipPlay(); if (old.length) document.querySelectorAll("#app .bar i").forEach((el, k) => { const nw = parseFloat(el.style.width); if (old[k] != null && Math.abs(old[k] - nw) > .5) try { el.animate([{ width: old[k] + "%" }, { width: nw + "%" }], { duration: MO.t3, delay: NAV && !RM() ? 170 : 0, fill: "backwards", easing: MO.E }) } catch (e) { } })
}
