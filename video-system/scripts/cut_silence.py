"""Dead air removal. Detects silences and keeps only the spoken parts, with a
little padding so cuts never clip a word. Writes an edit list (JSON) you can
review, plus the cut video. The original file is never changed.

  python3 cut_silence.py raw.mp4 out.mp4 [--noise -35] [--min-silence 0.6] [--pad 0.12] [--keep-pause 0]

--keep-pause N keeps silences longer than N seconds at a shortened length of
0.45 s instead of removing them: use it for storytelling where a pause matters.
--dry-run writes only the edit list.
"""
import argparse
import json
import re
from pathlib import Path

from kvs_common import AAC, X264_FINAL, duration, guard_output, need, run


def detect_silences(src: str, noise_db: float, min_sil: float) -> list[tuple[float, float]]:
    need("ffmpeg")
    res = run(["ffmpeg", "-hide_banner", "-i", src, "-af", f"silencedetect=noise={noise_db}dB:d={min_sil}", "-f", "null", "-"])
    starts = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", res.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", res.stderr)]
    total = duration(src)
    if len(ends) < len(starts):
        ends.append(total)
    return [(max(0.0, s), e) for s, e in zip(starts, ends)]


def keep_segments(total: float, silences, pad: float, keep_pause: float) -> list[tuple[float, float]]:
    segs, cursor = [], 0.0
    for s, e in silences:
        if keep_pause and (e - s) >= keep_pause:
            mid = (s + e) / 2
            segs.append((cursor, min(total, mid + 0.225)))  # keep a 0.45 s pause
            cursor = max(cursor, mid + 0.225)
            continue
        a, b = cursor, min(total, s + pad)
        if b - a > 0.05:
            segs.append((a, b))
        cursor = max(cursor, e - pad)
    if total - cursor > 0.05:
        segs.append((cursor, total))
    # merge overlaps
    merged = []
    for a, b in segs:
        if merged and a <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(b, merged[-1][1]))
        else:
            merged.append((a, b))
    return merged


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--noise", type=float, default=-35.0)
    ap.add_argument("--min-silence", type=float, default=0.6)
    ap.add_argument("--pad", type=float, default=0.12)
    ap.add_argument("--keep-pause", type=float, default=0.0)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    out = guard_output(a.src, a.out)
    total = duration(a.src)
    sil = detect_silences(a.src, a.noise, a.min_silence)
    segs = keep_segments(total, sil, a.pad, a.keep_pause)
    kept = sum(b - x for x, b in segs)
    edl = {"source": str(Path(a.src).resolve()), "source_duration": round(total, 3), "kept_duration": round(kept, 3),
           "removed_seconds": round(total - kept, 3), "settings": vars(a), "silences": sil, "segments": segs}
    edl_path = out.with_suffix(".edl.json")
    edl_path.write_text(json.dumps(edl, indent=2))
    print(f"Edit list: {edl_path}  kept {kept:.2f}s of {total:.2f}s in {len(segs)} segments")
    if a.dry_run:
        return

    parts, labels = [], []
    for i, (s, e) in enumerate(segs):
        parts.append(f"[0:v]trim=start={s:.3f}:end={e:.3f},setpts=PTS-STARTPTS[v{i}];"
                     f"[0:a]atrim=start={s:.3f}:end={e:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,"
                     f"areverse,afade=t=in:d=0.01,areverse[a{i}];")
        labels.append(f"[v{i}][a{i}]")
    graph = "".join(parts) + "".join(labels) + f"concat=n={len(segs)}:v=1:a=1[v][a]"
    script = out.with_suffix(".filter.txt")
    script.write_text(graph)
    run(["ffmpeg", "-hide_banner", "-y", "-i", a.src, "-filter_complex_script", str(script), "-map", "[v]", "-map", "[a]",
         *X264_FINAL, *AAC, str(out)])
    script.unlink()
    print(f"Wrote {out} ({duration(out):.2f}s)")


if __name__ == "__main__":
    main()
