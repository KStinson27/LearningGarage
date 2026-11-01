# 🏁 Learning Garage

A learning app for toddlers who love cars and monster trucks. It runs in Safari
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
- **Turn the volume up and make sure Silent Mode is off.** Sound effects are muted
  when the iPad is silenced.
- **Guided Access** keeps a toddler inside the app: *Settings → Accessibility →
  Guided Access*, turn it on, then triple-click the top or Home button while
  the app is open.
- *Settings → Accessibility → Spoken Content → Voices* lets you download a nicer
  English voice (for example an "Enhanced" or "Premium" voice). The app picks a
  clear US voice automatically.

## Run it locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. To try it on an iPad on the same Wi-Fi, use
`http://<your-computer-ip>:8000`. Offline mode only works over HTTPS or
localhost.

## Customize it

All the words, vehicles and phrases are in **`js/data.js`**. Edit that file to:
- add a vehicle (`emoji`, `name`, the `says` phrase and a `sfx` sound),
- change the ABC words,
- change what each shape or color says.

After changing files, bump `VERSION` in `sw.js` (for example to `learning-garage-v2`) so
installed copies update. Close and reopen the app on the iPad to load the new version.

## How it's built
- Plain HTML, CSS and JavaScript with no frameworks and no build step.
- `js/audio.js` makes every sound effect in code (Web Audio) and speaks with
  the iPad's built-in voice (Speech Synthesis), so there are no audio files.
- `js/art.js` draws the monster truck, cars and shapes as SVG so they can be any color.
- `sw.js` and `manifest.webmanifest` make it an installable, offline-capable app.
- Sticker progress is saved on the device (`localStorage`). To reset it, go to
  the Stickers screen and hold the small "Grown-ups" button for 3 seconds.

## Ideas for what's next
- Record your own voice saying words (it means a lot to a toddler).
- Add photos of his real toy trucks.
- A "build a monster truck" game: choose the wheels, color and stickers.
- Matching and memory games, opposites (big/small, fast/slow), and sounds like
  "which truck says nee-naw?"
