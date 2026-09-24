"""Rebuild assets/icons/MaterialSymbolsOutlined.ttf (static: FILL 0, GRAD 0, opsz 24, wght 400).

Source: google/material-design-icons, variablefont/MaterialSymbolsOutlined[FILL,GRAD,opsz,wght].ttf
and its .codepoints file. Requires `pip install fonttools`.

Usage: python3 scripts/build_icon_font.py path/to/MaterialSymbolsOutlined[FILL,GRAD,opsz,wght].ttf
"""
import sys

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

src = sys.argv[1]
font = TTFont(src)
static = instancer.instantiateVariableFont(font, {"FILL": 0, "GRAD": 0, "opsz": 24, "wght": 400})
static["name"].setName("Material Symbols Outlined", 1, 3, 1, 0x409)
static.save("assets/icons/MaterialSymbolsOutlined.ttf")
print("wrote assets/icons/MaterialSymbolsOutlined.ttf")
