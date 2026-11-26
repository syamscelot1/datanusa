// DataNusa — data statistik nasional Indonesia.
// Setiap angka di sini berasal dari rilis Badan Pusat Statistik (BPS) dan
// dicantumkan bersama tahun/periode serta nama publikasinya. Angka yang
// dibulatkan diberi tanda; tidak ada angka yang dikarang.

export const SOURCE = {
  publisher: 'Badan Pusat Statistik (BPS)',
  note: 'DataNusa adalah situs independen. Semua angka bersumber dari publikasi dan Berita Resmi Statistik BPS; BPS tidak berafiliasi dengan situs ini.',
};

// ---- Kependudukan ---------------------------------------------------------
export const POPULATION = {
  total2024: 281.6, // juta jiwa, proyeksi pertengahan tahun (BPS, 2024)
  total2024Exact: 281603900,
  // Jumlah penduduk per tahun (juta jiwa). Sumber: BPS, proyeksi penduduk.
  series: [
    { year: 2018, value: 265.0 },
    { year: 2019, value: 268.1 },
    { year: 2020, value: 270.2 },
    { year: 2021, value: 272.7 },
    { year: 2022, value: 275.8 },
    { year: 2023, value: 278.7 },
    { year: 2024, value: 281.6 },
  ],
  // Hasil Sensus Penduduk (juta jiwa). Sumber: BPS, Sensus Penduduk.
  census: [
    { year: 2000, value: 206.3 },
    { year: 2010, value: 237.6 },
    { year: 2020, value: 270.2 },
  ],
  javaShare2024: 55.93, // persen penduduk tinggal di Pulau Jawa (BPS, 2024)
  densityDKI2024: 16165, // jiwa per km2, DKI Jakarta (BPS, 2024)
  // 10 provinsi berpenduduk terbanyak, 2024 (jiwa). Sumber: BPS,
  // Statistical Yearbook of Indonesia 2024.
  topProvinces: [
    { name: 'Jawa Barat', pop: 50345200, share: 17.88 },
    { name: 'Jawa Timur', pop: 41814500, share: 14.85 },
    { name: 'Jawa Tengah', pop: 37892300, share: 13.46 },
    { name: 'Sumatera Utara', pop: 15588500, share: 5.54 },
    { name: 'Banten', pop: 12431400, share: 4.41 },
    { name: 'DKI Jakarta', pop: 10684900, share: 3.79 },
    { name: 'Sulawesi Selatan', pop: 9463400, share: 3.36 },
    { name: 'Lampung', pop: 9419600, share: 3.34 },
    { name: 'Sumatera Selatan', pop: 8837300, share: 3.14 },
    { name: 'Riau', pop: 6728100, share: 2.39 },
  ],
};

// ---- Ekonomi --------------------------------------------------------------
export const GDP = {
  // PDB atas dasar harga berlaku (Rp triliun) dan pertumbuhan c-to-c (%).
  // Sumber: BPS, Berita Resmi Statistik Pertumbuhan Ekonomi (rilis tahunan).
  series: [
    { year: 2020, nominal: 15434.2, growth: -2.07 },
    { year: 2021, nominal: 16976.7, growth: 3.7 },
    { year: 2022, nominal: 19588.4, growth: 5.31 },
    { year: 2023, nominal: 20892.4, growth: 5.05 },
    { year: 2024, nominal: 22139.0, growth: 5.03 },
  ],
  perCapita2024: 78.6, // Rp juta per kapita (BPS, 2024); setara US$4.960,3
  perCapita2023: 75.0, // Rp juta per kapita (BPS, 2023); setara US$4.919,7
  // Lima lapangan usaha penyumbang PDB terbesar, 2024 (pangsa %, BPS).
  // Pertumbuhan dicantumkan bila terverifikasi dari rilis BPS yang sama.
  sectors2024: [
    { name: 'Industri Pengolahan', share: 18.98, growth: 4.43 },
    { name: 'Perdagangan Besar dan Eceran', share: 13.07, growth: 4.86 },
    { name: 'Pertanian, Kehutanan, dan Perikanan', share: 12.61, growth: 0.67 },
    { name: 'Konstruksi', share: 10.09, growth: null },
    { name: 'Pertambangan dan Penggalian', share: 9.15, growth: null },
  ],
  // Lapangan usaha dengan pertumbuhan tertinggi, 2024 (BPS).
  fastestGrowing2024: [
    { name: 'Jasa Lainnya', growth: 9.8 },
    { name: 'Transportasi dan Pergudangan', growth: 8.69 },
    { name: 'Penyediaan Akomodasi dan Makan Minum', growth: 8.56 },
  ],
  // Pertumbuhan menurut pengeluaran, 2024 (BPS).
  expenditureGrowth2024: [
    { name: 'Konsumsi Rumah Tangga', growth: 4.94 },
    { name: 'Pembentukan Modal Tetap Bruto', growth: 4.61 },
    { name: 'Ekspor Barang dan Jasa', growth: 6.51 },
    { name: 'Impor Barang dan Jasa', growth: 7.95 },
  ],
  // Perdagangan luar negeri 2024, US$ miliar (BPS).
  trade2024: { exports: 264.7, imports: 233.66, surplus: 31.04 },
};

