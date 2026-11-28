// Renderer halaman DataNusa. Setiap view mengembalikan HTML; mount(route)
// memasang interaksi (tab, tabel, alat banding) setelah HTML disisipkan.

import { POPULATION, GDP, INFLATION, LABOR, POVERTY, PROVINCES, PROVINCE_POP, NATIONAL_POP_2025, FIGURE_COUNT, SOURCE } from './data.js';
import { cpiIndex, convertAmount, CPI_YEARS, CPI_INDEX } from './calculator.js';
import { fmtNum, fmtInt, fmtJuta, fmtRpTriliun, fmtPersen } from './format.js';
import { lineChart, barChart, hbarChart, donutChart } from './charts.js';
import { dataTable, bindDataTable } from './table.js';
import { estimatePopulation, startPopulationClock } from './clock.js';
import { renderProvinceMap } from './map.js';
import { toCsv, downloadCsv } from './csv.js';
import { ASEAN_COUNTRIES } from './asean.js';

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
function csvBar(key, label, source = 'BPS') {
  return `<div class="csv-bar"><button type="button" class="btn-csv" data-csv="${key}">↓ Unduh CSV — ${label}</button><span class="csv-note">Dibuat dari data di halaman ini · pemisah “;” · sumber: ${source}</span></div>`;
}

