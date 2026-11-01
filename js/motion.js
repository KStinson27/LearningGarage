/*
 * Motion: makes vehicles move like real ones.
 *
 * Instead of CSS keyframes, each vehicle is simulated every animation frame:
 *  - Position follows an easing curve (pull away gently, brake to a stop),
 *    or cruises at a varying speed for background traffic.
 *  - Wheels turn by exactly the distance travelled (rolling, no sliding).
 *  - The body sits on a springy suspension: it tilts back when speeding up,
 *    dips forward when braking, jiggles over the road, and bounces on landing.
 *
 * Vehicle art (js/art.js) marks the parts: `.spin` groups are wheels,
 * `.body` groups ride the suspension, and the <svg> carries
 * data-wheel-r (wheel radius) and data-pivot (suspension pivot point).
 * Emoji vehicles have no separate parts, so the whole picture tilts instead.
 *
 * Usage:
 *   const v = Motion.vehicle(el);                 // el wraps the <svg>
 *   v.place(400);                                 // jump to x = 400px
 *   await v.driveTo(0, { ease: 'out' });          // drive in and brake
 *   v.driveTo(250, { arc: 80 });                  // jump to x = 250px
 *   v.cruise({ from: 1200, to: -300, speed: 140 });   // loop across the screen
 *   v.hop();                                      // little bounce
 *   v.roll(220);                                  // drive on the spot (the
 *                                                 // world scrolls instead);
 *   v.speed                                       // current rolling speed
 */
