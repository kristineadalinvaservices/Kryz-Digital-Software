"""Branded captions from word timings (transcribe.py output).

  python3 captions.py words.json out.ass --platform reels [--keywords "leads,system"] [--style keyword|karaoke]
  python3 captions.py words.json out.ass --platform reels --burn in.mp4 out.mp4

Style rules (Doc 2, section 4): Manrope ExtraBold, Soft White text with a Kryz
Black outline, keywords in Bright Yellow, at most 4 words per screen, centred in
the platform safe zone at about 62 percent of the height so faces and the
platform interface stay clear. Dashes in captions become commas (brand voice).

--style karaoke turns each word yellow while it is spoken (use for fast
educational Reels); keyword only highlights the listed keywords (default, calmer).
Any word written as *word* in the JSON is also treated as a keyword.
--offset shifts timings, for example after cut_silence.py: use --edl to remap
word times onto the cut timeline automatically.
"""
import argparse
import json
import re
from pathlib import Path

from kvs_common import AAC, FONTS_DIR, PLATFORMS, TOKENS, X264_FINAL, guard_output, need, run, ass_color

C = TOKENS["captions"]
COL = TOKENS["colors"]


def remap(t: float, segs) -> float | None:
    """Map a source time onto the timeline produced by cut_silence.py."""
    acc = 0.0
    for a, b in segs:
        if a <= t <= b:
            return acc + (t - a)
        acc += b - a
    return None


def load_words(path: str, edl: str | None):
    data = json.loads(Path(path).read_text())
    segs = json.loads(Path(edl).read_text())["segments"] if edl else None
    words = []
    for s in data["segments"]:
        for w in s["words"]:
            st, en = w["start"], w["end"]
            if segs:
                st, en = remap(st, segs), remap(en, segs)
                if st is None or en is None:
                    continue  # word fell inside a removed section
            words.append({"start": st, "end": en, "word": w["word"]})
    return words


def clean(word: str) -> str:
    return re.sub(r"\s*[‐-―-]+\s*", ", ", word).strip(", ") if re.search(r"[‐-―]|\s-\s", word) else word


def chunk(words, max_words: int, max_chars: int):
    out, cur = [], []
    for i, w in enumerate(words):
        gap = w["start"] - words[i - 1]["end"] if i else 0
        text_len = len(" ".join(x["word"] for x in cur + [w]))
        if cur and (len(cur) >= max_words or text_len > max_chars * 2 or gap > 0.45):
            out.append(cur)
            cur = []
        cur.append(w)
        if re.search(r"[.!?]$", w["word"]):
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return out


def ts(t: float) -> str:
    h, rem = divmod(max(t, 0), 3600)
    m, s = divmod(rem, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def build_ass(words, platform: str, keywords: set[str], style: str) -> str:
    p = PLATFORMS[platform]
    W, H = p["w"], p["h"]
    size = round(C["sizePxAt1080Wide"] * W / 1080 * (0.8 if W > H else 1))
    y = round(H * (C["verticalCenterFromTop"] if H > W else 0.84))
    y = min(y, H - p["safe"]["bottom"] - size)
    x = round(p["safe"]["left"] + (W - p["safe"]["left"] - p["safe"]["right"]) / 2)
    fill, hi, outline = ass_color(COL["softWhite"]), ass_color(COL["brightYellow"]), ass_color(COL["kryzBlack"])
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Kryz,{TOKENS['fonts']['headline']['family']} ExtraBold,{size},{fill},{hi},{outline},&H80000000,0,0,0,0,100,100,0,0,1,{C['outlinePx']},{C['shadowPx']},5,{p['safe']['left']},{p['safe']['right']},0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = []
    for grp in chunk(words, C["maxWordsPerScreen"], C["maxCharsPerLine"]):
        start, end = grp[0]["start"], grp[-1]["end"] + 0.08
        pop = r"{\fscx92\fscy92\t(0,90,\fscx100\fscy100)}"  # 90 ms pop in
        parts = []
        for w in grp:
            raw = clean(w["word"])
            key = raw.startswith("*") and raw.endswith("*")
            txt = raw.strip("*")
            is_kw = key or re.sub(r"\W", "", txt.lower()) in keywords
            if style == "karaoke":
                k = max(1, round((w["end"] - w["start"]) * 100))
                parts.append(f"{{\\kf{k}}}{txt}")
            elif is_kw:
                parts.append(f"{{\\c{hi}}}{txt}{{\\c{fill}}}")
            else:
                parts.append(txt)
        text = " ".join(parts)
        if style == "karaoke":  # karaoke sweeps Secondary -> Primary, so swap the colours
            text = f"{{\\1c{hi}\\2c{fill}}}" + text
        lines.append(f"Dialogue: 0,{ts(start)},{ts(end)},Kryz,,0,0,0,,{{\\pos({x},{y})}}{pop}{text}")
    return head + "\n".join(lines) + "\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("words")
    ap.add_argument("out_ass")
    ap.add_argument("--platform", required=True, choices=sorted(PLATFORMS))
    ap.add_argument("--keywords", default="")
    ap.add_argument("--style", choices=["keyword", "karaoke"], default="keyword")
    ap.add_argument("--edl", default=None, help="edit list from cut_silence.py to remap timings")
    ap.add_argument("--burn", nargs=2, metavar=("IN_VIDEO", "OUT_VIDEO"))
    a = ap.parse_args()
    kws = {k.strip().lower() for k in a.keywords.split(",") if k.strip()}
    ass = build_ass(load_words(a.words, a.edl), a.platform, kws, a.style)
    out = Path(a.out_ass)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(ass, encoding="utf-8")
    print(f"Wrote {out}")
    if a.burn:
        need("ffmpeg")
        src, dst = a.burn
        dst_p = guard_output(src, dst)
        if not FONTS_DIR.exists():
            raise SystemExit("Run prepare_fonts.py first so the brand fonts are available.")
        esc = str(out.resolve()).replace(":", r"\:")
        run(["ffmpeg", "-hide_banner", "-y", "-i", src, "-vf", f"ass={esc}:fontsdir={FONTS_DIR}", *X264_FINAL, *AAC, str(dst_p)])
        print(f"Burned captions -> {dst_p}")


if __name__ == "__main__":
    main()
