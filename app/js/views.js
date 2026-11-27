// Renderer halaman DataNusa. Setiap view mengembalikan HTML; mount(route)
// memasang interaksi (tab, tabel, alat banding) setelah HTML disisipkan.

import { POPULATION, GDP, INFLATION, LABOR, POVERTY, PROVINCES, PROVINCE_POP, SOURCE } from './data.js';
import { fmtNum, fmtInt, fmtJuta, fmtRpTriliun, fmtPersen } from './format.js';
import { lineChart, barChart, hbarChart, donutChart } from './charts.js';
import { dataTable, bindDataTable } from './table.js';
import { estimatePopulation, startPopulationClock } from './clock.js';
import { renderProvinceMap } from './map.js';
import { toCsv, downloadCsv } from './csv.js';

function kpi(label, value, sub) {
  return `<article class="kpi"><p class="kpi-label">${label}</p><p class="kpi-value">${value}</p><p class="kpi-sub">${sub}</p></article>`;
}

function pageHead(title, intro, source) {
  return `<header class="page-head"><h1>${title}</h1><p class="page-intro">${intro}</p><p class="page-source">${source}</p></header>`;
}

function sectionTitle(title, note = '') {
  return `<h2 class="section-title">${title}</h2>${note ? `<p class="section-note">${note}</p>` : ''}`;
}

// ---- Unduh CSV ------------------------------------------------------------------
function csvBar(key, label) {
  return `<div class="csv-bar"><button type="button" class="btn-csv" data-csv="${key}">↓ Unduh CSV — ${label}</button><span class="csv-note">Dibuat dari data di halaman ini · pemisah “;” · sumber: BPS</span></div>`;
}

const CSV_BUILDERS = {
  kependudukan: () => ({
    filename: 'datanusa-kependudukan.csv',
    text: toCsv([
      { title: 'Jumlah penduduk Indonesia per tahun', headers: ['Tahun', 'Penduduk (juta jiwa)'], rows: POPULATION.series.map((d) => [d.year, fmtNum(d.value, 1)]) },
      { title: 'Hasil Sensus Penduduk', headers: ['Tahun', 'Penduduk (juta jiwa)'], rows: POPULATION.census.map((c) => [c.year, fmtNum(c.value, 1)]) },
      { title: '10 provinsi berpenduduk terbanyak, 2024', headers: ['Provinsi', 'Penduduk (jiwa)', 'Pangsa nasional (%)'], rows: POPULATION.topProvinces.map((p) => [p.name, fmtInt(p.pop), fmtNum(p.share, 2)]) },
    ], 'BPS, Proyeksi Penduduk 2024; Sensus Penduduk 2000/2010/2020; Statistical Yearbook of Indonesia 2024'),
  }),
  ekonomi: () => ({
    filename: 'datanusa-ekonomi.csv',
    text: toCsv([
      { title: 'PDB dan pertumbuhan ekonomi', headers: ['Tahun', 'PDB (Rp triliun)', 'Pertumbuhan (%)'], rows: GDP.series.map((d) => [d.year, fmtNum(d.nominal, 1), fmtNum(d.growth, 2)]) },
      { title: 'Lima lapangan usaha penyumbang PDB terbesar, 2024', headers: ['Lapangan usaha', 'Pangsa PDB (%)', 'Pertumbuhan (%)'], rows: GDP.sectors2024.map((s) => [s.name, fmtNum(s.share, 2), s.growth === null ? '—' : fmtNum(s.growth, 2)]) },
      { title: 'Perdagangan luar negeri 2024 (US$ miliar)', headers: ['Komponen', 'Nilai (US$ miliar)'], rows: [['Ekspor', fmtNum(GDP.trade2024.exports, 2)], ['Impor', fmtNum(GDP.trade2024.imports, 2)], ['Surplus', fmtNum(GDP.trade2024.surplus, 2)]] },
    ], 'BPS, Berita Resmi Statistik Pertumbuhan Ekonomi 2024 (5 Februari 2025)'),
  }),
  'tenaga-kerja': () => ({
    filename: 'datanusa-tenaga-kerja.csv',
    text: toCsv([
      { title: 'Tingkat Pengangguran Terbuka', headers: ['Periode', 'TPT (%)'], rows: LABOR.tptSeries.map((d) => [d.label, fmtNum(d.value, 2)]) },
    ], 'BPS, Survei Angkatan Kerja Nasional (Sakernas), Februari dan Agustus 2020–2024'),
  }),
  harga: () => ({
    filename: 'datanusa-harga-inflasi.csv',
    text: toCsv([
      { title: 'Inflasi tahunan (y-on-y, Desember)', headers: ['Tahun', 'Inflasi (%)'], rows: INFLATION.series.map((d) => [d.year, fmtNum(d.value, 2)]) },
    ], 'BPS, Indeks Harga Konsumen (IHK), Desember 2020–2024'),
  }),
  kemiskinan: () => ({
    filename: 'datanusa-kemiskinan.csv',
    text: toCsv([
      { title: 'Persentase penduduk miskin', headers: ['Periode', 'Penduduk miskin (%)'], rows: POVERTY.series.map((d) => [d.label, fmtNum(d.value, 2)]) },
      { title: 'Indeks Pembangunan Manusia', headers: ['Tahun', 'IPM'], rows: POVERTY.ipm.map((d) => [d.year, fmtNum(d.value, 2)]) },
      { title: 'Rasio gini', headers: ['Periode', 'Gini'], rows: POVERTY.gini.map((g) => [g.label, fmtNum(g.value, 3)]) },
    ], 'BPS, Susenas Maret/September 2020–2024; BRS IPM 2024 (15 November 2024)'),
  }),
};

function bindCsvButtons() {
  document.querySelectorAll('[data-csv]').forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const key = btn.dataset.csv;
      if (key === 'provinsi') {
        downloadProvinceCsv();
        return;
      }
      const build = CSV_BUILDERS[key];
      if (!build) return;
      const { filename, text } = build();
      downloadCsv(filename, text);
    });
  });
}

