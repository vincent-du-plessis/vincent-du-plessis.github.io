const PhysicsButton = document.getElementById('drop-btn');

// ---------- Game settings (tweak these) ----------
const AIR_RATE = 1e9;       // the "catch counter" rises by this much per second in the air (1000 million)
const MIN_AIR = 0.25;       // seconds in the air before a catch counts
const STILL_FRAMES = 30;    // this many nearly-motionless frames = it has landed on something

// 1,234 / 1.23e+25 / ∞
const fmt = n => {
  if (n === Infinity) return '∞';
  if (!Number.isFinite(n)) return '0';
  return n < 1e6 ? Math.floor(n).toLocaleString() : n.toExponential(2);
};

PhysicsButton.addEventListener('click', () => {
  const allElements = document.querySelectorAll(
    'body *:not(:has(*)):not(script):not(style):not(canvas):not(#drop-btn)'
  );

  const { Engine, Bodies, Composite, Constraint } = Matter;
  const engine = Engine.create();
  engine.gravity.x = 0;
  engine.gravity.y = 1;                       // 0.5 = floaty, 2 = heavy

  // Lock page scroll first so the floor stays at the bottom of the screen
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overscrollBehavior = 'none';   // no pull-to-refresh / bounce on phones

  const items = [...allElements].map(el => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight) return null;
    if (r.width * r.height > innerWidth * innerHeight * 0.5) return null;
    const x0 = r.left + r.width / 2 + scrollX;
    const y0 = r.top + r.height / 2 + scrollY;
    const body = Bodies.rectangle(x0, y0, r.width, r.height, { restitution: 0.4, friction: 0.3 });

    if (getComputedStyle(el).display === 'inline') el.style.display = 'inline-block';
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';  // so z-index works
    el.style.transition = 'none';
    el.style.touchAction = 'none';            // stops the phone scrolling while you drag
    el.style.userSelect = 'none';
    el.draggable = false;
    // st = the game state of this element
    return { el, body, x0, y0, st: { grabs: 0, flying: false, t0: 0, still: 0 } };
  }).filter(Boolean);

  // ---------- 5 coloured balls (round bodies, work with mouse and touch) ----------
  const BALL_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'];  // red, orange, green, blue, purple
  const radius = innerWidth < 600 ? 24 : 30;      // a little smaller on phones, still easy to grab
  BALL_COLORS.forEach((color, i) => {
    const x0 = innerWidth * (i + 1) / (BALL_COLORS.length + 1);
    const y0 = scrollY - radius - i * 70;         // start above the screen and rain in
    const el = document.createElement('div');
    el.setAttribute('aria-hidden', 'true');
    Object.assign(el.style, {
      position: 'fixed',                          // scrolling is locked, so fixed = page position
      left: (x0 - radius) + 'px', top: (y0 - scrollY - radius) + 'px',
      width: (radius * 2) + 'px', height: (radius * 2) + 'px', borderRadius: '50%',
      background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,.75), ' + color + ' 55%)',
      boxShadow: '0 2px 6px rgba(0,0,0,.4)', cursor: 'grab', zIndex: '900',
      touchAction: 'none', userSelect: 'none', webkitUserSelect: 'none', webkitTouchCallout: 'none'
    });
    el.draggable = false;
    document.body.appendChild(el);
    const body = Bodies.circle(x0, y0, radius, { restitution: 0.7, friction: 0.05 });
    items.push({ el, body, x0, y0, st: { grabs: 0, flying: false, t0: 0, still: 0 } });
  });

  console.log('dropping', items.length, 'elements');

  const bottom = scrollY + innerHeight;
  const mid = scrollY + innerHeight / 2;
  const walls = [
    Bodies.rectangle(innerWidth / 2, bottom + 50, innerWidth * 3, 100, { isStatic: true }),
    Bodies.rectangle(-50, mid, 100, 10000, { isStatic: true }),
    Bodies.rectangle(innerWidth + 50, mid, 100, 10000, { isStatic: true })
  ];
  Composite.add(engine.world, [...walls, ...items.map(i => i.body)]);

  // ---------- HUD: button left, air timer centre, score right ----------
  const navH = (document.querySelector('nav') || { offsetHeight: 56 }).offsetHeight;
  const hud = document.createElement('div');
  Object.assign(hud.style, {
    position: 'fixed', top: (navH + 8) + 'px', left: '0', right: '0',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '0 1rem', pointerEvents: 'none', zIndex: '2147483000'
  });

  // the button moves to the left-hand corner and becomes a reset button
  PhysicsButton.textContent = 'Reset';
  PhysicsButton.style.pointerEvents = 'auto';
  hud.appendChild(PhysicsButton);
  setTimeout(() => PhysicsButton.addEventListener('click', () => location.reload()), 0);

  const makeBox = html => {
    const d = document.createElement('div');
    d.className = 'bg-body-tertiary border rounded px-3 py-2 shadow-sm text-center';
    d.innerHTML = html;
    return d;
  };

  // centre: the catch timer and the score waiting to be banked
  const airBox = makeBox(
    '<div class="small text-body-secondary">Air time</div>' +
    '<div class="fs-4 fw-bold" data-air-time>0.00 s</div>' +
    '<div class="small">Catch bonus: <span data-air-score>0</span></div>' +
    '<div class="small fw-bold" data-status>&nbsp;</div>'
  );
  Object.assign(airBox.style, { position: 'absolute', left: '50%', transform: 'translateX(-50%)' });

  // right: the main score
  const scoreBox = makeBox(
    '<div class="small text-body-secondary">Score</div>' +
    '<div class="fs-4 fw-bold" data-score>0</div>'
  );

  hud.append(airBox, scoreBox);
  document.body.appendChild(hud);

  const airTimeEl = airBox.querySelector('[data-air-time]');
  const airScoreEl = airBox.querySelector('[data-air-score]');
  const statusEl = airBox.querySelector('[data-status]');
  const scoreEl = scoreBox.querySelector('[data-score]');

  // instructions pop-up
  const msg = document.createElement('div');
  msg.className = 'alert alert-info shadow';
  msg.setAttribute('role', 'status');
  msg.textContent = 'Throw the elements in the air and catch them to gain a score! Reach infinity which is an actual number in website code.';
  Object.assign(msg.style, {
    position: 'fixed', top: '35%', left: '50%', transform: 'translateX(-50%)',
    maxWidth: '90vw', textAlign: 'center', pointerEvents: 'none',
    zIndex: '2147483000', transition: 'opacity .5s'
  });
  document.body.appendChild(msg);
  const hideMsg = () => { msg.style.opacity = '0'; setTimeout(() => msg.remove(), 600); };
  setTimeout(hideMsg, 7000);

  // ---------- Scoring ----------
  let score = 0;
  let statusTimer = 0;

  const setStatus = text => {
    statusEl.textContent = text;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => (statusEl.innerHTML = '&nbsp;'), 1800);
  };

  // a successful catch banks the air score into the main score:
  // score = (score + airScore) ^ (1 + airTime)   -> grows exponentially until JS reaches Infinity
  const catchItem = st => {
    const t = (performance.now() - st.t0) / 1000;
    st.flying = false;
    if (t < MIN_AIR) return;                  // too short to count
    const bonus = t * AIR_RATE;
    score = (score + bonus) ** (1 + t * 0.1);  // the longer in the air, the more the score grows
    setStatus(score === Infinity ? 'INFINITY!' : 'Caught! +' + fmt(bonus));
  };

  // the item came down without being caught: stop its timer
  let frozenAir = 0, frozenUntil = 0;
  const land = st => {
    if (!st.flying) return;
    const t = (performance.now() - st.t0) / 1000;
    st.flying = false;
    if (t >= MIN_AIR) {
      frozenAir = t;                          // keep showing the final time for a moment
      frozenUntil = performance.now() + 1500;
      setStatus('Missed! Bonus lost');
    }
  };

  // ANY collision (another item, a wall or the floor) stops the timer of a flying item
  const stOf = new Map(items.map(i => [i.body, i.st]));
  const onTouch = ev => ev.pairs.forEach(({ bodyA, bodyB }) => {
    const a = stOf.get(bodyA), b = stOf.get(bodyB);
    if (a) land(a);
    if (b) land(b);
  });
  Matter.Events.on(engine, 'collisionStart', onTouch);
  Matter.Events.on(engine, 'collisionActive', onTouch);

  // ---------- Dragging (mouse + touch, multi-finger) ----------
  const active = new Map();                   // pointerId -> { c, x, y, moved, st }
  let zTop = 1000;
  let blockClick = false;

  items.forEach(({ el, body, st }) => {
    el.addEventListener('dragstart', e => e.preventDefault());
    el.addEventListener('pointerdown', e => {
      if (active.has(e.pointerId)) return;
      el.setPointerCapture(e.pointerId);
      el.style.zIndex = ++zTop;               // bring the dragged item to the front
      hideMsg();

      st.grabs++;
      if (st.flying) catchItem(st);           // grabbed while in the air = a catch

      // grab point, converted to the body's own rotated coordinates
      const dx = e.pageX - body.position.x, dy = e.pageY - body.position.y;
      const cos = Math.cos(body.angle), sin = Math.sin(body.angle);
      const c = Constraint.create({
        pointA: { x: e.pageX, y: e.pageY },
        bodyB: body,
        pointB: { x: dx * cos + dy * sin, y: -dx * sin + dy * cos },
        stiffness: 0.2, damping: 0.1, length: 0
      });
      Composite.add(engine.world, c);
      active.set(e.pointerId, { c, x: e.pageX, y: e.pageY, moved: false, st });
    });
  });

  window.addEventListener('pointermove', e => {
    const a = active.get(e.pointerId);
    if (!a) return;
    a.c.pointA.x = e.pageX;
    a.c.pointA.y = e.pageY;
    if (Math.hypot(e.pageX - a.x, e.pageY - a.y) > 6) a.moved = true;
  });

  const release = e => {
    const a = active.get(e.pointerId);
    if (!a) return;
    Composite.remove(engine.world, a.c);
    active.delete(e.pointerId);
    if (a.moved) { blockClick = true; setTimeout(() => (blockClick = false), 50); }

    // once nothing is holding the item, its time in the air starts
    const st = a.st;
    st.grabs = Math.max(0, st.grabs - 1);
    if (st.grabs === 0) {
      st.flying = true;
      st.t0 = performance.now();
      st.still = 0;
    }
  };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);

  // dragging a link shouldn't also open it; a plain tap still does
  document.addEventListener('click', e => {
    if (blockClick) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  // ---------- Physics loop ----------
  (function tick() {
    Engine.update(engine, 1000 / 60);
    const now = performance.now();
    let bestAir = 0;                          // longest flight happening right now

    items.forEach(({ el, body, x0, y0, st }) => {
      el.style.transform =
        `translate(${body.position.x - x0}px, ${body.position.y - y0}px) rotate(${body.angle}rad)`;

      if (st.flying) {
        const speed = Math.hypot(body.velocity.x, body.velocity.y);
        st.still = speed < 0.5 ? st.still + 1 : 0;
        if (body.bounds.max.y >= bottom - 2 || st.still > STILL_FRAMES) {
          land(st);                           // landed without a catch: that air time is lost
        } else {
          bestAir = Math.max(bestAir, (now - st.t0) / 1000);
        }
      }
    });

    const shown = bestAir > 0 ? bestAir : (now < frozenUntil ? frozenAir : 0);
    airTimeEl.textContent = shown.toFixed(2) + ' s';
    airScoreEl.textContent = fmt(bestAir * AIR_RATE);
    scoreEl.textContent = fmt(score);
    requestAnimationFrame(tick);
  })();
}, { once: true });