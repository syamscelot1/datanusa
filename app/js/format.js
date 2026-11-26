// Format angka gaya Indonesia: koma untuk desimal, titik untuk ribuan.

export function fmtNum(value, decimals = 2) {
  return value.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtInt(value) {
  return Math.round(value).toLocaleString('id-ID');
}

export function fmtJuta(value) {
  return `${fmtNum(value, 1)} juta`;
}

export function fmtRpTriliun(value) {
  return `Rp${fmtNum(value, 1)} triliun`;
}

export function fmtPersen(value, decimals = 2) {
  return `${fmtNum(value, decimals)}%`;
}

export function fmtSigned(value, decimals = 2) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${fmtNum(value, decimals)}`;
}
