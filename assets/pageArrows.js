(function () {
  const prev = document.getElementById('prevPage');
  const next = document.getElementById('nextPage');
  if (!prev || !next) return;

  // the order of the pages = the order of the links in the navbar
  const routes = Array.from(document.querySelectorAll('.navbar-nav a[data-route]'))
    .map(a => a.getAttribute('data-route').toLowerCase());

  function currentIndex() {
    const route = (location.hash || '#welcome').replace('#', '').toLowerCase();
    const i = routes.indexOf(route);
    return i === -1 ? 0 : i;
  }

  // step = -1 (previous) or 1 (next); wraps around at both ends
  function go(step) {
    const i = (currentIndex() + step + routes.length) % routes.length;
    location.hash = '#' + routes[i];
  }

  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
})();