// ---- Harga dan inflasi ------------------------------------------------------
export const INFLATION = {
  // Inflasi tahunan (y-on-y, %, Desember). Sumber: BPS, IHK.
  series: [
    { year: 2020, value: 1.68 },
    { year: 2021, value: 1.87 },
    { year: 2022, value: 5.51 },
    { year: 2023, value: 2.61 },
    { year: 2024, value: 1.57 },
  ],
  target2024: '2,5% ± 1% (sasaran Bank Indonesia)',
};

// ---- Ketenagakerjaan ---------------------------------------------------------
export const LABOR = {
  // Tingkat Pengangguran Terbuka, Februari dan Agustus (%). Sumber: BPS, Sakernas.
  tptSeries: [
    { label: 'Feb 2020', value: 4.99 },
    { label: 'Agu 2020', value: 7.07 },
    { label: 'Feb 2021', value: 6.26 },
    { label: 'Agu 2021', value: 6.49 },
    { label: 'Feb 2022', value: 5.83 },
    { label: 'Agu 2022', value: 5.86 },
    { label: 'Feb 2023', value: 5.45 },
    { label: 'Agu 2023', value: 5.32 },
    { label: 'Feb 2024', value: 4.82 },
    { label: 'Agu 2024', value: 4.91 },
  ],
  // Keadaan Agustus 2024 (juta orang, kecuali TPAK). Sumber: BPS, Sakernas Agustus 2024.
  aug2024: {
    angkatanKerja: 152.11,
    tpak: 70.63,
    bekerja: 144.64,
    penganggur: 7.47,
    tptSmk: 9.01, // TPT lulusan SMK, tertinggi menurut pendidikan (BPS, Agu 2024)
  },
};

// ---- Kemiskinan, ketimpangan, pembangunan manusia -----------------------------
export const POVERTY = {
  // Persentase penduduk miskin, Maret dan September (%). Sumber: BPS, Susenas.
  series: [
    { label: 'Mar 2020', value: 9.78 },
    { label: 'Sep 2020', value: 10.19 },
    { label: 'Mar 2021', value: 10.14 },
    { label: 'Sep 2021', value: 9.71 },
    { label: 'Mar 2022', value: 9.54 },
    { label: 'Sep 2022', value: 9.57 },
    { label: 'Mar 2023', value: 9.36 },
    { label: 'Sep 2023', value: 9.36 },
    { label: 'Mar 2024', value: 9.03 },
    { label: 'Sep 2024', value: 8.57 },
  ],
  sep2024: { rate: 8.57, poorMillions: 24.06, povertyLine: 595242 },
  mar2024: { rate: 9.03, poorMillions: 25.22, povertyLine: 582932 },
  // Rasio gini. Sumber: BPS.
  gini: [
    { label: 'Mar 2023', value: 0.377 },
    { label: 'Sep 2023', value: 0.379 },
    { label: 'Mar 2024', value: 0.379 },
    { label: 'Sep 2024', value: 0.381 },
  ],
  // Indeks Pembangunan Manusia. Sumber: BPS, BRS IPM (15 November 2024).
  ipm: [
    { year: 2020, value: 72.81 },
    { year: 2021, value: 73.16 },
    { year: 2022, value: 73.77 },
    { year: 2023, value: 74.39 },
    { year: 2024, value: 75.02 },
  ],
  // Komponen IPM 2024. Sumber: BPS, BRS IPM 2024.
  ipmComponents2024: {
    uhh: 74.15, // umur harapan hidup saat lahir (tahun)
    hls: 13.21, // harapan lama sekolah (tahun)
    rls: 8.85, // rata-rata lama sekolah penduduk 25+ (tahun)
    spending: 12.43, // pengeluaran riil per kapita per tahun, disesuaikan (Rp juta)
    spendingGrowth: 3.71, // persen terhadap 2023
  },
};

