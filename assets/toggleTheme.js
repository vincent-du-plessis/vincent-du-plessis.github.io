(function () {
  const html = document.documentElement;
  const themeBtn = document.getElementById('themeToggle');
  const iconMoon = document.getElementById('themeIconImageMoon');
  const iconSun = document.getElementById('themeIconImageSun');

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    html.setAttribute('data-bs-theme', theme);

    // dark theme shows the moon, light theme shows the sun
    if (iconMoon) iconMoon.classList.toggle('d-none', !isDark);
    if (iconSun) iconSun.classList.toggle('d-none', isDark);

    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', String(isDark));
      themeBtn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    }

    try { localStorage.setItem('theme', theme); } catch (e) {}
  }

  function savedTheme() {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
  }

  applyTheme(savedTheme() || html.getAttribute('data-bs-theme') || 'dark');

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      applyTheme(html.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark');
    });
  }
})();