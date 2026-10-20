#!/usr/bin/env python3
"""Генерирует разметки виджета (native/android/res/layout/bju_widget*.xml).
Запуск: python3 scripts/widget-layouts.py

Раскладки (ширина × высота в ячейках):
  t1  1×1 — кольцо калорий;  v2  1×2 в одну колонку — кольцо и Б / Ж / У строками с полосками;  v3  1×3 и выше — то же с подписью под кольцом;                       n2  2×1 — остаток калорий слева, Б / Ж / У столбиком справа;
  w3  3×1 — колонки «Осталось», Б, Ж, У с полосками; w4  4×1 — то же + «＋»;
  s   2×2 — кольцо + Б / Ж / У + полоски (вытянутых узких раскладок нет: узкий высокий виджет показывает квадрат 1×1);
  m   3×2 и низкий 4×2 — шапка с «＋», кольцо и строки Б / Ж / У;
  (без суффикса) высокий 4×2 — то же крупнее;     sx / lx — увеличенные (если лаунчер растянул выше двух строк).
Цвета в разметке — только заглушки: виджет красит их сам (тема приложения, акцент, на Android 12+ — светлая и тёмная сразу).
Кольцо рисуется картинкой (BjuWidget.ring): число внутри подбирается под свободное место и не касается кольца."""
import os, re, xml.dom.minidom as md
OUT = os.path.join(os.path.dirname(__file__), '..', 'native', 'android', 'res', 'layout')
NS = 'xmlns:android="http://schemas.android.com/apk/res/android"'
A = 'android:'
TX, MU = "#EEF1F5", "#A9ADB6"
COL = {'p': '#3CC77F', 'f': '#F2B33D', 'c': '#5B9CF0'}
FULL = {'p': 'Белки', 'f': 'Жиры', 'c': 'Углеводы'}; SHORT = {'p': 'Б', 'f': 'Ж', 'c': 'У'}
M3 = 'pfc'

def tv(id, text, size, color=MU, bold=False, w="wrap_content", extra=""):
    return (f'<TextView {A}id="@+id/{id}" {A}layout_width="{w}" {A}layout_height="wrap_content" {A}text="{text}" {A}textSize="{size}sp" '
            f'{A}textColor="{color}" {A}maxLines="1" {A}ellipsize="end" {A}includeFontPadding="false"' + (f' {A}fontFamily="sans-serif-medium"' if bold else '') + f' {extra}/>')
def bar(id, dr, h=6, mt=5):
    return f'<ProgressBar {A}id="@+id/{id}" style="?android:attr/progressBarStyleHorizontal" {A}layout_width="match_parent" {A}layout_height="{h}dp" {A}layout_marginTop="{mt}dp" {A}max="1000" {A}progress="0" {A}progressDrawable="@drawable/{dr}"/>'
def mbar(m, h=6, mt=5): return bar(f"bju_{m}_bar", f"bju_progress_{m}", h, mt)
def add(s, ms=8):
    return (f'<FrameLayout {A}id="@+id/bju_w_add" {A}layout_width="{s}dp" {A}layout_height="{s}dp" {A}layout_marginStart="{ms}dp" {A}contentDescription="Добавить">'
            f'<ImageView {A}id="@+id/bju_w_add_bg" {A}layout_width="match_parent" {A}layout_height="match_parent" {A}src="@drawable/bju_widget_add" {A}importantForAccessibility="no"/>'
            f'<ImageView {A}id="@+id/bju_w_add_ic" {A}layout_width="{round(s*.52)}dp" {A}layout_height="{round(s*.52)}dp" {A}layout_gravity="center" {A}src="@drawable/bju_ic_plus" {A}importantForAccessibility="no"/></FrameLayout>')
def ring(w="match_parent", h="match_parent", extra=""):
    return f'<ImageView {A}id="@+id/bju_w_ring" {A}layout_width="{w}" {A}layout_height="{h}" {A}scaleType="fitCenter" {A}adjustViewBounds="true" {A}contentDescription="Калории" {extra}/>'
def pads(pad):
    h, v = (pad.split() + [pad])[:2] if ' ' in pad else (pad, pad)
    return f'{A}paddingLeft="{h}" {A}paddingRight="{h}" {A}paddingTop="{v}" {A}paddingBottom="{v}"' if h != v else f'{A}padding="{h}"'