// ---- Mount beranda: jam populasi + peta ------------------------------------------
let stopClock = null;
function mountHome() {
  if (stopClock) {
    stopClock();
    stopClock = null;
  }
  const numberEl = document.getElementById('pop-clock');
  const sinceEl = document.getElementById('pop-clock-since');
  if (numberEl) stopClock = startPopulationClock(numberEl, sinceEl);
  const mapEl = document.getElementById('hero-map');
  if (mapEl) {
    renderProvinceMap(mapEl, (name) => {
      location.hash = `#/provinsi?detail=${encodeURIComponent(name)}`;
    });
  }
}

// Dipanggil router setiap kali halaman dirender.
export function mountPage(view, opts = {}) {
  if (view === 'home') mountHome();
  if (view === 'provinsi') mountProvinces(opts.detail);
  bindCsvButtons();
}

// ---- Beranda ----------------------------------------------------------------
export function viewHome() {
  const gdpGrowth = GDP.series.map((d) => ({ label: String(d.year), value: d.growth }));
  const pop = POPULATION.series.map((d) => ({ label: String(d.year), value: d.value }));
  const cards = [
    { href: '#/kependudukan', title: 'Kependudukan', figure: '281,6 juta jiwa', text: 'Penduduk Indonesia 2024, terbanyak di Jawa Barat.' },
    { href: '#/ekonomi', title: 'Ekonomi', figure: 'Rp22.139 triliun', text: 'PDB 2024, tumbuh 5,03 persen dari tahun sebelumnya.' },
    { href: '#/tenaga-kerja', title: 'Ketenagakerjaan', figure: '4,91%', text: 'Tingkat pengangguran terbuka, Agustus 2024.' },
    { href: '#/harga', title: 'Harga & Inflasi', figure: '1,57%', text: 'Inflasi tahunan Desember 2024, di dalam sasaran.' },
    { href: '#/kemiskinan', title: 'Kemiskinan & Kesejahteraan', figure: '8,57%', text: 'Penduduk miskin September 2024 — 24,06 juta jiwa.' },
    { href: '#/provinsi', title: 'Perbandingan Provinsi', figure: '38 provinsi', text: 'Bandingkan kemiskinan, pengangguran, dan penduduk.' },
  ];
  return `
  <section class="hero hero-v2">
    <div class="hero-copy">
      <p class="hero-eyebrow">Portal Statistik Nasional Indonesia</p>
      <h1 class="hero-title">DataNusa</h1>
      <p class="hero-tag">Angka-angka Indonesia, dari sumber resmi, dalam satu tempat — lengkap dengan sumber dan tahunnya.</p>
      <div class="clock-card" aria-label="Jam populasi Indonesia">
        <p class="clock-label">Penduduk Indonesia saat ini</p>
        <p class="clock-number"><span id="pop-clock">${fmtInt(estimatePopulation())}</span> <span class="clock-unit">jiwa</span></p>
        <p class="clock-since" id="pop-clock-since">+0 jiwa sejak halaman ini dibuka</p>
        <p class="clock-note">Estimasi live — dihitung dari proyeksi BPS 2024 (281.603.900 jiwa, pertengahan 2024) dengan laju +2,9 juta jiwa/tahun (2023→2024). Bukan angka real-time BPS.</p>
      </div>
      <p class="hero-meta">Seluruh angka di situs ini berasal dari Badan Pusat Statistik (BPS). Tidak ada angka yang dikarang.</p>
    </div>
    <div class="hero-map card" id="hero-map" aria-label="Peta provinsi Indonesia"></div>
  </section>
  <section class="kpi-grid" aria-label="Indikator utama">
    ${kpi('Penduduk 2024', '281,6 juta', 'Proyeksi BPS, 2024')}
    ${kpi('PDB 2024', 'Rp22.139 T', 'Tumbuh 5,03% · BPS, 2024')}
    ${kpi('Inflasi 2024', '1,57%', 'y-on-y, Des 2024 · BPS')}
    ${kpi('Pengangguran', '4,91%', 'TPT, Agu 2024 · BPS')}
    ${kpi('Kemiskinan', '8,57%', 'Sep 2024 · 24,06 jt jiwa · BPS')}
    ${kpi('IPM 2024', '75,02', 'Naik 0,63 poin · BPS, 2024')}
  </section>
  <section class="chart-duo">
    <article class="card chart-card">
      <h2>Pertumbuhan ekonomi, 2020–2024</h2>
      <p class="card-sub">Laju pertumbuhan PDB, persen per tahun (BPS)</p>
      ${lineChart(gdpGrowth, { color: '#0e6b5c', valueFmt: (v) => `${fmtNum(v, 2)}%`, aria: 'Grafik garis pertumbuhan ekonomi 2020 sampai 2024' })}
      <p class="card-foot">Ekonomi tumbuh 5,03% pada 2024 — melambat tipis dari 5,05% pada 2023.</p>
    </article>
    <article class="card chart-card">
      <h2>Penduduk Indonesia, 2018–2024</h2>
      <p class="card-sub">Juta jiwa (BPS, proyeksi penduduk)</p>
      ${barChart(pop, { color: '#0e6b5c', valueFmt: (v) => fmtNum(v, 1), aria: 'Grafik batang jumlah penduduk 2018 sampai 2024' })}
      <p class="card-foot">Penduduk bertambah sekitar 3 juta jiwa setiap tahun.</p>
    </article>
  </section>
  <section>
    ${sectionTitle('Jelajahi datanya', 'Enam topik utama — setiap halaman punya chart, tabel, dan sumber yang jelas.')}
    <div class="topic-grid">
      ${cards.map((c) => `<a class="topic-card" href="${c.href}"><h3>${c.title}</h3><p class="topic-figure">${c.figure}</p><p>${c.text}</p><span class="topic-link">Buka halaman →</span></a>`).join('')}
    </div>
  </section>
  <section class="highlights">
    ${sectionTitle('Sorotan dari data', '')}
    <div class="highlight-grid">
      <article class="highlight"><p class="hl-value">3,80%</p><p><strong>Bali</strong> — kemiskinan terendah di Indonesia, September 2024 (BPS).</p></article>
      <article class="highlight"><p class="hl-value">29,66%</p><p><strong>Papua Pegunungan</strong> — kemiskinan tertinggi, September 2024 (BPS).</p></article>
      <article class="highlight"><p class="hl-value">16.165</p><p><strong>DKI Jakarta</strong> — jiwa per km², provinsi terpadat, 2024 (BPS).</p></article>
      <article class="highlight"><p class="hl-value">1,32%</p><p><strong>Papua Pegunungan</strong> — pengangguran terendah, Agustus 2024 (BPS).</p></article>
    </div>
  </section>`;
}

