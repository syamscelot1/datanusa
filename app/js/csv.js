// Unduh CSV client-side (Blob, tanpa network). Pemisah ';' supaya angka
// gaya Indonesia (koma desimal) tetap terbaca benar di Excel Indonesia.

export function csvCell(value) {
  const s = String(value ?? '');
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// sections: [{ title, headers: [...], rows: [[...], ...] }].
// Baris pertama selalu sumber datanya, supaya file tetap terlacak asalnya.
export function toCsv(sections, source) {
  const lines = [];
  if (source) {
    lines.push(csvCell(`Sumber: ${source}`));
    lines.push('');
  }
  sections.forEach((sec, i) => {
    if (i > 0) lines.push('');
    lines.push(csvCell(sec.title));
    lines.push(sec.headers.map(csvCell).join(';'));
    for (const row of sec.rows) lines.push(row.map(csvCell).join(';'));
  });
  // BOM UTF-8: Excel Indonesia membuka file beraksen dengan benar.
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export function downloadCsv(filename, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
