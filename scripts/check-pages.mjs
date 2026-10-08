// Validates the build-time multipage output (see Task 1/4 of the plan).
// Exit non-zero with a message on the first failure class found.
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const scopes = new Set((process.argv.find((a) => a.startsWith('--scope='))?.split('=')[1] ?? 'all').split(','));
const checkLightbox = scopes.has('all') || scopes.has('lightbox');
const checkSitemap = scopes.has('all') || scopes.has('sitemap');
// Default page-structure assertions always run.
const pages = ['index', 'about', 'attractions', 'gallery', 'itineraries', 'guide', 'practical', 'visit'];
const failures = [];
const fail = (m) => failures.push(m);

for (const p of pages) {
  const f = join(pub, `${p}.html`);
  if (!existsSync(f)) { fail(`missing public/${p}.html`); continue; }
  const html = readFileSync(f, 'utf8');
  if (html.includes('{{') || html.includes('IF:showMap') || html.includes('IF:leaflet'))
    fail(`${p}.html contains unreplaced template slot`);
  if (html.match(/href="#(home|about|attractions|gallery|guide|practical|visit)"/))
    fail(`${p}.html contains legacy cross-section anchor`);
  if (!html.includes('id="site-drawer"')) fail(`${p}.html missing #site-drawer`);
  if (!html.includes('id="mobile-menu-btn"')) fail(`${p}.html missing #mobile-menu-btn`);
  if (!html.includes('id="drawer-backdrop"')) fail(`${p}.html missing #drawer-backdrop`);
  const hasMap = html.includes('id="map"');
  if ((p === 'index' || p === 'visit') && !hasMap) fail(`${p}.html should contain #map`);
  if (!(p === 'index' || p === 'visit') && hasMap) fail(`${p}.html should not contain #map`);
  if (!html.match(/<title>[^<]+<\/title>/)) fail(`${p}.html missing <title>`);
}

// Lightbox lives on gallery only (Task 3)
if (checkLightbox) for (const p of pages) {
  const f = join(pub, `${p}.html`);
  if (!existsSync(f)) continue;
  const html = readFileSync(f, 'utf8');
  const hasLb = html.includes('id="lightbox"');
  if (p === 'gallery' && !hasLb) fail('gallery.html should contain #lightbox');
  if (p !== 'gallery' && hasLb) fail(`${p}.html should not contain #lightbox`);
}

// Sitemap lists all 8 pages (Task 4)
if (checkSitemap) {
const smPath = join(pub, 'sitemap.xml');
if (!existsSync(smPath)) fail('missing public/sitemap.xml');
else {
const sm = readFileSync(smPath, 'utf8');
for (const p of pages) {
  const loc = p === 'index' ? 'https://www.tineghir.ma/' : `https://www.tineghir.ma/${p}.html`;
  if (!sm.includes(loc)) fail(`sitemap.xml missing ${loc}`);
}
}
}

if (failures.length) {
  console.error('check:pages FAIL');
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}
console.log('check:pages PASS (8 pages, drawer, map scope, lightbox scope, sitemap)');
