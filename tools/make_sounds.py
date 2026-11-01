#!/usr/bin/env python3
"""
Build the app's real vehicle sounds from tools/sounds.json.

For each sound: download the source recording (cached in tools/.sound-cache),
cut the listed segment, fade the edges, even out the loudness, and save it
as sounds/<id>.mp3. Also writes sounds/manifest.json (read by js/audio.js)
and sounds/CREDITS.md (required by CC BY licenses).

A sound's "url" can also be a local file path, e.g. a file you downloaded
yourself from BigSoundBank (https://bigsoundbank.com, CC0).

Run (needs ffmpeg):  python3 tools/make_sounds.py
"""
import json
import os
import subprocess
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG = os.path.join(ROOT, "tools", "sounds.json")
CACHE = os.path.join(ROOT, "tools", ".sound-cache")
OUT = os.path.join(ROOT, "sounds")


def fetch(url):
    if os.path.exists(url):
        return url
    os.makedirs(CACHE, exist_ok=True)
    dest = os.path.join(CACHE, url.rstrip("/").split("/")[-1])
    if not os.path.exists(dest):
        print("downloading", url)
        urllib.request.urlretrieve(url, dest)
    return dest


def main():
    cfg = json.load(open(CONFIG))
    sources = cfg["sources"]
    os.makedirs(OUT, exist_ok=True)
    manifest = {}
    for sid, s in cfg["sounds"].items():
        src = fetch(s["url"])
        dur = float(s["duration"])
        fade = min(0.25, dur / 4)
        dest = os.path.join(OUT, f"{sid}.mp3")
        filters = ",".join([
            f"afade=t=in:st=0:d={min(0.03, fade)}",
            f"afade=t=out:st={dur - fade:.3f}:d={fade:.3f}",
            "loudnorm=I=-16:TP=-1.5:LRA=11",
        ])
        subprocess.run([
            "ffmpeg", "-loglevel", "error", "-y",
            "-ss", str(s.get("start", 0)), "-t", str(dur), "-i", src,
            "-af", filters, "-ac", "1", "-ar", "44100", "-b:a", "96k", dest,
        ], check=True)
        manifest[sid] = f"{sid}.mp3"
        print("made", sid)

    # Drop sounds no longer listed.
    for f in os.listdir(OUT):
        if f.endswith(".mp3") and f[:-4] not in manifest:
            os.unlink(os.path.join(OUT, f))

    with open(os.path.join(OUT, "manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=1)
        fh.write("\n")

    lines = ["# Sound credits", "", "Vehicle sounds in this folder come from these recordings:", ""]
    for key, src in sources.items():
        used = [f"`{sid}` ({s['name']})" for sid, s in cfg["sounds"].items() if s["source"] == key]
        if not used:
            continue
        lines.append(f"- **{src['title']}** by {src['author']}, licensed "
                     f"[{src['license']}]({src['license_url']}). Source: {src['home']}. "
                     f"Trimmed and loudness-normalized. Used for: {', '.join(used)}.")
    with open(os.path.join(OUT, "CREDITS.md"), "w") as fh:
        fh.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