def root(inner, orient, pad, bg=None):
    return ('<?xml version="1.0" encoding="utf-8"?>\n<!-- Сгенерировано scripts/widget-layouts.py -->\n'
      f'<FrameLayout {NS} {A}id="@+id/bju_w_root" {A}layout_width="match_parent" {A}layout_height="match_parent">'
      + (bg or f'<ImageView {A}id="@+id/bju_w_bg" {A}layout_width="match_parent" {A}layout_height="match_parent" {A}scaleType="fitXY" {A}src="@drawable/bju_widget_shape" {A}importantForAccessibility="no"/>') +
      f'<LinearLayout {A}layout_width="match_parent" {A}layout_height="match_parent" {A}orientation="{orient}" {A}gravity="center" ' + pads(pad) + '>' + inner + '</LinearLayout></FrameLayout>\n')
def LL(inner, orient="vertical", w="match_parent", h="wrap_content", weight=None, gravity=None, extra=""):
    return (f'<LinearLayout {A}layout_width="{w}" {A}layout_height="{h}" {A}orientation="{orient}"' + (f' {A}layout_weight="{weight}"' if weight else '')
            + (f' {A}gravity="{gravity}"' if gravity else '') + f' {extra}>' + inner + '</LinearLayout>')
def end(m, px): return f'{A}layout_marginEnd="{px}dp"' if m != 'c' else ''
W1 = f'{A}layout_weight="1"'

# автоподбор размера текста (Android 8+): число уменьшается, чтобы влезть целиком, а не обрезаться «…»
def AS(mn, mx): return f'{A}autoSizeTextType="uniform" {A}autoSizeMinTextSize="{mn}sp" {A}autoSizeMaxTextSize="{mx}sp" {A}autoSizeStepGranularity="1sp"'
def val(id, text, mx, mn=9, color=TX, h=None, w="match_parent", grav="start", extra=""):
    h = h or round(mx * 1.3)
    return (f'<TextView {A}id="@+id/{id}" {A}layout_width="{w}" {A}layout_height="{h}dp" {A}text="{text}" {A}textSize="{mx}sp" {A}textColor="{color}" {A}maxLines="1" '
            f'{A}includeFontPadding="false" {A}fontFamily="sans-serif-medium" {A}gravity="{grav}|center_vertical" {AS(mn, mx)} {extra}/>')
# колонка калорий: крупное число («2107» или «+9021») и подпись под ним («осталось» / «перебор»), полоска
def kcol(k=1.0, weight="1.2", mr=12, bar_=True):
    return LL(val("bju_k_val", "—", round(19 * k), 10) + tv("bju_k_lbl", "осталось", round(11 * k), MU, False, extra=f'{A}layout_marginTop="1dp"')
              + (bar("bju_w_bar", "bju_progress", 5, 5) if bar_ else ""), w="0dp", weight=weight, gravity="center_vertical", extra=f'{A}layout_marginEnd="{mr}dp"')
# колонка макро: буква, «съедено», полоска (норма — в больших раскладках)
def mcol(m, k=1.0):
    return LL(tv(f"bju_{m}_lbl", SHORT[m], round(12 * k), COL[m], True) + val(f"bju_{m}_val", "0", round(16 * k), 9, extra=f'{A}layout_marginTop="1dp"')
              + mbar(m, 5, 4), w="0dp", weight="1", gravity="center_vertical", extra=end(m, 10))
# строка макро в больших раскладках: «Белки ……… 162 / 200 г» — название не обрезается, число подстраивается под место
def mrow(m, k=1.0):
    return LL(LL(tv(f"bju_{m}_lbl", FULL[m], round(12.5 * k), COL[m], True, extra=f'{A}layout_marginEnd="6dp"')
                 + val(f"bju_{m}_val", "0", round(14 * k), 9, w="0dp", grav="end", extra=W1)
                 + tv(f"bju_{m}_goal", " / 0", round(11.5 * k), MU), "horizontal", gravity="center_vertical")
              + mbar(m, round(6 * k), round(5 * k)), h="0dp", weight="1", gravity="center_vertical")
# короткая строка «Б 66  Ж 11  У 114» (2×2)
def mline(k=1.0):
    return LL(''.join(LL(tv(f"bju_{m}_lbl", SHORT[m], round(12.5 * k), COL[m], True, extra=f'{A}layout_marginEnd="3dp"') + val(f"bju_{m}_val", "0", round(13 * k), 9, w="0dp", extra=W1), "horizontal",
                         w="0dp", weight="1", gravity="center_vertical", extra=end(m, 6)) for m in M3), "horizontal")

