"""Timestamped transcript with word timings, using faster-whisper (open source,
runs locally, no per minute fees).

  pip install faster-whisper
  python3 transcribe.py raw.mp4 out_dir/ [--model medium] [--language en]

Writes: <name>.words.json (word timings, used by captions.py),
        <name>.srt, <name>.transcript.md (readable, timestamped).

Language: leave --language empty for mixed English, Tagalog and Bisaya so the
model detects it. Whisper handles Tagalog; Bisaya (Cebuano) accuracy is lower,
so Bisaya lines always get a human check (Doc 8, C3). The first run downloads
the model from huggingface.co, which this cloud environment currently blocks:
run it on a machine with internet access or allow that host.
"""
import argparse
import json
from pathlib import Path


def ts(t: float, srt: bool = False) -> str:
    h, rem = divmod(t, 3600)
    m, s = divmod(rem, 60)
    return f"{int(h):02d}:{int(m):02d}:{s:06.3f}".replace(".", ",") if srt else f"{int(h):02d}:{int(m):02d}:{int(s):02d}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out_dir")
    ap.add_argument("--model", default="medium")
    ap.add_argument("--language", default=None)
    ap.add_argument("--device", default="auto")
    a = ap.parse_args()
    from faster_whisper import WhisperModel  # imported late so --help works without it

    model = WhisperModel(a.model, device=a.device, compute_type="auto")
    segments, info = model.transcribe(a.src, language=a.language, word_timestamps=True, vad_filter=True)
    data = {"source": str(Path(a.src).resolve()), "language": info.language, "language_probability": info.language_probability,
            "segments": []}
    for s in segments:
        data["segments"].append({"start": s.start, "end": s.end, "text": s.text.strip(),
                                 "words": [{"start": w.start, "end": w.end, "word": w.word.strip()} for w in (s.words or [])]})
    out = Path(a.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    stem = Path(a.src).stem
    (out / f"{stem}.words.json").write_text(json.dumps(data, indent=1, ensure_ascii=False))
    with open(out / f"{stem}.srt", "w") as f:
        for i, s in enumerate(data["segments"], 1):
            f.write(f"{i}\n{ts(s['start'], True)} --> {ts(s['end'], True)}\n{s['text']}\n\n")
    with open(out / f"{stem}.transcript.md", "w") as f:
        f.write(f"# Transcript: {stem}\nDetected language: {info.language} ({info.language_probability:.0%}). Machine transcript, not yet checked.\n\n")
        for s in data["segments"]:
            f.write(f"**[{ts(s['start'])}]** {s['text']}\n\n")
    print(f"Wrote transcript files to {out}")


if __name__ == "__main__":
    main()
