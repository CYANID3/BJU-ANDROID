#!/usr/bin/env python3
"""Генерирует разметки виджета (native/android/res/layout/bju_widget*.xml).
Запуск: python3 scripts/widget-layouts.py
Раскладки: t1 1×1, n2 2×1, w3 3×1, w4 4×1, t2 1×2, s 2×2, m 3×2/низкий 4×2, (без суффикса) высокий 4×2,
и увеличенные t2x/sx/lx — если лаунчер позволил растянуть выше двух строк."""
import os, xml.dom.minidom as md
OUT = os.path.join(os.path.dirname(__file__), '..', 'native', 'android', 'res', 'layout')
NS = 'xmlns:android="http://schemas.android.com/apk/res/android"'
A = 'android:'
def tv(id, text, size, color="#8F98A8", bold=False, w="wrap_content", extra=""):
    return (f'<TextView {A}id="@+id/{id}" {A}layout_width="{w}" {A}layout_height="wrap_content" {A}text="{text}" {A}textSize="{size}sp" '
            f'{A}textColor="{color}" {A}maxLines="1" {A}ellipsize="end" {A}includeFontPadding="false"' + (f' {A}fontFamily="sans-serif-medium"' if bold else '') + f' {extra}/>')
def bar(m, h=5, mt=4, id=None):
    id = id or f"bju_{m}_bar"; dr = f"bju_progress_{m}" if m in "pfc" else "bju_progress"
    return f'<ProgressBar {A}id="@+id/{id}" style="?android:attr/progressBarStyleHorizontal" {A}layout_width="match_parent" {A}layout_height="{h}dp" {A}layout_marginTop="{mt}dp" {A}max="1000" {A}progress="0" {A}progressDrawable="@drawable/{dr}"/>'
def add(s, ms=8):
    return (f'<FrameLayout {A}id="@+id/bju_w_add" {A}layout_width="{s}dp" {A}layout_height="{s}dp" {A}layout_marginStart="{ms}dp" {A}contentDescription="Добавить приём пищи">'
            f'<ImageView {A}id="@+id/bju_w_add_bg" {A}layout_width="match_parent" {A}layout_height="match_parent" {A}src="@drawable/bju_circle"/>'
            f'<ImageView {A}layout_width="{int(s*.5)}dp" {A}layout_height="{int(s*.5)}dp" {A}layout_gravity="center" {A}src="@drawable/bju_ic_plus"/></FrameLayout>')
def root(inner, orient, pad):
    return ('<?xml version="1.0" encoding="utf-8"?>\n<!-- Сгенерировано scripts/widget-layouts.py -->\n'
      f'<FrameLayout {NS} {A}id="@+id/bju_w_root" {A}layout_width="match_parent" {A}layout_height="match_parent">'
      f'<ImageView {A}id="@+id/bju_w_bg" {A}layout_width="match_parent" {A}layout_height="match_parent" {A}scaleType="fitXY" {A}src="@drawable/bju_widget_shape" {A}importantForAccessibility="no"/>'
      f'<ImageView {A}id="@+id/bju_w_stroke" {A}layout_width="match_parent" {A}layout_height="match_parent" {A}scaleType="fitXY" {A}src="@drawable/bju_widget_stroke_dark" {A}importantForAccessibility="no"/>'
      f'<LinearLayout {A}layout_width="match_parent" {A}layout_height="match_parent" {A}orientation="{orient}" {A}gravity="center" {A}padding="{pad}">' + inner + '</LinearLayout></FrameLayout>\n')
def LL(inner, orient="vertical", w="match_parent", h="wrap_content", weight=None, gravity=None, extra=""):
    return (f'<LinearLayout {A}layout_width="{w}" {A}layout_height="{h}" {A}orientation="{orient}"' + (f' {A}layout_weight="{weight}"' if weight else '')
            + (f' {A}gravity="{gravity}"' if gravity else '') + f' {extra}>' + inner + '</LinearLayout>')
