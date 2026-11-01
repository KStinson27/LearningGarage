/*
 * Sound: synthesized sound effects (Web Audio) + spoken words (Speech Synthesis).
 * No audio files needed, so the app stays tiny and works offline.
 *
 * iPad note: Safari only allows audio after the first tap, so the app calls
 * Sound.unlock() from the "Start your engines!" splash screen.
 */
window.Sound = (() => {
  let ctx = null;
  let master = null;
  let voice = null;
  const hasSpeech = 'speechSynthesis' in window;

  function unlock() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!ctx && AC) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.8;
      master.connect(ctx.destination);
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
    const preferred = ['Samantha', 'Karen', 'Moira', 'Tessa', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny'];
    voice =
      preferred.map(n => voices.find(v => v.name.includes(n))).find(Boolean) ||
      voices.find(v => v.lang === 'en-US' && v.localService) ||
      voices.find(v => v.lang === 'en-US') ||
      voices[0];
  }
  if (hasSpeech) {
    pickVoice();
    speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
  }

  let speakTimer = null;
  function say(text, { rate = 0.9, pitch = 1.15 } = {}) {
    if (!hasSpeech || !text) return;
    clearTimeout(speakTimer);
    const wasBusy = speechSynthesis.speaking || speechSynthesis.pending;
    speechSynthesis.cancel();
    const go = () => {
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.lang = (voice && voice.lang) || 'en-US';
      u.rate = rate;
      u.pitch = pitch;
      speechSynthesis.speak(u);
    };
    // Safari sometimes drops an utterance queued right after cancel().
    if (wasBusy) speakTimer = setTimeout(go, 60);
    else go();
  }

  function hush() {
    clearTimeout(speakTimer);
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

  function sfx(name) {
    if (ctx && ctx.state === 'suspended') ctx.resume();
    (effects[name] || effects.pop)();
  }

  return { unlock, say, hush, sfx };
})();
