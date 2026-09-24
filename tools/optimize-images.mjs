// Creates responsive WebP versions of every JPG/PNG photo in images/ into
// images/opt/, plus a manifest the build uses to write srcset attributes.
//   npm i --no-save sharp   (once, or run from a folder that has sharp)
//   node tools/optimize-images.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(process.env.SHARP_FROM ? path.join(process.env.SHARP_FROM, 'x.js') : import.meta.url);
const sharp = require('sharp');
const SRC = path.join(ROOT, 'images'), OUT = path.join(SRC, 'opt');
const WIDTHS = [480, 960, 1440];
fs.mkdirSync(OUT, { recursive: true });
const manifest = {};
for (const f of fs.readdirSync(SRC)) {
  if (!/\.(jpe?g)$/i.test(f) || f.startsWith('logo')) continue;
  const base = f.replace(/\.[^.]+$/, '');
  const meta = await sharp(path.join(SRC, f)).metadata();
  const ws = WIDTHS.filter(w => w < meta.width - 40).concat(Math.min(meta.width, 1600));
  manifest[f] = { w: meta.width, h: meta.height, sizes: [...new Set(ws)] };
  for (const w of manifest[f].sizes) {
    const out = path.join(OUT, `${base}-${w}.webp`);
    if (!fs.existsSync(out)) await sharp(path.join(SRC, f)).resize({ width: w }).webp({ quality: 72, effort: 5 }).toFile(out);
  }
}
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
console.log(`Optimized ${Object.keys(manifest).length} images`);
