// ---- settings ----
const SKIP_ON_SMALL_SCREENS = false;  // true = no birds on phones (faster mobile score)
const RESPECT_REDUCED_MOTION = false; // true = no birds if the device is set to reduce motion
const SMALL_SCREEN_QUERY = "(max-width: 768px)";
const BIRD_QUANTITY = 3;              // default is 5, lower = cheaper

let vantaEffect = null;
let starting = false;
let scriptsPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Failed to load: " + src));
    document.head.appendChild(s);
  });
}

function loadScriptsOnce() {
  if (typeof VANTA !== "undefined") return Promise.resolve();
  if (!scriptsPromise) {
    scriptsPromise = (async () => {
      await loadScript("./assets/three.js");
      await loadScript("./assets/vantaBirds.js");
    })().catch(e => { scriptsPromise = null; throw e; });
  }
  return scriptsPromise;
}

function shouldSkipVanta() {
  if (RESPECT_REDUCED_MOTION && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  if (SKIP_ON_SMALL_SCREENS && window.matchMedia(SMALL_SCREEN_QUERY).matches) return true;
  return false;
}

async function initVanta() {
  if (vantaEffect || starting) return;
  if (shouldSkipVanta()) return;
  starting = true;
  try {
    await loadScriptsOnce();

    // the visitor may have left Welcome while the scripts were loading
    const hash = location.hash.replace("#", "").toLowerCase();
    if (hash && hash !== "welcome") return;

    vantaEffect = VANTA.BIRDS({
      el: "#Welcome",
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.00,
      minWidth: 200.00,
      scale: 1.00,
      scaleMobile: 1.00,
      backgroundColor: 0x0,
      color1: 0xf00ff,
      color2: 0xb2ff,
      birdSize: 0.50,
      wingSpan: 13.00,
      speedLimit: 1.00,
      separation: 50.00,
      quantity: BIRD_QUANTITY,
    });
  } catch (e) {
    console.warn("Vanta failed to load", e);
  } finally {
    starting = false;
  }
}

window.startVanta = initVanta;
window.stopVanta = function () {
  if (vantaEffect) {
    vantaEffect.destroy();
    vantaEffect = null;
  }
};

// first visit on Welcome: start once the page has loaded and the browser is idle
function scheduleFirstStart() {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(initVanta, { timeout: 2000 });
  } else {
    setTimeout(initVanta, 500);
  }
}

if (document.readyState === "complete") {
  scheduleFirstStart();
} else {
  window.addEventListener("load", scheduleFirstStart, { once: true });
}