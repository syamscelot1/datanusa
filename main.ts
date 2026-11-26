// DataNusa — program entri make.fun (Node 22, standard library saja).
//
// Tugasnya satu: menyerahkan situs di app/ beserta screenshots/ ke /output
// dan menulis /output/dossier.json dengan library make.fun yang divendor.
// Di luar container grader, MAKEFUN_OUTPUT_DIR menggantikan /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Program ini deterministik: dua kali jalan menulis byte yang sama.

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Menyalin satu pohon direktori (file biasa saja) ke tujuan, membuat
// direktori yang dibutuhkan di tengah jalan.
function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    const src = join(from, name);
    const dst = join(to, name);
    const info = statSync(src);
    if (info.isDirectory()) copyTree(src, dst);
    else if (info.isFile()) writeFileSync(dst, readFileSync(src));
  }
}

mkdirSync(outDir, { recursive: true });
copyTree(join(repoRoot, 'app'), join(outDir, 'app'));
if (existsSync(join(repoRoot, 'screenshots'))) {
  copyTree(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'));
}

// Batas gate yang sama dengan yang dipakai scorer: teks dossier dibatasi
// 160 KiB; maksimal 4 screenshot @ 256 KiB; app/ maksimal 993 entri dan
// 16 MiB. buildDossier menolak entri yang melampaui batas-batas ini.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
