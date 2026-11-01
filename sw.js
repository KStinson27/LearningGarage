// Offline support: serve from cache, refresh the cache in the background.
// Bump VERSION when you change files so iPads pick up the update.
const VERSION = 'learning-garage-v4';
const ASSETS = [
  './',
  'index.html',
  'css/styles.css',
  'js/audio.js',
  'js/art.js',
  'js/data.js',
  'js/lines.js',
  'js/motion.js',
  'js/app.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'fonts/fredoka-latin.woff2',
  'voice/manifest.json',
  'sounds/manifest.json',
];

// Also download every recorded voice clip and vehicle sound, so they work
// offline too.
async function precache() {
  const cache = await caches.open(VERSION);
  await cache.addAll(ASSETS);
  try {
    const manifest = await (await fetch('voice/manifest.json')).json();
    const clips = [...new Set(Object.values(manifest.clips || {}))].map(f => `voice/${f}`);
    await cache.addAll(clips);
  } catch (e) {
    // No recordings: the app falls back to the built-in voice.
  }
  try {
    const sounds = await (await fetch('sounds/manifest.json')).json();
    await cache.addAll([...new Set(Object.values(sounds))].map(f => `sounds/${f}`));
  } catch (e) {
    // No vehicle recordings: synthesized stand-ins are used.
  }
}

self.addEventListener('install', event => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  event.respondWith(
    caches.open(VERSION).then(async cache => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req)
        .then(res => { if (res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
