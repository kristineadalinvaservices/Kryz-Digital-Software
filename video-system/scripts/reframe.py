"""Aspect ratio conversion for platform versions.

  python3 reframe.py in.mp4 out.mp4 --platform reels [--mode crop|fill] [--focus 0.5] [--face]

crop : fills the frame by cropping. --focus is the horizontal centre of the
       subject from 0 (left) to 1 (right). --face finds it automatically with
       OpenCV (pip install opencv-python-headless), sampling one frame a second
       and using the median face position (a steady, non jittery crop).
fill : fits the whole picture and fills the empty area with a blurred, darkened
       copy. Use it for screen recordings so no interface is cut off.
"""
import argparse
import statistics
import subprocess
import tempfile
from pathlib import Path

from kvs_common import AAC, PLATFORMS, X264_FINAL, guard_output, has_audio, need, run, video_size


def face_focus(src: str) -> float | None:
    try:
        import cv2  # type: ignore
    except ImportError:
        print("OpenCV not installed, using --focus value.")
        return None
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    xs = []
    with tempfile.TemporaryDirectory() as td:
        subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vf", "fps=1,scale=640:-2", f"{td}/f%04d.jpg"], check=True)
        for p in sorted(Path(td).glob("*.jpg")):
            img = cv2.imread(str(p))
            faces = cascade.detectMultiScale(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), 1.1, 5, minSize=(40, 40))
            if len(faces):
                x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
                xs.append((x + w / 2) / img.shape[1])
    return statistics.median(xs) if xs else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--platform", required=True, choices=sorted(PLATFORMS))
    ap.add_argument("--mode", choices=["crop", "fill"], default="crop")
    ap.add_argument("--focus", type=float, default=0.5)
    ap.add_argument("--face", action="store_true")
    a = ap.parse_args()
    need("ffmpeg")
    out = guard_output(a.src, a.out)
    p = PLATFORMS[a.platform]
    W, H, fps = p["w"], p["h"], p["fps"]
    if a.mode == "crop":
        focus = (face_focus(a.src) if a.face else None) or a.focus
        sw, sh = video_size(a.src)
        scale = max(W / sw, H / sh)
        nw, nh = int(round(sw * scale / 2) * 2), int(round(sh * scale / 2) * 2)
        x = int(min(max(focus * nw - W / 2, 0), nw - W))
        vf = f"scale={nw}:{nh},crop={W}:{H}:{x}:(ih-{H})/2,setsar=1,fps={fps}"
        cmd = ["-vf", vf]
    else:
        fc = (f"[0:v]split[a][b];[a]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=40:2,"
              f"eq=brightness=-0.18[bg];[b]scale={W}:{H}:force_original_aspect_ratio=decrease[fg];"
              f"[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1,fps={fps}[v]")
        cmd = ["-filter_complex", fc, "-map", "[v]"] + (["-map", "0:a"] if has_audio(a.src) else [])
    run(["ffmpeg", "-hide_banner", "-y", "-i", a.src, *cmd, *X264_FINAL, *AAC, str(out)])
    print(f"Wrote {out} at {W}x{H} ({a.mode})")


if __name__ == "__main__":
    main()