M3 = 'pfc'
def end(m, px): return f'{A}layout_marginEnd="{px}dp"' if m != 'c' else ''
out = {}
out['bju_widget_t1'] = root(''.join(LL(tv(f"bju_{m}_lbl","Б",12,bold=True)+tv(f"bju_{m}_val","0",12,"#EEF1F5",True,w="0dp",extra=f'{A}layout_weight="1" {A}gravity="end"'),"horizontal",h="0dp",weight="1",gravity="center_vertical") for m in M3),"vertical","8dp")
out['bju_widget_n2'] = root(''.join(LL(tv(f"bju_{m}_lbl","Б",11,bold=True)+tv(f"bju_{m}_val","0",15,"#EEF1F5",True)+bar(m,4,3),w="0dp",weight="1",gravity="center_vertical",extra=end(m,6)) for m in M3),"horizontal","10dp")
def wcols(): return ''.join(LL(tv(f"bju_{m}_lbl","Б",11,bold=True)+tv(f"bju_{m}_val","0/0",13,"#EEF1F5",True)+bar(m,5,4),w="0dp",weight="1",gravity="center_vertical",extra=end(m,8)) for m in M3)
out['bju_widget_w3'] = root(wcols(),"horizontal","12dp")
out['bju_widget_w4'] = root(wcols()+add(36,10),"horizontal","12dp")
def t2(k, pad):
    return root(''.join(LL(LL(tv(f"bju_{m}_lbl","Б",round(12*k),bold=True)+tv(f"bju_{m}_val","0",round(13*k),"#EEF1F5",True,w="0dp",extra=f'{A}layout_weight="1" {A}gravity="end"'),"horizontal")
        +bar(m,round(4*k),round(3*k))+tv(f"bju_{m}_rest","",round(10*k),extra=f'{A}layout_marginTop="{round(2*k)}dp"'),h="0dp",weight="1",gravity="center_vertical") for m in M3),"vertical",pad)
out['bju_widget_t2'] = t2(1, "8dp"); out['bju_widget_t2x'] = t2(1.45, "12dp")
def s(k, pad):
    return root(tv("bju_w_left","—",round(12*k),"#EEF1F5",True,w="match_parent")+LL(''.join(LL(LL(tv(f"bju_{m}_lbl","Б",round(12*k),bold=True)+tv(f"bju_{m}_val","0 / 0 г",round(12*k),"#EEF1F5",True,w="0dp",extra=f'{A}layout_weight="1" {A}gravity="end"'),"horizontal")
        +bar(m,round(5*k),round(3*k)),h="0dp",weight="1",gravity="center_vertical") for m in M3),h="0dp",weight="1",extra=f'{A}layout_marginTop="{round(4*k)}dp"'),"vertical",pad)
out['bju_widget_s'] = s(1, "12dp"); out['bju_widget_sx'] = s(1.35, "16dp")
cols = ''.join(LL(tv(f"bju_{m}_lbl","Белки",12,bold=True)+tv(f"bju_{m}_val","0 / 0",13,"#EEF1F5",True,extra=f'{A}layout_marginTop="2dp"')+bar(m,5,5)+tv(f"bju_{m}_rest","",11,extra=f'{A}layout_marginTop="4dp"'),w="0dp",weight="1",extra=end(m,8)) for m in M3)
out['bju_widget_m'] = root(LL(tv("bju_w_left","—",15,"#EEF1F5",True,w="0dp",extra=f'{A}layout_weight="1"')+add(34),"horizontal",gravity="center_vertical")+LL(cols,"horizontal",h="0dp",weight="1",gravity="center_vertical"),"vertical","12dp")
def l(k, pad):
    rows = ''.join(LL(LL(tv(f"bju_{m}_lbl","Белки",round(13*k),bold=True,w="0dp",extra=f'{A}layout_weight="1"')+tv(f"bju_{m}_val","0 / 0 г",round(13*k),"#EEF1F5",True)+tv(f"bju_{m}_rest","",round(11*k),extra=f'{A}layout_marginStart="8dp"'),"horizontal",gravity="center_vertical")
        +bar(m,round(5*k),round(4*k)),h="0dp",weight="1",gravity="center_vertical") for m in M3)
    return root(LL(LL(tv("bju_w_label","",round(12*k))+tv("bju_w_left","—",round(22*k),"#EEF1F5",True,extra=f'{A}layout_marginTop="2dp"'),w="0dp",weight="1")+add(round(40*k)),"horizontal",gravity="center_vertical")
        +bar("k",round(6*k),round(8*k),id="bju_w_bar")+LL(rows,h="0dp",weight="1",extra=f'{A}layout_marginTop="{round(4*k)}dp"'),"vertical",pad)
out['bju_widget'] = l(1, "14dp"); out['bju_widget_lx'] = l(1.3, "18dp")
for n, x in out.items():
    p = os.path.join(OUT, n + '.xml'); open(p, 'w').write(x); md.parse(p)
print('ok', len(out), 'layouts')
