// DataNusa — bootstrap: membangun navigasi, lalu menjalankan router hash.

import { ROUTES, initRouter } from './router.js';

function buildNav() {
  const nav = document.getElementById('main-nav');
  nav.innerHTML = ROUTES.map(
    (r) => `<a class="nav-link" href="#/${r.path}">${r.label}</a>`,
  ).join('');
  const toggle = document.getElementById('nav-toggle');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) nav.classList.remove('open');
  });
}

buildNav();
initRouter();
