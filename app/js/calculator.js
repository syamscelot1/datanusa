// Kalkulator inflasi DataNusa — mengubah nilai rupiah antar tahun memakai
// Indeks Harga Konsumen (IHK) Desember dari BPS.
//
// Cara kerja: IHK Desember 2019 ditetapkan 100. Indeks tiap tahun berikutnya
// diperoleh dengan mengalikan indeks tahun sebelumnya dengan
// (1 + inflasi tahun itu / 100), memakai inflasi y-on-y Desember di
// INFLATION.series (data.js). Nilai rupiah tahun B = nilai tahun A dikali
// indeks[B] / indeks[A]. Hanya tahun 2020-2024 yang tersedia, karena hanya
// itu inflasi Desember yang ada di data.

import { INFLATION } from './data.js';

export const CPI_YEARS = [2020, 2021, 2022, 2023, 2024];

const BASE_YEAR = 2019;
const BASE_INDEX = 100;

// Indeks IHK Desember tiap tahun, dihitung dari inflasi y-on-y Desember.
// Kunci: tahun; nilai: indeks (Des 2019 = 100).
export const CPI_INDEX = (() => {
  const table = {};
  let index = BASE_INDEX;
  const byYear = new Map(INFLATION.series.map((d) => [d.year, d.value]));
  for (const year of CPI_YEARS) {
    const inflation = byYear.get(year);
    if (typeof inflation !== 'number') break;
    index *= 1 + inflation / 100;
    table[year] = index;
  }
  return table;
})();

// Indeks IHK Desember suatu tahun (Des 2019 = 100).
// Mengembalikan null bila tahun di luar 2020-2024.
export function cpiIndex(year) {
  const value = CPI_INDEX[Number(year)];
  return typeof value === 'number' ? value : null;
}

// Mengubah nilai rupiah dari tahun asal ke tahun tujuan.
// Mengembalikan null bila salah satu tahun di luar 2020-2024.
export function convertAmount(amount, fromYear, toYear) {
  const fromIndex = cpiIndex(fromYear);
  const toIndex = cpiIndex(toYear);
  if (fromIndex === null || toIndex === null) return null;
  if (!(amount > 0)) return null;
  return (amount * toIndex) / fromIndex;
}

export { BASE_YEAR, BASE_INDEX };
