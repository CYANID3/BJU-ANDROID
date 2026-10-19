#!/usr/bin/env python3
"""Генерирует разметки виджета (native/android/res/layout/bju_widget*.xml).
Запуск: python3 scripts/widget-layouts.py

Раскладки (ширина × высота в ячейках):
  t1  1×1 — кольцо калорий;                       n2  2×1 — остаток калорий + Б / Ж / У строкой;
  w3  3×1 — колонки «Осталось», Б, Ж, У с полосками; w4  4×1 — то же + «＋»;
  t2  1×2 — кольцо + Б / Ж / У;                   s   2×2 — кольцо + Б / Ж / У + полоски;
  m   3×2 и низкий 4×2 — шапка с «＋», кольцо и строки Б / Ж / У;
  (без суффикса) высокий 4×2 — то же крупнее;     t2x / sx / lx — увеличенные (если лаунчер растянул выше двух строк).
Цвета в разметке — только заглушки: виджет красит их сам (тема приложения, акцент, на Android 12+ — светлая и тёмная сразу).
Кольцо рисуется картинкой (BjuWidget.ring): число внутри подбирается под свободное место и не касается кольца."""
import os, xml.dom.minidom as md
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
def root(inner, orient, pad):
    return ('<?xml version="1.0" encoding="utf-8"?>\n<!-- Сгенерировано scripts/widget-layouts.py -->\n'
      f'<FrameLayout {NS} {A}id="@+id/bju_w_root" {A}layout_width="match_parent" {A}layout_height="match_parent">'
      f'<ImageView {A}id="@+id/bju_w_bg" {A}layout_width="match_parent" {A}layout_height="match_parent" {A}scaleType="fitXY" {A}src="@drawable/bju_widget_shape" {A}importantForAccessibility="no"/>'
      f'<LinearLayout {A}layout_width="match_parent" {A}layout_height="match_parent" {A}orientation="{orient}" {A}gravity="center" {A}padding="{pad}">' + inner + '</LinearLayout></FrameLayout>\n')
def LL(inner, orient="vertical", w="match_parent", h="wrap_content", weight=None, gravity=None, extra=""):
    return (f'<LinearLayout {A}layout_width="{w}" {A}layout_height="{h}" {A}orientation="{orient}"' + (f' {A}layout_weight="{weight}"' if weight else '')
            + (f' {A}gravity="{gravity}"' if gravity else '') + f' {extra}>' + inner + '</LinearLayout>')
def end(m, px): return f'{A}layout_marginEnd="{px}dp"' if m != 'c' else ''
W1 = f'{A}layout_weight="1"'

# колонка «Осталось N ккал» с полоской калорий
def kcol(k=1.0, weight="1.25", mr=12):
    return LL(tv("bju_k_lbl", "Осталось", round(12 * k), MU, True)
              + LL(tv("bju_k_val", "—", round(18 * k), TX, True) + tv("bju_k_unit", " ккал", round(11 * k), MU), "horizontal", gravity="bottom", extra=f'{A}layout_marginTop="2dp"')
              + bar("bju_w_bar", "bju_progress", 6, 5), w="0dp", weight=weight, gravity="center_vertical", extra=f'{A}layout_marginEnd="{mr}dp"')
# колонка макро: буква, «съедено/норма», полоска
def mcol(m, k=1.0, goal=True):
    return LL(tv(f"bju_{m}_lbl", SHORT[m], round(12 * k), COL[m], True)
              + LL(tv(f"bju_{m}_val", "0", round(15 * k), TX, True) + (tv(f"bju_{m}_goal", "/0", round(11 * k), MU) if goal else ""), "horizontal", gravity="bottom", extra=f'{A}layout_marginTop="2dp"')
              + mbar(m, 6, 5), w="0dp", weight="1", gravity="center_vertical", extra=end(m, 10))
# строка макро: «Белки ……… 65,9 / 200 г» и полоска
def mrow(m, k=1.0):
    return LL(LL(tv(f"bju_{m}_lbl", FULL[m], round(13 * k), COL[m], True, w="0dp", extra=W1) + tv(f"bju_{m}_val", "0", round(14 * k), TX, True)
                 + tv(f"bju_{m}_goal", " / 0 г", round(11.5 * k), MU), "horizontal", gravity="bottom")
              + mbar(m, round(6 * k), round(5 * k)), h="0dp", weight="1", gravity="center_vertical")
