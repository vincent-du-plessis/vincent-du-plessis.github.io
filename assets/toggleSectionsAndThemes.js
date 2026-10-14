
(function () {
  // Theme toggle
  const themeBtn = document.getElementById('themeToggle');
  const icon = document.getElementById('themeIconImage'); // HTML id must match
  const html = document.documentElement;
  const ICONS = {
    light: './assets/icons/brightness-high-fill.svg', // was "hight"
    dark:  './assets/icons/moon-fill.svg'
  };

  function applyTheme(theme) {
    html.setAttribute('data-bs-theme', theme);
    if (themeBtn) themeBtn.setAttribute('aria-pressed', theme === 'dark');
    if (icon) {
      icon.src = theme === 'dark' ? ICONS.dark : ICONS.light;
      icon.alt = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    }
    try { localStorage.setItem('theme', theme); } catch (e) {}
  }

  const saved = (function () {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
  })();
  applyTheme(saved || html.getAttribute('data-bs-theme') || 'dark');

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      applyTheme(html.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  // Router
  const sections = Array.from(document.querySelectorAll('main [data-route]'));

  function showRoute(route) {
    let found = false;
    sections.forEach(sec => {
      const is = sec.getAttribute('data-route') === route;
      sec.hidden = !is;
      if (is) found = true;
    });
    if (!found) {
      location.hash = '#welcome';
      return;
    }
    document.querySelectorAll('a[data-route]').forEach(a => {
      a.classList.toggle('active', a.getAttribute('data-route') === route);
    });
    document.title = route.charAt(0).toUpperCase() + route.slice(1) + ' - Vincent du Plessis';
  }

  function currentRoute() {
    return (location.hash || '#welcome').replace('#', '').toLowerCase();
  }

  // Navbar collapse
  const collapseEl = document.querySelector('.navbar-collapse');
  const collapseInstance = collapseEl
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

  // Also needed when clicking the link for the page you're already on
  // (that doesn't fire hashchange)
  document.querySelectorAll('.navbar-collapse .nav-link').forEach(link => {
    link.addEventListener('click', closeNav);
  });
})();
