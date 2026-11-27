// Router hash DataNusa: #/ , #/kependudukan, #/ekonomi, #/tenaga-kerja,
// #/harga, #/kemiskinan, #/provinsi, #/tentang. Tanpa network, tanpa reload.

import { VIEWS, mountPage } from './views.js';

export const ROUTES = [
  { path: '', label: 'Beranda', view: 'home' },
  { path: 'kependudukan', label: 'Kependudukan', view: 'kependudukan' },
  { path: 'ekonomi', label: 'Ekonomi', view: 'ekonomi' },
  { path: 'tenaga-kerja', label: 'Ketenagakerjaan', view: 'tenaga-kerja' },
  { path: 'harga', label: 'Harga & Inflasi', view: 'harga' },
  { path: 'kemiskinan', label: 'Kemiskinan', view: 'kemiskinan' },
  { path: 'provinsi', label: 'Perbandingan Provinsi', view: 'provinsi' },
  { path: 'tentang', label: 'Tentang', view: 'tentang' },
];

function currentPath() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const [path, query] = hash.split('?');
  const params = new URLSearchParams(query ?? '');
  return {
    path: ROUTES.some((r) => r.path === path) ? path : '',
    detail: params.get('detail'),
  };
}

export function renderRoute() {
  const { path, detail } = currentPath();
  const route = ROUTES.find((r) => r.path === path) ?? ROUTES[0];
  const app = document.getElementById('app');
  app.innerHTML = VIEWS[route.view]();
  document.querySelectorAll('.nav-link').forEach((a) => {
    const active = a.getAttribute('href') === `#/${route.path}`;
    a.classList.toggle('active', active);
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  mountPage(route.view, { detail });
  window.scrollTo(0, 0);
}

export function initRouter() {
  window.addEventListener('hashchange', renderRoute);
  renderRoute();
}
