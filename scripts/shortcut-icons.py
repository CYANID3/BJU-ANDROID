#!/usr/bin/env python3
"""Значки ярлыков (долгое нажатие на иконку приложения): единый стиль — мягкий цветной фон и линейный символ.
Android 8+: адаптивная иконка (лаунчер сам задаёт форму, как у иконки приложения); старые версии — круг.
Запуск: python3 scripts/shortcut-icons.py  → native/android/res/drawable*/bju_sc_*.xml"""
import os
R = os.path.join(os.path.dirname(__file__), '..', 'native', 'android', 'res')
# имя: (фон, цвет символа, путь символа на сетке 24×24)
IC = {
 'breakfast': ('#FFF0D4', '#B86E00', 'M5,10h11v4a5.5,5.5 0,0 1,-11 0z M16,11h1.5a2.5,2.5 0,0 1,0 5H16 M8.5,6.5V5 M12,6.5V4.5'),
 'lunch':     ('#DDF3E6', '#17834C', 'M3.5,11.5h17a8.5,8.5 0,0 1,-17 0z M8,8c0,-1.4 1,-1.6 1,-3 M12,8c0,-1.4 1,-1.6 1,-3 M16,8c0,-1.4 1,-1.6 1,-3'),
 'dinner':    ('#E3E5FB', '#4447B8', 'M18.5,14.5A7.5,7.5 0,1 1,9.5 5.5a6,6 0,0 0,9 9z'),
 'snack':     ('#FCE3EB', '#B3245B', 'M12,8c-1.6,-1.2 -5.4,-1.4 -6.5,2.1 -1,3.3 1.1,8.6 3.5,9.1 1.2,0.3 2.1,-0.5 3,-0.5s1.8,0.8 3,0.5c2.4,-0.5 4.5,-5.8 3.5,-9.1C17.4,6.6 13.6,6.8 12,8z M12,8c0,-2 1,-3.2 2.6,-3.9'),
 'weight':    ('#DAF1EF', '#0D7671', 'M8,3.5h8a4.5,4.5 0,0 1,4.5 4.5v8a4.5,4.5 0,0 1,-4.5 4.5H8A4.5,4.5 0,0 1,3.5 16V8A4.5,4.5 0,0 1,8 3.5z M8,9.4a5.6,5.6 0,0 1,8 0 M12,9.8l1.4,-2.1'),
}
def glyph(col, d, tx, s, sw):
    return (f'    <group android:translateX="{tx}" android:translateY="{tx}" android:scaleX="{s}" android:scaleY="{s}">\n'
            f'        <path android:strokeColor="{col}" android:strokeWidth="{sw}" android:strokeLineCap="round" android:strokeLineJoin="round" android:fillColor="#00000000" android:pathData="{d}" />\n'
            f'    </group>\n')
os.makedirs(os.path.join(R, 'drawable-anydpi-v26'), exist_ok=True)
for n, (bg, col, d) in IC.items():
    # Android 8+: адаптивная иконка: 108×108, символ ~44 dp по центру
    fg = f'{R}/drawable/bju_sc_{n}_fg.xml'
    open(fg, 'w').write('<?xml version="1.0" encoding="utf-8"?>\n<!-- создано scripts/shortcut-icons.py -->\n'
        '<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108">\n'
        + glyph(col, d, 32, 1.8333, 2) + '</vector>\n')
    open(f'{R}/drawable-anydpi-v26/bju_sc_{n}.xml', 'w').write('<?xml version="1.0" encoding="utf-8"?>\n<!-- создано scripts/shortcut-icons.py -->\n'
        f'<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@color/bju_sc_{n}_bg" />\n    <foreground android:drawable="@drawable/bju_sc_{n}_fg" />\n</adaptive-icon>\n')
    # до Android 8: круг с тем же символом
    open(f'{R}/drawable/bju_sc_{n}.xml', 'w').write('<?xml version="1.0" encoding="utf-8"?>\n<!-- создано scripts/shortcut-icons.py -->\n'
        '<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="48dp" android:height="48dp" android:viewportWidth="48" android:viewportHeight="48">\n'
        f'    <path android:fillColor="{bg}" android:pathData="M24,0A24,24 0,1 1,24,48A24,24 0,1 1,24,0Z" />\n' + glyph(col, d, 12, 1, 2) + '</vector>\n')
open(f'{R}/values/bju_sc_colors.xml', 'w').write('<?xml version="1.0" encoding="utf-8"?>\n<!-- создано scripts/shortcut-icons.py -->\n<resources>\n'
    + ''.join(f'    <color name="bju_sc_{n}_bg">{bg}</color>\n' for n, (bg, _, _) in IC.items()) + '</resources>\n')
print('ok', ', '.join(IC))
