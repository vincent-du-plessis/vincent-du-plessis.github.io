let vantaEffect = null; // ADDED

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function initVanta() {
  if (vantaEffect) return; // ADDED
  try {
    if (typeof VANTA === "undefined") { // ADDED: only load the scripts once
      await loadScript("./assets/three.js");
      await loadScript("./assets/vantaBirds.js");
    }

    vantaEffect = VANTA.BIRDS({ // CHANGED: saved in a variable
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
  }
}

// ADDED: so the router can start and stop the effect
window.startVanta = initVanta;
window.stopVanta = function () {
  if (vantaEffect) {
    vantaEffect.destroy();
    vantaEffect = null;
  }
};

// Wait until the page is idle so it doesn't compete with content
function firstStart() {
  const hash = location.hash.replace("#", "").toLowerCase(); // ADDED
  if (!hash || hash === "welcome") initVanta();              // ADDED
}

if ("requestIdleCallback" in window) {
  requestIdleCallback(firstStart, { timeout: 100 });
} else {
  window.addEventListener("load", () => setTimeout(firstStart, 0));
}