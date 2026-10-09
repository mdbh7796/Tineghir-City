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
const checkScript = scopes.has('all') || scopes.has('script');
const checkStay = scopes.has('all') || scopes.has('stay');
const checkContact = scopes.has('all') || scopes.has('contact');
const checkTransport = scopes.has('all') || scopes.has('transport');
const checkTools = scopes.has('all') || scopes.has('tools');
// Default page-structure assertions always run.
const pages = ['index', 'about', 'attractions', 'gallery', 'itineraries', 'guide', 'practical', 'visit', 'stay', 'contact', 'transport', 'tools', 'privacy'];
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
  const tagWith = (id) => (html.match(new RegExp(`<[^>]*\\bid="${id}"[^>]*>`)) || [''])[0];
  if (!html.includes('id="mobile-menu-btn"')) fail(`${p}.html missing #mobile-menu-btn`);
  if (!tagWith('mobile-menu-btn').includes('aria-controls="site-drawer"')) fail(`${p}.html button missing aria-controls="site-drawer"`);
  if (!tagWith('site-drawer').includes('role="dialog"')) fail(`${p}.html drawer missing role="dialog"`);
  if (!tagWith('site-drawer').includes('aria-modal="true"')) fail(`${p}.html drawer missing aria-modal="true"`);
  if (!html.includes('id="drawer-backdrop"')) fail(`${p}.html missing #drawer-backdrop`);
  const hasMap = html.includes('id="map"');
  if ((p === 'index' || p === 'visit') && !hasMap) fail(`${p}.html should contain #map`);
  if (!(p === 'index' || p === 'visit') && hasMap) fail(`${p}.html should not contain #map`);
  if (!html.match(/<title>[^<]+<\/title>/)) fail(`${p}.html missing <title>`);
  const canon = (html.match(/<link rel="canonical" href="([^"]+)" \/>/) || [])[1];
  const ogUrl = (html.match(/<meta property="og:url" content="([^"]+)" \/>/) || [])[1];
  if (!canon) fail(`${p}.html missing canonical`);
  if (ogUrl !== canon) fail(`${p}.html og:url does not match canonical`);
  const desc = (html.match(/<meta\s+name="description"\s+content="([^"]+)"\s*\/>/) || [])[1];
  if (!desc) fail(`${p}.html missing meta description`);
  if (!html.includes('href="./stay.html"')) fail(`${p}.html missing Stay cross-link (drawer/footer)`);
  if (!html.includes('href="./contact.html"')) fail(`${p}.html missing Contact cross-link (drawer/footer)`);
  if (!html.includes('href="./transport.html"')) fail(`${p}.html missing Transport cross-link (drawer/footer)`);
  if (!html.includes('https://www.paypal.com/ncp/payment/J3LGU3527J9FU')) fail(`${p}.html missing tip-jar link`);
}

// Stay page vs stays.json data (stay plan, Task 1)
if (checkStay) {
  const dataPath = join(root, 'src', 'templates', 'stays.json');
  if (!existsSync(dataPath)) fail('missing src/templates/stays.json');
  else {
    const stays = JSON.parse(readFileSync(dataPath, 'utf8'));
    const stayFile = join(pub, 'stay.html');
    if (!existsSync(stayFile)) fail('missing public/stay.html');
    else {
      const html = readFileSync(stayFile, 'utf8');
      const cards = html.split('data-stay="').slice(1);
      if (cards.length !== stays.length) fail(`stay.html has ${cards.length} cards for ${stays.length} stays`);
      for (const s of stays) {
        const chunk = cards.find((c) => c.startsWith(`${s.name}"`));
        if (!chunk) { fail(`stay.html missing card for "${s.name}"`); continue; }
        const body = chunk.slice(0, chunk.indexOf('data-stay="') < 0 ? chunk.length : chunk.indexOf('data-stay="'));
        const actions = (body.match(/href="(https:\/\/www\.booking\.com|tel:|https:\/\/wa\.me\/|https:\/\/www\.google\.com\/maps\/dir\/)/g) || []).length;
        if (!actions) fail(`stay card "${s.name}" has no action link`);
        if (s.verified === false && body.includes('https://www.google.com/maps/dir/'))
          fail(`unverified stay "${s.name}" must not render Directions`);
      }
      for (const m of html.matchAll(/href="(tel:[^"]+)"/g)) {
        if (!/^tel:\+212\d{9}$/.test(m[1])) fail(`bad tel: link "${m[1]}"`);
      }
      for (const m of html.matchAll(/href="(https:\/\/wa\.me\/[^"]+)"/g)) {
        if (!/^https:\/\/wa\.me\/212\d{9}(\?.*)?$/.test(m[1])) fail(`bad wa.me link "${m[1]}"`);
      }
      for (const m of html.matchAll(/href="(https:\/\/www\.booking\.com[^"]*)"/g)) {
        if (!m[1].startsWith('https://www.booking.com/searchresults.html?ss=') || /\s/.test(m[1]))
          fail(`bad booking link "${m[1]}"`);
      }
      for (const m of html.matchAll(/<a[^>]*href="https:\/\/www\.booking\.com[^"]*"[^>]*>/g)) {
        if (!/aria-label="Book [^"]+ on Booking\.com"/.test(m[0])) fail('booking link missing accessible name');
      }
      for (const m of html.matchAll(/<img[^>]+src="(images\/[^"]+)"[^>]*>/g)) {
        if (!existsSync(join(pub, m[1].split('?')[0]))) fail(`stay image missing: ${m[1]}`);
      }
    }
  }
}

