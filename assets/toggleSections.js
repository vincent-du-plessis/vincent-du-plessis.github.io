(function () {
  const sections = Array.from(document.querySelectorAll('main [data-route]'));
  const norm = s => (s || '').toLowerCase();

  // ADDED: report a section view to GoatCounter
  function trackPage(route) {
    const send = () => window.goatcounter.count({
      path: '/' + route,
      title: document.title
    });
    if (window.goatcounter && window.goatcounter.count) {
      send();
    } else {
      // the analytics script loads async, so wait for it on the first view
      window.addEventListener('load', () => {
        if (window.goatcounter && window.goatcounter.count) send();
      });
    }
  }

  function showRoute(route) {
    let found = false;
    sections.forEach(sec => {
      const is = norm(sec.getAttribute('data-route')) === route;
      sec.hidden = !is;
      if (is) found = true;
    });
    if (!found) {
      location.hash = '#welcome';
      return;
    }
    document.querySelectorAll('a[data-route]').forEach(a => {
      a.classList.toggle('active', norm(a.getAttribute('data-route')) === route);
    });
    document.title = route.charAt(0).toUpperCase() + route.slice(1) + ' - Vincent du Plessis';

    // start the birds on Welcome, destroy them everywhere else
    if (route === 'welcome') {
      requestAnimationFrame(() => window.startVanta && window.startVanta());
    } else if (window.stopVanta) {
      window.stopVanta();
    }

    trackPage(route); // ADDED
  }

  function currentRoute() {
    return (location.hash || '#welcome').replace('#', '').toLowerCase();
  }

  // Navbar collapse
  const collapseEl = document.querySelector('.navbar-collapse');
  const collapseInstance = collapseEl && window.bootstrap
    ? bootstrap.Collapse.getOrCreateInstance(collapseEl, { toggle: false })
    : null;

  function closeNav() {
    if (collapseInstance) collapseInstance.hide();
  }

  showRoute(currentRoute());

  window.addEventListener('hashchange', () => {
    showRoute(currentRoute());
    closeNav();
  });

  // Clicking the link for the page you're already on doesn't fire hashchange
  document.querySelectorAll('.navbar-collapse .nav-link').forEach(link => {
    link.addEventListener('click', closeNav);
  });
})();