(function () {
  // ---- tweak these ----
  const START      = 200;    // px of scrolling before anything happens
  const DISTANCE   = 90;     // px of scrolling after START until the letters have arrived (smaller = faster)
  const TOP        = 12;     // px from the top of the screen where "www" ends up
  const FINAL_SIZE = 38;     // px: final font size of the "www"
  const SMOOTHING  = 0.3;   // 0.05 = slow and floaty, 0.3 = snappy (fraction of the gap closed per frame)

  const section = document.getElementById('Welcome');
  if (!section) return;

  // the red W's in the welcome text (Web Developer / Welcome / work)
  const sources = Array.from(section.querySelectorAll('.capital-red'))
    .filter(el => el.textContent.trim().toLowerCase() === 'w')
    .slice(0, 3);
  if (sources.length < 3) return;

  // flying copies, fixed to the screen so nothing in the hero can clip them.
  // each holds a capital and a lowercase "w" that crossfade as it flies
  const clones = sources.map(src => {
    const c = document.createElement('span');
    c.className = 'capital-red';
    c.setAttribute('aria-hidden', 'true');
    Object.assign(c.style, {
      position: 'fixed', left: '0', top: '0', margin: '0', padding: '0',
      display: 'none', pointerEvents: 'none', whiteSpace: 'nowrap',
      transformOrigin: '0 0', willChange: 'transform, opacity', zIndex: '1050',
      lineHeight: 'normal'
    });
    const cap = document.createElement('span');
    cap.textContent = src.textContent.trim();
    const low = document.createElement('span');
    low.textContent = 'w';
    Object.assign(low.style, { position: 'absolute', left: '0', top: '0', opacity: '0' });
    c.appendChild(cap);
    c.appendChild(low);
    c._cap = cap;
    c._low = low;
    document.body.appendChild(c);
    return c;
  });

  const startScale = [];
  const base = [];          // where each W sits in the page (document coordinates)
  let letterW = 0;          // width of one lowercase "w" at FINAL_SIZE
  let centerX = 0;          // cached horizontal centre of the viewport
  let start = START;        // scroll position where the animation begins (lowered on short pages)
  let dist = DISTANCE;      // scroll distance the animation takes
  let cur = 0;              // smoothed progress, 0 to 1
  let running = false;
  let lastT = 0;

  // measure everything once (not on every frame)
  // all reads happen first, then all writes, to avoid forced reflows
  function sync() {
    if (section.hidden) return;

    // ---- READ PHASE (no DOM changes) ----
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    centerX = document.documentElement.clientWidth / 2;

    const info = sources.map(src => {
      const cs = getComputedStyle(src);
      const r = src.getBoundingClientRect();
      return {
        fontFamily: cs.fontFamily,
        fontWeight: cs.fontWeight,
        fontSize: cs.fontSize,
        x: r.left + scrollX,
        y: r.top + scrollY
      };
    });

    // ---- WRITE PHASE ----
    info.forEach((d, i) => {
      clones[i].style.fontFamily = d.fontFamily;
      clones[i].style.fontWeight = d.fontWeight;
      clones[i].style.fontSize   = d.fontSize;
      startScale[i] = FINAL_SIZE / parseFloat(d.fontSize);
      base[i] = { x: d.x, y: d.y };
    });

    // width of a lowercase "w" in the first W's font, scaled to the final size
    // (the one unavoidable measurement, so it is done last)
    const probe = document.createElement('span');
    probe.textContent = 'w';
    Object.assign(probe.style, {
      position: 'fixed', left: '0', top: '0', visibility: 'hidden', whiteSpace: 'nowrap',
      fontFamily: info[0].fontFamily, fontWeight: info[0].fontWeight, fontSize: info[0].fontSize
    });
    document.body.appendChild(probe);
    letterW = probe.getBoundingClientRect().width * startScale[0];
    probe.remove();

    // the page may not scroll as far as START + DISTANCE: pull the start (and length)
    // down so the animation can still finish when you reach the bottom
    dist  = Math.max(20, Math.min(DISTANCE, maxScroll * 0.5));
    start = Math.max(0, Math.min(START, maxScroll - dist));
  }

  function reset() {
    cur = 0;
    clones.forEach(c => { c.style.display = 'none'; });
    sources.forEach(s => { s.style.visibility = ''; });
  }

  function targetProgress() {
    if (section.hidden) return 0;
    return Math.min(1, Math.max(0, (window.scrollY - start) / dist));
  }

  // draw one frame at the current smoothed progress (no layout reads here)
  function render() {
    if (cur < 0.0005) { reset(); return; }

    const p = cur * cur * (3 - 2 * cur);                        // smoothstep: gentle start and finish
    const t = Math.min(1, Math.max(0, (p - 0.3) / 0.4));        // capital -> lowercase crossfade
    const fade = Math.min(1, p * 6);                            // fade in quickly as it leaves the page

    const startX = centerX - (letterW * 3) / 2;

    sources.forEach((src, i) => {
      const fromX = base[i].x - window.scrollX;                 // where the W is on screen right now
      // after 400px of scrolling the original W has usually scrolled off the top,
      // so start from the top edge instead of flying in from above the screen
      const fromY = Math.max(TOP, base[i].y - window.scrollY);
      const targetX = startX + i * letterW;
      const x = fromX + p * (targetX - fromX);
      const y = fromY + p * (TOP - fromY);
      const s = 1 + p * (startScale[i] - 1);

      const c = clones[i];
      c.style.display = 'block';
      c.style.opacity = String(fade);
      c.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) scale(' + s + ')';
      c._cap.style.opacity = String(1 - t);
      c._low.style.opacity = String(t);
      src.style.visibility = 'hidden';                          // the original keeps its space so the text doesn't reflow
    });
  }

  // animation loop: glides toward the scroll position, stops when it arrives
  function frame(now) {
    const dt = Math.min(64, now - (lastT || now));
    lastT = now;
    const target = targetProgress();
    const k = 1 - Math.pow(1 - SMOOTHING, dt / 16.67);          // same feel at 60 Hz and 144 Hz
    cur += (target - cur) * k;
    if (Math.abs(target - cur) < 0.0005) cur = target;
    render();
    if (cur !== target) {
      requestAnimationFrame(frame);
    } else {
      running = false;
      lastT = 0;
    }
  }

  function kick() {
    if (running) return;
    running = true;
    lastT = 0;
    requestAnimationFrame(frame);
  }

  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', () => { sync(); kick(); });
  window.addEventListener('load', () => { sync(); kick(); });
  // after a page change, re-measure once the router has shown or hidden Welcome
  window.addEventListener('hashchange', () => {
    requestAnimationFrame(() => {
      if (section.hidden) { reset(); } else { sync(); kick(); }
    });
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { sync(); kick(); });       // web fonts change letter sizes
  }

  sync();
  kick();
})();