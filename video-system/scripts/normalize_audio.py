"""Two pass EBU R128 loudness normalisation, with a gentle voice clean up chain
(rumble cut, light de-noise, de-ess friendly high shelf left out on purpose).

  python3 normalize_audio.py in.mp4 out.mp4 [--lufs -14] [--tp -1.0] [--no-clean]

-14 LUFS integrated, -1 dBTP is the working target for social and YouTube.
Video is copied untouched.
"""
import argparse
import json
import re

from kvs_common import guard_output, need, run

CLEAN = "highpass=f=80,afftdn=nr=10:nf=-40"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--lufs", type=float, default=-14.0)
    ap.add_argument("--tp", type=float, default=-1.0)
    ap.add_argument("--lra", type=float, default=11.0)
    ap.add_argument("--no-clean", action="store_true")
    a = ap.parse_args()
    need("ffmpeg")
    out = guard_output(a.src, a.out)
    pre = "" if a.no_clean else CLEAN + ","
    first = run(["ffmpeg", "-hide_banner", "-i", a.src, "-af",
                 f"{pre}loudnorm=I={a.lufs}:TP={a.tp}:LRA={a.lra}:print_format=json", "-f", "null", "-"])
    m = json.loads(re.findall(r"\{[^{}]*\"input_i\"[^{}]*\}", first.stderr, re.S)[-1])
    second = (f"{pre}loudnorm=I={a.lufs}:TP={a.tp}:LRA={a.lra}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
              f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    run(["ffmpeg", "-hide_banner", "-y", "-i", a.src, "-c:v", "copy", "-af", second, "-c:a", "aac", "-b:a", "192k",
         "-ar", "48000", str(out)])
    print(f"Measured {m['input_i']} LUFS, normalised to {a.lufs} LUFS -> {out}")


if __name__ == "__main__":
    main()
