  // /assets/hero.js
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
  try {
    await loadScript("./assets/three.js");
    await loadScript("./assets/vantaBirds.js");
    
    VANTA.BIRDS({
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
    })
  } catch (e) {
    console.warn("Vanta failed to load", e);
  }
}

// Wait until the page is idle so it doesn't compete with content
if ("requestIdleCallback" in window) {
  requestIdleCallback(initVanta, { timeout:100 });
  } else {
    window.addEventListener("load", () => setTimeout(initVanta, 0));
}