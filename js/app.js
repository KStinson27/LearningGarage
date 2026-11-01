/*
 * Learning Garage -- a toddler learning app.
 *
 * Design rules for a 2-year-old:
 *  - Everything is spoken aloud (they can't read yet).
 *  - Giant tap targets, forgiving taps, no scrolling during games.
 *  - No "wrong" buzzers or fail states: a miss just gently names what was tapped.
 *  - Frequent rewards (cheers, confetti, collectable vehicle stickers).
 */
(function () {
  'use strict';

  const { VEHICLES, COLORS, SHAPES, LETTERS, NUMBER_THINGS } = window.DATA;
  const app = document.getElementById('app');
  const say = (text, opts) => Sound.say(text, opts);

  // ---- small helpers --------------------------------------------------------
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style') el.style.cssText = v;
      else el.setAttribute(k, v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }

  // Forgiving tap: fires on finger-up even if the finger wiggled a bit
  // (toddler taps are rarely clean enough for a normal "click").
  function tap(el, fn) {
    let id = null, sx = 0, sy = 0;
    el.addEventListener('pointerdown', e => { id = e.pointerId; sx = e.clientX; sy = e.clientY; });
    el.addEventListener('pointerup', e => {
      if (e.pointerId !== id) return;
      id = null;
      if (Math.hypot(e.clientX - sx, e.clientY - sy) < 40) fn(e);
    });
    el.addEventListener('pointercancel', () => { id = null; });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); }
    });
    return el;
  }

  const rand = n => Math.floor(Math.random() * n);
  const randInt = (lo, hi) => lo + rand(hi - lo + 1);
  const pick = arr => arr[rand(arr.length)];
  const shuffle = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const article = word => (/^[aeiou]/i.test(word) ? 'an' : 'a');
  const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  // Timers are tied to the current screen and cleared when you leave it.
  let timers = [];
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  // ---- saved stickers -------------------------------------------------------
  const STICKER_KEY = 'learning-garage.stickers';
  const Store = {
    load() { try { return JSON.parse(localStorage.getItem(STICKER_KEY) || '{}'); } catch { return {}; } },
    save(d) { try { localStorage.setItem(STICKER_KEY, JSON.stringify(d)); } catch { /* private mode */ } },
  };

  // ---- shared pieces -------------------------------------------------------
  function vehicleArt(v) {
    if (v.svg === 'monster') return h('span', { class: 'art art-svg', html: Art.monster(v.color || '#e53935') });
    return h('span', { class: 'art art-emoji' }, v.emoji);
  }

  // A green highway sign with a white inner border.
  function highwaySign(text, cls = '') {
    return h('div', { class: `hwy ${cls}` }, h('h1', { class: 'hwy-inner' }, text));
  }

  function header(title, ...right) {
    const home = h('button', { class: 'btn-home press', 'aria-label': 'Home', html: Art.homeSign() });
    tap(home, () => { Sound.sfx('pop'); go('home'); });
    return h('header', { class: 'bar' },
      home,
      h('div', { class: 'bar-title' }, highwaySign(title, 'hwy-small')),
      h('div', { class: 'bar-right' }, ...right));
  }

  function stickerCount() {
    const data = Store.load();
    return VEHICLES.filter(v => data[v.id]).length;
  }

  function confetti(n = 26) {
    const layer = h('div', { class: 'confetti', 'aria-hidden': 'true' });
    const bits = ['⭐', '🎉', '✨', '🏁', '🌟'];
    for (let i = 0; i < n; i++) {
      layer.append(h('span', {
        style: `left:${rand(100)}%;animation-delay:${(Math.random() * 0.4).toFixed(2)}s;` +
          `--dx:${randInt(-80, 80)}px;--r:${randInt(-360, 360)}deg;font-size:${randInt(26, 54)}px`,
      }, pick(bits)));
    }
    app.append(layer);
    setTimeout(() => layer.remove(), 2600);
  }

  // Give a vehicle sticker (new ones first), show it big, then call `after`.
  function awardSticker(after) {
    const data = Store.load();
    const unowned = VEHICLES.filter(v => !data[v.id]);
    const v = pick(unowned.length ? unowned : VEHICLES);
    data[v.id] = (data[v.id] || 0) + 1;
    Store.save(data);

    const overlay = h('div', { class: 'overlay' },
      h('div', { class: 'sticker-pop' },
        h('div', { class: 'sticker-title' }, '⭐ New sticker! ⭐'),
        h('div', { class: 'sticker-art' }, vehicleArt(v)),
        h('div', { class: 'sticker-name' }, v.name),
        h('div', { class: 'sticker-tap' }, 'Tap to keep going ▶')));
    app.append(overlay);
    Sound.sfx('fanfare');
    confetti(40);
    say(`You got a sticker! ${article(v.name)} ${v.name}!`);
    let done = false;
    later(() => tap(overlay, () => {
      if (done) return;
      done = true;
      overlay.remove();
      Sound.sfx('pop');
      if (after) after();
    }), 700);
  }

  // ---- navigation ----------------------------------------------------------
  function go(name) {
    clearTimers();
    Sound.hush();
    app.replaceChildren(screens[name]());
    app.scrollTop = 0;
  }

  // ---- splash (needed so iPad lets us play sound) ---------------------------
  function splash() {
    let started = false;
    const el = h('div', { class: 'screen splash' },
      h('div', { class: 'splash-sign' },
        highwaySign('Learning Garage', 'hwy-big'),
        h('div', { class: 'posts' }, h('span'), h('span'))),
      h('div', { class: 'splash-truck', html: Art.monster('#ff7043') }),
      h('button', { class: 'btn-big go-btn press' }, '▶ Start your engines!'));
    tap(el, () => {
      if (started) return;
      started = true;
      Sound.unlock();
      Sound.sfx('vroom');
      el.classList.add('leaving');
      later(() => { go('home'); say("Let's go! What do you want to play?"); }, 900);
    });
    return el;
  }

  // ---- home ----------------------------------------------------------------
  // Each section is a road sign on a post.
  const TOPICS = [
    { id: 'garage', label: 'Trucks', intro: 'Trucks and cars!' },
    { id: 'numbers', label: 'Numbers', intro: 'Numbers!' },
    { id: 'shapes', label: 'Shapes', intro: 'Shapes!' },
    { id: 'colors', label: 'Colors', intro: 'Colors!' },
    { id: 'abc', label: 'ABC', intro: 'A, B, C!' },
    { id: 'stickers', label: 'Stickers', intro: 'Your stickers!' },
  ];

  function home() {
    const signs = h('main', { class: 'home' });
    TOPICS.forEach(t => {
      const b = h('button', { class: 'road-sign press', 'aria-label': t.label },
        h('span', { class: 'rs-sign', html: Art.sign(t.id) }),
        h('span', { class: 'rs-post' }),
        h('span', { class: 'rs-label' }, t.label));
      tap(b, () => { Sound.sfx('pop'); go(t.id); say(t.intro); });
      signs.append(b);
    });

    const counter = h('button', { class: 'sticker-pill press', 'aria-label': 'Stickers' },
      h('span', { html: Art.star(36) }), `${stickerCount()} / ${VEHICLES.length}`);
    tap(counter, () => { Sound.sfx('pop'); go('stickers'); });

    // Vehicles driving along the road. Tap them for a sound!
    const traffic = h('div', { class: 'traffic' });
    [
      { art: Art.car('#1e88e5'), cls: 'drive-car', sfx: 'honk', say: 'Beep beep!' },
      { art: Art.monster('#ff7043'), cls: 'drive-monster', sfx: 'vroom', say: 'Vroom vroom! Monster truck!' },
    ].forEach(v => {
      const el = h('button', { class: `traffic-vehicle ${v.cls}`, 'aria-label': 'vehicle', html: v.art });
      tap(el, () => { Sound.sfx(v.sfx); say(v.say); restart(el, 'hop'); });
      traffic.append(el);
    });

    return h('div', { class: 'screen home-screen' },
      h('header', { class: 'home-header' },
        h('div', { class: 'home-title' }, highwaySign('Learning Garage'), h('div', { class: 'posts' }, h('span'), h('span'))),
        counter),
      signs,
      traffic);
  }

  // ---- generic "Learn" view: big stage on top, tappable picture grid below --
  function learnView({ items, tile, stage, speak, sfx, hint = '👇 Tap a picture!' }) {
    const stageEl = h('div', { class: 'stage' }, h('div', { class: 'stage-hint' }, hint));
    const grid = h('div', { class: 'grid' });
    let current = null;
    const buttons = [];

    function select(item) {
      current = item;
      stageEl.replaceChildren(stage(item));
      buttons.forEach(b => b.classList.toggle('sel', b._item === item));
      Sound.sfx(sfx ? sfx(item) : 'pop');
      later(() => say(speak(item)), 150);
    }

    items.forEach(item => {
      const b = h('button', { class: 'tile press' }, tile(item));
      b._item = item;
      buttons.push(b);
      tap(b, () => select(item));
      grid.append(b);
    });
    tap(stageEl, () => { if (current) select(current); });

    return h('div', { class: 'learn' }, stageEl, grid);
  }

  // A screen with "Learn" and "Play" tabs.
  function topicScreen({ title, learn, play, start = 'learn' }) {
    const body = h('main', { class: 'topic' });
    const learnBtn = h('button', { class: 'tab press' }, '👀 Learn');
    const playBtn = h('button', { class: 'tab press' }, '🎮 Play');
    function show(mode) {
      clearTimers();
      Sound.hush();
      learnBtn.classList.toggle('on', mode === 'learn');
      playBtn.classList.toggle('on', mode === 'play');
      body.replaceChildren(mode === 'learn' ? learn() : play());
    }
    tap(learnBtn, () => { Sound.sfx('pop'); show('learn'); });
    tap(playBtn, () => { Sound.sfx('pop'); show('play'); });
    const el = h('div', { class: 'screen' }, header(title, learnBtn, playBtn), body);
    show(start);
    return el;
  }

  // ---- generic "Find the ___" game ----------------------------------------
  function findGame({ items, art, label, prompt }) {
    const promptEl = h('button', { class: 'prompt press' });
    const choicesEl = h('div', { class: 'choices' });
    let wins = 0, target = null, last = null, locked = false;

    tap(promptEl, () => target && say(prompt(target)));

    function round() {
      locked = false;
      // Start with 2 choices, add more as they get the hang of it.
      const k = Math.min(2 + Math.floor(wins / 3), 4, items.length);
      target = pick(items.filter(i => i !== last));
      last = target;
      const others = shuffle(items.filter(i => i !== target)).slice(0, k - 1);
      choicesEl.dataset.n = k;
      choicesEl.replaceChildren(...shuffle([target, ...others]).map(item => {
        const b = h('button', { class: 'choice press' }, art(item));
        tap(b, () => choose(item, b));
        return b;
      }));
      promptEl.replaceChildren(h('span', { class: 'speaker' }, '🔊'), h('span', {}, prompt(target)));
      say(prompt(target));
    }

    function choose(item, b) {
      if (locked) return;
      if (item === target) {
        locked = true;
        wins++;
        b.classList.add('right');
        Sound.sfx('cheer');
        confetti();
        const praise = pick(['Yes!', 'You found it!', 'Great job!', 'Hooray!', 'You did it!']);
        say(`${praise} ${label(item)}!`);
        if (wins % 3 === 0) later(() => awardSticker(round), 1700);
        else later(round, 2300);
      } else {
        restart(b, 'wiggle');
        Sound.sfx('boop');
        say(`That's ${label(item)}. ${prompt(target)}`);
      }
    }

    round();
    return h('div', { class: 'play' }, promptEl, choicesEl);
  }

  // ---- Trucks (garage) ------------------------------------------------------
  function garage() {
    return h('div', { class: 'screen' }, header('Trucks & Cars'), h('main', { class: 'topic' }, learnView({
      items: VEHICLES,
      tile: v => vehicleArt(v),
      stage: v => h('div', { class: 'stage-inner on-road' },
        h('div', { class: 'road' }),
        h('div', { class: 'stage-word' }, v.name),
        h('div', { class: 'stage-art drive' }, vehicleArt(v))),
      speak: v => `${v.name}! ${v.says}`,
      sfx: v => v.sfx,
      hint: '👇 Tap a truck!',
    })));
  }

  // ---- Numbers --------------------------------------------------------------
  const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

  function numbers() {
    return topicScreen({
      title: 'Numbers',
      start: 'play',
      learn: () => learnView({
        items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        tile: n => h('span', { class: 'tile-num' }, n),
        stage: n => {
          const thing = NUMBER_THINGS[n - 1];
          return h('div', { class: 'stage-inner' },
            h('div', { class: 'stage-num pop-in' }, n),
            h('div', { class: 'num-row' }, Array.from({ length: n }, (_, i) =>
              h('span', { class: 'num-item', style: `animation-delay:${0.25 + i * 0.35}s` }, thing.emoji))));
        },
        speak: n => {
          const thing = NUMBER_THINGS[n - 1];
          const counting = NUMBER_WORDS.slice(1, n + 1).join(', ');
          return `${NUMBER_WORDS[n]}! ... ${counting}. ${NUMBER_WORDS[n]} ${n === 1 ? thing.one : thing.many}!`;
        },
        hint: '👇 Tap a number!',
      }),
      play: countGame,
    });
  }

  // Monster truck counting game: tap each car and the truck jumps on it.
  function countGame() {
    let max = 3, rounds = 0, lastN = 0, first = true;
    const numEl = h('div', { class: 'count-num' });
    const dotsEl = h('div', { class: 'count-dots' });
    const road = h('div', { class: 'count-road' });
    const nextBtn = h('button', { class: 'btn-big next-btn press hidden' }, 'More! ▶');
    tap(nextBtn, () => { Sound.sfx('pop'); round(); });

    function round() {
      nextBtn.classList.add('hidden');
      numEl.classList.remove('win');
      let n;
      do { n = randInt(1, max); } while (n === lastN && max > 1);
      lastN = n;
      let counted = 0;

      numEl.textContent = '?';
      dotsEl.replaceChildren(...Array.from({ length: n }, () => h('span', { class: 'dot' })));

      const jumper = h('div', { class: 'jumper', html: Art.monster('#e53935') });
      const truck = h('div', { class: 'count-truck' }, jumper);
      const lane = h('div', { class: 'count-cars' });
      const colors = shuffle(COLORS.filter(c => c.id !== 'red'));
      for (let i = 0; i < n; i++) {
        const car = h('button', {
          class: 'count-car', 'aria-label': 'car',
          style: `animation-delay:${i * 90}ms`,
          html: Art.car(colors[i % colors.length].hex),
        });
        tap(car, () => hit(car));
        lane.append(car);
      }
      road.replaceChildren(lane, truck);

      say(first
        ? "Let's count the cars! Tap each car, and the monster truck will crush it!"
        : pick(["Let's count the cars!", 'How many cars? Tap and count!', 'More cars! Let\'s count!']));
      first = false;

      function hit(car) {
        if (car.classList.contains('hit')) return;
        car.classList.add('hit');
        counted++;

        // Jump the truck onto this car.
        const rr = road.getBoundingClientRect();
        const cr = car.getBoundingClientRect();
        const x = cr.left - rr.left + cr.width / 2 - truck.offsetLeft - truck.offsetWidth / 2;
        truck.style.transform = `translateX(${x}px)`;
        restart(jumper, 'jump');
        Sound.sfx('boing');
        later(() => { car.classList.add('squash'); Sound.sfx('crunch'); }, 280);

        numEl.textContent = counted;
        restart(numEl, 'bump');
        dotsEl.children[counted - 1].classList.add('on');
        say(NUMBER_WORDS[counted], { rate: 0.85, pitch: 1.2 });

        if (counted === n) {
          rounds++;
          later(() => {
            numEl.classList.add('win');
            Sound.sfx('cheer');
            confetti();
            say(`${NUMBER_WORDS[n]} ${n === 1 ? 'car' : 'cars'}! Great counting!`);
          }, 850);
          if (rounds % 2 === 0) max = Math.min(10, max + 1); // slowly count higher
          const showNext = () => nextBtn.classList.remove('hidden');
          if (rounds % 2 === 0) later(() => awardSticker(showNext), 2900);
          else later(showNext, 2200);
        }
      }
    }

    round();
    return h('div', { class: 'count' },
      h('div', { class: 'count-top' }, numEl, dotsEl),
      road,
      nextBtn);
  }

  // ---- Shapes ---------------------------------------------------------------
  function shapes() {
    const shapeArt = s => h('span', { class: 'art art-svg shape', html: Art.shape(s.id, s.color) });
    return topicScreen({
      title: 'Shapes',
      learn: () => learnView({
        items: SHAPES,
        tile: shapeArt,
        stage: s => h('div', { class: 'stage-inner' },
          h('div', { class: 'stage-art pop-in' }, shapeArt(s)),
          h('div', { class: 'stage-word' }, s.name)),
        speak: s => `${s.name}! ${s.tip}`,
        hint: '👇 Tap a shape!',
      }),
      play: () => findGame({
        items: SHAPES,
        art: shapeArt,
        label: s => `the ${s.name}`,
        prompt: s => `Find the ${s.name}!`,
      }),
    });
  }

  // ---- Colors ---------------------------------------------------------------
  function colors() {
    return topicScreen({
      title: 'Colors',
      learn: () => learnView({
        items: COLORS,
        tile: c => h('span', { class: 'art art-svg', html: Art.monster(c.hex) }),
        stage: c => h('div', { class: 'stage-inner on-road' },
          h('div', { class: 'road' }),
          h('div', { class: 'stage-word', style: `background:${c.hex};color:${c.ink}` }, c.name),
          h('div', { class: 'stage-art drive' }, h('span', { class: 'art art-svg', html: Art.monster(c.hex) }))),
        speak: c => `${c.name}! ${article(c.name)} ${c.name} monster truck!`,
        sfx: () => 'vroom',
        hint: '👇 Tap a color!',
      }),
      play: () => findGame({
        items: COLORS.slice(0, 8), // skip the trickier black/white/brown at first
        art: c => h('span', { class: 'art art-svg', html: Art.car(c.hex) }),
        label: c => `the ${c.name} car`,
        prompt: c => `Find the ${c.name} car!`,
      }),
    });
  }

  // ---- ABC ------------------------------------------------------------------
  function abc() {
    const letterArt = L => (L.svg === 'monster'
      ? h('span', { class: 'art art-svg', html: Art.monster('#e53935') })
      : h('span', { class: 'art art-emoji' }, L.emoji));

    function word(L) {
      const lower = L.word.toLowerCase();
      const i = Math.max(0, lower.indexOf(L.l.toLowerCase()));
      return h('div', { class: 'stage-word' },
        L.word.slice(0, i), h('b', { class: 'hl' }, L.word[i]), L.word.slice(i + 1));
    }

    return topicScreen({
      title: 'ABC',
      learn: () => learnView({
        items: LETTERS,
        tile: L => h('span', { class: 'tile-letter' }, L.l),
        stage: L => h('div', { class: 'stage-inner' },
          h('div', { class: 'abc-row' },
            h('div', { class: 'stage-letter pop-in' }, L.l, h('small', {}, L.l.toLowerCase())),
            h('div', { class: 'stage-art pop-in delay' }, letterArt(L))),
          word(L)),
        speak: L => L.speak || `${L.l}! ${L.l} is for ${L.word}!`,
        hint: '👇 Tap a letter!',
      }),
      play: () => findGame({
        items: LETTERS.slice(0, 8),
        art: L => h('span', { class: 'tile-letter big' }, L.l),
        label: L => `${L.l}`,
        prompt: L => `Find the letter ${L.l}!`,
      }),
    });
  }

  // ---- Stickers -------------------------------------------------------------
  function stickers() {
    const data = Store.load();
    const got = VEHICLES.filter(v => data[v.id]).length;
    const grid = h('div', { class: 'grid stickers' });
    VEHICLES.forEach(v => {
      const owned = !!data[v.id];
      const b = h('button', { class: `tile press sticker ${owned ? 'got' : 'locked'}` },
        vehicleArt(v),
        data[v.id] > 1 ? h('span', { class: 'badge' }, `×${data[v.id]}`) : null);
      tap(b, () => {
        if (owned) { restart(b, 'wiggle'); Sound.sfx(v.sfx); say(`${v.name}! ${v.says}`); }
        else { Sound.sfx('boop'); say('Keep playing to win this sticker!'); }
      });
      grid.append(b);
    });

    // Grown-ups: press and hold for 3 seconds to clear stickers.
    const reset = h('button', { class: 'reset' }, 'Grown-ups: hold 3 seconds to reset');
    let holdTimer = null;
    reset.addEventListener('pointerdown', () => {
      holdTimer = setTimeout(() => { Store.save({}); go('stickers'); }, 3000);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
      reset.addEventListener(ev, () => clearTimeout(holdTimer)));

    later(() => say(got
      ? `You have ${got} ${got === 1 ? 'sticker' : 'stickers'}! Great job!`
      : 'Play games to win stickers!'), 600);

    return h('div', { class: 'screen' },
      header(`Stickers ${got}/${VEHICLES.length}`),
      h('main', { class: 'topic sticker-page' }, grid, reset));
  }

  const screens = { splash, home, garage, numbers, shapes, colors, abc, stickers };

  // ---- iPad niceties ---------------------------------------------------------
  // No pinch-zoom, no long-press menus, no accidental text selection.
  ['gesturestart', 'gesturechange'].forEach(ev => document.addEventListener(ev, e => e.preventDefault()));
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('visibilitychange', () => { if (document.hidden) Sound.hush(); });

  // Offline support (only works when served over http/https, not file://).
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  // The sky, hills and road sit behind every screen.
  document.body.prepend(h('div', { class: 'scenery', html: Art.scenery() }));

  go('splash');
})();
