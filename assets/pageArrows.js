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
    const idx = routes.indexOf(currentRoute());
    let i;
    if (idx === -1) {
      // on a legal page (not in the navbar): next = first page, previous = last page
      i = step > 0 ? 0 : routes.length - 1;
    } else {
      i = (idx + step + routes.length) % routes.length;
    }
    location.hash = '#' + routes[i];
  }

  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));

  // scroll wheel / trackpad over the arrows and page name switches pages
  const picker = prev.parentElement;   // the div holding the arrows and the page name
  let wheelLocked = false;

  picker.addEventListener('wheel', (e) => {
    e.preventDefault();                 // don't scroll the page while over the picker
    if (wheelLocked || Math.abs(e.deltaY) < 4) return;

    go(e.deltaY > 0 ? 1 : -1);          // scroll down = next, scroll up = previous

    // one page per scroll gesture; trackpads fire many events per swipe
    wheelLocked = true;
    setTimeout(() => { wheelLocked = false; }, 350);
  }, { passive: false });

  window.addEventListener('hashchange', updateLabel);
  updateLabel();
})();