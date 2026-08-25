import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const walk = (d) => fs.readdirSync(d, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));

const rows = [];
for (const f of walk('public/images')) {
  const rel = f.split(path.sep).join('/');
  try {
    const m = await sharp(f).metadata();
    rows.push(`${String(m.width).padStart(5)} x ${String(m.height).padEnd(6)}${(m.width / m.height).toFixed(2).padStart(6)}  ${rel}`);
  } catch {
    rows.push(`  ERR                 ${rel}`);
  }
}
console.log(rows.sort((a, b) => a.slice(21).localeCompare(b.slice(21))).join('\n'));
