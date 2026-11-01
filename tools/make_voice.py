#!/usr/bin/env python3
"""
Pre-record every spoken line with a natural-sounding voice.

Uses Kokoro (https://github.com/thewh1teagle/kokoro-onnx), an open-source
neural text-to-speech model that runs offline. Output goes to voice/*.mp3 plus
voice/manifest.json, which the app reads (see js/audio.js).

Only new or changed lines are recorded, so re-running is quick.

Setup (once):
    python3 -m venv .venv-voice
    .venv-voice/bin/pip install kokoro-onnx soundfile
    mkdir -p tools/models
    curl -L -o tools/models/kokoro-v1.0.onnx \
      https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
    curl -L -o tools/models/voices-v1.0.bin \
      https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin

Run (needs node and ffmpeg):
    .venv-voice/bin/python tools/make_voice.py
    .venv-voice/bin/python tools/make_voice.py --voice af_bella   # try another voice
"""
import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "voice")

# Spelling tweaks so the voice pronounces things right. The app still shows
# and matches the original text; only the recording uses the tweak.
PRONOUNCE = [
    (r"\bA is for\b", "Eh is for"),  # otherwise "A" is read as "uh"
]


def clip_name(text, voice, speed):
    digest = hashlib.sha1(f"{voice}|{speed}|{text}".encode()).hexdigest()[:12]
    return f"{digest}.mp3"


def trim(samples, sr, threshold=0.01, pad=0.05):
    """Cut leading/trailing silence, keeping a short natural pad."""
    import numpy as np
    loud = np.where(np.abs(samples) > threshold)[0]
    if not len(loud):
        return samples
    start = max(0, loud[0] - int(pad * sr))
    end = min(len(samples), loud[-1] + int(pad * sr))
    return samples[start:end]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="af_heart", help="Kokoro voice, e.g. af_heart, af_bella, am_michael")
    ap.add_argument("--speed", type=float, default=0.92, help="1.0 = normal; a bit slower suits toddlers")
    ap.add_argument("--models", default=os.path.join(ROOT, "tools", "models"))
    args = ap.parse_args()

    import soundfile as sf
    from kokoro_onnx import Kokoro

    lines = json.loads(subprocess.check_output(["node", os.path.join(ROOT, "tools", "list-lines.js")]))
    os.makedirs(OUT, exist_ok=True)

    kokoro = Kokoro(os.path.join(args.models, "kokoro-v1.0.onnx"), os.path.join(args.models, "voices-v1.0.bin"))

    clips = {}
    made = 0
    for i, text in enumerate(lines, 1):
        name = clip_name(text, args.voice, args.speed)
        clips[text] = name
        dest = os.path.join(OUT, name)
        if os.path.exists(dest):
            continue
        spoken = text
        for pattern, repl in PRONOUNCE:
            spoken = re.sub(pattern, repl, spoken)
        samples, sr = kokoro.create(spoken, voice=args.voice, speed=args.speed, lang="en-us")
        samples = trim(samples, sr)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            sf.write(tmp.name, samples, sr)
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-i", tmp.name, "-ac", "1", "-b:a", "48k", dest],
            check=True,
        )
        os.unlink(tmp.name)
        made += 1
        print(f"[{i}/{len(lines)}] {text}", file=sys.stderr)

    # Remove recordings that are no longer used.
    keep = set(clips.values())
    removed = 0
    for f in os.listdir(OUT):
        if f.endswith(".mp3") and f not in keep:
            os.unlink(os.path.join(OUT, f))
            removed += 1

    with open(os.path.join(OUT, "manifest.json"), "w") as fh:
        json.dump({"voice": args.voice, "speed": args.speed, "clips": clips}, fh, indent=1, ensure_ascii=False)
        fh.write("\n")

    print(f"{len(lines)} lines: {made} recorded, {removed} removed.", file=sys.stderr)


if __name__ == "__main__":
    main()