// ---- Kependudukan -------------------------------------------------------------
export function viewPopulation() {
  const pop = POPULATION.series.map((d) => ({ label: String(d.year), value: d.value }));
  const top = POPULATION.topProvinces.map((p) => ({ label: p.name, value: +(p.pop / 1000000).toFixed(2) }));
  return `
  ${pageHead('Kependudukan', 'Berapa banyak penduduk Indonesia, di mana mereka tinggal, dan seberapa cepat jumlahnya bertambah.', 'BPS — Proyeksi Penduduk 2024, Sensus Penduduk 2000/2010/2020, Statistical Yearbook of Indonesia 2024')}
  ${csvBar('kependudukan', 'data kependudukan')}
  <section class="kpi-grid">
    ${kpi('Penduduk 2024', '281,6 juta', 'Proyeksi BPS, pertengahan 2024')}
    ${kpi('Di Pulau Jawa', '55,93%', 'dari seluruh penduduk (BPS, 2024)')}
    ${kpi('Kepadatan DKI Jakarta', '16.165/km²', 'Provinsi terpadat (BPS, 2024)')}
    ${kpi('Sensus 2020', '270,2 juta', 'Sensus Penduduk 2020 (BPS)')}
  </section>
  <section class="card chart-card">
    <h2>Jumlah penduduk, 2018–2024</h2>
    <p class="card-sub">Juta jiwa (BPS, proyeksi penduduk)</p>
    ${lineChart(pop, { color: '#0e6b5c', valueFmt: (v) => fmtNum(v, 1), aria: 'Grafik garis jumlah penduduk 2018 sampai 2024' })}
    <p class="card-foot">Dari 265,0 juta pada 2018 menjadi 281,6 juta pada 2024 — bertambah sekitar 16,6 juta jiwa dalam enam tahun.</p>
  </section>
  <section class="split">
    <article class="card">
      <h2>Hasil sensus penduduk</h2>
      <table class="simple-table">
        <thead><tr><th>Sensus</th><th class="num">Penduduk</th></tr></thead>
        <tbody>
          ${POPULATION.census.map((c) => `<tr><td>${c.year}</td><td class="num">${fmtNum(c.value, 1)} juta jiwa</td></tr>`).join('')}
        </tbody>
      </table>
      <p class="card-foot">Sumber: BPS, Sensus Penduduk 2000, 2010, dan 2020.</p>
    </article>
    <article class="card">
      <h2>Kepadatan di Pulau Jawa, 2024</h2>
      <table class="simple-table">
        <thead><tr><th>Provinsi</th><th class="num">Jiwa/km²</th></tr></thead>
        <tbody>
          <tr><td>DKI Jakarta</td><td class="num">16.165</td></tr>
          <tr><td>Jawa Barat</td><td class="num">1.359</td></tr>
          <tr><td>Banten</td><td class="num">1.329</td></tr>
          <tr><td>Jawa Tengah</td><td class="num">1.104</td></tr>
          <tr><td>Jawa Timur</td><td class="num">870</td></tr>
        </tbody>
      </table>
      <p class="card-foot">Sumber: BPS, 2024. DKI Jakarta lebih dari 11 kali lebih padat dari Jawa Barat.</p>
    </article>
  </section>
  <section class="card chart-card">
    <h2>10 provinsi berpenduduk terbanyak, 2024</h2>
    <p class="card-sub">Juta jiwa (BPS, Statistical Yearbook of Indonesia 2024)</p>
    ${hbarChart(top, { valueFmt: (v) => fmtNum(v, 2), aria: 'Grafik batang 10 provinsi berpenduduk terbanyak 2024' })}
    <p class="card-foot">Jawa Barat menampung 17,88% penduduk Indonesia; tiga provinsi teratas — Jawa Barat, Jawa Timur, Jawa Tengah — menampung 46,19% penduduk nasional.</p>
  </section>`;
}

