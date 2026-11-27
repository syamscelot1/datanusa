// Peta stilasi Indonesia — titik per provinsi, warna dari data yang ADA
// untuk semua 38 provinsi (kemiskinan Sep 2024 dan TPT Agu 2024).
// Posisi titik disederhanakan dari bujur/lintang provinsi (proyeksi
// equirectangular) dan diberi label "peta stilasi" di halaman: ini BUKAN
// peta batas administratif yang akurat. Populasi per provinsi TIDAK dipakai
// di sini karena yang terverifikasi hanya 10 besar — tidak ada angka karangan.

import { PROVINCES } from './data.js';
import { fmtNum } from './format.js';

// Bujur/lintang (kira-kira, pusat provinsi) — hanya untuk penempatan titik.
export const PROVINCE_XY = {
  'Aceh': [95.32, 4.69],
  'Sumatera Utara': [99.0, 2.9],
  'Sumatera Barat': [100.5, -0.8],
  'Riau': [101.5, 0.5],
  'Jambi': [103.0, -1.8],
  'Sumatera Selatan': [104.5, -3.0],
  'Bengkulu': [102.4, -3.8],
  'Lampung': [105.0, -4.8],
  'Kep. Bangka Belitung': [106.1, -2.2],
  'Kepulauan Riau': [104.5, 1.0],
  'DKI Jakarta': [106.8, -6.2],
  'Jawa Barat': [107.6, -6.9],
  'Jawa Tengah': [110.0, -7.2],
  'DI Yogyakarta': [110.4, -7.8],
  'Jawa Timur': [112.7, -7.5],
  'Banten': [106.2, -6.4],
  'Bali': [115.2, -8.4],
  'Nusa Tenggara Barat': [117.5, -8.6],
  'Nusa Tenggara Timur': [120.0, -9.0],
  'Kalimantan Barat': [110.0, 0.0],
  'Kalimantan Tengah': [113.5, -1.5],
  'Kalimantan Selatan': [115.5, -3.0],
  'Kalimantan Timur': [116.5, 0.5],
  'Kalimantan Utara': [117.0, 2.5],
  'Sulawesi Utara': [124.5, 0.8],
  'Sulawesi Tengah': [120.5, -1.0],
  'Sulawesi Selatan': [120.0, -4.0],
  'Sulawesi Tenggara': [122.0, -4.0],
  'Gorontalo': [122.5, 0.7],
  'Sulawesi Barat': [119.0, -2.5],
  'Maluku': [128.5, -3.5],
  'Maluku Utara': [128.0, 1.0],
  'Papua Barat': [132.5, -1.5],
  'Papua Barat Daya': [131.5, -0.8],
  'Papua': [138.5, -4.0],
  'Papua Selatan': [140.0, -6.5],
  'Papua Tengah': [136.5, -4.0],
  'Papua Pegunungan': [139.0, -4.2],
};

// Label pulau/kawasan (teks kecil di atas peta).
const ISLAND_LABELS = [
  ['SUMATERA', 99.2, 1.6],
  ['JAWA', 110.5, -9.6],
  ['KALIMANTAN', 114.3, 2.2],
  ['SULAWESI', 121.6, -2.6],
  ['NUSA TENGGARA', 118.6, -10.6],
  ['MALUKU', 129.2, -5.6],
  ['PAPUA', 137.2, -7.0],
];

const W = 720;
const H = 330;
const LON_MIN = 94.5;
const LON_MAX = 141.0;
const LAT_MAX = 6.5;
const LAT_MIN = -11.5;

function project(lon, lat) {
  const x = 10 + ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * (W - 20);
  const y = 10 + ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * (H - 20);
  return [x, y];
}

// Skala warna yang sama untuk kedua indikator: rendah = teal, tinggi = merah.
const BANDS = {
  kemiskinan: [
    { max: 5, label: '< 5%', color: '#0e6b5c' },
    { max: 8, label: '5–8%', color: '#7ba05b' },
    { max: 12, label: '8–12%', color: '#e8a317' },
    { max: 20, label: '12–20%', color: '#c96f2e' },
    { max: Infinity, label: '> 20%', color: '#a93226' },
  ],
  pengangguran: [
    { max: 3, label: '< 3%', color: '#0e6b5c' },
    { max: 4.5, label: '3–4,5%', color: '#7ba05b' },
    { max: 6, label: '4,5–6%', color: '#e8a317' },
    { max: 6.5, label: '6–6,5%', color: '#c96f2e' },
    { max: Infinity, label: '> 6,5%', color: '#a93226' },
  ],
};

