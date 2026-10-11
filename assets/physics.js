const PhysicsButton = document.getElementById('drop-btn');

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
    return { el, body, x0, y0 };
  }).filter(Boolean);

  console.log('dropping', items.length, 'elements');

  const bottom = scrollY + innerHeight;
  const mid = scrollY + innerHeight / 2;
  const walls = [
    Bodies.rectangle(innerWidth / 2, bottom + 50, innerWidth * 3, 100, { isStatic: true }),
    Bodies.rectangle(-50, mid, 100, 10000, { isStatic: true }),
    Bodies.rectangle(innerWidth + 50, mid, 100, 10000, { isStatic: true })
  ];
  Composite.add(engine.world, [...walls, ...items.map(i => i.body)]);

  // ---------- Dragging (mouse + touch, multi-finger) ----------
  const active = new Map();                   // pointerId -> { c, x, y, moved }
  let zTop = 1000;
  let blockClick = false;

  items.forEach(({ el, body }) => {
    el.addEventListener('dragstart', e => e.preventDefault());
    el.addEventListener('pointerdown', e => {
      if (active.has(e.pointerId)) return;
      el.setPointerCapture(e.pointerId);
      el.style.zIndex = ++zTop;               // bring the dragged item to the front

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
      active.set(e.pointerId, { c, x: e.pageX, y: e.pageY, moved: false });
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
    items.forEach(({ el, body, x0, y0 }) => {
      el.style.transform =
        `translate(${body.position.x - x0}px, ${body.position.y - y0}px) rotate(${body.angle}rad)`;
    });
    requestAnimationFrame(tick);
  })();
}, { once: true });