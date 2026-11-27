"""Evidence pack for reverse engineering a reference video (Doc 1).

  python3 analyze_reference.py reference.mp4 out_dir/ [--scene 0.30]

Produces, without changing the file:
  cuts.csv            every detected hard cut with its timestamp and the
                      average shot length (editing pace)
  frames/             one still per detected shot plus one every 0.5 s for the
                      first 10 seconds (the hook)
  contact_sheet.jpg   all shot stills on one page, timestamps burned in
  audio.csv           loudness per second (music drops, SFX hits, silences)
  summary.json        totals: duration, cut count, cuts per minute, hook cuts

These are OBSERVED facts. Effects such as speed ramps, masking or motion
tracking are then identified by a person or Claude looking at the frames,
and every row in the report says whether it was observed or inferred.
"""
import argparse
import csv
import json
import re
import shutil
import subprocess
from pathlib import Path

from kvs_common import FONTS_DIR, duration, need, run


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out_dir")
    ap.add_argument("--scene", type=float, default=0.30)
    a = ap.parse_args()
    need("ffmpeg")
    out = Path(a.out_dir)
    (out / "frames").mkdir(parents=True, exist_ok=True)
    total = duration(a.src)

    res = run(["ffmpeg", "-hide_banner", "-i", a.src, "-vf", f"select='gt(scene,{a.scene})',showinfo", "-an", "-f", "null", "-"])
    cuts = [float(t) for t in re.findall(r"pts_time:([\d.]+)", res.stderr)]
    with open(out / "cuts.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["cut", "timestamp_s", "timecode", "shot_length_s"])
        prev = 0.0
        for i, t in enumerate(cuts, 1):
            w.writerow([i, f"{t:.3f}", f"{int(t // 60):02d}:{t % 60:06.3f}", f"{t - prev:.3f}"])
            prev = t

    stamps = sorted(set([0.0] + cuts + [x / 2 for x in range(0, min(21, int(total * 2)))]))
    for t in stamps:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", a.src, "-frames:v", "1", "-vf", "scale=480:-2",
                        str(out / "frames" / f"t{t:08.3f}.jpg")], check=True)

    shot_times = [0.0] + cuts
    cols = 6
    rows = max(1, -(-len(shot_times) // cols))
    font = FONTS_DIR / "Inter-SemiBold.ttf"
    sheet_dir = out / "frames" / "_sheet"
    sheet_dir.mkdir(exist_ok=True)
    for i, t in enumerate(shot_times):
        label = f"{int(t // 60):02d}\\:{t % 60:05.2f}"
        dt = f",drawtext=fontfile={font}:text='{label}':fontcolor=0xFFD23F:fontsize=18:x=6:y=4" if font.exists() else ""
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", a.src, "-frames:v", "1", "-vf",
                        f"scale=320:-2,pad=iw:ih+28:0:28:color=0x141012{dt}", str(sheet_dir / f"{i:04d}.jpg")], check=True)
    listfile = sheet_dir / "_shots.txt"
    listfile.write_text("".join(f"file '{i:04d}.jpg'\nduration 1\n" for i in range(len(shot_times))))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(listfile), "-vf",
                    f"tile={cols}x{rows}:padding=6:color=0x141012",
                    "-frames:v", "1", str(out / "contact_sheet.jpg")], check=False)
    shutil.rmtree(sheet_dir)

    ebu = run(["ffmpeg", "-hide_banner", "-i", a.src, "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
    rows_a = re.findall(r"t:\s*([\d.]+)\s+TARGET.*?M:\s*(-?[\d.]+)\s+S:\s*(-?[\d.]+)", ebu)
    with open(out / "audio.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["t_s", "momentary_lufs", "short_term_lufs"])
        last = -1
        for t, m, s in rows_a:
            if int(float(t)) != last:
                last = int(float(t))
                w.writerow([last, m, s])

    summary = {"source": str(Path(a.src).resolve()), "duration_s": round(total, 2), "hard_cuts": len(cuts),
               "cuts_per_minute": round(len(cuts) / (total / 60), 1) if total else 0,
               "cuts_in_first_3s": sum(t <= 3 for t in cuts), "cuts_in_first_10s": sum(t <= 10 for t in cuts),
               "avg_shot_length_s": round(total / (len(cuts) + 1), 2), "scene_threshold": a.scene}
    (out / "summary.json").write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
