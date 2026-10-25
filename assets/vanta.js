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

async function initVanta() {
  if (vantaEffect || starting) return;
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

// first visit on Welcome (the guard above stops a double start)
if ("requestIdleCallback" in window) {
  requestIdleCallback(initVanta, { timeout: 100 });
} else {
  window.addEventListener("load", () => setTimeout(initVanta, 0));
}