// ---- Provinsi: kemiskinan dan pengangguran (38 provinsi) -----------------------
// Persentase penduduk miskin September 2024 (%). Sumber: BPS, Berita Resmi
// Statistik Profil Kemiskinan per provinsi (Januari 2025).
// TPT Februari dan Agustus 2024 (%). Sumber: BPS, Sakernas 2024 (tabel
// Tingkat Pengangguran Terbuka Menurut Provinsi).
export const PROVINCES = [
  { name: 'Aceh', poverty: 12.64, tptFeb: 5.56, tptAug: 5.75 },
  { name: 'Sumatera Utara', poverty: 7.19, tptFeb: 5.1, tptAug: 5.6 },
  { name: 'Sumatera Barat', poverty: 5.42, tptFeb: 5.79, tptAug: 5.75 },
  { name: 'Riau', poverty: 6.36, tptFeb: 3.85, tptAug: 3.7 },
  { name: 'Jambi', poverty: 7.26, tptFeb: 4.45, tptAug: 4.48 },
  { name: 'Sumatera Selatan', poverty: 10.51, tptFeb: 3.97, tptAug: 3.86 },
  { name: 'Bengkulu', poverty: 12.52, tptFeb: 3.17, tptAug: 3.11 },
  { name: 'Lampung', poverty: 10.62, tptFeb: 4.12, tptAug: 4.19 },
  { name: 'Kep. Bangka Belitung', poverty: 5.08, tptFeb: 3.85, tptAug: 4.63 },
  { name: 'Kepulauan Riau', poverty: 4.78, tptFeb: 6.94, tptAug: 6.39 },
  { name: 'DKI Jakarta', poverty: 4.14, tptFeb: 6.03, tptAug: 6.21 },
  { name: 'Jawa Barat', poverty: 7.08, tptFeb: 6.91, tptAug: 6.75 },
  { name: 'Jawa Tengah', poverty: 9.58, tptFeb: 4.39, tptAug: 4.78 },
  { name: 'DI Yogyakarta', poverty: 10.4, tptFeb: 3.24, tptAug: 3.48 },
  { name: 'Jawa Timur', poverty: 9.56, tptFeb: 3.74, tptAug: 4.19 },
  { name: 'Banten', poverty: 5.7, tptFeb: 7.02, tptAug: 6.68 },
  { name: 'Bali', poverty: 3.8, tptFeb: 1.87, tptAug: 1.79 },
  { name: 'Nusa Tenggara Barat', poverty: 11.91, tptFeb: 3.3, tptAug: 2.73 },
  { name: 'Nusa Tenggara Timur', poverty: 19.02, tptFeb: 3.17, tptAug: 3.02 },
  { name: 'Kalimantan Barat', poverty: 6.25, tptFeb: 4.2, tptAug: 4.86 },
  { name: 'Kalimantan Tengah', poverty: 5.26, tptFeb: 3.67, tptAug: 4.01 },
  { name: 'Kalimantan Selatan', poverty: 4.02, tptFeb: 3.89, tptAug: 4.2 },
  { name: 'Kalimantan Timur', poverty: 5.51, tptFeb: 5.75, tptAug: 5.14 },
  { name: 'Kalimantan Utara', poverty: 5.38, tptFeb: 4.01, tptAug: 3.9 },
  { name: 'Sulawesi Utara', poverty: 6.7, tptFeb: 5.98, tptAug: 5.85 },
  { name: 'Sulawesi Tengah', poverty: 11.04, tptFeb: 3.15, tptAug: 2.94 },
  { name: 'Sulawesi Selatan', poverty: 7.77, tptFeb: 4.9, tptAug: 4.19 },
  { name: 'Sulawesi Tenggara', poverty: 10.63, tptFeb: 3.22, tptAug: 3.09 },
  { name: 'Gorontalo', poverty: 13.87, tptFeb: 3.05, tptAug: 3.13 },
  { name: 'Sulawesi Barat', poverty: 10.71, tptFeb: 3.02, tptAug: 2.68 },
  { name: 'Maluku', poverty: 15.78, tptFeb: 5.96, tptAug: 6.11 },
  { name: 'Maluku Utara', poverty: 6.03, tptFeb: 4.16, tptAug: 4.03 },
  { name: 'Papua Barat', poverty: 21.09, tptFeb: 4.31, tptAug: 4.13 },
  { name: 'Papua Barat Daya', poverty: 16.95, tptFeb: 6.02, tptAug: 6.48 },
  { name: 'Papua', poverty: 18.09, tptFeb: 5.81, tptAug: 6.48 },
  { name: 'Papua Selatan', poverty: 19.35, tptFeb: 4.75, tptAug: 4.05 },
  { name: 'Papua Tengah', poverty: 27.6, tptFeb: 2.49, tptAug: 2.75 },
  { name: 'Papua Pegunungan', poverty: 29.66, tptFeb: 1.18, tptAug: 1.32 },
];

// Penduduk per provinsi 2024 (jiwa) untuk 10 provinsi terbesar — dipakai alat
// banding. Sumber: BPS, Statistical Yearbook of Indonesia 2024.
export const PROVINCE_POP = Object.fromEntries(
  POPULATION.topProvinces.map((p) => [p.name, p.pop]),
);
