"""Shared helpers for the Kryz video system scripts.

Every script reads inputs and writes NEW files. None of them modify or delete
the source footage they are given.
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent          # video-system/
REPO = ROOT.parent
TOKENS = json.loads((ROOT / "brand" / "tokens.json").read_text())
PLATFORMS = {k: v for k, v in json.loads((ROOT / "presets" / "platforms.json").read_text()).items() if not k.startswith("_")}
FONTS_DIR = ROOT / "fonts"


def need(tool: str) -> str:
    path = shutil.which(tool)
    if not path:
        sys.exit(f"Missing tool: {tool}. Install it first (see docs/05-automation-sop.md).")
    return path


def run(cmd: list[str], capture: bool = False) -> subprocess.CompletedProcess:
    res = subprocess.run(cmd, text=True, capture_output=True)
    if res.returncode != 0:
        sys.stderr.write(res.stderr[-4000:])
        sys.exit(f"Command failed: {' '.join(cmd[:6])} ...")
    return res


def probe(path: str | Path) -> dict:
    need("ffprobe")
    out = run(["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(path)]).stdout
    return json.loads(out)


def duration(path: str | Path) -> float:
    return float(probe(path)["format"]["duration"])


def has_audio(path: str | Path) -> bool:
    return any(s.get("codec_type") == "audio" for s in probe(path)["streams"])


def video_size(path: str | Path) -> tuple[int, int]:
    v = next(s for s in probe(path)["streams"] if s.get("codec_type") == "video")
    return int(v["width"]), int(v["height"])


def guard_output(src: str | Path, out: str | Path) -> Path:
    """Refuse to overwrite the source file. Originals are never touched."""
    src_p, out_p = Path(src).resolve(), Path(out).resolve()
    if src_p == out_p:
        sys.exit("Refusing to write over the original footage. Choose a different output path.")
    out_p.parent.mkdir(parents=True, exist_ok=True)
    return out_p


def ass_color(hex_rgb: str, alpha: int = 0) -> str:
    """#RRGGBB -> ASS &HAABBGGRR"""
    h = hex_rgb.lstrip("#")
    r, g, b = h[0:2], h[2:4], h[4:6]
    return f"&H{alpha:02X}{b}{g}{r}".upper()


X264_FINAL = ["-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart"]
X264_DRAFT = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p"]
AAC = ["-c:a", "aac", "-b:a", "192k", "-ar", "48000"]
