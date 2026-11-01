/*
 * Sound: sound effects (synthesized with Web Audio) + the spoken voice.
 *
 * Voice: every line in js/lines.js is pre-recorded with a natural-sounding
 * voice (see tools/make_voice.py) into voice/*.mp3, listed in
 * voice/manifest.json. If a line has no recording, we fall back to the
 * device's built-in speech voice.
 *
 * iPad note: Safari only allows audio after the first tap, so the app calls
 * Sound.unlock() from the "Start your engines!" splash screen.
 */
window.Sound = (() => {
  let ctx = null;
  let master = null;
  let voiceOut = null;
  let voice = null;
  const hasSpeech = 'speechSynthesis' in window;

  // ---- recorded voice clips -------------------------------------------------
  let manifest = null;
  fetch('voice/manifest.json')
    .then(r => (r.ok ? r.json() : null))
    .then(m => { manifest = m && m.clips; })
    .catch(() => {});

  const clipCache = new Map();
  function loadClip(text) {
    const file = manifest && manifest[text];
    if (!file || !ctx) return Promise.reject(new Error('no clip'));
    if (!clipCache.has(file)) {
      const p = fetch(`voice/${file}`)
        .then(r => { if (!r.ok) throw new Error('fetch'); return r.arrayBuffer(); })
        // Callback form of decodeAudioData works on older iPads too.
        .then(ab => new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej)));
      p.catch(() => clipCache.delete(file));
      clipCache.set(file, p);
    }
    return clipCache.get(file);
  }

  function unlock() {
    const AC = window.AudioContext || window.webkitAudioContext;
    // iOS 17+: play even when the iPad's silent switch is on (it's a kids' app).
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* older iOS */ }
    if (!ctx && AC) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.7;
      master.connect(ctx.destination);
      voiceOut = ctx.createGain();
      voiceOut.gain.value = 1;
      voiceOut.connect(ctx.destination);
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    if (hasSpeech) {
      // A silent utterance inside the tap "unlocks" speech on iOS.
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      speechSynthesis.speak(u);
      pickVoice();
    }
  }

  // Prefer a friendly, clear English voice when one is available.
  function pickVoice() {
    if (!hasSpeech) return;
    const voices = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
    if (!voices.length) return;
    // Fallback voice: prefer the higher-quality downloadable voices if present.
    const quality = v => (/premium/i.test(v.name) ? 2 : /enhanced|neural|natural/i.test(v.name) ? 1 : 0);
    const best = voices.filter(v => v.lang === 'en-US' && quality(v) > 0).sort((a, b) => quality(b) - quality(a))[0];
    const preferred = ['Ava', 'Zoe', 'Samantha', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny'];
    voice = best ||
      preferred.map(n => voices.find(v => v.name.includes(n))).find(Boolean) ||
      voices.find(v => v.lang === 'en-US' && v.localService) ||
      voices.find(v => v.lang === 'en-US') ||
      voices[0];
  }
  if (hasSpeech) {
    pickVoice();
    speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
  }

  // ---- built-in speech (fallback) -------------------------------------------
  let speakTimer = null;
  function speakBuiltIn(text) {
    if (!hasSpeech || !text) return;
    const wasBusy = speechSynthesis.speaking || speechSynthesis.pending;
    speechSynthesis.cancel();
    const go = () => {
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.lang = (voice && voice.lang) || 'en-US';
      u.rate = 0.95;
      u.pitch = 1; // raising the pitch is what made it sound robotic
      speechSynthesis.speak(u);
    };
    // Safari sometimes drops an utterance queued right after cancel().
    if (wasBusy) speakTimer = setTimeout(go, 60);
    else go();
  }

  // ---- say(): recorded clips first, built-in voice as fallback ---------------
  let sayToken = 0;
  let playing = [];

  function stopClips() {
    playing.forEach(src => { try { src.stop(); } catch { /* already stopped */ } });
    playing = [];
  }

  /**
   * Speak a line. `line` is a string or an array of strings that are played
   * back to back with a short natural pause between them.
   */
  function say(line) {
    const parts = [].concat(line).filter(Boolean);
    if (!parts.length) return;
    hush();
    const token = sayToken;
    const recorded = ctx && manifest && parts.every(p => manifest[p]);
    if (!recorded) { speakBuiltIn(parts.join(' ')); return; }

    if (ctx.state === 'suspended') ctx.resume();
    Promise.all(parts.map(loadClip)).then(buffers => {
      if (token !== sayToken) return; // something newer was said meanwhile
      let t = ctx.currentTime + 0.03;
      buffers.forEach(buf => {
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(voiceOut);
        src.start(t);
        playing.push(src);
        t += buf.duration + 0.15;
      });
      duck(t - ctx.currentTime); // vehicle sounds go quiet while the voice talks
    }).catch(() => { if (token === sayToken) speakBuiltIn(parts.join(' ')); });
  }

  function hush() {
    sayToken++;
    clearTimeout(speakTimer);
    stopClips();
    if (hasSpeech) speechSynthesis.cancel();
  }

  // ---- tiny synth ---------------------------------------------------------
  function tone({ freq, freqEnd, type = 'sine', dur = 0.2, vol = 0.3, when = 0, filter }) {
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    let out = g;
    if (filter) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filter;
      g.connect(f);
      out = f;
    }
    out.connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function noise({ dur = 0.25, vol = 0.3, when = 0, filter = 1200, filterEnd }) {
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(filter, t);
    if (filterEnd) f.frequency.exponentialRampToValueAtTime(filterEnd, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(master);
    src.start(t);
  }

  const effects = {
    pop: () => tone({ freq: 500, freqEnd: 900, dur: 0.12, vol: 0.25 }),
    boop: () => tone({ freq: 300, freqEnd: 220, dur: 0.18, vol: 0.2, type: 'triangle' }),
    boing: () => tone({ freq: 180, freqEnd: 620, dur: 0.22, vol: 0.25, type: 'triangle' }),
    crunch: () => { noise({ dur: 0.28, vol: 0.45, filter: 2200, filterEnd: 300 }); tone({ freq: 90, freqEnd: 45, dur: 0.25, vol: 0.4, type: 'square', filter: 400 }); },
    honk: () => {
      [0, 0.28].forEach(w => {
        tone({ freq: 360, dur: 0.2, vol: 0.12, type: 'square', when: w, filter: 1400 });
        tone({ freq: 450, dur: 0.2, vol: 0.12, type: 'square', when: w, filter: 1400 });
      });
    },
    bighonk: () => {
      tone({ freq: 160, dur: 0.7, vol: 0.18, type: 'sawtooth', filter: 900 });
      tone({ freq: 200, dur: 0.7, vol: 0.18, type: 'sawtooth', filter: 900 });
    },
    vroom: () => {
      tone({ freq: 50, freqEnd: 150, dur: 0.55, vol: 0.35, type: 'sawtooth', filter: 700 });
      tone({ freq: 150, freqEnd: 70, dur: 0.6, vol: 0.3, type: 'sawtooth', filter: 600, when: 0.5 });
    },
    zoom: () => tone({ freq: 120, freqEnd: 900, dur: 0.7, vol: 0.25, type: 'sawtooth', filter: 1800 }),
    siren: () => [0, 0.32, 0.64, 0.96].forEach((w, i) =>
      tone({ freq: i % 2 ? 960 : 720, dur: 0.3, vol: 0.18, type: 'triangle', when: w })),
    putt: () => [0, 0.16, 0.32, 0.48, 0.64].forEach(w =>
      tone({ freq: 70, freqEnd: 50, dur: 0.12, vol: 0.4, type: 'square', filter: 500, when: w })),
    bell: () => [0, 0.22].forEach(w => {
      tone({ freq: 2100, dur: 0.25, vol: 0.15, when: w });
      tone({ freq: 3150, dur: 0.2, vol: 0.08, when: w });
    }),
    choo: () => {
      tone({ freq: 620, dur: 0.7, vol: 0.15, type: 'triangle' });
      tone({ freq: 780, dur: 0.7, vol: 0.12, type: 'triangle' });
      [0.8, 1.05].forEach(w => noise({ dur: 0.18, vol: 0.3, filter: 3000, when: w }));
    },
    whoosh: () => noise({ dur: 0.8, vol: 0.35, filter: 400, filterEnd: 4000 }),
    chop: () => [0, 0.12, 0.24, 0.36, 0.48, 0.6].forEach(w =>
      noise({ dur: 0.08, vol: 0.4, filter: 600, when: w })),
    cheer: () => [523, 659, 784, 1047].forEach((f, i) =>
      tone({ freq: f, dur: 0.25, vol: 0.2, type: 'triangle', when: i * 0.1 })),
    fanfare: () => [523, 659, 784, 659, 784, 1047].forEach((f, i) =>
      tone({ freq: f, dur: i === 5 ? 0.5 : 0.16, vol: 0.2, type: 'square', filter: 2500, when: i * 0.13 })),
  };

  effects.backup = () => [0, 0.5, 1.0].forEach(w => tone({ freq: 1050, dur: 0.3, vol: 0.18, type: 'square', filter: 3000, when: w }));
  effects.screech = () => { tone({ freq: 2400, freqEnd: 1800, dur: 0.7, vol: 0.06, type: 'sawtooth', filter: 4000 }); noise({ dur: 0.7, vol: 0.12, filter: 5000, filterEnd: 2500 }); };
  effects.hiss = () => noise({ dur: 0.6, vol: 0.2, filter: 6000, filterEnd: 2000 });

  function sfx(name) {
    if (ctx && ctx.state === 'suspended') ctx.resume();
    (effects[name] || effects.pop)();
  }

  // ---- real vehicle recordings ------------------------------------------------
  // sounds/manifest.json maps a sound id to a recording (see tools/sounds.json).
  // Ids without a recording use a synthesized stand-in from FALLBACK.
  let soundFiles = null;
  fetch('sounds/manifest.json')
    .then(r => (r.ok ? r.json() : null))
    .then(m => { soundFiles = m; })
    .catch(() => {});

  const FALLBACK = {
    'horn-car': 'honk', 'horn-truck': 'honk', airhorn: 'bighonk',
    'siren-police': 'siren', 'siren-fire': 'siren', 'siren-ambulance': 'siren',
    'engine-start': 'vroom', 'engine-rev': 'vroom', 'engine-rev-big': 'vroom', 'engine-fast': 'zoom', 'engine-idle': 'putt',
    motorcycle: 'zoom', tractor: 'putt', train: 'choo', airplane: 'whoosh', helicopter: 'chop', rocket: 'whoosh',
    boat: 'whoosh', 'bike-bell': 'bell', 'backup-beep': 'backup', 'tire-screech': 'screech', 'air-brakes': 'hiss',
    door: 'boop', crunch: 'crunch',
  };

  const soundCache = new Map();
  function loadSound(id) {
    const file = soundFiles && soundFiles[id];
    if (!file || !ctx) return Promise.reject(new Error('no recording'));
    if (!soundCache.has(file)) {
      const p = fetch(`sounds/${file}`)
        .then(r => { if (!r.ok) throw new Error('fetch'); return r.arrayBuffer(); })
        .then(ab => new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej)));
      p.catch(() => soundCache.delete(file));
      soundCache.set(file, p);
    }
    return soundCache.get(file);
  }

  let vehicleSrc = null;
  let vehicleBus = null;
  function duck(seconds) {
    if (!vehicleBus) return;
    const g = vehicleBus.gain, t = ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(0.3, t, 0.08);
    g.setTargetAtTime(1, t + seconds, 0.25);
  }
  function stopVehicle() {
    if (vehicleSrc) { try { vehicleSrc.stop(); } catch { /* done */ } vehicleSrc = null; }
  }

  /**
   * Play a real vehicle sound. `rate` speeds it up / slows it down (which also
   * raises / lowers the pitch: 0.8 makes an engine sound bigger).
   * Resolves with the sound's length in seconds.
   */
  function vehicle(id, { rate = 1, volume = 0.9 } = {}) {
    if (!id) return Promise.resolve(0);
    stopVehicle();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return loadSound(id).then(buf => {
      const src = ctx.createBufferSource();
      const g = ctx.createGain();
      g.gain.value = volume;
      src.buffer = buf;
      src.playbackRate.value = rate;
      if (!vehicleBus) { vehicleBus = ctx.createGain(); vehicleBus.connect(ctx.destination); }
      src.connect(g).connect(vehicleBus);
      src.start();
      vehicleSrc = src;
      return buf.duration / rate;
    }).catch(() => {
      sfx(FALLBACK[id] || 'pop');
      return 1;
    });
  }

  // Two ids "sound the same" if neither has a recording and they share a stand-in.
  function soundKey(id) {
    return soundFiles && soundFiles[id] ? `rec:${id}` : `fx:${FALLBACK[id] || 'pop'}`;
  }

  // Warm up recordings so the first tap plays instantly.
  function preload(ids) { ids.forEach(id => loadSound(id).catch(() => {})); }

  return { unlock, say, hush, sfx, vehicle, stopVehicle, preload, soundKey };
})();