out = {}
# 1×1 — кольцо на квадратной плашке. Плашка всегда квадратная (по меньшей стороне): если лаунчер растянул виджет
# в узкий высокий (1×2, 1×3…), это выглядит как обычный 1×1 посередине ячеек, а не как вытянутая белая полоса
TILE = f'<ImageView {A}id="@+id/bju_w_bg" {A}layout_width="match_parent" {A}layout_height="match_parent" {A}scaleType="fitCenter" {A}src="@drawable/bju_widget_tile" {A}importantForAccessibility="no"/>'
out['bju_widget_t1'] = root(ring(), "vertical", "6dp", TILE)
# Узкие высокие (1×2, 1×3 и выше): кольцо сверху, под ним Б / Ж / У строками — буква цветом, число справа, полоска.
# Кольцо не бывает шире ячейки (≈50 dp). Раньше вся группа стояла по центру между двумя равными распорками, и в 1×3 весь
# запас высоты (≈110 dp) уходил в пустые полосы сверху и снизу. Теперь запас делится так:
#  - кольцо стоит в «слоте» с весом: при нехватке места оно уменьшается само (строки не обрезаются и при крупном шрифте
#    в настройках телефона), а лишнее место слота ложится поровну над кольцом и под ним;
#  - остальное — распорки между блоками (под подписью, между строками, снизу), поэтому отступы растут вместе с высотой
#    равномерно, а не скапливаются по краям.
def vrow(m, lab=12, num=13, bh=4, bm=3):
    return LL(LL(tv(f"bju_{m}_lbl", SHORT[m], lab, COL[m], True, extra=f'{A}layout_marginEnd="4dp"') + val(f"bju_{m}_val", "0", num, 9, w="0dp", grav="end", extra=W1),
                 "horizontal", gravity="center_vertical") + mbar(m, bh, bm))
def SPw(w): return f'<View {A}layout_width="match_parent" {A}layout_height="0dp" {A}layout_weight="{w}"/>'
def SPd(h): return f'<View {A}layout_width="match_parent" {A}layout_height="{h}dp"/>'
def RING_W(w): return ring("match_parent", "0dp", f'{A}layout_weight="{w}"')
# 1×2 (высота 160–229 dp): кольцо и три строки
out['bju_widget_v2'] = root(RING_W(1) + SPd(6) + vrow('p') + SPd(7) + vrow('f') + SPd(7) + vrow('c') + SPw(.1), "vertical", "12dp")
# 1×3 и выше (от 230 dp): под кольцом подпись «осталось» / «перебор» и норма «из 2920»; строки крупнее, полоски толще
CAP = LL(tv("bju_w_cap", "осталось", 11, MU, True, extra=f'{A}gravity="center"') + tv("bju_w_cap2", "из 0", 10, MU, extra=f'{A}gravity="center" {A}layout_marginTop="1dp"'),
         gravity="center_horizontal", extra=f'{A}layout_marginTop="4dp"')
R3 = lambda m: vrow(m, 13, 15, 5, 4)
out['bju_widget_v3'] = root(RING_W(2.2) + CAP + SPd(10) + SPw(.6) + R3('p') + SPd(10) + SPw(.35) + R3('f') + SPd(10) + SPw(.35) + R3('c') + SPw(.5), "vertical", "14dp")
# 2×1 — слева остаток калорий крупно, справа столбик Б / Ж / У (буква и число в строку) — две равные половины
def mstack(k=1.0):
    return ''.join(LL(tv(f"bju_{m}_lbl", SHORT[m], round(12.5 * k), COL[m], True, extra=f'{A}layout_marginEnd="6dp"')
                      + val(f"bju_{m}_val", "0", round(13.5 * k), 9, w="0dp", grav="end", extra=W1), "horizontal", h="0dp", weight="1", gravity="center_vertical") for m in M3)