// Contact directory vs contacts.json + stays.json reuse (call directory)
if (checkContact) {
  const dataPath = join(root, 'src', 'templates', 'contacts.json');
  if (!existsSync(dataPath)) fail('missing src/templates/contacts.json');
  else {
    const contacts = JSON.parse(readFileSync(dataPath, 'utf8'));
    const contactFile = join(pub, 'contact.html');
    if (!existsSync(contactFile)) fail('missing public/contact.html');
    else {
      const html = readFileSync(contactFile, 'utf8');
      const cards = html.split('data-contact="').slice(1);
      if (cards.length < contacts.length) fail(`contact.html has ${cards.length} cards for ${contacts.length} contacts`);
      for (const c of contacts) {
        const chunk = cards.find((x) => x.startsWith(`${c.name}"`));
        if (!chunk) { fail(`contact.html missing card for "${c.name}"`); continue; }
        const body = chunk.slice(0, chunk.indexOf('data-contact="') < 0 ? chunk.length : chunk.indexOf('data-contact="'));
        if (c.phone && !body.includes(`tel:${c.phone}`)) fail(`contact "${c.name}" missing tel: link`);
      }
      // Stays numbers are reused from stays.json — every stay with a phone appears.
      const stays = JSON.parse(readFileSync(join(root, 'src', 'templates', 'stays.json'), 'utf8'));
      for (const s of stays.filter((x) => x.phone)) {
        if (!html.includes(`tel:${s.phone}`)) fail(`contact.html missing reused stay number for "${s.name}"`);
      }
      if (!html.includes('./practical.html')) fail('contact.html missing emergency link to practical.html');
    }
  }
}

// Trip tools page sections (trip tools plan, Task 1)
if (checkTools) {
  const f = join(pub, 'tools.html');
  if (!existsSync(f)) fail('missing public/tools.html');
  else {
    const html = readFileSync(f, 'utf8');
    for (const needle of ['id="pack-list"', 'id="plan-list"', 'id="pack-progress"', 'js/tools.js']) {
      if (!html.includes(needle)) fail(`tools.html missing "${needle}"`);
    }
  }
}

// Transport page outbound links (flights & transport)
if (checkTransport) {
  const f = join(pub, 'transport.html');
  if (!existsSync(f)) fail('missing public/transport.html');
  else {
    const html = readFileSync(f, 'utf8');
    for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
      if (!m[1].startsWith('https://')) fail(`transport.html has non-https link "${m[1]}"`);
    }
    if (!html.includes('rel="noopener"')) fail('transport.html outbound links missing rel=noopener');
    for (const needle of ['Ouarzazate', 'Errachidia', 'CTM', 'contact.html']) {
      if (!html.includes(needle)) fail(`transport.html missing "${needle}"`);
    }
  }
}
{
  const titles = new Set();
  for (const p of pages) {
    const f = join(pub, `${p}.html`);
    if (!existsSync(f)) continue;
    const html = readFileSync(f, 'utf8');
    const t = (html.match(/<title>([^<]+)<\/title>/) || [])[1];
    if (t) {
      if (titles.has(t)) fail(`duplicate <title>: ${t}`);
      titles.add(t);
    }
  }
  const css = readFileSync(join(pub, 'style.css'), 'utf8');
  for (const needle of ['.site-drawer', '.nav-active']) {
    if (!css.includes(needle)) fail(`public/style.css missing "${needle}"`);
  }
}

// Drawer behavior assets (Task 2): shared drawer.js + styles
{
  const dj = join(pub, 'js', 'drawer.js');
  if (!existsSync(dj)) fail('missing public/js/drawer.js');
  else {
    const js = readFileSync(dj, 'utf8');
    for (const needle of ['openDrawer', 'closeDrawer', 'location.pathname', 'aria-expanded']) {
      if (!js.includes(needle)) fail(`public/js/drawer.js missing "${needle}"`);
    }
    if (!js.includes('Tab') && !js.toLowerCase().includes('focustrap') && !js.includes('focusable'))
      fail('public/js/drawer.js missing focus-trap handling');
  }
  const css = readFileSync(join(root, 'src', 'input.css'), 'utf8');
  for (const needle of ['site-drawer', 'drawer-open', 'drawer-backdrop']) {
    if (!css.includes(needle)) fail(`src/input.css missing "${needle}"`);
  }
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

// Per-page script guards + back-button flow (Task 3)
if (checkScript) {
  const sj = readFileSync(join(pub, 'script.js'), 'utf8');
  if (sj.includes('hashEntries')) fail('public/script.js still counts hash history entries');
  if (sj.includes('initScrollspy')) fail('public/script.js still contains anchor scrollspy');
  if (sj.includes("getElementById('mobile-menu')")) fail('public/script.js still references removed #mobile-menu');
  for (const needle of ['.lightbox-trigger', '#attractions-grid']) {
    if (!sj.includes(needle)) fail(`public/script.js missing mount guard for "${needle}"`);
  }
  if (!sj.includes('exitApp')) fail('public/script.js missing Capacitor exitApp fallback');
}
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

// Responsive images must ship AVIF + WebP alongside JPEG (perf plan).
{
  const opt = readFileSync(join(root, 'scripts', 'optimize-images.mjs'), 'utf8');
  if (!/\.avif\(/.test(opt)) fail('scripts/optimize-images.mjs missing .avif() variant');
  if (!/AVIF_Q/.test(opt)) fail('scripts/optimize-images.mjs missing AVIF_Q');
}

if (failures.length) {
  console.error('check:pages FAIL');
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}
console.log(`check:pages PASS (${pages.length} pages, drawer, map scope, lightbox scope, sitemap)`);
