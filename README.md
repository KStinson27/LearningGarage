# 🏁 Learning Garage

A learning app for toddlers who love cars and monster trucks, styled as a
sunny road trip: every section is a road sign, and trucks drive along the road. It runs in Safari
on an iPad, installs to the home screen like a real app, and works offline.

Everything is spoken aloud, the buttons are huge, and there are no "wrong"
buzzers. A miss just gets a gentle "That's blue. Find the red car!"

## What's inside

| Section | Learn mode | Play mode |
|---|---|---|
| 🚚 **Trucks** | 23 vehicles. Tap one and it drives in, makes its sound (siren, honk, choo choo…) and says its name | – |
| 🔢 **Numbers** | 1–10, each shown with that many vehicles and counted out loud | **Monster Truck Count**: tap each car, the monster truck jumps on it and crushes it while counting. It starts at 1–3 cars and slowly goes up to 10 |
| ⭐ **Shapes** | 8 shapes with car-themed hints ("Round like a wheel!") | "Find the circle!" |
| 🎨 **Colors** | Monster trucks in 10 colors | "Find the red car!" |
| 🔤 **ABC** | A–Z, each with a vehicle-themed word ("M is for Monster truck!") | "Find the letter B!" |
| 🏆 **Stickers** | A collection of vehicle stickers won while playing | – |

Games start easy (2 choices) and add more choices as your child gets answers
right. Every few wins earns a new vehicle sticker.

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

## How it's built
- Plain HTML, CSS and JavaScript with no frameworks and no build step.
- `js/audio.js` makes every sound effect in code (Web Audio) and plays the
  recorded voice clips. It falls back to the built-in voice for any line without a clip.
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
- A "build a monster truck" game: choose the wheels, color and stickers.
- Matching and memory games, opposites (big/small, fast/slow), and sounds like
  "which truck says nee-naw?"
