"""Convert the brand fonts (SIL OFL 1.1, already in the repo's node_modules via
@fontsource) into TTF files that FFmpeg/libass can use for burned in captions.

Run once after `npm ci` in the repo root:  python3 video-system/scripts/prepare_fonts.py
Needs: pip install fonttools brotli
"""
from fontTools.ttLib import TTFont

from kvs_common import FONTS_DIR, REPO

SRC = REPO / "node_modules" / "@fontsource"
MAP = {
    "manrope/files/manrope-latin-800-normal.woff2": "Manrope-ExtraBold.ttf",
    "instrument-serif/files/instrument-serif-latin-400-italic.woff2": "InstrumentSerif-Italic.ttf",
    "inter/files/inter-latin-400-normal.woff2": "Inter-Regular.ttf",
    "inter/files/inter-latin-600-normal.woff2": "Inter-SemiBold.ttf",
}

FONTS_DIR.mkdir(exist_ok=True)
for rel, name in MAP.items():
    f = TTFont(SRC / rel)
    f.flavor = None
    if name.startswith("Manrope"):
        # The @fontsource subset carries a confusing name table ("Manrope ExtraLight ExtraBold").
        # The outlines are the real ExtraBold (weight 800); only the names are tidied so
        # FFmpeg/libass and editors find it as "Manrope ExtraBold".
        nt = f["name"]
        for nid, val in {1: "Manrope ExtraBold", 2: "Regular", 4: "Manrope ExtraBold", 6: "Manrope-ExtraBold",
                         16: "Manrope", 17: "ExtraBold"}.items():
            nt.setName(val, nid, 3, 1, 0x409)
            nt.setName(val, nid, 1, 0, 0)
    f.save(FONTS_DIR / name)
    print("wrote", FONTS_DIR / name)
