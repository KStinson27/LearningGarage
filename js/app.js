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

  const { VEHICLES, COLORS, SHAPES, LETTERS, NUMBER_THINGS, PARTS, JOBS, SOUND_GAME } = window.DATA;
  const byId = id => VEHICLES.find(v => v.id === id);
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
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
    if (v.svg) return h('span', { class: 'art art-svg', html: Art.workTruck(v.svg, v.color) });
    return h('span', { class: 'art art-emoji' }, v.emoji);
  }

  // Play a vehicle's real sound (resolves with its length in seconds).
  const vehicleSound = v => Sound.vehicle(v.sound, { rate: v.rate || 1 });

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
    Sound.stopVehicle();
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
      Sound.vehicle('engine-start');
      Sound.preload(['horn-car', 'engine-rev-big', 'engine-rev', 'door']);
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
    { id: 'garage', label: 'Trucks' },
    { id: 'parts', label: 'Car Parts' },
    { id: 'sounds', label: 'Sounds' },
    { id: 'jobs', label: 'Who Helps?' },
    { id: 'stopgo', label: 'Stop & Go' },
    { id: 'numbers', label: 'Numbers' },
    { id: 'shapes', label: 'Shapes' },
    { id: 'colors', label: 'Colors' },
    { id: 'abc', label: 'ABC' },
    { id: 'stickers', label: 'Stickers' },
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
      { art: Art.car('#1e88e5'), cls: 'drive-car', sound: 'horn-car', rate: 1, speed: 150, start: 0.15 },
      { art: Art.monster('#ff7043'), cls: 'drive-monster', sound: 'engine-rev-big', rate: 0.75, speed: 105, start: 0.65 },
    ].map(d => {
      const el = h('button', { class: `traffic-vehicle ${d.cls}`, 'aria-label': 'vehicle', html: d.art });
      tap(el, () => { Sound.vehicle(d.sound, { rate: d.rate }); Motion.vehicle(el).hop(el.offsetHeight * 0.35); });
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
  // `sound(item)` may play a real sound first (returns a promise of its
  // length); the spoken line starts once the sound has had its moment.
  function learnView({ items, tile, stage, speak, sound, onShow, hint = '👇 Tap a picture!' }) {
    const stageEl = h('div', { class: 'stage' }, h('div', { class: 'stage-hint' }, hint));
    const grid = h('div', { class: 'grid' });
    let current = null;
    let selectToken = 0;
    const buttons = [];

    function select(item) {
      current = item;
      stageEl.replaceChildren(stage(item));
      if (onShow) onShow(stageEl, item);
      buttons.forEach(b => b.classList.toggle('sel', b._item === item));
      const token = ++selectToken;
      Sound.hush();
      const playing = sound ? sound(item) : (Sound.sfx('pop'), Promise.resolve(0));
      playing.then(sec => {
        if (token !== selectToken) return;
        later(() => { if (token === selectToken) say(speak(item)); }, Math.min(1600, Math.max(150, sec * 600)));
      });
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
      const k = Math.min(3 + Math.floor(wins / 3), 6, items.length);
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
    const factIndex = {}; // tap the same vehicle again for the next fact
    return h('div', { class: 'screen' }, header('Trucks & Cars'), h('main', { class: 'topic' }, learnView({
      items: VEHICLES,
      tile: v => vehicleArt(v),
      stage: v => h('div', { class: 'stage-inner on-road' },
        h('div', { class: 'road' }),
        h('div', { class: 'stage-word' }, v.name),
        h('div', { class: 'stage-art' }, vehicleArt(v))),
      onShow: driveIntoStage,
      speak: v => { const i = factIndex[v.id] || 0; factIndex[v.id] = i + 1; return Lines.vehicle(v, i); },
      sound: vehicleSound,
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
    let max = 4, rounds = 0, lastN = 0, first = true;
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
        Sound.vehicle('engine-rev', { rate: 0.8 });
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
          max = Math.min(10, max + 1); // count higher each round
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
        sound: () => Sound.vehicle('engine-rev', { rate: 0.75 }),
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
    const letterArt = L => (L.svg
      ? vehicleArt(VEHICLES.find(v => v.svg === L.svg))
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

  // ---- Car Parts --------------------------------------------------------------
  // A big car where every part can be tapped. Some parts do something real:
  // the headlights shine, the horn honks, the engine starts, the wipers wipe.
  function partsCar() {
    const wrap = h('div', { class: 'parts-car', html: Art.carDiagram('#1e88e5') });
    const svg = wrap.querySelector('svg');
    const highlight = (id, cls = 'active') => {
      svg.querySelectorAll(`.${cls}`).forEach(el => el.classList.remove(cls));
      if (id) svg.querySelectorAll(`[data-part="${id}"]`).forEach(el => el.classList.add(cls));
    };
    const ACTIONS = {
      headlight: () => restart(svg, 'lights-on'),
      taillight: () => restart(svg, 'brake-on'),
      wheel: () => {
        Sound.vehicle('engine-idle');
        const v = Motion.vehicle(wrap);
        v.driveTo(-60, { duration: 800 }).then(ok => ok && v.driveTo(0, { duration: 900 }));
      },
      'steering-wheel': () => { Sound.vehicle('horn-car'); restart(svg, 'steer-turn'); },
      windshield: () => restart(svg, 'wipe'),
      door: () => Sound.vehicle('door'),
      'door-handle': () => Sound.vehicle('door'),
      trunk: () => Sound.vehicle('door'),
      hood: () => { Sound.vehicle('engine-start'); restart(svg, 'rumble'); },
      exhaust: () => { Sound.vehicle('engine-rev'); restart(svg, 'puff'); },
    };
    const partAt = e => {
      const el = e.target && e.target.closest && e.target.closest('[data-part]');
      return el ? PARTS.find(p => p.id === el.dataset.part) : null;
    };
    return { wrap, svg, highlight, act: id => ACTIONS[id] && ACTIONS[id](), partAt };
  }

  function parts() {
    return topicScreen({
      title: 'Car Parts',
      learn: () => {
        const car = partsCar();
        const label = h('div', { class: 'part-label' }, '👆 Tap any part of the car!');
        tap(car.wrap, e => {
          const p = car.partAt(e);
          if (!p) return;
          car.highlight(p.id);
          label.textContent = cap(p.name);
          restart(label, 'pop-in');
          car.act(p.id);
          say(Lines.part(p));
        });
        return h('div', { class: 'parts' }, label, car.wrap);
      },
      play: () => {
        const car = partsCar();
        const promptEl = h('button', { class: 'prompt press' });
        let target = null, last = null, wins = 0, locked = false;
        tap(promptEl, () => target && say(Lines.partFind(target)));
        function round() {
          locked = false;
          car.highlight(null);
          car.highlight(null, 'found');
          target = pick(PARTS.filter(p => p !== last));
          last = target;
          promptEl.replaceChildren(h('span', { class: 'speaker' }, '🔊'), h('span', {}, Lines.partFind(target)));
          say(Lines.partFind(target));
        }
        tap(car.wrap, e => {
          const p = car.partAt(e);
          if (!p || locked) return;
          if (p === target) {
            locked = true;
            wins++;
            car.highlight(p.id, 'found');
            car.act(p.id);
            Sound.sfx('cheer');
            confetti();
            say([pick(Lines.praise), Lines.partName(p)]);
            if (wins % 4 === 0) later(() => awardSticker(round), 2200);
            else later(round, 2600);
          } else {
            car.highlight(p.id);
            Sound.sfx('boop');
            say([Lines.partThats(p), Lines.partFind(target)]);
            later(() => car.highlight(null), 1200);
          }
        });
        round();
        return h('div', { class: 'parts' }, promptEl, car.wrap);
      },
    });
  }

  // ---- What's that sound? ------------------------------------------------------
  function sounds() {
    const items = SOUND_GAME.map(byId).filter(Boolean);
    const listenBtn = h('button', { class: 'listen-btn press', 'aria-label': 'Play the sound again' },
      h('span', { class: 'listen-icon', html: Art.sign('sounds') }), h('span', {}, 'Listen'));
    const choicesEl = h('div', { class: 'choices named' });
    let target = null, last = null, wins = 0, locked = false;

    const play = () => { if (target) { restart(listenBtn, 'playing'); vehicleSound(target); } };
    tap(listenBtn, play);

    function round() {
      locked = false;
      const k = Math.min(3 + Math.floor(wins / 3), 5);
      target = pick(items.filter(i => i !== last));
      last = target;
      // Never offer two vehicles that would sound the same.
      const keys = new Set([Sound.soundKey(target.sound)]);
      const others = [];
      for (const v of shuffle(items.filter(i => i !== target))) {
        const key = Sound.soundKey(v.sound);
        if (keys.has(key)) continue;
        keys.add(key);
        others.push(v);
        if (others.length === k - 1) break;
      }
      const opts = shuffle([target, ...others]);
      choicesEl.dataset.n = opts.length;
      choicesEl.replaceChildren(...opts.map(v => {
        const b = h('button', { class: 'choice press' }, vehicleArt(v), h('span', { class: 'choice-name' }, v.name));
        tap(b, () => choose(v, b));
        return b;
      }));
      say(Lines.soundListen);
      later(play, 2300);
    }

    function choose(v, b) {
      if (locked) return;
      if (v === target) {
        locked = true;
        wins++;
        b.classList.add('right');
        Sound.stopVehicle();
        Sound.sfx('cheer');
        confetti();
        say([pick(Lines.praise), Lines.vehicleName(v)]);
        if (wins % 3 === 0) later(() => awardSticker(round), 2000);
        else later(round, 2600);
      } else {
        restart(b, 'wiggle');
        Sound.stopVehicle();
        say([Lines.vehicleThats(v), Lines.soundAgain]);
        later(play, 2400);
      }
    }

    round();
    return h('div', { class: 'screen' }, header("What's That Sound?"),
      h('main', { class: 'play' }, listenBtn, choicesEl));
  }

  // ---- Who helps? ----------------------------------------------------------------
  function jobs() {
    const helpers = [...new Set(JOBS.map(j => j.answer))].map(byId);
    const sceneEl = h('div', { class: 'job-scene' });
    const askEl = h('button', { class: 'prompt job-ask press' });
    const choicesEl = h('div', { class: 'choices named' });
    let job = null, last = null, wins = 0, locked = false;
    tap(askEl, () => job && say(Lines.jobAsk(job)));

    function round() {
      locked = false;
      job = pick(JOBS.filter(j => j !== last));
      last = job;
      const answer = byId(job.answer);
      const k = Math.min(3 + Math.floor(wins / 4), 4);
      const opts = shuffle([answer, ...shuffle(helpers.filter(v => v !== answer)).slice(0, k - 1)]);
      sceneEl.replaceChildren(...job.scene.map(e => h('span', { class: 'pop-in' }, e)));
      askEl.replaceChildren(h('span', { class: 'speaker' }, '🔊'), h('span', {}, job.ask));
      choicesEl.dataset.n = opts.length;
      choicesEl.replaceChildren(...opts.map(v => {
        const b = h('button', { class: 'choice press' }, vehicleArt(v), h('span', { class: 'choice-name' }, v.name));
        tap(b, () => choose(v, b));
        return b;
      }));
      say(Lines.jobAsk(job));
    }

    function choose(v, b) {
      if (locked) return;
      if (v.id === job.answer) {
        locked = true;
        wins++;
        b.classList.add('right');
        Sound.sfx('cheer');
        confetti();
        vehicleSound(v);
        say([pick(Lines.praise), Lines.jobWhy(job)]);
        if (wins % 3 === 0) later(() => awardSticker(round), 3200);
        else later(round, 4200);
      } else {
        restart(b, 'wiggle');
        Sound.sfx('boop');
        say([Lines.vehicleThats(v), Lines.tryAgain]);
      }
    }

    round();
    return h('div', { class: 'screen' }, header('Who Helps?'),
      h('main', { class: 'play jobs' }, h('div', { class: 'job-top' }, sceneEl, askEl), choicesEl));
  }

  // ---- Stop & Go: traffic light driving game --------------------------------------
  // The car drives on the spot while the road, trees and traffic lights scroll
  // past. Red means STOP (brake with the pedal), green means GO.
  function stopgo() {
    const L = Lines.stopgo;
    const panel = h('div', { class: 'drive-panel' });
    const lane = h('div', { class: 'dg-lane' });
    const sceneryEls = ['🌳', '🏠', '🌲', '🏡', '🌳', '🏪', '🌲', '🏠'].map(e => h('span', { class: 'dg-thing' }, e));
    const light = h('div', { class: 'dg-light tl green', html: Art.trafficLight() });
    const stopLine = h('div', { class: 'dg-stopline' });
    const carEl = h('div', { class: 'dg-car', html: Art.car('#e53935') });
    const starsEl = h('div', { class: 'dg-stars' });
    panel.append(...sceneryEls, lane, stopLine, light, carEl, starsEl);

    const stopBtn = h('button', { class: 'pedal pedal-stop press', 'aria-label': 'Stop' }, 'STOP');
    const goBtn = h('button', { class: 'pedal pedal-go press', 'aria-label': 'Go' }, 'GO');
    const car = Motion.vehicle(carEl, { flip: true });

    const CRUISE = 230; // px/s
    let dist = 0;        // how far we've driven (px)
    let lightAt = null;  // world position of the next stop line
    let lightState = 'green';
    let phase = 'parked'; // parked | driving | braking | stopped
    let changeScheduled = false;
    let kidStopped = false;
    let stars = 0;
    let raf = 0, lastT = 0;

    const W = () => panel.clientWidth;
    const carFront = () => carEl.offsetLeft + carEl.offsetWidth;
    const gap = () => (lightAt == null ? Infinity : lightAt - dist); // px from car front to stop line

    function setLight(state) {
      lightState = state;
      light.classList.remove('green', 'yellow', 'red');
      light.classList.add(state);
    }
    function pulse(btn) { [stopBtn, goBtn].forEach(b => b.classList.toggle('pulse', b === btn)); }
    function drawStars() { starsEl.replaceChildren(...Array.from({ length: stars % 3 || (stars ? 3 : 0) }, () => h('span', { html: Art.star(34) }))); }

    function spawnLight() {
      lightAt = dist + W() * (1.1 + Math.random() * 0.5);
      changeScheduled = false;
      setLight('green');
    }

    function brakeToLine() {
      const room = Math.max(10, gap() - 18);
      const v = car.speed;
      car.roll(0, Math.max(40, (v * v) / (2 * room))); // ease to a stop right at the line
      phase = 'braking';
    }

    function pressGo() {
      Sound.stopVehicle();
      if (lightState === 'red' && gap() < W() * 0.6 && gap() > -20) { say(L.waitGreen); return; }
      if (phase === 'driving') return;
      phase = 'driving';
      pulse(null);
      car.roll(CRUISE, 260);
      Sound.vehicle('engine-rev', { rate: 0.9 });
      if (lightAt == null) spawnLight();
      say(L.green);
    }

    function pressStop() {
      if (phase !== 'driving') return;
      if (lightState === 'green') { car.roll(0, 260); phase = 'stopped'; say(L.green); pulse(goBtn); return; }
      kidStopped = true;
      brakeToLine();
    }

    tap(goBtn, pressGo);
    tap(stopBtn, pressStop);

    function frame(t) {
      if (!panel.isConnected) { cancelAnimationFrame(raf); return; }
      const dt = Math.min(0.05, (t - lastT) / 1000 || 0);
      lastT = t;
      dist += car.speed * dt;
      const w = W();
      const front = carFront();

      // Road dashes and scenery scroll by.
      lane.style.backgroundPositionX = `${-dist % 80}px`;
      const span = w + 260;
      sceneryEls.forEach((el, i) => {
        const x = ((i * span) / sceneryEls.length - dist * 0.6) % span;
        el.style.transform = `translateX(${(x < -130 ? x + span : x)}px)`;
      });

      // Traffic light position.
      if (lightAt != null) {
        const x = front + gap();
        light.style.transform = `translateX(${x}px)`;
        stopLine.style.transform = `translateX(${x - 6}px)`;
        if (x < -120) spawnLight();
      }

      // Light changes as we get close.
      if (phase === 'driving' && lightAt != null && !changeScheduled && gap() < w * 0.7 && gap() > w * 0.35) {
        changeScheduled = true;
        if (Math.random() < 0.75) {
          setLight('yellow');
          say(L.yellow);
          later(() => { setLight('red'); say(L.red); pulse(stopBtn); }, 1300);
        } else {
          say(L.green);
        }
      }

      // Didn't press STOP in time: stop for them (no fail, just the rule).
      if (phase === 'driving' && lightState === 'red' && gap() > 0) {
        const v = car.speed;
        if (gap() - 18 < (v * v) / (2 * 520) + 10) {
          kidStopped = false;
          brakeToLine();
          Sound.sfx('screech');
        }
      }

      // Came to a stop at the red light.
      if (phase === 'braking' && car.speed < 1) {
        phase = 'stopped';
        pulse(null);
        if (kidStopped) {
          stars++;
          drawStars();
          Sound.sfx('cheer');
          say(L.stopped);
        } else {
          say(L.autoStop);
        }
        const earnedSticker = kidStopped && stars % 3 === 0;
        later(() => {
          setLight('green');
          say(L.goNow);
          pulse(goBtn);
          if (earnedSticker) later(() => awardSticker(), 1800);
        }, 2600);
      }
      raf = requestAnimationFrame(frame);
    }

    later(() => { say(L.start); pulse(goBtn); lastT = performance.now(); raf = requestAnimationFrame(frame); }, 0);
    return h('div', { class: 'screen' }, header('Stop & Go'),
      h('main', { class: 'stopgo' }, panel, h('div', { class: 'pedals' }, stopBtn, goBtn)));
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
        if (owned) { restart(b, 'wiggle'); vehicleSound(v).then(sec => later(() => say(Lines.vehicle(v)), Math.min(1600, sec * 600))); }
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

  const screens = { splash, home, garage, parts, sounds, jobs, stopgo, numbers, shapes, colors, abc, stickers };

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
