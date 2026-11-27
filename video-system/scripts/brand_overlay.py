"""Logo watermark and timed graphics (lower thirds, titles, CTAs) over a video.

  python3 brand_overlay.py in.mp4 out.mp4 --platform reels [--logo] \
      [--graphic lower-third.mov@1.2] [--graphic cta.mov@end-4]

--logo        adds the official 3D K mark (unmodified file) top right inside the
              safe zone, 72 px tall at 85 percent opacity. Never recoloured.
--graphic F@T overlays an alpha video or PNG made by render_graphics.mjs starting
              at T seconds (or end-N for N seconds before the end).
"""
import argparse

from kvs_common import AAC, PLATFORMS, REPO, TOKENS, X264_FINAL, duration, guard_output, need, run


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--platform", required=True, choices=sorted(PLATFORMS))
    ap.add_argument("--logo", action="store_true")
    ap.add_argument("--graphic", action="append", default=[])
    a = ap.parse_args()
    need("ffmpeg")
    out = guard_output(a.src, a.out)
    p = PLATFORMS[a.platform]
    total = duration(a.src)
    inputs, chain, last = ["-i", a.src], [], "[0:v]"
    idx = 1
    if a.logo:
        lg = TOKENS["logo"]
        inputs += ["-i", str(REPO / "brand" / "source" / "kryz-mark-3d.png")]
        chain.append(f"[{idx}:v]scale=-1:{lg['watermarkHeightPx']},format=rgba,colorchannelmixer=aa={lg['watermarkOpacity']}[lg]")
        chain.append(f"{last}[lg]overlay=W-w-{p['safe']['right']}:{p['safe']['top']}[v{idx}]")
        last = f"[v{idx}]"
        idx += 1
    for g in a.graphic:
        path, _, when = g.rpartition("@")
        start = total - float(when[4:]) if when.startswith("end-") else float(when)
        is_png = path.lower().endswith(".png")
        inputs += (["-loop", "1", "-t", "4", "-i", path] if is_png else ["-i", path])
        chain.append(f"[{idx}:v]setpts=PTS-STARTPTS+{start:.3f}/TB[g{idx}]")
        chain.append(f"{last}[g{idx}]overlay=0:0:eof_action=pass:enable='gte(t,{start:.3f})'[v{idx}]")
        last = f"[v{idx}]"
        idx += 1
    if not chain:
        raise SystemExit("Nothing to add. Use --logo and/or --graphic.")
    run(["ffmpeg", "-hide_banner", "-y", *inputs, "-filter_complex", ";".join(chain), "-map", last, "-map", "0:a?",
         *X264_FINAL, *AAC, str(out)])
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
