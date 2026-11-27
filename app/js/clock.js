// Jam populasi Indonesia — estimasi live yang jujur.
//
// Angkanya BUKAN angka real-time BPS (BPS tidak merilis hitungan detik).
// Estimasi dihitung client-side dari dua angka BPS yang sudah ada di data.js:
//   - dasar: 281.603.900 jiwa, proyeksi pertengahan 2024 (1 Juli 2024)
//   - laju: 281,6 jt − 278,7 jt = +2,9 juta jiwa/tahun (2023 → 2024)
//     ≈ +7.945 jiwa/hari ≈ 1 jiwa tiap ~11 detik.
// Label "Estimasi live" wajib tampil di samping jamnya di halaman.

import { fmtInt } from './format.js';

export const POP_CLOCK = {
  base: 281603900, // jiwa, proyeksi pertengahan 2024 (BPS)
  baseDate: Date.UTC(2024, 6, 1), // 1 Juli 2024
  annualIncrease: 2900000, // jiwa/tahun, dari 278,7 → 281,6 juta (BPS)
  secondsPerYear: 365.25 * 24 * 3600,
};

// Populasi estimasi pada suatu waktu (linear dari dasar + laju tahunan).
export function estimatePopulation(now = new Date()) {
  const elapsedSeconds = (now.getTime() - POP_CLOCK.baseDate) / 1000;
  return Math.floor(
    POP_CLOCK.base + (POP_CLOCK.annualIncrease * elapsedSeconds) / POP_CLOCK.secondsPerYear,
  );
}

// Menjalankan jam di elemen angka; sinceEl (opsional) menampilkan
// pertambahan sejak halaman dibuka. Mengembalikan fungsi stop().
export function startPopulationClock(numberEl, sinceEl) {
  const openedAt = Date.now();
  const openedValue = estimatePopulation(new Date(openedAt));
  let last = -1;
  const tick = () => {
    const value = estimatePopulation();
    if (value !== last) {
      numberEl.textContent = fmtInt(value);
      last = value;
      numberEl.classList.add('ticked');
      setTimeout(() => numberEl.classList.remove('ticked'), 350);
    }
    if (sinceEl) {
      sinceEl.textContent = `+${fmtInt(value - openedValue)} jiwa sejak halaman ini dibuka`;
    }
  };
  tick();
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}