out['bju_widget_n2'] = root(kcol(weight="1", mr=14, bar_=False) + LL(mstack(), w="0dp", h="match_parent", weight="1"), "horizontal", "12dp 10dp")
# 3×1 и 4×1 — колонки: калории, Б, Ж, У (только «съедено» — норма есть в больших); 4×1 — ещё «＋»
out['bju_widget_w3'] = root(kcol(weight="1.45") + ''.join(mcol(m) for m in M3), "horizontal", "14dp")
out['bju_widget_w4'] = root(kcol(weight="1.45") + ''.join(mcol(m) for m in M3) + add(40, 12), "horizontal", "14dp")
def s(k, pad):
    bars = LL(''.join(LL(mbar(m, round(5 * k), 0), w="0dp", weight="1", extra=end(m, 6)) for m in M3), "horizontal", extra=f'{A}layout_marginTop="{round(6*k)}dp"')
    return root(ring("match_parent", "0dp", W1) + LL(mline(k), "horizontal", extra=f'{A}layout_marginTop="{round(8*k)}dp"') + bars, "vertical", pad)
out['bju_widget_s'] = s(1, "14dp"); out['bju_widget_sx'] = s(1.25, "18dp")
def big(k, ringdp, pad):
    head = LL(tv("bju_w_head", "Сегодня", round(12.5 * k), MU, True, w="0dp", extra=W1) + add(round(40 * k)), "horizontal", gravity="center_vertical")
    body = LL(ring(f"{ringdp}dp", f"{ringdp}dp") + LL(''.join(mrow(m, k) for m in M3), w="0dp", h="match_parent", weight="1", extra=f'{A}layout_marginStart="{round(16*k)}dp"'),
              "horizontal", h="0dp", weight="1", gravity="center_vertical", extra=f'{A}layout_marginTop="{round(8*k)}dp"')
    return root(head + body, "vertical", pad)
out['bju_widget_m'] = big(.95, 92, "14dp")
out['bju_widget'] = big(1, 112, "16dp")
out['bju_widget_lx'] = big(1.25, 150, "20dp")
# превью в списке виджетов (Android 12+): средний день — съедено 1146 из 2110 ккал (осталось 964), Б 102/120, Ж 36/70, У 104/250.
# Кольцо — рисунок с числом поверх, «＋» — цветом акцента (превью не раскрашивается кодом)
pv = big(1, 112, "16dp")
pv = pv.replace(f'<ImageView {A}id="@+id/bju_w_ring" {A}layout_width="112dp" {A}layout_height="112dp" {A}scaleType="fitCenter" {A}adjustViewBounds="true" {A}contentDescription="Калории" />',
    f'<FrameLayout {A}layout_width="112dp" {A}layout_height="112dp"><ImageView {A}id="@+id/bju_w_ring" {A}layout_width="match_parent" {A}layout_height="match_parent" {A}src="@drawable/bju_widget_ring_preview" {A}importantForAccessibility="no"/>'
    f'<LinearLayout {A}layout_width="wrap_content" {A}layout_height="wrap_content" {A}layout_gravity="center" {A}orientation="vertical" {A}gravity="center_horizontal">'
    + tv("bju_pv_num", "964", 26, TX, True) + tv("bju_pv_lbl", "осталось", 11.5, MU, extra=f'{A}layout_marginTop="3dp"') + '</LinearLayout></FrameLayout>')
pv = pv.replace(f'{A}src="@drawable/bju_widget_add" {A}importantForAccessibility="no"/>', f'{A}src="@drawable/bju_widget_add" {A}tint="#7C70F0" {A}importantForAccessibility="no"/>')
pv = pv.replace(f'{A}src="@drawable/bju_widget_shape"', f'{A}src="@drawable/bju_widget_shape_preview"').replace(f'{A}text="Сегодня"', f'{A}text="Съедено 1146 из 2110"')
for m, v, g, pr in [('p', '102', ' / 120', 850), ('f', '36', ' / 70', 514), ('c', '104', ' / 250', 416)]:
    pv = re.sub(rf'({A}id="@\+id/bju_{m}_val"[^>]*?{A}text=)"0"', rf'\1"{v}"', pv)
    pv = re.sub(rf'({A}id="@\+id/bju_{m}_goal"[^>]*?{A}text=)" / 0"', rf'\1"{g}"', pv)
    pv = re.sub(rf'({A}id="@\+id/bju_{m}_bar"[^>]*?{A}progress=)"0"', rf'\1"{pr}"', pv)
out['bju_widget_preview'] = pv
for n, x in out.items():
    p = os.path.join(OUT, n + '.xml'); open(p, 'w').write(x); md.parse(p)
print('ok', len(out), 'layouts')
