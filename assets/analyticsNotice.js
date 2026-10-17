(function () {
  const KEY = 'analyticsNoticeDismissed';

  function wasDismissed() {
    try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
  }
  function remember() {
    try { localStorage.setItem(KEY, '1'); } catch (e) {}
  }

  async function isBrave() {
    try { return !!(navigator.brave && await navigator.brave.isBrave()); }
    catch (e) { return false; }
  }

  // GoatCounter's script defines window.goatcounter.count once it has loaded.
  // If a blocker stopped the script, this stays undefined.
  function analyticsLoaded() {
    return !!(window.goatcounter && typeof window.goatcounter.count === 'function');
  }

  function showNotice(brave) {
    const box = document.createElement('div');
    box.className = 'alert alert-info alert-dismissible fade show fixed-bottom m-3 shadow';
    box.setAttribute('role', 'status');

    const text = document.createElement('div');
    text.innerHTML = brave
      ? '<strong>Hi! A quick request.</strong> I count visits to see how many people view my site, ' +
        'using a small privacy-friendly counter with no cookies, no personal data and no ads. ' +
        'Brave Shields is blocking it. If you don\'t mind, click the lion icon in the address bar ' +
        'and turn Shields off for this site. Thank you!'
      : '<strong>Hi! A quick request.</strong> I count visits to see how many people view my site, ' +
        'using a small privacy-friendly counter with no cookies, no personal data and no ads. ' +
        'An ad blocker seems to be blocking it. If you don\'t mind, allow this site in your blocker. ' +
        'Thank you!';

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn-close';
    close.setAttribute('aria-label', 'Close');
    close.addEventListener('click', () => {
      remember();
      box.remove();
    });

    box.append(text, close);
    document.body.appendChild(box);
  }

  async function check() {
    if (wasDismissed() || analyticsLoaded()) return;
    showNotice(await isBrave());
  }

  // Give the async analytics script time to load before deciding it was blocked
  window.addEventListener('load', () => setTimeout(check, 2000));
})();