window.Motion = (() => {
  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const EASE = {
    linear: t => t,
    inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    out: t => 1 - Math.pow(1 - t, 3), // arrive and brake
    in: t => t * t * t, // pull away and speed up
  };

  // Suspension tuning (in SVG units / degrees).
  const PITCH_PER_ACCEL = 0.0035; // degrees of tilt per (svg unit / s²)
  const MAX_PITCH = 7;
  const PITCH_SPRING = 140;
  const PITCH_DAMP = 11;
  const BOUNCE_SPRING = 220;
  const BOUNCE_DAMP = 13;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  class Vehicle {
    constructor(el, { flip = false } = {}) {
      this.el = el;
      this.svg = el.querySelector('svg');
      this.spins = [...el.querySelectorAll('.spin')];
      this.bodies = [...el.querySelectorAll('.body')];
      this.loose = this.bodies.length ? null : el.firstElementChild; // emoji: tilt the whole picture
      const ds = (this.svg && this.svg.dataset) || {};
      this.wheelR = +ds.wheelR || 0;
      this.pivot = ds.pivot || null;
      this.flip = flip; // art is mirrored to face right
      if (flip && this.svg) this.svg.style.transform = 'scaleX(-1)';
      if (this.loose) this.loose.style.transformOrigin = '50% 90%';

      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.ax = 0;
      this.dist = 0;
      this.wheelAngle = 0;
      this.pitch = 0;
      this.pitchV = 0;
      this.bounce = 0;
      this.bounceV = 0;
      this.task = null;
      this.cruising = null;
      this.hopT = null;
      this.hopH = 0;
      this.render();
    }

    // Screen pixels per SVG unit (vehicles are drawn at different sizes).
    scale() {
      if (!this.svg || !this.svg.viewBox || !this.svg.viewBox.baseVal) return 1;
      const w = this.svg.getBoundingClientRect().width;
      return w && this.svg.viewBox.baseVal.width ? w / this.svg.viewBox.baseVal.width : 1;
    }

    place(x, y = 0) {
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.ax = 0;
      this.render();
      return this;
    }

    /** Drive to x (px). Resolves true on arrival, false if interrupted. */
    driveTo(x, { duration, ease = 'inOut', arc = 0, speed = 500 } = {}) {
      this.stop();
      if (reduceMotion) { this.place(x); return Promise.resolve(true); }
      const dist = Math.abs(x - this.x);
      const dur = duration != null ? duration : Math.max(300, (dist / speed) * 1500);
      const curve = EASE[ease] || EASE.inOut;
      // If the curve starts at speed (e.g. 'out'), the vehicle is already
      // rolling: seed its speed so the first frame isn't a fake jolt.
      this.vx = (x - this.x) * (curve(0.001) / 0.001) / (dur / 1000);
      this.ax = 0;
      return new Promise(resolve => {
        this.task = { from: this.x, to: x, t: 0, dur, ease: curve, arc, resolve };
        wake(this);
      });
    }

    /** Drive across forever, gently varying speed, wrapping from `to` back to `from`. */
    cruise({ from, to, speed = 140, vary = 0.3, startAt = from }) {
      this.stop();
      this.x = startAt;
      this.cruising = { from, to, base: speed, target: speed, speed, vary, next: 0 };
      if (reduceMotion) { this.cruising = null; this.render(); return; }
      wake(this);
    }

    /** Drive "on the spot" toward a target speed (px/s) with an acceleration
     *  limit (px/s²). Wheels and suspension behave as if moving; the game
     *  scrolls the world instead. Read the current speed with v.speed. */
    roll(target, accel = 300) {
      const v = this.rolling ? this.rolling.v : 0;
      this.stop();
      this.rolling = { v, target: Math.max(0, target), accel: Math.max(1, accel) };
      wake(this);
    }

    get speed() { return this.rolling ? this.rolling.v : 0; }

    hop(height = 40) {
      this.hopT = 0;
      this.hopH = height;
      wake(this);
    }

    stop() {
      if (this.task) {
        const { resolve } = this.task;
        this.task = null;
        this.y = 0;
        resolve(false);
      }
      this.cruising = null;
      this.rolling = null;
    }

    step(dt, now) {
      const prevX = this.x;
      const prevV = this.vx;
      let y = 0;

      if (this.task) {
        const k = this.task;
        k.t += dt * 1000;
        const p = Math.min(1, k.t / k.dur);
        this.x = k.from + (k.to - k.from) * k.ease(p);
        y = k.arc ? -Math.sin(Math.PI * p) * k.arc : 0;
        if (p >= 1) {
          this.task = null;
          y = 0;
          if (k.arc) this.bounceV += 180; // landing squish
          k.resolve(true);
        }
      } else if (this.cruising) {
        const c = this.cruising;
        if (now > c.next) {
          c.target = c.base * (1 - c.vary + Math.random() * c.vary * 2);
          c.next = now + 1500 + Math.random() * 2500;
        }
        c.speed += (c.target - c.speed) * Math.min(1, dt * 0.8);
        const dir = Math.sign(c.to - c.from) || -1;
        this.x += dir * c.speed * dt;
        if ((dir < 0 && this.x < c.to) || (dir > 0 && this.x > c.to)) {
          this.x = c.from; // wrap around without a physics jolt
          this.vx = dir * c.speed;
          this.render();
          return true;
        }
      }

      let rollDx = 0;
      if (this.rolling) {
        const r = this.rolling;
        const maxStep = r.accel * dt;
        r.v += clamp(r.target - r.v, -maxStep, maxStep);
        rollDx = (this.flip ? 1 : -1) * r.v * dt; // forward on screen
      }

      if (this.hopT != null) {
        this.hopT += dt / 0.45;
        if (this.hopT >= 1) { this.hopT = null; this.bounceV += 140; } else y += -Math.sin(Math.PI * this.hopT) * this.hopH;
      }
      this.y = y;

      const s = this.scale();
      const dx = this.x - prevX + rollDx;
      this.vx = dt > 0 ? dx / dt : 0;
      const rawA = dt > 0 ? (this.vx - prevV) / dt : 0;
      this.ax += (rawA - this.ax) * Math.min(1, dt * 14); // smooth out jitter

      // Art faces left; when flipped, screen +x is the art's own -x.
      const localDx = (this.flip ? -dx : dx) / s;
      const localA = (this.flip ? -this.ax : this.ax) / s;
      this.dist += Math.abs(localDx);

      // Wheels roll: angle = distance / radius.
      if (this.wheelR) this.wheelAngle += (localDx / this.wheelR) * (180 / Math.PI);

      // Suspension: the art's nose points to its -x, so speeding up forward is
      // a negative local acceleration; a positive (clockwise) rotation lifts
      // the nose. So: nose up when speeding up, nose dips when braking.
      const airborne = this.y < -1;
      const targetPitch = airborne ? 0 : clamp(-localA * PITCH_PER_ACCEL, -MAX_PITCH, MAX_PITCH);
      this.pitchV += ((targetPitch - this.pitch) * PITCH_SPRING - this.pitchV * PITCH_DAMP) * dt;
      this.pitch += this.pitchV * dt;

      // Road texture: small bumps that grow with speed.
      const speed = Math.abs(localDx) / Math.max(dt, 1e-3);
      const road = airborne ? 0 : Math.sin(this.dist * 0.09) * Math.sin(this.dist * 0.023) * Math.min(1.2, speed / 250);
      this.bounceV += ((road - this.bounce) * BOUNCE_SPRING - this.bounceV * BOUNCE_DAMP) * dt;
      this.bounce += this.bounceV * dt;

      this.render();
      const settled = Math.abs(this.pitch) < 0.02 && Math.abs(this.pitchV) < 0.05 &&
        Math.abs(this.bounce) < 0.02 && Math.abs(this.bounceV) < 0.05;
      const rolling = this.rolling && (this.rolling.v > 0.5 || this.rolling.target > 0);
      return !!(this.task || this.cruising || rolling || this.hopT != null || !settled);
    }

    render() {
      this.el.style.transform = `translate3d(${this.x.toFixed(2)}px, ${this.y.toFixed(2)}px, 0)`;
      const spin = `rotate(${this.wheelAngle.toFixed(2)})`;
      this.spins.forEach(w => w.setAttribute('transform', spin));
      if (this.bodies.length) {
        const pivot = this.pivot ? ` ${this.pivot}` : '';
        const t = `translate(0 ${this.bounce.toFixed(2)}) rotate(${this.pitch.toFixed(2)}${pivot})`;
        this.bodies.forEach(b => b.setAttribute('transform', t));
      } else if (this.loose) {
        const s = this.scale();
        this.loose.style.transform = `translateY(${(this.bounce * s).toFixed(2)}px) rotate(${this.pitch.toFixed(2)}deg)`;
      }
    }
  }

  // ---- one shared animation loop -------------------------------------------
  const active = new Set();
  let raf = 0;
  let last = 0;

  function wake(v) {
    active.add(v);
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (const v of active) {
      if (!v.el.isConnected) { v.stop(); active.delete(v); continue; }
      if (!v.step(dt, now)) active.delete(v);
    }
    raf = active.size ? requestAnimationFrame(tick) : 0;
  }

  function vehicle(el, opts) {
    if (!el._vehicle) el._vehicle = new Vehicle(el, opts);
    return el._vehicle;
  }

  return { vehicle };
})();
