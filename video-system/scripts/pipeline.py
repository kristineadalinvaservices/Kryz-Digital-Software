"""One command from a raw clip to branded platform versions.

  python3 pipeline.py RAW.mp4 --rec R001 --content C01 --platforms reels,tiktok,youtube \
      [--words RAW.words.json] [--keywords "leads,system"] [--caption-style keyword] \
      [--mode reels=crop,youtube=fill] [--focus 0.5] [--face] [--no-cut] [--keep-pause 1.2] [--logo] \
      [--graphic lower-third.mov@1.0] --out OUT_DIR [--version 1]

Steps: dead air cut -> loudness -> per platform reframe -> captions -> logo and graphics.
Writes finals to OUT_DIR with the Doc 7 naming convention and keeps every
intermediate in OUT_DIR/_work so nothing has to be re-rendered for a revision.
Raw footage is only ever read.
"""
import argparse
import datetime as dt
import json
import subprocess
import sys
from pathlib import Path

from kvs_common import PLATFORMS, duration, video_size

HERE = Path(__file__).resolve().parent


def step(script: str, *args: str):
    print(f"\n== {script} {' '.join(Path(a).name if '/' in a else a for a in args[:4])}")
    r = subprocess.run([sys.executable, str(HERE / script), *args])
    if r.returncode:
        sys.exit(f"Step failed: {script}")


def final_name(rec: str, content: str, platform: str, version: int, date: str) -> str:
    p = PLATFORMS[platform]
    return f"KRYZ-{date}-{rec}-{content}_{platform}_{p['w']}x{p['h']}_v{version:02d}.mp4"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("raw")
    ap.add_argument("--rec", required=True)
    ap.add_argument("--content", required=True)
    ap.add_argument("--platforms", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--words")
    ap.add_argument("--keywords", default="")
    ap.add_argument("--caption-style", default="keyword", choices=["keyword", "karaoke"])
    ap.add_argument("--mode", default="", help="per platform reframe mode, e.g. reels=crop,youtube=fill")
    ap.add_argument("--focus", default="0.5")
    ap.add_argument("--face", action="store_true")
    ap.add_argument("--no-cut", action="store_true")
    ap.add_argument("--keep-pause", default="0")
    ap.add_argument("--logo", action="store_true")
    ap.add_argument("--graphic", action="append", default=[])
    ap.add_argument("--version", type=int, default=1)
    ap.add_argument("--date", default=dt.date.today().strftime("%Y%m%d"))
    a = ap.parse_args()

    out = Path(a.out)
    work = out / "_work"
    work.mkdir(parents=True, exist_ok=True)
    stem = f"{a.rec}-{a.content}"
    modes = dict(kv.split("=") for kv in a.mode.split(",") if "=" in kv)
    report = {"raw": str(Path(a.raw).resolve()), "raw_duration": duration(a.raw), "outputs": []}

    edl = None
    cut = Path(a.raw)
    if not a.no_cut:
        cut = work / f"{stem}_01_cut.mp4"
        step("cut_silence.py", a.raw, str(cut), "--keep-pause", a.keep_pause)
        edl = cut.with_suffix(".edl.json")
    norm = work / f"{stem}_02_loud.mp4"
    step("normalize_audio.py", str(cut), str(norm))

    for plat in [p.strip() for p in a.platforms.split(",") if p.strip()]:
        if plat not in PLATFORMS:
            sys.exit(f"Unknown platform {plat}. Choose from {', '.join(sorted(PLATFORMS))}")
        cur = work / f"{stem}_{plat}_03_frame.mp4"
        mode = modes.get(plat, "crop")
        step("reframe.py", str(norm), str(cur), "--platform", plat, "--mode", mode, "--focus", a.focus, *(["--face"] if a.face else []))
        if a.words:
            nxt = work / f"{stem}_{plat}_04_caps.mp4"
            ass = work / f"{stem}_{plat}.ass"
            step("captions.py", a.words, str(ass), "--platform", plat, "--keywords", a.keywords, "--style", a.caption_style,
                 *(["--edl", str(edl)] if edl else []), "--burn", str(cur), str(nxt))
            cur = nxt
        final = out / final_name(a.rec, a.content, plat, a.version, a.date)
        if a.logo or a.graphic:
            gargs = [x for g in a.graphic for x in ("--graphic", g)]
            step("brand_overlay.py", str(cur), str(final), "--platform", plat, *(["--logo"] if a.logo else []), *gargs)
        else:
            final.write_bytes(cur.read_bytes())
        w, h = video_size(final)
        report["outputs"].append({"platform": plat, "file": str(final), "size": f"{w}x{h}", "duration": round(duration(final), 2),
                                  "reframe": mode})
    (out / f"{stem}_v{a.version:02d}_render-report.json").write_text(json.dumps(report, indent=2))
    print("\n" + json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
