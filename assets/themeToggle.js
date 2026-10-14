        const toggle2 = document.getElementById('themeToggle');
        toggle2.addEventListener('click', () => {         
            const html = document.documentElement;
            const themIconImage = document.getElementById('themIconImage')
            if (html.getAttribute('data-bs-theme') !== 'dark') {
 
            html.setAttribute('data-bs-theme', 'light');
            themIconImage.src = './assets/icons/moon-fill.svg'
            } else {
          
            html.setAttribute('data-bs-theme', 'dark');
            themIconImage.src = './assets/icons/brightness-high-fill.svg'
            }
        });