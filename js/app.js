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
  const say = line => Sound.say(line);

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
    say(Lines.stickerWin(v));
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
      // Pull away: the truck speeds up (nose lifts) and drives off screen.
      const truck = el.querySelector('.splash-truck');
      truck.style.animation = 'none';
      Motion.vehicle(truck).driveTo(-(window.innerWidth + truck.offsetWidth), { duration: 1100, ease: 'in' });
      later(() => { go('home'); say(Lines.welcome); }, 1000);
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
      tap(b, () => { Sound.sfx('pop'); go(t.id); say(Lines.topic[t.id]); });
      signs.append(b);
    });

    const counter = h('button', { class: 'sticker-pill press', 'aria-label': 'Stickers' },
      h('span', { html: Art.star(36) }), `${stickerCount()} / ${VEHICLES.length}`);
    tap(counter, () => { Sound.sfx('pop'); go('stickers'); });

    // Vehicles driving along the road (wheels turning, suspension bouncing).
    // Tap them for a sound!
    const traffic = h('div', { class: 'traffic' });
    const drivers = [
      { art: Art.car('#1e88e5'), cls: 'drive-car', sfx: 'honk', line: Lines.trafficCar, speed: 150, start: 0.15 },
      { art: Art.monster('#ff7043'), cls: 'drive-monster', sfx: 'vroom', line: Lines.trafficMonster, speed: 105, start: 0.65 },
    ].map(d => {
      const el = h('button', { class: `traffic-vehicle ${d.cls}`, 'aria-label': 'vehicle', html: d.art });
      tap(el, () => { Sound.sfx(d.sfx); say(d.line); Motion.vehicle(el).hop(el.offsetHeight * 0.35); });
      traffic.append(el);
      return { el, d };
    });
    // Start driving once the screen is on display (so sizes are known).
    later(() => drivers.forEach(({ el, d }) => {
      const w = el.offsetWidth;
      const from = window.innerWidth + 20;
      const to = -w - 20;
      Motion.vehicle(el).cruise({ from, to, speed: d.speed, startAt: to + (from - to) * (1 - d.start) });
    }), 0);

    return h('div', { class: 'screen home-screen' },
      h('header', { class: 'home-header' },
        h('div', { class: 'home-title' }, highwaySign('Learning Garage'), h('div', { class: 'posts' }, h('span'), h('span'))),
        counter),
      signs,
      traffic);
  }

  // ---- generic "Learn" view: big stage on top, tappable picture grid below --
  function learnView({ items, tile, stage, speak, sfx, onShow, hint = '👇 Tap a picture!' }) {
    const stageEl = h('div', { class: 'stage' }, h('div', { class: 'stage-hint' }, hint));
    const grid = h('div', { class: 'grid' });
    let current = null;
    const buttons = [];

    function select(item) {
      current = item;
      stageEl.replaceChildren(stage(item));
      if (onShow) onShow(stageEl, item);
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

  // The stage vehicle drives in from the right and brakes to a stop.
  function driveIntoStage(stageEl) {
    const art = stageEl.querySelector('.stage-art');
    if (!art) return;
    const v = Motion.vehicle(art);
    v.place(stageEl.clientWidth);
    v.driveTo(0, { duration: 1300, ease: 'out' });
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
  // name/find/thats come from js/lines.js, e.g. "The circle!", "Find the
  // circle!", "That's the circle." (pieces are recorded separately).
  function findGame({ items, art, name, find, thats }) {
    const promptEl = h('button', { class: 'prompt press' });
    const choicesEl = h('div', { class: 'choices' });
    let wins = 0, target = null, last = null, locked = false;

    tap(promptEl, () => target && say(find(target)));

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
      promptEl.replaceChildren(h('span', { class: 'speaker' }, '🔊'), h('span', {}, find(target)));
      say(find(target));
    }

    function choose(item, b) {
      if (locked) return;
      if (item === target) {
        locked = true;
        wins++;
        b.classList.add('right');
        Sound.sfx('cheer');
        confetti();
        say([pick(Lines.praise), name(item)]);
        if (wins % 3 === 0) later(() => awardSticker(round), 1700);
        else later(round, 2300);
      } else {
        restart(b, 'wiggle');
        Sound.sfx('boop');
        say([thats(item), find(target)]);
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
        h('div', { class: 'stage-art' }, vehicleArt(v))),
      onShow: driveIntoStage,
      speak: Lines.vehicle,
      sfx: v => v.sfx,
      hint: '👇 Tap a truck!',
    })));
  }

  // ---- Numbers --------------------------------------------------------------
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
        speak: Lines.numberLearn,
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

      // The truck art faces left; flip it to face the cars on the right.
      const truck = h('div', { class: 'count-truck', html: Art.monster('#e53935') });
      const driver = Motion.vehicle(truck, { flip: true });
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

      say(first ? Lines.countFirst : pick(Lines.countAgain));
      first = false;

      function hit(car) {
        if (car.classList.contains('hit')) return;
        car.classList.add('hit');
        counted++;

        // Drive and jump the truck onto this car; crush it on landing.
        const rr = road.getBoundingClientRect();
        const cr = car.getBoundingClientRect();
        const x = cr.left - rr.left + cr.width / 2 - truck.offsetLeft - truck.offsetWidth / 2;
        Sound.sfx('boing');
        driver.driveTo(x, { duration: 650, ease: 'inOut', arc: truck.offsetHeight * 0.55 }).then(() => {
          car.classList.add('squash');
          Sound.sfx('crunch');
        });

        numEl.textContent = counted;
        restart(numEl, 'bump');
        dotsEl.children[counted - 1].classList.add('on');
        say(Lines.count(counted));

        if (counted === n) {
          rounds++;
          later(() => {
            numEl.classList.add('win');
            Sound.sfx('cheer');
            confetti();
            say(Lines.countDone(n));
          }, 850);
          if (rounds % 2 === 0) max = Math.min(10, max + 1); // slowly count higher
          const showNext = () => nextBtn.classList.remove('hidden');
          if (rounds % 2 === 0) later(() => awardSticker(showNext), 3200);
          else later(showNext, 2500);
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
        speak: Lines.shape,
        hint: '👇 Tap a shape!',
      }),
      play: () => findGame({
        items: SHAPES,
        art: shapeArt,
        name: Lines.shapeName,
        find: Lines.shapeFind,
        thats: Lines.shapeThats,
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
          h('div', { class: 'stage-art' }, h('span', { class: 'art art-svg', html: Art.monster(c.hex) }))),
        onShow: driveIntoStage,
        speak: Lines.color,
        sfx: () => 'vroom',
        hint: '👇 Tap a color!',
      }),
      play: () => findGame({
        items: Lines.FIND_COLORS, // skips the trickier black/white/brown
        art: c => h('span', { class: 'art art-svg', html: Art.car(c.hex) }),
        name: Lines.colorName,
        find: Lines.colorFind,
        thats: Lines.colorThats,
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
        speak: Lines.letter,
        hint: '👇 Tap a letter!',
      }),
      play: () => findGame({
        items: Lines.FIND_LETTERS,
        art: L => h('span', { class: 'tile-letter big' }, L.l),
        name: Lines.letterName,
        find: Lines.letterFind,
        thats: Lines.letterThats,
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
        if (owned) { restart(b, 'wiggle'); Sound.sfx(v.sfx); say(Lines.vehicle(v)); }
        else { Sound.sfx('boop'); say(Lines.stickerLocked); }
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

    later(() => say(Lines.stickerCount(got)), 600);

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