export const MAP_MODES = {
  kemiskinan: {
    label: 'Kemiskinan',
    unit: '%',
    source: 'BPS, Susenas September 2024',
    value: (p) => p.poverty,
    title: (p) => `${p.name} — kemiskinan ${fmtNum(p.poverty, 2)}% (Sep 2024)`,
  },
  pengangguran: {
    label: 'Pengangguran',
    unit: '%',
    source: 'BPS, Sakernas Agustus 2024',
    value: (p) => p.tptAug,
    title: (p) => `${p.name} — TPT ${fmtNum(p.tptAug, 2)}% (Agu 2024)`,
  },
};

function bandFor(mode, value) {
  return BANDS[mode].find((b) => value < b.max) ?? BANDS[mode][BANDS[mode].length - 1];
}

export function provinceMapSvg(mode) {
  const cfg = MAP_MODES[mode];
  const values = PROVINCES.map((p) => cfg.value(p));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const dots = PROVINCES.map((p) => {
    const [lon, lat] = PROVINCE_XY[p.name];
    const [x, y] = project(lon, lat);
    const value = cfg.value(p);
    const r = 6 + ((value - min) / (max - min || 1)) * 5;
    return `<g class="map-dot" data-name="${p.name}" tabindex="0" role="button" aria-label="${cfg.title(p)}. Tekan Enter untuk melihat detail."><title>${cfg.title(p)}</title><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${bandFor(mode, value).color}" stroke="#fff" stroke-width="1.6"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r + 5).toFixed(1)}" fill="transparent"/></g>`;
  }).join('');
  const labels = ISLAND_LABELS.map(([text, lon, lat]) => {
    const [x, y] = project(lon, lat);
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="map-island-label" text-anchor="middle">${text}</text>`;
  }).join('');
  return `<svg id="province-map-svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Peta stilasi Indonesia: satu titik per provinsi, warna menunjukkan ${cfg.label.toLowerCase()}">
    <rect x="0" y="0" width="${W}" height="${H}" rx="10" fill="#eef4f2"/>
    ${labels}${dots}
  </svg>`;
}

export function provinceMapLegend(mode) {
  const cfg = MAP_MODES[mode];
  return `<div class="map-legend" role="list" aria-label="Legenda ${cfg.label}">
    ${BANDS[mode].map((b) => `<span class="map-legend-item" role="listitem"><span class="map-legend-dot" style="background:${b.color}"></span>${b.label}</span>`).join('')}
    <span class="map-legend-unit">${cfg.label} (%)</span>
  </div>`;
}

// Memasang peta ke dalam container. onSelect(name) dipanggil saat sebuah
// titik diklik / ditekan Enter. Mengembalikan { setMode }.
export function renderProvinceMap(container, onSelect) {
  let mode = 'kemiskinan';
  container.innerHTML = `
    <div class="map-head">
      <h2>Peta provinsi</h2>
      <div class="map-toggle" role="group" aria-label="Pilih indikator peta">
        <button type="button" class="map-toggle-btn active" data-mode="kemiskinan">Kemiskinan</button>
        <button type="button" class="map-toggle-btn" data-mode="pengangguran">Pengangguran</button>
      </div>
    </div>
    <div id="hero-map-body"></div>
    <div id="hero-map-legend"></div>
    <p class="map-note">Peta stilasi — posisi provinsi disederhanakan, satu titik per provinsi. Klik titik untuk melihat detail provinsi. <span id="hero-map-source"></span></p>`;

  const body = container.querySelector('#hero-map-body');
  const legend = container.querySelector('#hero-map-legend');
  const source = container.querySelector('#hero-map-source');

  function draw() {
    body.innerHTML = provinceMapSvg(mode);
    legend.innerHTML = provinceMapLegend(mode);
    source.textContent = `Sumber: ${MAP_MODES[mode].source}.`;
    container.querySelectorAll('.map-toggle-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
  }
  draw();

  container.addEventListener('click', (e) => {
    const toggle = e.target.closest('.map-toggle-btn');
    if (toggle) {
      mode = toggle.dataset.mode;
      draw();
      return;
    }
    const dot = e.target.closest('.map-dot');
    if (dot) onSelect(dot.dataset.name);
  });
  container.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('map-dot')) {
      e.preventDefault();
      onSelect(e.target.dataset.name);
    }
  });
  return { setMode: (m) => { mode = m; draw(); } };
}