// ---- Ekonomi -------------------------------------------------------------------
export function viewEconomy() {
  const growth = GDP.series.map((d) => ({ label: String(d.year), value: d.growth }));
  const nominal = GDP.series.map((d) => ({ label: String(d.year), value: d.nominal }));
  const sectors = GDP.sectors2024.map((s) => ({ label: s.name, value: s.share }));
  return `
  ${pageHead('Ekonomi', 'Seberapa besar ekonomi Indonesia, seberapa cepat tumbuhnya, dan sektor apa yang menopangnya.', 'BPS — Berita Resmi Statistik Pertumbuhan Ekonomi 2024 (5 Februari 2025)')}
  ${csvBar('ekonomi', 'data ekonomi')}
  <section class="kpi-grid">
    ${kpi('PDB 2024', 'Rp22.139 T', 'Harga berlaku · BPS, 2024')}
    ${kpi('Tumbuh 2024', '5,03%', 'c-to-c · BPS, 2024')}
    ${kpi('PDB per kapita', 'Rp78,6 jt', 'US$4.960,3 · BPS, 2024')}
    ${kpi('Ekspor 2024', 'US$264,70 M', 'BPS, 2024')}
    ${kpi('Impor 2024', 'US$233,66 M', 'BPS, 2024')}
    ${kpi('Surplus dagang', 'US$31,04 M', 'Ekspor − impor · BPS, 2024')}
  </section>
  <section class="chart-duo">
    <article class="card chart-card">
      <h2>Pertumbuhan ekonomi, 2020–2024</h2>
      <p class="card-sub">Persen per tahun (BPS)</p>
      ${lineChart(growth, { color: '#0e6b5c', valueFmt: (v) => `${fmtNum(v, 2)}%`, aria: 'Grafik garis pertumbuhan ekonomi 2020 sampai 2024' })}
      <p class="card-foot">Kontraksi −2,07% pada 2020 (pandemi), lalu pulih di atas 5% selama tiga tahun berturut-turut.</p>
    </article>
    <article class="card chart-card">
      <h2>PDB atas dasar harga berlaku</h2>
      <p class="card-sub">Rp triliun (BPS)</p>
      ${barChart(nominal, { color: '#e8a317', valueFmt: (v) => fmtInt(v), aria: 'Grafik batang PDB 2020 sampai 2024' })}
      <p class="card-foot">PDB naik dari Rp15.434 triliun (2020) menjadi Rp22.139 triliun (2024).</p>
    </article>
  </section>
  <section class="split">
    <article class="card chart-card">
      <h2>Struktur PDB menurut lapangan usaha, 2024</h2>
      <p class="card-sub">Pangsa terhadap PDB (BPS)</p>
      ${donutChart(sectors, { center: '18,98%', centerSub: 'Industri Pengolahan', valueFmt: (v) => `${fmtNum(v, 2)}%`, aria: 'Grafik donat lima lapangan usaha terbesar 2024' })}
      <p class="card-foot">Lima lapangan usaha terbesar menyumbang 64,90% PDB. Industri pengolahan tumbuh 4,43% pada 2024.</p>
    </article>
    <article class="card">
      <h2>Lapangan usaha paling cepat tumbuh, 2024</h2>
      <table class="simple-table">
        <thead><tr><th>Lapangan usaha</th><th class="num">Tumbuh</th></tr></thead>
        <tbody>
          ${GDP.fastestGrowing2024.map((s) => `<tr><td>${s.name}</td><td class="num">${fmtNum(s.growth, 2)}%</td></tr>`).join('')}
        </tbody>
      </table>
      <p class="card-foot">Sumber: BPS, 2024. Jasa lainnya didorong aktivitas rekreasi dan wisatawan.</p>
      <h2 class="subhead">Menurut pengeluaran, 2024</h2>
      <table class="simple-table">
        <thead><tr><th>Komponen</th><th class="num">Tumbuh</th></tr></thead>
        <tbody>
          ${GDP.expenditureGrowth2024.map((s) => `<tr><td>${s.name}</td><td class="num">${fmtNum(s.growth, 2)}%</td></tr>`).join('')}
        </tbody>
      </table>
      <p class="card-foot">Sumber: BPS, 2024. Konsumsi rumah tangga tetap penopang terbesar PDB.</p>
    </article>
  </section>`;
}

// ---- Ketenagakerjaan -------------------------------------------------------------
export function viewLabor() {
  const tpt = LABOR.tptSeries.map((d) => ({ label: d.label, value: d.value }));
  const top = [...PROVINCES].sort((a, b) => b.tptAug - a.tptAug).slice(0, 10);
  return `
  ${pageHead('Ketenagakerjaan', 'Berapa banyak yang bekerja, berapa yang menganggur, dan di mana pengangguran paling tinggi.', 'BPS — Survei Angkatan Kerja Nasional (Sakernas), Februari dan Agustus 2024')}
  ${csvBar('tenaga-kerja', 'data ketenagakerjaan')}
  <section class="kpi-grid">
    ${kpi('TPT Agu 2024', '4,91%', 'Turun 0,41 poin dari Agu 2023')}
    ${kpi('Angkatan kerja', '152,11 jt', 'Agustus 2024 · BPS')}
    ${kpi('TPAK', '70,63%', 'Agustus 2024 · BPS')}
    ${kpi('Bekerja', '144,64 jt', 'Agustus 2024 · BPS')}
    ${kpi('Penganggur', '7,47 jt', 'Agustus 2024 · BPS')}
    ${kpi('TPT lulusan SMK', '9,01%', 'Tertinggi menurut pendidikan')}
  </section>
  <section class="card chart-card">
    <h2>Tingkat Pengangguran Terbuka, 2020–2024</h2>
    <p class="card-sub">Persen angkatan kerja (BPS, Sakernas)</p>
    ${lineChart(tpt, { color: '#0e6b5c', valueFmt: (v) => `${fmtNum(v, 2)}%`, aria: 'Grafik garis tingkat pengangguran terbuka 2020 sampai 2024' })}
    <p class="card-foot">Pengangguran melonjak ke 7,07% pada Agustus 2020, lalu turun stabil hingga 4,91% pada Agustus 2024 — di bawah level sebelum pandemi.</p>
  </section>
  <section class="split">
    <article class="card">
      <h2>10 provinsi dengan TPT tertinggi, Agustus 2024</h2>
      <table class="simple-table">
        <thead><tr><th>Provinsi</th><th class="num">TPT</th></tr></thead>
        <tbody>
          ${top.map((p) => `<tr><td>${p.name}</td><td class="num">${fmtNum(p.tptAug, 2)}%</td></tr>`).join('')}
        </tbody>
      </table>
      <p class="card-foot">Sumber: BPS, Sakernas Agustus 2024. Rata-rata nasional 4,91%.</p>
    </article>
    <article class="card">
      <h2>Membaca angka ini</h2>
      <p>TPT mengukur penganggur sebagai bagian dari angkatan kerja — bukan dari seluruh penduduk. Karena itu TPT 4,91% berarti sekitar 5 dari 100 orang angkatan kerja sedang mencari pekerjaan.</p>
      <p>Pengangguran paling tinggi ada di kalangan lulusan SMK (9,01% pada Agustus 2024), dan paling rendah di Papua Pegunungan (1,32%) serta Bali (1,79%) — dua provinsi dengan struktur pekerjaan yang sangat berbeda.</p>
      <p><a href="#/provinsi">Bandingkan semua provinsi →</a></p>
    </article>
  </section>`;
}

