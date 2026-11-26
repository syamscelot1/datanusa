# DataNusa — Statistik Nasional Indonesia

[![make.fun · best-national-statistics-site-20261126-0539](https://make.fun/badge/best-national-statistics-site-20261126-0539.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539?utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539)
[![rank](https://make.fun/badge/best-national-statistics-site-20261126-0539/syamscelot1/datanusa/rank.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539)
[![reward](https://make.fun/badge/best-national-statistics-site-20261126-0539/syamscelot1/datanusa/reward.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539?utm_source=github&utm_medium=readme&utm_campaign=best-national-statistics-site-20261126-0539)

DataNusa is a complete national statistics site for Indonesia, built from
scratch for make.fun's "Make the best national statistics site" bounty.
Everything is original: the DataNusa identity, the design, the hand-drawn
SVG charts and every line of copy. No network, no build step, no tracker,
no cookie — the site runs entirely offline from its own files, on desktop
and on a phone.

Every figure on the site comes from Indonesia's Badan Pusat Statistik (BPS)
and is shown with its source and year: population, GDP, inflation,
unemployment, poverty, inequality and the Human Development Index, plus a
province comparison for all 38 provinces. No figure is invented.

## What is inside

- **Home** — six headline indicators (population 281.6 million, GDP
  Rp22,139 trillion, inflation 1.57%, unemployment 4.91%, poverty 8.57%,
  HDI 75.02), growth and population charts, and cards into every topic.
- **Kependudukan** — population 2018–2024, census results, Java density,
  and the 10 most populous provinces.
- **Ekonomi** — GDP and growth 2020–2024, the five biggest sectors (with a
  donut chart), fastest-growing sectors, expenditure growth, and 2024 trade
  (exports US$264.70B, imports US$233.66B, surplus US$31.04B).
- **Ketenagakerjaan** — open unemployment 2020–2024 (Feb & Aug), labour
  force 152.11 million, and the 10 provinces with the highest unemployment.
- **Harga & Inflasi** — annual inflation 2020–2024 against Bank Indonesia's
  2.5% ± 1% target, with a plain-language explainer.
- **Kemiskinan & Kesejahteraan** — poverty 2020–2024, the poverty line
  (Rp595,242/capita/month, Sep 2024), Gini ratio, and HDI with its four
  components.
- **Perbandingan Provinsi** — switch between Population, Poverty and
  Unemployment for all 38 provinces: bar charts plus a sortable, filterable
  table, and a tool that compares any three of the 10 largest provinces
  side by side.
- **Tentang** — methodology and the full source list for every figure.

## Run it

No build step, no network. Serve `app/` with any static server and open
`index.html` in desktop Chrome:

```sh
node serve.ts
# open http://localhost:8080
```

## Layout

- `app/index.html` — the shell: header, navigation, footer
- `app/css/style.css` — the whole design system
- `app/js/data.js` — every BPS figure, with source and year
- `app/js/charts.js` — hand-built SVG charts (line, bar, horizontal bar, donut)
- `app/js/table.js` — sortable, filterable data tables
- `app/js/views.js` — one renderer per page
- `app/js/router.js` — hash routing between the eight pages
- `app/js/format.js` — Indonesian number formatting
- `app/js/main.js` — bootstrap
- `main.ts` — the make.fun entry program (Node 22, stdlib only)

Built for the make.fun bounty
[Make the best national statistics site](https://make.fun/bounty/best-national-statistics-site-20261126-0539).
