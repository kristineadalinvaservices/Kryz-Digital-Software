#!/usr/bin/env bash
# End to end check of the video system on a SYNTHETIC clip (test pattern and tones).
# It proves the tools run and produce the right sizes and durations. It is not a
# creative review: real footage still goes through Doc 8 QA.
#   bash video-system/scripts/selftest.sh [out_dir]
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="${1:-$HERE/../_selftest}"
rm -rf "$OUT"; mkdir -p "$OUT"
cd "$HERE"
[ -f ../fonts/Manrope-ExtraBold.ttf ] || python3 prepare_fonts.py

# 20 s 1920x1080 source: speech-like tone bursts with 1.5 s silences between them
ffmpeg -v error -y -f lavfi -i "testsrc2=size=1920x1080:rate=30:duration=20" \
  -f lavfi -i "sine=frequency=220:sample_rate=48000:duration=20" \
  -filter_complex "[1:a]volume='if(lt(mod(t,5),3.5),0.35,0)':eval=frame[a]" \
  -map 0:v -map "[a]" -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "$OUT/raw_synthetic.mp4"
cp "$OUT/raw_synthetic.mp4" "$OUT/raw_original_copy.mp4"

# Fake word timings that sit on the tone bursts (what transcribe.py would output)
python3 - "$OUT/raw_synthetic.words.json" <<'EOF'
import json, sys
lines = ["Your website needs a clear next step.", "Most enquiries die in the inbox.", "This system answers in minutes.", "Message SYSTEM for a walkthrough."]
segs = []
for i, line in enumerate(lines):
    base, words = i * 5 + 0.2, line.split()
    step = 3.0 / len(words)
    segs.append({"start": base, "end": base + 3.0, "text": line,
                 "words": [{"start": base + j * step, "end": base + (j + 1) * step - 0.05, "word": w} for j, w in enumerate(words)]})
json.dump({"language": "en", "segments": segs}, open(sys.argv[1], "w"))
EOF

node render_graphics.mjs lower-third "$OUT/lower-third.mov" --w 1080 --h 1920 --duration 3
node render_graphics.mjs title-card "$OUT/title-card.png" --w 1080 --h 1920 --p '{"kicker":"Systems that sell","title":"Stop chasing [every] detail"}'
node render_graphics.mjs cta "$OUT/cta.png" --w 1080 --h 1920
node render_graphics.mjs callout "$OUT/callout.png" --w 1920 --h 1080 --p '{"x":"700px","y":"380px","w":"520px","h":"140px"}'
node render_graphics.mjs reel-cover "$OUT/reel-cover.png" --w 1080 --h 1920
node render_graphics.mjs thumbnail "$OUT/thumbnail.png" --w 1280 --h 720
node render_graphics.mjs logo-reveal "$OUT/logo-reveal.png" --w 1920 --h 1080 --still 2
node render_graphics.mjs end-screen "$OUT/end-screen.png" --w 1920 --h 1080 --still 1.5

python3 pipeline.py "$OUT/raw_synthetic.mp4" --rec R000 --content C00 --platforms reels,youtube \
  --words "$OUT/raw_synthetic.words.json" --keywords "website,enquiries,system,minutes" \
  --mode reels=crop,youtube=fill --logo --graphic "$OUT/lower-third.mov@0.5" --out "$OUT/final" --date 20261127

python3 analyze_reference.py "$OUT/final/KRYZ-20261127-R000-C00_reels_1080x1920_v01.mp4" "$OUT/analysis"

# Checks
python3 - "$OUT" <<'EOF'
import json, subprocess, sys, hashlib
out = sys.argv[1]
def probe(p):
    return json.loads(subprocess.run(["ffprobe","-v","error","-print_format","json","-show_format","-show_streams",p],capture_output=True,text=True).stdout)
ok = True
def check(cond, msg):
    global ok; ok &= bool(cond); print(("PASS " if cond else "FAIL ") + msg)
h = lambda p: hashlib.sha256(open(p,"rb").read()).hexdigest()
check(h(f"{out}/raw_synthetic.mp4") == h(f"{out}/raw_original_copy.mp4"), "raw footage unchanged byte for byte")
rep = json.load(open(f"{out}/final/R000-C00_v01_render-report.json"))
edl = json.load(open(f"{out}/final/_work/R000-C00_01_cut.edl.json"))
check(edl["removed_seconds"] > 3, f"dead air removed: {edl['removed_seconds']} s of {edl['source_duration']} s")
for o in rep["outputs"]:
    want = {"reels": "1080x1920", "youtube": "1920x1080"}[o["platform"]]
    check(o["size"] == want, f"{o['platform']} size {o['size']}")
    check(abs(o["duration"] - edl["kept_duration"]) < 0.3, f"{o['platform']} duration {o['duration']} s matches edit list")
    a = next(s for s in probe(o["file"])["streams"] if s["codec_type"] == "audio")
    check(a["sample_rate"] == "48000", f"{o['platform']} audio 48 kHz")
mov = probe(f"{out}/lower-third.mov")["streams"][0]
check(mov["pix_fmt"].startswith("yuva"), f"lower third has alpha ({mov['pix_fmt']})")
loud = subprocess.run(["ffmpeg","-hide_banner","-i",rep["outputs"][0]["file"],"-af","ebur128","-f","null","-"],capture_output=True,text=True).stderr
I = float(loud.rsplit("I:",1)[1].split("LUFS")[0])
check(-16 < I < -12, f"integrated loudness {I} LUFS (target -14)")
sys.exit(0 if ok else 1)
EOF
echo "Self test finished. Stills to eyeball: $OUT/*.png and $OUT/analysis/contact_sheet.jpg"