// ---- Harga & inflasi ---------------------------------------------------------------
export function viewPrices() {
  const inf = INFLATION.series.map((d) => ({ label: String(d.year), value: d.value }));
  return `
  ${pageHead('Harga & Inflasi', 'Seberapa cepat harga naik, dan apakah masih di dalam sasaran.', 'BPS — Indeks Harga Konsumen (IHK), Desember 2024')}
  ${csvBar('harga', 'data inflasi')}
  <section class="kpi-grid">
    ${kpi('Inflasi 2024', '1,57%', 'y-on-y, Des 2024 · BPS')}
    ${kpi('Inflasi 2023', '2,61%', 'y-on-y, Des 2023 · BPS')}
    ${kpi('Inflasi 2022', '5,51%', 'Tertinggi 5 tahun terakhir')}
    ${kpi('Sasaran BI', '2,5% ± 1%', 'Sasaran inflasi Bank Indonesia')}
  </section>
  <section class="card chart-card">
    <h2>Inflasi tahunan, 2020–2024</h2>
    <p class="card-sub">Persen, year-on-year Desember (BPS, IHK)</p>
    ${lineChart(inf, { color: '#0e6b5c', valueFmt: (v) => `${fmtNum(v, 2)}%`, aria: 'Grafik garis inflasi tahunan 2020 sampai 2024' })}
    <p class="card-foot">Inflasi melonjak ke 5,51% pada 2022, lalu turun dua tahun berturut-turut hingga 1,57% pada 2024 — di bawah batas bawah sasaran Bank Indonesia.</p>
  </section>
  <section class="split">
    <article class="card">
      <h2>Apa itu inflasi y-on-y?</h2>
      <p>Angka ini membandingkan Indeks Harga Konsumen (IHK) bulan Desember suatu tahun dengan Desember tahun sebelumnya. Inflasi 1,57% pada Desember 2024 berarti harga-harga rata-rata naik 1,57% dibanding Desember 2023.</p>
      <p>IHK dihitung BPS dari harga barang dan jasa yang dikonsumsi rumah tangga di 90 kota di Indonesia.</p>
    </article>
    <article class="card">
      <h2>Kenapa 2022 melonjak?</h2>
      <p>Inflasi 2022 mencapai 5,51% — tertinggi dalam lima tahun — seiring penyesuaian harga BBM bersubsidi pada September 2022 dan kenaikan harga pangan global. Setelah itu inflasi kembali turun: 2,61% pada 2023 dan 1,57% pada 2024.</p>
      <p>Pada 2024 inflasi berada di bawah sasaran Bank Indonesia (2,5% ± 1%), yang memberi ruang bagi kebijakan moneter yang lebih longgar.</p>
    </article>
  </section>`;
}

// ---- Kemiskinan & kesejahteraan ------------------------------------------------------
export function viewPoverty() {
  const pov = POVERTY.series.map((d) => ({ label: d.label, value: d.value }));
  const ipm = POVERTY.ipm.map((d) => ({ label: String(d.year), value: d.value }));
  const c = POVERTY.ipmComponents2024;
  return `
  ${pageHead('Kemiskinan & Kesejahteraan', 'Berapa banyak penduduk miskin, seberapa timpang pembagian pendapatan, dan bagaimana kualitas hidup membaik.', 'BPS — Susenas Maret/September 2024; BRS IPM 2024 (15 November 2024)')}
  ${csvBar('kemiskinan', 'data kemiskinan & IPM')}
  <section class="kpi-grid">
    ${kpi('Kemiskinan Sep 2024', '8,57%', '24,06 juta jiwa · BPS')}
    ${kpi('Garis kemiskinan', 'Rp595.242', 'per kapita/bulan · Sep 2024')}
    ${kpi('Rasio gini', '0,381', 'September 2024 · BPS')}
    ${kpi('IPM 2024', '75,02', 'Kategori tinggi · BPS')}
  </section>
  <section class="chart-duo">
    <article class="card chart-card">
      <h2>Persentase penduduk miskin, 2020–2024</h2>
      <p class="card-sub">Persen, Maret dan September (BPS, Susenas)</p>
      ${lineChart(pov, { color: '#0e6b5c', valueFmt: (v) => `${fmtNum(v, 2)}%`, aria: 'Grafik garis persentase penduduk miskin 2020 sampai 2024' })}
      <p class="card-foot">Kemiskinan sempat naik ke 10,19% pada September 2020, lalu turun hampir tanpa henti hingga 8,57% pada September 2024 — terendah sepanjang sejarah pengukuran.</p>
    </article>
    <article class="card chart-card">
      <h2>Indeks Pembangunan Manusia, 2020–2024</h2>
      <p class="card-sub">IPM (BPS)</p>
      ${lineChart(ipm, { color: '#e8a317', valueFmt: (v) => fmtNum(v, 2), aria: 'Grafik garis IPM 2020 sampai 2024' })}
      <p class="card-foot">IPM naik dari 72,81 (2020) menjadi 75,02 (2024). Seluruh komponen pembentuknya meningkat.</p>
    </article>
  </section>
  <section class="split">
    <article class="card">
      <h2>Komponen IPM 2024</h2>
      <table class="simple-table">
        <thead><tr><th>Komponen</th><th class="num">Nilai</th></tr></thead>
        <tbody>
          <tr><td>Umur harapan hidup saat lahir</td><td class="num">${fmtNum(c.uhh, 2)} tahun</td></tr>
          <tr><td>Harapan lama sekolah</td><td class="num">${fmtNum(c.hls, 2)} tahun</td></tr>
          <tr><td>Rata-rata lama sekolah (25+)</td><td class="num">${fmtNum(c.rls, 2)} tahun</td></tr>
          <tr><td>Pengeluaran riil per kapita/tahun</td><td class="num">Rp${fmtNum(c.spending, 2)} jt</td></tr>
        </tbody>
      </table>
      <p class="card-foot">Sumber: BPS, BRS IPM 2024. Pengeluaran riil naik ${fmtNum(c.spendingGrowth, 2)}% dari 2023. Rata-rata lama sekolah 8,85 tahun setara kelas 3 SMP.</p>
    </article>
    <article class="card">
      <h2>Rasio gini, 2023–2024</h2>
      <table class="simple-table">
        <thead><tr><th>Periode</th><th class="num">Gini</th></tr></thead>
        <tbody>
          ${POVERTY.gini.map((g) => `<tr><td>${g.label}</td><td class="num">${fmtNum(g.value, 3)}</td></tr>`).join('')}
        </tbody>
      </table>
      <p class="card-foot">Sumber: BPS. Gini 0 berarti pembagian pendapatan merata sempurna; 1 berarti satu orang menguasai semuanya. Angka Indonesia bergerak di kisaran 0,38 — ketimpangan moderat dan relatif stabil.</p>
      <h2 class="subhead">Garis kemiskinan</h2>
      <p>Garis kemiskinan September 2024 adalah Rp595.242 per kapita per bulan — naik dari Rp582.932 pada Maret 2024. Penduduk dengan pengeluaran di bawah garis itu dikategorikan miskin.</p>
    </article>
  </section>`;
}

