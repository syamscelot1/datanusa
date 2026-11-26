// Chart SVG murni — tanpa library, tanpa network. Setiap fungsi menerima data
// dan mengembalikan string SVG yang siap disisipkan ke halaman.

function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function niceTicks(min, max, count = 4) {
  const span = max - min || 1;
  const stepRaw = span / count;
  const mag = 10 ** Math.floor(Math.log10(stepRaw));
  const norm = stepRaw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10) * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(v);
  return { lo, hi, ticks };
}

// Grafik garis dengan titik, label nilai, dan garis grid.
export function lineChart(points, opts = {}) {
  const w = opts.width ?? 640;
  const h = opts.height ?? 260;
  const padL = 52;
  const padR = 14;
  const padT = 18;
  const padB = 30;
  const color = opts.color ?? '#0e6b5c';
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const { lo, hi, ticks } = niceTicks(Math.min(0, min), max);
  const x = (i) => padL + (i * (w - padL - padR)) / Math.max(1, points.length - 1);
  const y = (v) => padT + ((hi - v) * (h - padT - padB)) / (hi - lo || 1);
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1).toFixed(1)},${y(lo).toFixed(1)} L${x(0).toFixed(1)},${y(lo).toFixed(1)} Z`;
  const grid = ticks
    .map(
      (t) =>
        `<line x1="${padL}" y1="${y(t)}" x2="${w - padR}" y2="${y(t)}" stroke="#e3e0d6" stroke-width="1"/><text x="${padL - 8}" y="${y(t) + 4}" text-anchor="end" font-size="11" fill="#6b7280">${esc(opts.tickFmt ? opts.tickFmt(t) : String(t))}</text>`,
    )
    .join('');
  const dots = points
    .map((p, i) => {
      // Label nilai: titik pertama diratakan kiri dan titik terakhir
      // diratakan kanan, supaya tidak menabrak label sumbu-y.
      const anchor = i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle';
      const lx = x(i) + (i === 0 ? 6 : i === points.length - 1 ? -6 : 0);
      return `<circle cx="${x(i)}" cy="${y(p.value)}" r="4" fill="#fff" stroke="${color}" stroke-width="2.5"/><text x="${lx}" y="${y(p.value) - 10}" text-anchor="${anchor}" font-size="11.5" font-weight="700" fill="#1c2420">${esc(opts.valueFmt ? opts.valueFmt(p.value) : String(p.value))}</text>`;
    })
    .join('');
  const labels = points
    .map((p, i) => `<text x="${x(i)}" y="${h - 8}" text-anchor="middle" font-size="11" fill="#6b7280">${esc(p.label)}</text>`)
    .join('');
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="${esc(opts.aria ?? 'Grafik garis')}">
    ${grid}
    <path d="${area}" fill="${color}" opacity="0.10"/>
    <path d="${line}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}${labels}
  </svg>`;
}