# короткая строка «Б 66  Ж 11  У 114»
def mline(k=1.0):
    return LL(''.join(tv(f"bju_{m}_lbl", SHORT[m], round(12.5 * k), COL[m], True) + tv(f"bju_{m}_val", "0", round(12.5 * k), TX, True, extra=f'{A}layout_marginStart="3dp" ' + (f'{A}layout_marginEnd="9dp"' if m != 'c' else ''))
                      for m in M3), "horizontal", w="wrap_content", gravity="center")

out = {}
out['bju_widget_t1'] = root(ring(), "vertical", "6dp")
out['bju_widget_n2'] = root(kcol(1, "1", 0).replace(f'{A}layout_width="0dp"', f'{A}layout_width="match_parent"', 1).replace(f' {A}layout_weight="1"', '', 1)
                            + LL(mline(.95), "horizontal", gravity="start", extra=f'{A}layout_marginTop="6dp"'), "vertical", "12dp")
out['bju_widget_w3'] = root(kcol() + ''.join(mcol(m) for m in M3), "horizontal", "14dp")
out['bju_widget_w4'] = root(kcol() + ''.join(mcol(m) for m in M3) + add(40, 12), "horizontal", "14dp")
def t2(k, pad): return root(ring("match_parent", "0dp", W1) + LL(mline(k), "horizontal", gravity="center", extra=f'{A}layout_marginTop="{round(6*k)}dp"'), "vertical", pad)
out['bju_widget_t2'] = t2(.9, "8dp"); out['bju_widget_t2x'] = t2(1.2, "12dp")
def s(k, pad):
    bars = LL(''.join(LL(mbar(m, round(5 * k), 0), w="0dp", weight="1", extra=end(m, 5)) for m in M3), "horizontal", extra=f'{A}layout_marginTop="{round(7*k)}dp"')
    return root(ring("match_parent", "0dp", W1) + LL(mline(k), "horizontal", gravity="center", extra=f'{A}layout_marginTop="{round(8*k)}dp"') + bars, "vertical", pad)
out['bju_widget_s'] = s(1, "14dp"); out['bju_widget_sx'] = s(1.3, "18dp")
def big(k, ringdp, pad):
    head = LL(tv("bju_w_head", "Сегодня", round(12.5 * k), MU, True, w="0dp", extra=W1) + add(round(40 * k)), "horizontal", gravity="center_vertical")
    body = LL(ring(f"{ringdp}dp", f"{ringdp}dp") + LL(''.join(mrow(m, k) for m in M3), w="0dp", h="match_parent", weight="1", extra=f'{A}layout_marginStart="{round(16*k)}dp"'),
              "horizontal", h="0dp", weight="1", gravity="center_vertical", extra=f'{A}layout_marginTop="{round(8*k)}dp"')
    return root(head + body, "vertical", pad)
out['bju_widget_m'] = big(.95, 92, "14dp")
out['bju_widget'] = big(1, 112, "16dp")
out['bju_widget_lx'] = big(1.25, 150, "20dp")
# превью в списке виджетов (Android 12+): средний день — съедено 1146 из 2110 ккал, Б 102/120, Ж 36/70, У 104/250
pv = big(1, 112, "16dp").replace('android:id="@+id/bju_w_ring"', 'android:id="@+id/bju_w_ring" android:src="@drawable/bju_widget_ring_preview"')
pv = pv.replace('android:src="@drawable/bju_widget_shape"', 'android:src="@drawable/bju_widget_shape_preview"').replace('android:text="Сегодня"', 'android:text="Сегодня · съедено 1146 из 2110"')
for m, v, g, pr in [('p', '102', ' / 120 г', 850), ('f', '36', ' / 70 г', 514), ('c', '104', ' / 250 г', 416)]:
    pv = pv.replace(f'android:id="@+id/bju_{m}_val" android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="0"', f'android:id="@+id/bju_{m}_val" android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="{v}"')
    pv = pv.replace(f'android:id="@+id/bju_{m}_goal" android:layout_width="wrap_content" android:layout_height="wrap_content" android:text=" / 0 г"', f'android:id="@+id/bju_{m}_goal" android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="{g}"')
    pv = pv.replace(f'android:id="@+id/bju_{m}_bar" style="?android:attr/progressBarStyleHorizontal" android:layout_width="match_parent" android:layout_height="6dp" android:layout_marginTop="5dp" android:max="1000" android:progress="0"', f'android:id="@+id/bju_{m}_bar" style="?android:attr/progressBarStyleHorizontal" android:layout_width="match_parent" android:layout_height="6dp" android:layout_marginTop="5dp" android:max="1000" android:progress="{pr}"')
out['bju_widget_preview'] = pv
for n, x in out.items():
    p = os.path.join(OUT, n + '.xml'); open(p, 'w').write(x); md.parse(p)
print('ok', len(out), 'layouts')