// ---- Perbandingan provinsi --------------------------------------------------------------
const PROV_TABS = [
  { key: 'penduduk', label: 'Penduduk' },
  { key: 'kemiskinan', label: 'Kemiskinan' },
  { key: 'pengangguran', label: 'Pengangguran' },
];

export function viewProvinces() {
  const compareOptions = POPULATION.topProvinces.map((p) => `<option value="${p.name}">${p.name}</option>`).join('');
  return `
  ${pageHead('Perbandingan Provinsi', 'Bandingkan 38 provinsi: penduduknya, tingkat kemiskinannya, dan tingkat penganggurannya. Pilih indikator, urutkan tabelnya, atau bandingkan tiga provinsi sekaligus.', 'BPS — Proyeksi Penduduk 2024; Susenas September 2024; Sakernas Agustus 2024')}
  ${csvBar('provinsi', 'tabel provinsi yang tampil')}
  <section class="card">
    <div class="tabs" role="tablist" aria-label="Pilih indikator">
      ${PROV_TABS.map((t, i) => `<button class="tab${i === 0 ? ' active' : ''}" role="tab" aria-selected="${i === 0}" data-tab="${t.key}">${t.label}</button>`).join('')}
    </div>
    <div id="prov-detail"></div>
    <div id="prov-panel"></div>
  </section>
  <section class="card">
    <h2>Bandingkan tiga provinsi</h2>
    <p class="card-sub">Pilih tiga provinsi dari 10 provinsi berpenduduk terbanyak — semua indikatornya tersedia.</p>
    <div class="compare-picks">
      <label>Provinsi A <select id="cmp-a" class="cmp-select">${compareOptions}</select></label>
      <label>Provinsi B <select id="cmp-b" class="cmp-select">${compareOptions}</select></label>
      <label>Provinsi C <select id="cmp-c" class="cmp-select">${compareOptions}</select></label>
    </div>
    <div id="cmp-cards" class="compare-cards"></div>
  </section>`;
}

function provRows(indicator) {
  if (indicator === 'penduduk') {
    return POPULATION.topProvinces.map((p) => ({
      name: p.name,
      value: p.pop,
      display: fmtInt(p.pop),
      share: p.share,
    }));
  }
  if (indicator === 'kemiskinan') {
    return [...PROVINCES].sort((a, b) => b.poverty - a.poverty).map((p) => ({
      name: p.name,
      value: p.poverty,
      display: `${fmtNum(p.poverty, 2)}%`,
    }));
  }
  return [...PROVINCES].sort((a, b) => b.tptAug - a.tptAug).map((p) => ({
    name: p.name,
    value: p.tptAug,
    display: `${fmtNum(p.tptAug, 2)}%`,
    feb: p.tptFeb,
  }));
}

let currentProvTab = 'penduduk';

function renderProvTab(indicator) {
  const panel = document.getElementById('prov-panel');
  if (!panel) return;
  currentProvTab = indicator;
  const rows = provRows(indicator);
  const top10 = rows.slice(0, 10);
  const isPop = indicator === 'penduduk';
  const unit = isPop ? 'jiwa' : '%';
  const title = isPop
    ? '10 provinsi berpenduduk terbanyak, 2024'
    : indicator === 'kemiskinan'
      ? '10 provinsi dengan kemiskinan tertinggi, September 2024'
      : '10 provinsi dengan pengangguran tertinggi, Agustus 2024';
  const src = isPop
    ? 'Sumber: BPS, Statistical Yearbook of Indonesia 2024.'
    : indicator === 'kemiskinan'
      ? 'Sumber: BPS, Susenas September 2024. Rata-rata nasional 8,57%.'
      : 'Sumber: BPS, Sakernas Agustus 2024. Rata-rata nasional 4,91%.';
  const chart = hbarChart(top10.map((r) => ({ label: r.name, value: r.value })), {
    valueFmt: (v) => (isPop ? fmtInt(v) : `${fmtNum(v, 2)}%`),
    aria: `Grafik batang ${title}`,
  });
  const columns = isPop
    ? [
        { key: 'name', label: 'Provinsi', fmt: (r) => r.name },
        { key: 'value', label: 'Penduduk 2024', fmt: (r) => fmtInt(r.value), num: (r) => r.value, align: true },
        { key: 'share', label: 'Pangsa nasional', fmt: (r) => `${fmtNum(r.share, 2)}%`, num: (r) => r.share, align: true },
      ]
    : indicator === 'kemiskinan'
      ? [
          { key: 'name', label: 'Provinsi', fmt: (r) => r.name },
          { key: 'value', label: 'Kemiskinan Sep 2024', fmt: (r) => `${fmtNum(r.value, 2)}%`, num: (r) => r.value, align: true },
        ]
      : [
          { key: 'name', label: 'Provinsi', fmt: (r) => r.name },
          { key: 'feb', label: 'TPT Feb 2024', fmt: (r) => `${fmtNum(r.feb, 2)}%`, num: (r) => r.feb, align: true },
          { key: 'value', label: 'TPT Agu 2024', fmt: (r) => `${fmtNum(r.value, 2)}%`, num: (r) => r.value, align: true },
        ];
  panel.innerHTML = `<h2>${title}</h2><p class="card-sub">${src}</p>${chart}
    <div class="table-tools table-tools-top">
      <label class="filter-label" for="prov-sort">Urutkan:</label>
      <select id="prov-sort" class="sort-select">
        <option value="desc">Tertinggi dulu</option>
        <option value="asc">Terendah dulu</option>
        <option value="az">Nama A–Z</option>
      </select>
      <span class="table-hint">Klik baris untuk melihat detail provinsi · klik judul kolom untuk mengurutkan</span>
    </div>
    ${dataTable('prov-table', columns, rows, { filterLabel: 'provinsi', filterPlaceholder: 'Cari provinsi…', source: src })}`;
  const tableApi = bindDataTable('prov-table', columns, rows);
  const sortSelect = document.getElementById('prov-sort');
  if (sortSelect && tableApi) {
    sortSelect.addEventListener('change', () => {
      if (sortSelect.value === 'desc') tableApi.setSort('value', -1);
      else if (sortSelect.value === 'asc') tableApi.setSort('value', 1);
      else tableApi.setSort('name', 1);
    });
  }
}