// Grafik batang vertikal dengan label nilai di atas batang.
export function barChart(items, opts = {}) {
  const w = opts.width ?? 640;
  const h = opts.height ?? 260;
  const padL = 52;
  const padR = 10;
  const padT = 22;
  const padB = 30;
  const color = opts.color ?? '#0e6b5c';
  const highlight = opts.highlight ?? '#e8a317';
  const values = items.map((d) => d.value);
  const max = Math.max(...values);
  const { lo, hi, ticks } = niceTicks(0, max);
  const slot = (w - padL - padR) / items.length;
  const barW = Math.min(46, slot * 0.62);
  const y = (v) => padT + ((hi - v) * (h - padT - padB)) / (hi - lo || 1);
  const grid = ticks
    .map(
      (t) =>
        `<line x1="${padL}" y1="${y(t)}" x2="${w - padR}" y2="${y(t)}" stroke="#e3e0d6" stroke-width="1"/><text x="${padL - 8}" y="${y(t) + 4}" text-anchor="end" font-size="11" fill="#6b7280">${esc(opts.tickFmt ? opts.tickFmt(t) : String(t))}</text>`,
    )
    .join('');
  const bars = items
    .map((d, i) => {
      const cx = padL + slot * i + slot / 2;
      const fill = d.highlight ? highlight : color;
      return `<rect x="${(cx - barW / 2).toFixed(1)}" y="${y(d.value).toFixed(1)}" width="${barW}" height="${(y(lo) - y(d.value)).toFixed(1)}" rx="4" fill="${fill}"/><text x="${cx}" y="${y(d.value) - 7}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#1c2420">${esc(opts.valueFmt ? opts.valueFmt(d.value) : String(d.value))}</text><text x="${cx}" y="${h - 8}" text-anchor="middle" font-size="11" fill="#6b7280">${esc(d.label)}</text>`;
    })
    .join('');
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="${esc(opts.aria ?? 'Grafik batang')}">
    ${grid}${bars}
  </svg>`;
}

// Grafik batang horizontal — cocok untuk daftar provinsi yang panjang.
export function hbarChart(items, opts = {}) {
  const rowH = opts.rowHeight ?? 30;
  const w = opts.width ?? 640;
  const padL = opts.labelWidth ?? 150;
  const padR = 56;
  const h = rowH * items.length + 16;
  const color = opts.color ?? '#0e6b5c';
  const max = Math.max(...items.map((d) => d.value));
  const rows = items
    .map((d, i) => {
      const y = 8 + i * rowH;
      const bw = ((w - padL - padR) * d.value) / (max || 1);
      return `<text x="${padL - 10}" y="${y + 15}" text-anchor="end" font-size="12" fill="#1c2420">${esc(d.label)}</text><rect x="${padL}" y="${y + 3}" width="${Math.max(2, bw).toFixed(1)}" height="16" rx="3" fill="${d.highlight ? '#e8a317' : color}"/><text x="${padL + Math.max(2, bw) + 8}" y="${y + 16}" font-size="12" font-weight="700" fill="#1c2420">${esc(opts.valueFmt ? opts.valueFmt(d.value) : String(d.value))}</text>`;
    })
    .join('');
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="${esc(opts.aria ?? 'Grafik batang horizontal')}">
    ${rows}
  </svg>`;
}

// Donat sederhana untuk pangsa (mis. struktur PDB).
export function donutChart(items, opts = {}) {
  const size = opts.size ?? 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 14;
  const inner = r - 30;
  const total = items.reduce((s, d) => s + d.value, 0);
  const palette = opts.palette ?? ['#0e6b5c', '#e8a317', '#2f8f7b', '#c96f2e', '#7ba05b', '#4a6fa5'];
  let angle = -90;
  const arcs = items
    .map((d, i) => {
      const frac = d.value / total;
      const a0 = angle;
      const a1 = angle + frac * 360;
      angle = a1;
      const large = frac > 0.5 ? 1 : 0;
      const p = (a) => [(cx + r * Math.cos((a * Math.PI) / 180)).toFixed(1), (cy + r * Math.sin((a * Math.PI) / 180)).toFixed(1)];
      const q = (a) => [(cx + inner * Math.cos((a * Math.PI) / 180)).toFixed(1), (cy + inner * Math.sin((a * Math.PI) / 180)).toFixed(1)];
      const [x0, y0] = p(a0);
      const [x1, y1] = p(a1);
      const [x2, y2] = q(a1);
      const [x3, y3] = q(a0);
      return `<path d="M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${inner},${inner} 0 ${large} 0 ${x3},${y3} Z" fill="${palette[i % palette.length]}"/>`;
    })
    .join('');
  const legend = items
    .map(
      (d, i) =>
        `<div class="legend-item"><span class="legend-dot" style="background:${palette[i % palette.length]}"></span><span>${esc(d.label)}</span><strong>${esc(opts.valueFmt ? opts.valueFmt(d.value) : String(d.value))}</strong></div>`,
    )
    .join('');
  return `<div class="donut-wrap"><svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${esc(opts.aria ?? 'Grafik donat')}">${arcs}<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="20" font-weight="800" fill="#1c2420">${esc(opts.center ?? '')}</text><text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="11" fill="#6b7280">${esc(opts.centerSub ?? '')}</text></svg><div class="legend">${legend}</div></div>`;
}
