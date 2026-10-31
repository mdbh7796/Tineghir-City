// Generates Google Play listing graphics from the built site + brand assets.
// Usage: node scripts/play-graphics.mjs   (also: npm run play:graphics)
// Requires the site to be built first (npm run build) — serves public/ locally.
//
// Outputs (all committed under assets/play/):
//   icon-512.png                  512x512   Play Store app icon
//   feature-graphic-1024x500.png  1024x500  Play feature graphic (no alpha)
//   screenshots/phone-NN-*.png    1080x1920 phone screenshots (9:16)
import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { chromium } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const outDir = join(root, 'assets', 'play');
const shotsDir = join(outDir, 'screenshots');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

function staticServer() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      // Prevent path traversal: resolve then confirm it stays under publicDir.
      const rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
      const file = join(publicDir, rel === '' ? 'index.html' : rel);
      if (!file.startsWith(publicDir) || !existsSync(file)) {
        res.writeHead(404).end('not found');
        return;
      }
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': MIME[extname(file).toLowerCase()] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(500).end('error');
    }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

// Brand mark (hexagon) lifted from src/templates/footer.html — kept in sync by eye.
const MARK = `<svg viewBox="0 0 40 40" fill="currentColor" aria-hidden="true">
  <path d="M20 2L4 12v16l16 10 16-10V12L20 2zm0 4l12 7.5v11L20 32 8 24.5v-11L20 6z"/>
  <path d="M20 10l-8 5v8l8 5 8-5v-8l-8-5zm0 3l5 3.125v5L20 24.25l-5-3.125v-5L20 13z"/>
</svg>`;

function featureHtml(bgUrl) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 1024px; height: 500px; overflow: hidden; }
  .fg { position: relative; width: 1024px; height: 500px; background: #1c1917; }
  .bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .grad { position: absolute; inset: 0;
    background: linear-gradient(90deg, rgba(28,25,23,.97) 0%, rgba(28,25,23,.86) 42%, rgba(28,25,23,.30) 100%); }
  .content { position: absolute; inset: 0; padding: 0 72px; display: flex; flex-direction: column;
    justify-content: center; gap: 16px; }
  .eyebrow { font-family: Outfit, sans-serif; letter-spacing: .30em; text-transform: uppercase;
    color: #f59e0b; font-size: 15px; font-weight: 600; }
  h1 { font-family: "Playfair Display", Georgia, serif; color: #fff; font-size: 72px; line-height: 1.0;
    font-weight: 700; letter-spacing: -.01em; }
  p { font-family: Outfit, sans-serif; color: #d6d3d1; font-size: 22px; font-weight: 300; max-width: 620px; }
  .mark { position: absolute; right: 68px; top: 50%; transform: translateY(-50%); width: 156px; height: 156px;
    color: #d97706; opacity: .92; }
</style></head>
<body>
  <div class="fg">
    <img class="bg" src="${bgUrl}" alt="">
    <div class="grad"></div>
    <div class="content">
      <div class="eyebrow">Tineghir &middot; Morocco</div>
      <h1>Tineghir City</h1>
      <p>Gateway to Todra Gorge — offline maps, stays &amp; guides.</p>
    </div>
    <div class="mark">${MARK}</div>
  </div>
</body></html>`;
}

// Phone screenshots: 540x960 CSS at DPR 2 -> 1080x1920 (exactly 9:16) with the
// mobile layout (<768px breakpoint), which is what a phone screenshot should show.
const SHOTS = [
  ['index', 'Home'],
  ['attractions', 'Attractions'],
  ['gallery', 'Gallery'],
  ['stay', 'Where to stay'],
  ['tools', 'Trip tools'],
  ['visit', 'Plan your visit'],
];

async function main() {
  if (!existsSync(join(publicDir, 'index.html'))) {
    console.error('play:graphics: public/index.html missing — run `npm run build` first.');
    process.exit(1);
  }
  await mkdir(shotsDir, { recursive: true });

  // 1. Play app icon: 512x512, flattened (Play shows it masked over its own bg).
  await sharp(join(root, 'assets', 'icon.png'))
    .resize(512, 512, { fit: 'cover' })
    .png()
    .toFile(join(outDir, 'icon-512.png'));
  console.log('play:graphics: wrote assets/play/icon-512.png');

  const server = await staticServer();
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  try {
    // 2. Feature graphic: 1024x500, no alpha.
    const fgPage = await browser.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
    await fgPage.setContent(featureHtml(`${base}/images/hero-tineghir-1920.jpg`), { waitUntil: 'networkidle' });
    await fgPage.evaluate(() => document.fonts && document.fonts.ready);
    const fgBuf = await fgPage.screenshot({ type: 'png' });
    await fgPage.close();
    await sharp(fgBuf)
      .flatten({ background: '#1c1917' })
      .png()
      .toFile(join(outDir, 'feature-graphic-1024x500.png'));
    console.log('play:graphics: wrote assets/play/feature-graphic-1024x500.png');

    // 3. Phone screenshots (light theme).
    const ctx = await browser.newContext({
      viewport: { width: 540, height: 960 },
      deviceScaleFactor: 2,
      colorScheme: 'light',
    });
    let n = 0;
    for (const [slug, label] of SHOTS) {
      n += 1;
      const page = await ctx.newPage();
      await page.goto(`${base}/${slug}.html`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      await page.evaluate(() => window.scrollTo(0, 0));
      const file = join(shotsDir, `phone-${String(n).padStart(2, '0')}-${slug}.png`);
      await page.screenshot({ path: file, type: 'png' });
      await page.close();
      console.log(`play:graphics: wrote assets/play/screenshots/${label} (${slug})`);
    }
    await ctx.close();
  } finally {
    await browser.close();
    server.close();
  }
  console.log(`play:graphics: done (${SHOTS.length} screenshots + icon + feature graphic)`);
}

main().catch((e) => {
  console.error(`play:graphics: ${e.message}`);
  process.exit(1);
});