const CSV_BUILDERS = {
  kependudukan: () => ({
    filename: 'datanusa-kependudukan.csv',
    text: toCsv([
      { title: 'Jumlah penduduk Indonesia per tahun', headers: ['Tahun', 'Penduduk (juta jiwa)'], rows: POPULATION.series.map((d) => [d.year, fmtNum(d.value, 1)]) },
      { title: 'Hasil Sensus Penduduk', headers: ['Tahun', 'Penduduk (juta jiwa)'], rows: POPULATION.census.map((c) => [c.year, fmtNum(c.value, 1)]) },
      { title: '10 provinsi berpenduduk terbanyak, 2025', headers: ['Provinsi', 'Penduduk (jiwa)', 'Pangsa nasional (%)'], rows: POPULATION.topProvinces.map((p) => [p.name, fmtInt(p.pop), fmtNum(p.share, 2)]) },
    ], 'BPS, Proyeksi Penduduk 2024; Sensus Penduduk 2000/2010/2020; Statistik Indonesia 2026, Tabel 3'),
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
  asean: () => ({
    filename: 'datanusa-asean.csv',
    text: toCsv([
      { title: 'Perbandingan ASEAN — 6 negara', headers: ['Negara', 'Penduduk 2024 (jiwa)', 'PDB 2024 (US$)', 'Inflasi 2024 (%)', 'Pengangguran 2024 (%)', 'Kemiskinan (%)', 'Tahun kemiskinan'], rows: ASEAN_COUNTRIES.map((c) => [c.name, fmtInt(c.population.value), fmtInt(c.gdp.value), fmtNum(c.inflation.value, 1), fmtNum(c.unemployment.value, 1), c.poverty ? fmtNum(c.poverty.value, 1) : 'Tidak ada garis kemiskinan nasional resmi', c.poverty ? c.poverty.year : '']) },
    ], 'World Bank, World Development Indicators (WDI) 2024; kemiskinan: SI.POV.NAHC, tahun terbaru per negara; pengangguran: estimasi model ILO (SL.UEM.TOTL.ZS)'),
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
  if (view === 'calculator') mountCalculator();
  if (view === 'asean') mountAsean();
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
    { href: '#/kalkulator', title: 'Kalkulator Inflasi', figure: 'Rp1 jt (2020) → Rp1.120.199 (2024)', text: 'Berapa nilai rupiahmu dulu dalam harga hari ini — dihitung dari IHK BPS.' },
    { href: '#/provinsi', title: 'Perbandingan Provinsi', figure: '38 provinsi', text: 'Bandingkan kemiskinan, pengangguran, dan penduduk.' },
    { href: '#/asean', title: 'Perbandingan ASEAN', figure: '6 negara', text: 'Indonesia vs Singapura, Malaysia, Thailand, Vietnam, dan Filipina — penduduk, PDB, inflasi, pengangguran, dan kemiskinan.' },
  ];
  const pageCount = Object.keys(VIEWS).length;
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
      <p class="hero-meta">Angka Indonesia di situs ini berasal dari Badan Pusat Statistik (BPS); perbandingan ASEAN dari World Bank. Tidak ada angka yang dikarang.</p>
      <p class="figure-strip" aria-label="Ringkasan isi situs"><strong>${fmtInt(FIGURE_COUNT)} angka</strong> statistik · <strong>${PROVINCES.length} provinsi</strong> · <strong>${pageCount} halaman</strong> · semua bersumber + tahun (BPS & World Bank)</p>
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
    ${sectionTitle('Jelajahi datanya', 'Delapan topik utama — setiap halaman punya chart, tabel, dan sumber yang jelas.')}
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
  ${pageHead('Kependudukan', 'Berapa banyak penduduk Indonesia, di mana mereka tinggal, dan seberapa cepat jumlahnya bertambah.', 'BPS — Proyeksi Penduduk 2024, Sensus Penduduk 2000/2010/2020, Statistik Indonesia 2026, Tabel 3')}
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
    <h2>10 provinsi berpenduduk terbanyak, 2025</h2>
    <p class="card-sub">Juta jiwa (BPS, Statistik Indonesia 2026, Tabel 3)</p>
    ${hbarChart(top, { valueFmt: (v) => fmtNum(v, 2), aria: 'Grafik batang 10 provinsi berpenduduk terbanyak 2025' })}
    <p class="card-foot">Jawa Barat menampung 17,85% penduduk Indonesia; tiga provinsi teratas — Jawa Barat, Jawa Timur, Jawa Tengah — menampung 46,09% penduduk nasional.</p>
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

// ---- Kalkulator inflasi ---------------------------------------------------------
export function viewCalculator() {
  const yearOptions = (selected) => CPI_YEARS.map((y) => `<option value="${y}"${y === selected ? ' selected' : ''}>${y}</option>`).join('');
  const inflByYear = new Map(INFLATION.series.map((d) => [d.year, d.value]));
  return `
  ${pageHead('Kalkulator Inflasi', 'Berapa nilai rupiah dari tahun lalu dalam harga tahun lain? Kalkulator ini mengubah nilai uang memakai Indeks Harga Konsumen (IHK) Desember dari BPS.', 'BPS — Indeks Harga Konsumen (IHK), Desember 2020–2024')}
  <section class="card calc-card">
    <h2>Hitung nilai rupiah antar tahun</h2>
    <form id="calc-form" class="calc-form">
      <label>Jumlah (Rp)
        <input id="calc-amount" type="number" min="1" step="1" value="1000000" inputmode="numeric" aria-label="Jumlah dalam rupiah">
      </label>
      <label>Dari tahun
        <select id="calc-from" aria-label="Tahun asal">${yearOptions(2020)}</select>
      </label>
      <label>Ke tahun
        <select id="calc-to" aria-label="Tahun tujuan">${yearOptions(2024)}</select>
      </label>
      <button type="submit" class="btn-calc">Hitung</button>
    </form>
    <div id="calc-result" class="calc-result" aria-live="polite"></div>
    <p class="card-foot">Contoh: Rp1.000.000 pada 2020 setara Rp1.120.199 pada 2024 — harga-harga naik 12,02% dalam empat tahun itu menurut IHK Desember BPS.</p>
  </section>
  <section class="card">
    <h2>Indeks Harga Konsumen yang dipakai, Desember 2019 = 100</h2>
    <p class="card-sub">Dihitung dari inflasi tahunan (y-on-y) Desember BPS: tiap indeks = indeks tahun sebelumnya × (1 + inflasi/100).</p>
    <table class="simple-table">
      <thead><tr><th>Desember</th><th class="num">Inflasi y-on-y</th><th class="num">Indeks IHK</th></tr></thead>
      <tbody>
        <tr><td>2019</td><td class="num">—</td><td class="num">100,00</td></tr>
        ${CPI_YEARS.map((y) => `<tr><td>${y}</td><td class="num">${fmtNum(inflByYear.get(y), 2)}%</td><td class="num">${fmtNum(CPI_INDEX[y], 2)}</td></tr>`).join('')}
      </tbody>
    </table>
    <p class="card-foot">Sumber: BPS, Indeks Harga Konsumen (IHK), Desember 2020–2024.</p>
  </section>
  <section class="card">
    <h2>Yang perlu diketahui</h2>
    <p>Kalkulator ini memakai <strong>inflasi tahunan Desember</strong> (year-on-year): perbandingan IHK bulan Desember suatu tahun dengan Desember tahun sebelumnya. Hasilnya adalah perkiraan daya beli berdasarkan harga rata-rata nasional — bukan IHK bulanan, dan bukan harga barang tertentu di kotamu.</p>
    <p>Hanya tahun 2020–2024 yang bisa dipilih, karena hanya itu data inflasi Desember yang tersedia di situs ini. Nilai hasil dibulatkan ke rupiah terdekat.</p>
    <p><a href="#/harga">Lihat tren inflasi 2020–2024 →</a></p>
  </section>`;
}

export function mountCalculator() {
  const form = document.getElementById('calc-form');
  const result = document.getElementById('calc-result');
  if (!form || !result) return;
  const amountEl = document.getElementById('calc-amount');
  const fromEl = document.getElementById('calc-from');
  const toEl = document.getElementById('calc-to');

  function render() {
    const amount = Number(amountEl.value);
    const fromYear = Number(fromEl.value);
    const toYear = Number(toEl.value);
    if (!(amount > 0) || !Number.isFinite(amount)) {
      result.innerHTML = `<p class="calc-error">Masukkan jumlah lebih dari Rp0 — misalnya 1000000.</p>`;
      return;
    }
    const fromIdx = cpiIndex(fromYear);
    const toIdx = cpiIndex(toYear);
    if (fromIdx === null || toIdx === null) {
      result.innerHTML = `<p class="calc-error">Tahun di luar 2020–2024 tidak tersedia.</p>`;
      return;
    }
    if (fromYear === toYear) {
      result.innerHTML = `<p class="calc-value">Rp${fmtInt(amount)}</p>
        <p class="calc-sentence">Rp${fmtInt(amount)} pada ${fromYear} setara Rp${fmtInt(amount)} pada ${toYear} — tahunnya sama, jadi nilainya tidak berubah.</p>
        <p class="calc-detail">Indeks IHK Desember ${fromYear}: ${fmtNum(fromIdx, 2)} (Des 2019 = 100). Sumber: BPS, IHK.</p>`;
      return;
    }
    const converted = convertAmount(amount, fromYear, toYear);
    const change = ((toIdx / fromIdx) - 1) * 100;
    const direction = change >= 0 ? 'naik' : 'turun';
    result.innerHTML = `<p class="calc-value">Rp${fmtInt(converted)}</p>
      <p class="calc-sentence">Rp${fmtInt(amount)} pada ${fromYear} setara Rp${fmtInt(converted)} pada ${toYear}.</p>
      <p class="calc-detail">Harga-harga ${direction} ${fmtNum(Math.abs(change), 2)}% dari Desember ${fromYear} ke Desember ${toYear} (indeks IHK ${fmtNum(fromIdx, 2)} → ${fmtNum(toIdx, 2)}; Des 2019 = 100). Sumber: BPS, IHK.</p>`;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    render();
  });
  [amountEl, fromEl, toEl].forEach((el) => el.addEventListener('input', render));
  render();
}

// ---- Perbandingan provinsi --------------------------------------------------------------
const PROV_TABS = [
  { key: 'penduduk', label: 'Penduduk' },
  { key: 'kemiskinan', label: 'Kemiskinan' },
  { key: 'pengangguran', label: 'Pengangguran' },
];

export function viewProvinces() {
  const compareOptions = PROVINCES.map((p) => `<option value="${p.name}">${p.name}</option>`).join('');
  return `
  ${pageHead('Perbandingan Provinsi', 'Bandingkan 38 provinsi: penduduknya, tingkat kemiskinannya, dan tingkat penganggurannya. Pilih indikator, urutkan tabelnya, atau bandingkan tiga provinsi sekaligus.', 'BPS — Statistik Indonesia 2026, Tabel 3; Susenas September 2024; Sakernas Agustus 2024')}
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
    <p class="card-sub">Pilih tiga provinsi dari 38 provinsi — semua indikatornya tersedia.</p>
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
    // Semua 38 provinsi, terurut dari yang terbanyak. Angka BPS asli dalam
    // ribuan (1 desimal), jadi ditampilkan dalam jutaan (2 desimal).
    return Object.entries(PROVINCE_POP)
      .map(([name, pop]) => ({
        name,
        value: pop,
        display: `${fmtNum(pop / 1000000, 2)} juta`,
        share: (pop / NATIONAL_POP_2025) * 100,
      }))
      .sort((a, b) => b.value - a.value);
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
    ? '10 provinsi berpenduduk terbanyak, 2025'
    : indicator === 'kemiskinan'
      ? '10 provinsi dengan kemiskinan tertinggi, September 2024'
      : '10 provinsi dengan pengangguran tertinggi, Agustus 2024';
  const src = isPop
    ? 'Sumber: BPS, Statistik Indonesia 2026, Tabel 3. Tabel di bawah memuat semua 38 provinsi; grafik hanya 10 teratas.'
    : indicator === 'kemiskinan'
      ? 'Sumber: BPS, Susenas September 2024. Rata-rata nasional 8,57%.'
      : 'Sumber: BPS, Sakernas Agustus 2024. Rata-rata nasional 4,91%.';
  const chart = hbarChart(top10.map((r) => ({ label: r.name, value: r.value })), {
    valueFmt: (v) => (isPop ? `${fmtNum(v / 1000000, 2)} jt` : `${fmtNum(v, 2)}%`),
    aria: `Grafik batang ${title}`,
  });
  const columns = isPop
    ? [
        { key: 'name', label: 'Provinsi', fmt: (r) => r.name },
        { key: 'value', label: 'Penduduk 2025', fmt: (r) => `${fmtNum(r.value / 1000000, 2)} juta`, num: (r) => r.value, align: true },
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
  const share = pop === null ? null : (pop / NATIONAL_POP_2025) * 100;
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
  const share = pop === null ? null : (pop / NATIONAL_POP_2025) * 100;
  const maxPov = Math.max(...PROVINCES.map((x) => x.poverty));
  const maxTpt = Math.max(...PROVINCES.map((x) => Math.max(x.tptFeb, x.tptAug)));
  const maxPop = Math.max(...Object.values(PROVINCE_POP));
  const popRank = pop === null
    ? null
    : Object.values(PROVINCE_POP).filter((v) => v > pop).length + 1;
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
        <p class="kpi-label">Penduduk · 2025</p>
        <p class="kpi-value">${fmtNum(pop / 1000000, 2)} juta</p>
        <p class="kpi-sub">Pangsa nasional ${fmtNum(share, 2)}% · peringkat penduduk #${popRank} dari 38</p>
        ${detailBar(pop, maxPop)}
      </div>
    </div>
    <p class="card-foot">Sumber: BPS, Susenas September 2024; Sakernas Februari &amp; Agustus 2024; penduduk: BPS, Statistik Indonesia 2026, Tabel 3 (angka dalam ribuan, ditampilkan dalam jutaan).</p>
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
    ? 'Penduduk per provinsi, 2025'
    : currentProvTab === 'kemiskinan'
      ? 'Persentase penduduk miskin per provinsi, September 2024'
      : 'Tingkat Pengangguran Terbuka per provinsi, Februari dan Agustus 2024';
  const headers = isPop
    ? ['Provinsi', 'Penduduk 2025 (juta jiwa)', 'Pangsa nasional (%)']
    : currentProvTab === 'kemiskinan'
      ? ['Provinsi', 'Kemiskinan Sep 2024 (%)']
      : ['Provinsi', 'TPT Feb 2024 (%)', 'TPT Agu 2024 (%)'];
  const csvRows = rows.map((r) => (isPop
    ? [r.name, fmtNum(r.value / 1000000, 2), fmtNum(r.share, 2)]
    : currentProvTab === 'kemiskinan'
      ? [r.name, fmtNum(r.value, 2)]
      : [r.name, fmtNum(r.feb, 2), fmtNum(r.value, 2)]));
  const source = isPop
    ? 'BPS, Statistik Indonesia 2026, Tabel 3 (angka dalam ribuan, ditampilkan dalam jutaan)'
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
  const maxPop = Math.max(...Object.values(PROVINCE_POP));
  const maxPov = Math.max(...PROVINCES.map((p) => p.poverty));
  const maxTpt = Math.max(...PROVINCES.map((p) => p.tptAug));
  wrap.innerHTML = picks
    .map((name) => {
      const d = provinceByName(name);
      const bar = (val, max) =>
        `<div class="mini-bar"><span style="width:${((val / max) * 100).toFixed(1)}%"></span></div>`;
      return `<article class="cmp-card">
        <h3>${d.name}</h3>
        <div class="cmp-row"><span>Penduduk 2025</span><strong>${fmtNum(d.pop / 1000000, 2)} juta</strong></div>${bar(d.pop, maxPop)}
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

// ---- Perbandingan ASEAN ---------------------------------------------------------
// Kolom tabel: sel kemiskinan selalu mencantumkan tahunnya karena tahun
// terbaru berbeda per negara; Singapura menampilkan teks penjelasan,
// bukan angka kosong.
const ASEAN_COLUMNS = [
  { key: 'name', label: 'Negara', fmt: (c) => c.name },
  { key: 'population', label: 'Penduduk 2024', fmt: (c) => `${fmtNum(c.population.value / 1000000, 2)} jt`, num: (c) => c.population.value, align: true },
  { key: 'gdp', label: 'PDB 2024', fmt: (c) => `US$${fmtNum(c.gdp.value / 1000000000, 1)} M`, num: (c) => c.gdp.value, align: true },
  { key: 'inflation', label: 'Inflasi 2024', fmt: (c) => `${fmtNum(c.inflation.value, 1)}%`, num: (c) => c.inflation.value, align: true },
  { key: 'unemployment', label: 'Pengangguran 2024', fmt: (c) => `${fmtNum(c.unemployment.value, 1)}%`, num: (c) => c.unemployment.value, align: true },
  { key: 'poverty', label: 'Kemiskinan', fmt: (c) => (c.poverty ? `${fmtNum(c.poverty.value, 1)}% (${c.poverty.year})` : c.povertyNote), num: (c) => (c.poverty ? c.poverty.value : null), align: true },
];

export function viewAsean() {
  const idn = ASEAN_COUNTRIES.find((c) => c.name === 'Indonesia');
  const sgp = ASEAN_COUNTRIES.find((c) => c.name === 'Singapura');
  const byPop = [...ASEAN_COUNTRIES].sort((a, b) => b.population.value - a.population.value);
  const byGdp = [...ASEAN_COUNTRIES].sort((a, b) => b.gdp.value - a.gdp.value);
  const byInflation = [...ASEAN_COUNTRIES].sort((a, b) => b.inflation.value - a.inflation.value);
  const byUnemp = [...ASEAN_COUNTRIES].sort((a, b) => b.unemployment.value - a.unemployment.value);
  const withPoverty = ASEAN_COUNTRIES.filter((c) => c.poverty);
  const byPoverty = [...withPoverty].sort((a, b) => b.poverty.value - a.poverty.value);
  const popRankId = byPop.findIndex((c) => c.name === 'Indonesia') + 1;
  const gdpRankId = byGdp.findIndex((c) => c.name === 'Indonesia') + 1;
  const poorest = byPoverty[0];
  const lowestUnemp = [...ASEAN_COUNTRIES].reduce((m, c) => (c.unemployment.value < m.unemployment.value ? c : m));
  const highestInfl = byInflation[0];
  return `
  ${pageHead('Perbandingan ASEAN', 'Di mana posisi Indonesia di antara tetangganya? Enam negara ASEAN dibandingkan pada lima indikator yang sama: penduduk, PDB, inflasi, pengangguran, dan kemiskinan.', 'World Bank — World Development Indicators (WDI), 2024; kemiskinan memakai tahun terbaru per negara')}
  ${csvBar('asean', 'tabel perbandingan ASEAN', 'World Bank WDI')}
  <section class="kpi-grid">
    ${kpi('Penduduk Indonesia', `${fmtNum(idn.population.value / 1000000, 2)} jt`, `Terbesar · peringkat #${popRankId} dari 6 negara · 2024`)}
    ${kpi('PDB Indonesia', `US$${fmtNum(idn.gdp.value / 1000000000, 1)} M`, `Terbesar · peringkat #${gdpRankId} dari 6 negara · 2024`)}
    ${kpi('Inflasi tertinggi', `${fmtNum(highestInfl.inflation.value, 1)}%`, `${highestInfl.name} · 2024`)}
    ${kpi('Pengangguran terendah', `${fmtNum(lowestUnemp.unemployment.value, 1)}%`, `${lowestUnemp.name} · 2024 · estimasi ILO`)}
    ${kpi('Kemiskinan tertinggi', `${fmtNum(poorest.poverty.value, 1)}%`, `${poorest.name} · ${poorest.poverty.year}`)}
    ${kpi('Penduduk Singapura', `${fmtNum(sgp.population.value / 1000000, 2)} jt`, 'Terkecil dari 6 negara · 2024')}
  </section>
  <section class="card">
    <h2>Tabel perbandingan — 6 negara, 5 indikator</h2>
    <p class="card-sub">Klik judul kolom untuk mengurutkan. Kolom kemiskinan mencantumkan tahunnya karena tahun terbaru berbeda per negara.</p>
    ${dataTable('asean-table', ASEAN_COLUMNS, ASEAN_COUNTRIES, { filterLabel: 'negara', filterPlaceholder: 'Cari negara…', source: 'Sumber: World Bank, World Development Indicators (WDI) 2024; kemiskinan: SI.POV.NAHC, tahun terbaru per negara.' })}
  </section>
  <section class="chart-duo">
    <article class="card chart-card">
      <h2>Penduduk, 2024</h2>
      <p class="card-sub">Juta jiwa (World Bank WDI)</p>
      ${hbarChart(byPop.map((c) => ({ label: c.name, value: +(c.population.value / 1000000).toFixed(2), highlight: c.name === 'Indonesia' })), { valueFmt: (v) => `${fmtNum(v, 2)} jt`, aria: 'Grafik batang penduduk enam negara ASEAN 2024' })}
      <p class="card-foot">Indonesia berpenduduk ${fmtNum(idn.population.value / 1000000, 2)} juta jiwa — lebih dari dua kali Filipina, negara kedua terbanyak.</p>
    </article>
    <article class="card chart-card">
      <h2>PDB, 2024</h2>
      <p class="card-sub">Miliar US$ berlaku (World Bank WDI)</p>
      ${hbarChart(byGdp.map((c) => ({ label: c.name, value: +(c.gdp.value / 1000000000).toFixed(1), highlight: c.name === 'Indonesia' })), { valueFmt: (v) => `US$${fmtNum(v, 1)} M`, aria: 'Grafik batang PDB enam negara ASEAN 2024' })}
      <p class="card-foot">PDB Indonesia US$${fmtNum(idn.gdp.value / 1000000000, 1)} miliar — terbesar di antara enam negara ini, lebih dari dua kali Singapura.</p>
    </article>
  </section>
  <section class="chart-duo">
    <article class="card chart-card">
      <h2>Inflasi, 2024</h2>
      <p class="card-sub">Persen, harga konsumen (World Bank WDI)</p>
      ${hbarChart(byInflation.map((c) => ({ label: c.name, value: c.inflation.value })), { valueFmt: (v) => `${fmtNum(v, 1)}%`, aria: 'Grafik batang inflasi enam negara ASEAN 2024' })}
      <p class="card-foot">Inflasi tertinggi ${highestInfl.name} (${fmtNum(highestInfl.inflation.value, 1)}%), terendah Thailand (${fmtNum(ASEAN_COUNTRIES.find((c) => c.name === 'Thailand').inflation.value, 1)}%). Indonesia 2,2%.</p>
    </article>
    <article class="card chart-card">
      <h2>Pengangguran, 2024</h2>
      <p class="card-sub">Persen angkatan kerja, estimasi model ILO (World Bank WDI)</p>
      ${hbarChart(byUnemp.map((c) => ({ label: c.name, value: c.unemployment.value })), { valueFmt: (v) => `${fmtNum(v, 1)}%`, aria: 'Grafik batang pengangguran enam negara ASEAN 2024' })}
      <p class="card-foot">Pengangguran terendah ${lowestUnemp.name} (${fmtNum(lowestUnemp.unemployment.value, 1)}%), tertinggi Malaysia (3,8%). Indonesia 3,3%.</p>
    </article>
  </section>
  <section class="card chart-card">
    <h2>Kemiskinan — garis kemiskinan nasional, tahun terbaru per negara</h2>
    <p class="card-sub">Persen penduduk di bawah garis kemiskinan nasional (World Bank WDI, SI.POV.NAHC). Singapura tidak tampil di grafik ini karena tidak punya garis kemiskinan nasional resmi.</p>
    ${hbarChart(byPoverty.map((c) => ({ label: `${c.name} (${c.poverty.year})`, value: c.poverty.value })), { valueFmt: (v) => `${fmtNum(v, 1)}%`, aria: 'Grafik batang kemiskinan lima negara ASEAN' })}
    <p class="card-foot">Kemiskinan tertinggi ${poorest.name} (${fmtNum(poorest.poverty.value, 1)}%, ${poorest.poverty.year}), terendah Vietnam (4,2%, 2022). Tahun berbeda per negara — bandingkan dengan hati-hati, lihat catatan metodologi di bawah.</p>
  </section>
  <section class="highlights">
    ${sectionTitle('Sorotan dari data', '')}
    <div class="highlight-grid">
      <article class="highlight"><p class="hl-value">#${popRankId}</p><p><strong>Indonesia</strong> — penduduk terbesar di antara 6 negara ASEAN (${fmtNum(idn.population.value / 1000000, 2)} juta jiwa, 2024).</p></article>
      <article class="highlight"><p class="hl-value">#${gdpRankId}</p><p><strong>Indonesia</strong> — PDB terbesar (US$${fmtNum(idn.gdp.value / 1000000000, 1)} miliar, 2024).</p></article>
      <article class="highlight"><p class="hl-value">${fmtNum(poorest.poverty.value, 1)}%</p><p><strong>${poorest.name}</strong> — kemiskinan tertinggi (${poorest.poverty.year}, garis kemiskinan nasional).</p></article>
      <article class="highlight"><p class="hl-value">${fmtNum(lowestUnemp.unemployment.value, 1)}%</p><p><strong>${lowestUnemp.name}</strong> — pengangguran terendah (2024, estimasi model ILO).</p></article>
    </div>
  </section>
  <section class="card">
    <h2>Sumber &amp; catatan metodologi</h2>
    <p><strong>Sumber:</strong> World Bank, World Development Indicators (WDI). Indikator: penduduk (SP.POP.TOTL), PDB atas dasar harga berlaku dalam US$ (NY.GDP.MKTP.CD), inflasi harga konsumen (FP.CPI.TOTL.ZG), pengangguran (SL.UEM.TOTL.ZS), kemiskinan menurut garis kemiskinan nasional (SI.POV.NAHC).</p>
    <p><strong>Pengangguran sebanding:</strong> angka pengangguran memakai estimasi model ILO (World Bank SL.UEM.TOTL.ZS) supaya definisinya sama antar negara. Angka ini berbeda dengan angka survei nasional — misalnya TPT Indonesia versi BPS Agustus 2024 adalah 4,91%, sedangkan estimasi model ILO 2024 adalah 3,3%.</p>
    <p><strong>Kemiskinan tidak satu garis:</strong> kemiskinan memakai garis kemiskinan nasional masing-masing negara, sehingga tahun terbaru berbeda: Indonesia 2024, Malaysia 2023, Filipina 2023, Thailand 2022, Vietnam 2022. Karena garisnya berbeda, angka kemiskinan antar negara tidak sepenuhnya sebanding — bandingkan dengan hati-hati.</p>
    <p><strong>Singapura tanpa garis kemiskinan:</strong> Singapura tidak menetapkan garis kemiskinan nasional resmi (SingStat, indikator SDG 1.2.1), sehingga kolom kemiskinannya berisi penjelasan ini, bukan angka dan bukan tanda kosong.</p>
    <p class="card-foot">Catatan: angka kemiskinan Indonesia versi World Bank (9,0%, 2024) berbeda dengan angka BPS (8,57%, September 2024) karena garis dan metode yang dipakai berbeda. Halaman Kemiskinan &amp; Kesejahteraan di situs ini memakai angka BPS.</p>
  </section>`;
}

export function mountAsean() {
  bindDataTable('asean-table', ASEAN_COLUMNS, ASEAN_COUNTRIES);
}

// ---- Tentang ------------------------------------------------------------------
export function viewAbout() {
  return `
  ${pageHead('Tentang DataNusa', 'Situs independen yang menyajikan statistik nasional Indonesia dari sumber resmi — dirancang agar mudah dibaca di desktop maupun di ponsel.', 'Angka Indonesia: BPS; perbandingan ASEAN: World Bank (WDI)')}
  <section class="card">
    <h2>Apa itu DataNusa?</h2>
    <p>DataNusa adalah portal statistik nasional Indonesia yang dibuat dari nol: desainnya orisinal, chart-nya digambar dari kode sendiri, dan angka Indonesianya diambil dari publikasi resmi Badan Pusat Statistik (BPS); angka perbandingan ASEAN dari World Bank. Situs ini tidak berafiliasi dengan BPS dan bukan tiruan situs mana pun.</p>
    <p>Setiap angka di situs ini dicantumkan bersama sumber dan tahunnya, supaya pembaca bisa memeriksa sendiri ke publikasi yang bersangkutan.</p>
  </section>
  <section class="card">
    <h2>Metodologi & sumber</h2>
    <table class="simple-table">
      <thead><tr><th>Topik</th><th>Sumber</th></tr></thead>
      <tbody>
        <tr><td>Jumlah penduduk &amp; provinsi</td><td>BPS, Proyeksi Penduduk 2024; Statistik Indonesia 2026, Tabel 3 (penduduk per provinsi, 2025)</td></tr>
        <tr><td>Sensus penduduk</td><td>BPS, Sensus Penduduk 2000, 2010, 2020</td></tr>
        <tr><td>PDB &amp; pertumbuhan ekonomi</td><td>BPS, Berita Resmi Statistik Pertumbuhan Ekonomi, rilis 5 Februari 2025</td></tr>
        <tr><td>Inflasi</td><td>BPS, Indeks Harga Konsumen, Desember 2024</td></tr>
        <tr><td>Pengangguran</td><td>BPS, Survei Angkatan Kerja Nasional (Sakernas), Februari &amp; Agustus 2024</td></tr>
        <tr><td>Kemiskinan &amp; garis kemiskinan</td><td>BPS, Susenas Maret &amp; September 2024; BRS Profil Kemiskinan per provinsi, Januari 2025</td></tr>
        <tr><td>Ketimpangan (gini)</td><td>BPS, 2023–2024</td></tr>
        <tr><td>IPM &amp; komponennya</td><td>BPS, Berita Resmi Statistik IPM 2024, 15 November 2024</td></tr>
        <tr><td>Perbandingan ASEAN</td><td>World Bank, World Development Indicators (WDI) 2024; kemiskinan: SI.POV.NAHC, tahun terbaru per negara</td></tr>
      </tbody>
    </table>
    <p class="card-foot">Angka penduduk provinsi berasal dari BPS dalam ribuan (satu desimal), sehingga ditampilkan dalam jutaan dengan dua desimal — bukan seolah presisi sampai satuan jiwa. Persentase ditampilkan dua desimal. Situs ini berjalan sepenuhnya offline: tidak ada permintaan jaringan, tidak ada pelacak, tidak ada cookie.</p>
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
  calculator: viewCalculator,
  kemiskinan: viewPoverty,
  provinsi: viewProvinces,
  asean: viewAsean,
  tentang: viewAbout,
};

export { SOURCE };