function provinceByName(name) {
  const p = PROVINCES.find((x) => x.name === name);
  const pop = PROVINCE_POP[name] ?? null;
  const share = POPULATION.topProvinces.find((x) => x.name === name)?.share ?? null;
  return { ...p, pop, share };
}

// ---- Detail per provinsi -------------------------------------------------------
function rankOf(key, name) {
  const sorted = [...PROVINCES].sort((a, b) => b[key] - a[key]);
  return sorted.findIndex((p) => p.name === name) + 1;
}

function detailBar(value, max) {
  return `<div class="detail-bar"><span style="width:${((value / max) * 100).toFixed(1)}%"></span></div>`;
}

function openProvinceDetail(name, scroll = true) {
  const wrap = document.getElementById('prov-detail');
  const p = PROVINCES.find((x) => x.name === name);
  if (!wrap || !p) return false;
  const pop = PROVINCE_POP[name] ?? null;
  const share = POPULATION.topProvinces.find((x) => x.name === name)?.share ?? null;
  const maxPov = Math.max(...PROVINCES.map((x) => x.poverty));
  const maxTpt = Math.max(...PROVINCES.map((x) => Math.max(x.tptFeb, x.tptAug)));
  const maxPop = Math.max(...POPULATION.topProvinces.map((x) => x.pop));
  const popRank = pop === null ? null : POPULATION.topProvinces.findIndex((x) => x.name === name) + 1;
  wrap.innerHTML = `<article class="prov-detail-card" aria-label="Detail ${name}">
    <div class="prov-detail-head">
      <h3>${name}</h3>
      <button type="button" id="prov-detail-close" class="btn-close" aria-label="Tutup detail">Tutup ×</button>
    </div>
    <div class="prov-detail-grid">
      <div>
        <p class="kpi-label">Kemiskinan · Sep 2024</p>
        <p class="kpi-value">${fmtNum(p.poverty, 2)}%</p>
        <p class="kpi-sub">Peringkat #${rankOf('poverty', name)} dari 38 · rata-rata nasional 8,57%</p>
        ${detailBar(p.poverty, maxPov)}
      </div>
      <div>
        <p class="kpi-label">Pengangguran · Agu 2024</p>
        <p class="kpi-value">${fmtNum(p.tptAug, 2)}%</p>
        <p class="kpi-sub">Peringkat #${rankOf('tptAug', name)} dari 38 · rata-rata nasional 4,91%</p>
        ${detailBar(p.tptAug, maxTpt)}
      </div>
      <div>
        <p class="kpi-label">Pengangguran · Feb 2024</p>
        <p class="kpi-value">${fmtNum(p.tptFeb, 2)}%</p>
        <p class="kpi-sub">Perubahan Feb → Agu 2024: ${p.tptAug >= p.tptFeb ? '+' : ''}${fmtNum(p.tptAug - p.tptFeb, 2)} poin</p>
        ${detailBar(p.tptFeb, maxTpt)}
      </div>
      <div>
        <p class="kpi-label">Penduduk · 2024</p>
        ${pop === null
          ? `<p class="kpi-value">—</p><p class="kpi-sub">Tidak tersedia — BPS memublikasikan penduduk per provinsi hanya untuk 10 provinsi terbesar di sumber yang dipakai situs ini.</p>`
          : `<p class="kpi-value">${fmtInt(pop)} jiwa</p><p class="kpi-sub">Pangsa nasional ${fmtNum(share, 2)}% · peringkat penduduk #${popRank} dari 10 besar</p>${detailBar(pop, maxPop)}`}
      </div>
    </div>
    <p class="card-foot">Sumber: BPS, Susenas September 2024; Sakernas Februari &amp; Agustus 2024; penduduk: BPS, Statistical Yearbook of Indonesia 2024.</p>
  </article>`;
  document.getElementById('prov-detail-close').addEventListener('click', () => {
    wrap.innerHTML = '';
  });
  if (scroll) wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  return true;
}

function downloadProvinceCsv() {
  const rows = provRows(currentProvTab);
  const isPop = currentProvTab === 'penduduk';
  const title = isPop
    ? '10 provinsi berpenduduk terbanyak, 2024'
    : currentProvTab === 'kemiskinan'
      ? 'Persentase penduduk miskin per provinsi, September 2024'
      : 'Tingkat Pengangguran Terbuka per provinsi, Februari dan Agustus 2024';
  const headers = isPop
    ? ['Provinsi', 'Penduduk 2024 (jiwa)', 'Pangsa nasional (%)']
    : currentProvTab === 'kemiskinan'
      ? ['Provinsi', 'Kemiskinan Sep 2024 (%)']
      : ['Provinsi', 'TPT Feb 2024 (%)', 'TPT Agu 2024 (%)'];
  const csvRows = rows.map((r) => (isPop
    ? [r.name, fmtInt(r.value), fmtNum(r.share, 2)]
    : currentProvTab === 'kemiskinan'
      ? [r.name, fmtNum(r.value, 2)]
      : [r.name, fmtNum(r.feb, 2), fmtNum(r.value, 2)]));
  const source = isPop
    ? 'BPS, Statistical Yearbook of Indonesia 2024'
    : currentProvTab === 'kemiskinan'
      ? 'BPS, Susenas September 2024 (BRS Profil Kemiskinan per provinsi, Januari 2025)'
      : 'BPS, Sakernas Februari dan Agustus 2024';
  downloadCsv(`datanusa-provinsi-${currentProvTab}.csv`, toCsv([{ title, headers, rows: csvRows }], source));
}

function renderCompare() {
  const wrap = document.getElementById('cmp-cards');
  if (!wrap) return;
  const picks = ['cmp-a', 'cmp-b', 'cmp-c'].map((id) => {
    const el = document.getElementById(id);
    return el && (el.value || el.options[0]?.value);
  }).filter(Boolean);
  const maxPop = Math.max(...POPULATION.topProvinces.map((p) => p.pop));
  const maxPov = Math.max(...PROVINCES.map((p) => p.poverty));
  const maxTpt = Math.max(...PROVINCES.map((p) => p.tptAug));
  wrap.innerHTML = picks
    .map((name) => {
      const d = provinceByName(name);
      const bar = (val, max) =>
        `<div class="mini-bar"><span style="width:${((val / max) * 100).toFixed(1)}%"></span></div>`;
      return `<article class="cmp-card">
        <h3>${d.name}</h3>
        <div class="cmp-row"><span>Penduduk 2024</span><strong>${fmtInt(d.pop)} jiwa</strong></div>${bar(d.pop, maxPop)}
        <div class="cmp-row"><span>Kemiskinan Sep 2024</span><strong>${fmtNum(d.poverty, 2)}%</strong></div>${bar(d.poverty, maxPov)}
        <div class="cmp-row"><span>Pengangguran Agu 2024</span><strong>${fmtNum(d.tptAug, 2)}%</strong></div>${bar(d.tptAug, maxTpt)}
        <p class="cmp-note">Pangsa penduduk nasional ${fmtNum(d.share, 2)}% · TPT Feb 2024 ${fmtNum(d.tptFeb, 2)}%</p>
      </article>`;
    })
    .join('');
}

export function mountProvinces(detailName) {
  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      renderProvTab(btn.dataset.tab);
    });
  });
  renderProvTab('penduduk');
  // Klik baris tabel -> panel detail provinsi.
  const panel = document.getElementById('prov-panel');
  if (panel) {
    panel.addEventListener('click', (e) => {
      const tr = e.target.closest('tbody tr');
      if (!tr) return;
      const name = tr.querySelector('td')?.textContent?.trim();
      if (name) openProvinceDetail(name);
    });
  }
  // Detail langsung dari peta beranda: #/provinsi?detail=Nama.
  if (detailName) openProvinceDetail(detailName, false);
  const a = document.getElementById('cmp-a');
  const b = document.getElementById('cmp-b');
  const c = document.getElementById('cmp-c');
  if (a && b && c) {
    a.value = 'Jawa Barat';
    b.value = 'Jawa Timur';
    c.value = 'DKI Jakarta';
    [a, b, c].forEach((s) => s.addEventListener('change', renderCompare));
    renderCompare();
  }
}

// ---- Tentang ------------------------------------------------------------------
export function viewAbout() {
  return `
  ${pageHead('Tentang DataNusa', 'Situs independen yang menyajikan statistik nasional Indonesia dari sumber resmi — dirancang agar mudah dibaca di desktop maupun di ponsel.', 'Seluruh angka: Badan Pusat Statistik (BPS)')}
  <section class="card">
    <h2>Apa itu DataNusa?</h2>
    <p>DataNusa adalah portal statistik nasional Indonesia yang dibuat dari nol: desainnya orisinal, chart-nya digambar dari kode sendiri, dan semua angkanya diambil dari publikasi resmi Badan Pusat Statistik (BPS). Situs ini tidak berafiliasi dengan BPS dan bukan tiruan situs mana pun.</p>
    <p>Setiap angka di situs ini dicantumkan bersama sumber dan tahunnya, supaya pembaca bisa memeriksa sendiri ke publikasi BPS yang bersangkutan.</p>
  </section>
  <section class="card">
    <h2>Metodologi & sumber</h2>
    <table class="simple-table">
      <thead><tr><th>Topik</th><th>Sumber</th></tr></thead>
      <tbody>
        <tr><td>Jumlah penduduk &amp; provinsi</td><td>BPS, Proyeksi Penduduk 2024; Statistical Yearbook of Indonesia 2024</td></tr>
        <tr><td>Sensus penduduk</td><td>BPS, Sensus Penduduk 2000, 2010, 2020</td></tr>
        <tr><td>PDB &amp; pertumbuhan ekonomi</td><td>BPS, Berita Resmi Statistik Pertumbuhan Ekonomi, rilis 5 Februari 2025</td></tr>
        <tr><td>Inflasi</td><td>BPS, Indeks Harga Konsumen, Desember 2024</td></tr>
        <tr><td>Pengangguran</td><td>BPS, Survei Angkatan Kerja Nasional (Sakernas), Februari &amp; Agustus 2024</td></tr>
        <tr><td>Kemiskinan &amp; garis kemiskinan</td><td>BPS, Susenas Maret &amp; September 2024; BRS Profil Kemiskinan per provinsi, Januari 2025</td></tr>
        <tr><td>Ketimpangan (gini)</td><td>BPS, 2023–2024</td></tr>
        <tr><td>IPM &amp; komponennya</td><td>BPS, Berita Resmi Statistik IPM 2024, 15 November 2024</td></tr>
      </tbody>
    </table>
    <p class="card-foot">Angka penduduk provinsi dibulatkan ke ratusan jiwa sesuai publikasi BPS. Persentase ditampilkan dua desimal. Situs ini berjalan sepenuhnya offline: tidak ada permintaan jaringan, tidak ada pelacak, tidak ada cookie.</p>
  </section>
  <section class="card">
    <h2>Kenapa angka bisa berbeda dengan sumber lain?</h2>
    <p>Angka kependudukan BPS (proyeksi) dan angka administrasi Dukcapil (registrasi) dihitung dengan cara berbeda sehingga nilainya tidak sama persis. DataNusa memakai angka BPS agar konsisten antar-topik. Jika sebuah angka diperbarui BPS lewat revisi, halaman ini mengikuti rilis BPS terbaru yang dikutip di atas.</p>
  </section>`;
}

export const VIEWS = {
  home: viewHome,
  kependudukan: viewPopulation,
  ekonomi: viewEconomy,
  'tenaga-kerja': viewLabor,
  harga: viewPrices,
  kemiskinan: viewPoverty,
  provinsi: viewProvinces,
  tentang: viewAbout,
};

export { SOURCE };
