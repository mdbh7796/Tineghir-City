// Idempotent image pipeline: originals live in assets/originals/ (never
// overwritten); every file under public/images/ is regenerated from them.
// Rerunning produces byte-identical results. Run: npm run images:optimize
import sharp from 'sharp';
import { readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const SRC = 'assets/originals';
const OUT = 'public/images';
const MAX_W = 1920;
const JPEG_Q = 78;
const WEBP_Q = 75;
const WIDTHS = [640, 1024, 1920];

// Hero + every original over ~1 MB get <picture> treatment (WebP + srcset).
// Anything listed here must have a matching <picture> block in index.html.
const RESPONSIVE = new Set([
  'hero-tineghir.jpg',
  'todra-gorge-hike.jpg',
  'gallery-river.jpg',
  'gallery-crafts.jpg',
  'gallery-palms.jpg',
  'todra-gorge.jpg',
  'gallery-trek.jpg',
  'kasbah-el-glaoui.jpg',
  'tineghir-palm-grove.jpg',
]);

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
let totalBefore = 0;
let totalAfter = 0;
const rows = [];

for (const file of readdirSync(SRC).filter((f) => f.endsWith('.jpg'))) {
  const src = join(SRC, file);
  const name = basename(file, '.jpg');
  const before = statSync(src).size;
  const meta = await sharp(src).metadata();
  totalBefore += before;

  // Base file: max 1920px wide, progressive JPEG. Never upscales.
  const base = sharp(src);
  if ((meta.width || 0) > MAX_W) base.resize({ width: MAX_W });
  const baseBuf = await base.jpeg({ quality: JPEG_Q, progressive: true }).toBuffer();
  const { writeFileSync } = await import('node:fs');
  writeFileSync(join(OUT, file), baseBuf);
  totalAfter += baseBuf.length;
  rows.push(`${file}: ${kb(before)} -> ${kb(baseBuf.length)} (${meta.width}x${meta.height})`);

  // Responsive variants, only for <picture> files, never upscaled.
  if (RESPONSIVE.has(file)) {
    for (const w of WIDTHS) {
      if ((meta.width || 0) < w) {
        rows.push(`  ! ${name}-${w}.jpg/.webp skipped (original ${meta.width}px, no upscale)`);
        continue;
      }
      const variants = [
        [`${name}-${w}.jpg`, sharp(src).resize({ width: w }).jpeg({ quality: JPEG_Q, progressive: true })],
        [`${name}-${w}.webp`, sharp(src).resize({ width: w }).webp({ quality: WEBP_Q })],
      ];
      for (const [outName, pipeline] of variants) {
        const buf = await pipeline.toBuffer();
        writeFileSync(join(OUT, outName), buf);
        totalAfter += buf.length;
      }
    }
    rows.push(`  + ${name}-{640,1024,1920}.jpg/.webp variants`);
  }
}

// Social card: exact 1200x630 crop from the gorge photo.
const og = await sharp(join(SRC, 'todra-gorge.jpg'))
  .resize({ width: 1200, height: 630, fit: 'cover' })
  .jpeg({ quality: 80 })
  .toBuffer();
const { writeFileSync: write } = await import('node:fs');
write(join(OUT, 'og-image.jpg'), og);
totalAfter += og.length;
rows.push(`og-image.jpg: new, ${kb(og.length)} (1200x630)`);

console.log(rows.join('\n'));
console.log(`TOTAL: ${kb(totalBefore)} -> ${kb(totalAfter)}`);
