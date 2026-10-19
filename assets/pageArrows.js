(function () {
  const prev = document.getElementById('prevPage');
  const next = document.getElementById('nextPage');
  const label = document.getElementById('pageName');
  if (!prev || !next) return;

  // the order of the pages = the order of the links in the navbar
  const links = Array.from(document.querySelectorAll('.navbar-nav a[data-route]'));
  const routes = links.map(a => a.getAttribute('data-route').toLowerCase());

  function currentRoute() {
    return (location.hash || '#welcome').replace('#', '').toLowerCase();
  }

  function currentIndex() {
    const i = routes.indexOf(currentRoute());
    return i === -1 ? 0 : i;
  }

  // show the current page name between the arrows
  function updateLabel() {
    if (!label) return;
    const i = routes.indexOf(currentRoute());
    const name = i !== -1
      ? links[i].textContent.trim()
      : currentRoute().charAt(0).toUpperCase() + currentRoute().slice(1);
    label.textContent = name;
  }

  // step = -1 (previous) or 1 (next); wraps around at both ends
  function go(step) {
    const i = (currentIndex() + step + routes.length) % routes.length;
    location.hash = '#' + routes[i];
  }

  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));

  window.addEventListener('hashchange', updateLabel);
  updateLabel();
})();