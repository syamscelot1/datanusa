// Tabel data yang bisa diurutkan (klik judul kolom) dan difilter (ketik di
// kotak cari). Dipakai di halaman provinsi dan di halaman-halaman lain.

export function dataTable(id, columns, rows, opts = {}) {
  const head = columns
    .map(
      (c, i) =>
        `<th data-col="${i}" data-key="${c.key}" scope="col" tabindex="0" aria-sort="none">${c.label}<span class="sort-mark" aria-hidden="true"></span></th>`,
    )
    .join('');
  return `<div class="table-tools">
      <label class="filter-label" for="${id}-filter">Cari ${opts.filterLabel ?? 'baris'}:</label>
      <input id="${id}-filter" class="filter-input" type="search" placeholder="${opts.filterPlaceholder ?? 'Ketik untuk memfilter…'}" autocomplete="off">
      <span class="table-count" id="${id}-count"></span>
    </div>
    <div class="table-scroll">
      <table class="data-table" id="${id}">
        <thead><tr>${head}</tr></thead>
        <tbody></tbody>
      </table>
    </div>
    <p class="table-source">${opts.source ?? ''}</p>`;
}

// Mengisi tbody dan memasang sort + filter. rows: array objek; columns:
// [{key, label, fmt(row)->string, num(row)->number|null, align}].
export function bindDataTable(id, columns, rows) {
  const table = document.getElementById(id);
  if (!table) return;
  const tbody = table.querySelector('tbody');
  const filter = document.getElementById(`${id}-filter`);
  const count = document.getElementById(`${id}-count`);
  const state = { sortKey: null, sortDir: 1, query: '' };

  function visibleRows() {
    let out = rows.slice();
    if (state.query) {
      const q = state.query.toLowerCase();
      out = out.filter((r) => columns.some((c) => String(c.fmt(r)).toLowerCase().includes(q)));
    }
    if (state.sortKey) {
      const col = columns.find((c) => c.key === state.sortKey);
      out.sort((a, b) => {
        const av = col.num ? col.num(a) : String(col.fmt(a));
        const bv = col.num ? col.num(b) : String(col.fmt(b));
        if (av < bv) return -1 * state.sortDir;
        if (av > bv) return 1 * state.sortDir;
        return 0;
      });
    }
    return out;
  }

  function render() {
    const list = visibleRows();
    tbody.innerHTML = list
      .map(
        (r) =>
          `<tr>${columns.map((c) => `<td${c.align ? ` class="num"` : ''}>${c.fmt(r)}</td>`).join('')}</tr>`,
      )
      .join('');
    if (count) count.textContent = `${list.length} dari ${rows.length} baris`;
    table.querySelectorAll('th').forEach((th) => {
      const active = th.dataset.key === state.sortKey;
      th.setAttribute('aria-sort', active ? (state.sortDir === 1 ? 'ascending' : 'descending') : 'none');
      th.querySelector('.sort-mark').textContent = active ? (state.sortDir === 1 ? ' ▲' : ' ▼') : '';
    });
  }

  table.querySelectorAll('th').forEach((th) => {
    const toggle = () => {
      const key = th.dataset.key;
      if (state.sortKey === key) state.sortDir *= -1;
      else {
        state.sortKey = key;
        state.sortDir = 1;
      }
      render();
    };
    th.addEventListener('click', toggle);
    th.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });
  if (filter) {
    filter.addEventListener('input', () => {
      state.query = filter.value.trim();
      render();
    });
  }
  render();
  // API untuk kontrol di luar tabel (mis. menu "Urutkan" di halaman provinsi).
  return {
    setSort(key, dir) {
      state.sortKey = key;
      state.sortDir = dir;
      render();
    },
    setQuery(q) {
      state.query = q;
      if (filter) filter.value = q;
      render();
    },
  };
}
