# 🏁 Learning Garage

A learning app for toddlers who love cars and monster trucks, styled as a
sunny road trip: every section is a road sign, and trucks drive along the road. It runs in Safari
on an iPad, installs to the home screen like a real app, and works offline.

Everything is spoken aloud, the buttons are huge, and there are no "wrong"
buzzers. A miss just gets a gentle "That's blue. Find the red car!"

## What's inside

**Learning about vehicles**

| Section | What he does |
|---|---|
| 🚚 **Trucks** | 27 vehicles, including a tow truck, dump truck, cement mixer and garbage truck. Tap one and it drives in and plays its real sound, then the voice says a fact. Tap it again for the next fact. |
| 🔧 **Car Parts** | A big car with 15 parts to tap. Some parts do something: headlights shine, the steering wheel honks the horn, the hood starts the engine, the exhaust puffs smoke, the wheels roll. **Play:** "Find the gas cap!" |
| 🔊 **Sounds** | "Listen! Who makes this sound?" Hear a horn, train, siren or engine and pick the vehicle. |
| ❓ **Who Helps?** | Little stories that teach what each vehicle is for: "This car broke down. Who can help?" (the tow truck). |
| 🛑 **Stop & Go** | Drive a car down the road using the GO and STOP pedals. Green means go, yellow means slow down, red means stop. Stopping at red earns stars. |

**The basics, car-themed**

| Section | Learn | Play |
|---|---|---|
| 🔢 **Numbers** | 1–10 with that many vehicles | **Monster Truck Count**: the truck jumps and crushes each car he counts (4 cars at first, up to 10) |
| ⭐ **Shapes** | 9 shapes ("A stop sign has eight sides!") | "Find the octagon!" |
| 🎨 **Colors** | Monster trucks in 10 colors | "Find the red car!" |
| 🔤 **ABC** | A–Z ("T is for Tow truck!") | "Find the letter T!" |
| 🏆 **Stickers** | A collection of vehicle stickers | – |

The "Find it" games start with 3 choices and go up to 6 as he gets them right.

## Put it on the iPad

### 1. Host it (free, with GitHub Pages)
1. On GitHub, open this repository, then **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, pick your
   branch (for example `main`) and the `/ (root)` folder, then **Save**.
3. After about a minute your app will be at
   `https://<your-username>.github.io/<repo-name>/`.

Any static host works too (Netlify, Cloudflare Pages, Vercel). Just upload the
folder. There's no build step.

### 2. Add it to the home screen
1. Open that link in **Safari** on the iPad.
2. Tap **Share** (the square with an arrow), then **Add to Home Screen**.
3. It now opens full screen with its own icon, and works without Wi-Fi after
   the first launch.

### 3. Recommended iPad settings
- **Turn the volume up.** On iPadOS 17 and later the app plays even with Silent
  Mode on. On older iPads, turn Silent Mode off.
- **Guided Access** keeps a toddler inside the app: *Settings → Accessibility →
  Guided Access*, turn it on, then triple-click the top or Home button while
  the app is open.
- The app's voice is pre-recorded (see "The voice" below). For any line that
  isn't recorded, the app falls back to the iPad's built-in voice. You can make
  that fallback sound better by downloading an "Enhanced" or "Premium" English voice in
  *Settings → Accessibility → Spoken Content → Voices*. The app picks it automatically.

## Run it locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. To try it on an iPad on the same Wi-Fi, use
`http://<your-computer-ip>:8000`. Offline mode only works over HTTPS or
localhost.

## Customize it

The vehicles, words and phrases are in **`js/data.js`**. Edit that file to:
- add a vehicle (`emoji`, `name`, the `says` phrase and a `sfx` sound),
- change the ABC words,
- change what each shape or color says.

Every sentence the app speaks is built in **`js/lines.js`**.

After changing files:
1. Re-record the voice (below) if you changed any wording.
2. Bump `VERSION` in `sw.js` (for example from `learning-garage-v3` to
   `learning-garage-v4`) so installed copies update.
3. Close and reopen the app on the iPad to load the new version.

## The voice

The built-in iPad voice sounds robotic. Instead, every line is pre-recorded
with [Kokoro](https://github.com/thewh1teagle/kokoro-onnx), an open-source,
natural-sounding text-to-speech model, into `voice/*.mp3`. The default voice is
`af_heart`, a warm American English female voice. Lines without a recording use
the device's built-in voice instead.

To re-record after changing wording (needs Python 3, Node and ffmpeg):

```bash
python3 -m venv .venv-voice
.venv-voice/bin/pip install kokoro-onnx soundfile
mkdir -p tools/models
curl -L -o tools/models/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -L -o tools/models/voices-v1.0.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
.venv-voice/bin/python tools/make_voice.py
```

Only new or changed lines are recorded. To try a different voice, add for example
`--voice af_bella` or `--voice am_michael`. Other female voices start with `af_`
and other male voices with `am_`.

## Vehicle sounds

Horns, sirens and engines are **real recordings**, not a person saying "beep beep".
They are listed in `tools/sounds.json` with their source and license, and built
into `sounds/` by `python3 tools/make_sounds.py` (needs ffmpeg). Credits are in
`sounds/CREDITS.md`.

Any sound without a recording yet plays a synthesized stand-in. Good free
sources (CC0, no credit needed) are [BigSoundBank](https://bigsoundbank.com) and
[Freesound](https://freesound.org) (filter by the CC0 license). To add one, list it in
`tools/sounds.json` under the sound id the app uses, then re-run the tool. The ids are:
`horn-car`, `horn-truck`, `airhorn`, `siren-police`, `siren-fire`, `siren-ambulance`,
`motorcycle`, `tractor`, `airplane`, `helicopter`, `rocket`, `boat`, `bike-bell`,
`backup-beep`, `air-brakes` and `tire-screech`. `"url"` can also be a file on your computer.

## How it's built
- Plain HTML, CSS and JavaScript with no frameworks and no build step.
- `js/audio.js` plays the recorded voice clips and real vehicle sounds. The
  vehicle sound gets quieter while the voice talks. It falls back to the built-in
  voice or a synthesized sound when a recording is missing.
- `js/motion.js` is a small physics loop for vehicles. The wheels turn with the
  distance travelled, and the body rides a springy suspension: it tilts back when
  speeding up, dips when braking, bumps over the road and squishes on landing.
- `js/art.js` draws the monster truck, cars, shapes, road signs and scenery as
  SVG, so vehicles can be any color.
- The font is [Fredoka](https://github.com/hafontia/Fredoka-One), bundled in
  `fonts/` so it works offline (SIL Open Font License, see `fonts/OFL.txt`).
- `sw.js` and `manifest.webmanifest` make it an installable, offline-capable app.
- Sticker progress is saved on the device (`localStorage`). To reset it, go to
  the Stickers screen and hold the small "Grown-ups" button for 3 seconds.

## Ideas for what's next
- Record your own voice saying words (it means a lot to a toddler).
- Add photos of his real toy trucks.
- More Stop & Go: crosswalks, school zones, a railroad crossing.
- A "build a monster truck" game: choose the wheels, color and stickers.
- Matching and memory games, opposites (big/small, fast/slow), and sounds like
  "which truck says nee-naw?"
