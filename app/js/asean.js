// DataNusa — perbandingan ASEAN (6 negara).
// Sumber utama: World Bank, World Development Indicators (WDI).
// Tahun acuan 2024, kecuali kemiskinan yang memakai tahun terbaru per
// negara menurut indikator garis kemiskinan nasional (SI.POV.NAHC).
// Pengangguran memakai estimasi model ILO (SL.UEM.TOTL.ZS) supaya angka
// antar negara sebanding. Singapura tidak punya garis kemiskinan nasional
// resmi (SingStat, SDG 1.2.1), jadi kemiskinannya bukan angka melainkan
// penjelasan. Jumlah nilai indikator nyata di file ini: 29
// (6 negara x 5 indikator, dikurangi kemiskinan Singapura yang tidak ada).

export const ASEAN_COUNTRIES = [
  {
    name: 'Indonesia',
    population: { value: 283487931, year: 2024, source: 'World Bank WDI, SP.POP.TOTL' },
    gdp: { value: 1396301788462, year: 2024, source: 'World Bank WDI, NY.GDP.MKTP.CD' },
    inflation: { value: 2.2, year: 2024, source: 'World Bank WDI, FP.CPI.TOTL.ZG' },
    unemployment: { value: 3.3, year: 2024, source: 'World Bank WDI, SL.UEM.TOTL.ZS (estimasi model ILO)' },
    poverty: { value: 9.0, year: 2024, source: 'World Bank WDI, SI.POV.NAHC' },
    povertyNote: 'BPS September 2024 mencatat 8,57% dengan garis kemiskinan nasional BPS.',
  },
  {
    name: 'Singapura',
    population: { value: 6036860, year: 2024, source: 'World Bank WDI, SP.POP.TOTL' },
    gdp: { value: 572877260178, year: 2024, source: 'World Bank WDI, NY.GDP.MKTP.CD' },
    inflation: { value: 2.4, year: 2024, source: 'World Bank WDI, FP.CPI.TOTL.ZG' },
    unemployment: { value: 3.2, year: 2024, source: 'World Bank WDI, SL.UEM.TOTL.ZS (estimasi model ILO)' },
    poverty: null,
    povertyNote: 'Tidak ada garis kemiskinan nasional resmi (SingStat, SDG 1.2.1).',
  },
  {
    name: 'Malaysia',
    population: { value: 35557673, year: 2024, source: 'World Bank WDI, SP.POP.TOTL' },
    gdp: { value: 422227005429, year: 2024, source: 'World Bank WDI, NY.GDP.MKTP.CD' },
    inflation: { value: 1.8, year: 2024, source: 'World Bank WDI, FP.CPI.TOTL.ZG' },
    unemployment: { value: 3.8, year: 2024, source: 'World Bank WDI, SL.UEM.TOTL.ZS (estimasi model ILO)' },
    poverty: { value: 5.1, year: 2023, source: 'World Bank WDI, SI.POV.NAHC' },
    povertyNote: '',
  },
  {
    name: 'Thailand',
    population: { value: 71668011, year: 2024, source: 'World Bank WDI, SP.POP.TOTL' },
    gdp: { value: 529385520942, year: 2024, source: 'World Bank WDI, NY.GDP.MKTP.CD' },
    inflation: { value: 0.4, year: 2024, source: 'World Bank WDI, FP.CPI.TOTL.ZG' },
    unemployment: { value: 0.7, year: 2024, source: 'World Bank WDI, SL.UEM.TOTL.ZS (estimasi model ILO)' },
    poverty: { value: 5.4, year: 2022, source: 'World Bank WDI, SI.POV.NAHC' },
    povertyNote: '',
  },
  {
    name: 'Vietnam',
    population: { value: 100987686, year: 2024, source: 'World Bank WDI, SP.POP.TOTL' },
    gdp: { value: 476324572784, year: 2024, source: 'World Bank WDI, NY.GDP.MKTP.CD' },
    inflation: { value: 3.6, year: 2024, source: 'World Bank WDI, FP.CPI.TOTL.ZG' },
    unemployment: { value: 1.4, year: 2024, source: 'World Bank WDI, SL.UEM.TOTL.ZS (estimasi model ILO)' },
    poverty: { value: 4.2, year: 2022, source: 'World Bank WDI, SI.POV.NAHC' },
    povertyNote: '',
  },
  {
    name: 'Filipina',
    population: { value: 115843670, year: 2024, source: 'World Bank WDI, SP.POP.TOTL' },
    gdp: { value: 461671157905, year: 2024, source: 'World Bank WDI, NY.GDP.MKTP.CD' },
    inflation: { value: 3.2, year: 2024, source: 'World Bank WDI, FP.CPI.TOTL.ZG' },
    unemployment: { value: 2.2, year: 2024, source: 'World Bank WDI, SL.UEM.TOTL.ZS (estimasi model ILO)' },
    poverty: { value: 15.5, year: 2023, source: 'World Bank WDI, SI.POV.NAHC' },
    povertyNote: '',
  },
];
