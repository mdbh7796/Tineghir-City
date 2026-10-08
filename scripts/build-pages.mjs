// Assembles public/*.html from src/templates (Approach C, build-time templates).
// Usage: node scripts/build-pages.mjs
// Fails fast on missing slots/fragments or dangling ./page.html links.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tplDir = join(root, 'src', 'templates');
const pagesDir = join(tplDir, 'pages');
const publicDir = join(root, 'public');

const fail = (msg) => {
  console.error(`pages:build: ${msg}`);
  process.exit(1);
};

const AREAS = { 'gorge-road': 'Gorge road', town: 'In town', palmeraie: 'Palmeraie' };
const PRICE_BANDS = new Set(['budget', 'mid', 'splurge']);

export function validateStays(stays, rootDir = root) {
  if (!Array.isArray(stays) || !stays.length) fail('stays.json must be a non-empty array');
  for (const s of stays) {
    for (const key of ['name', 'area', 'priceBand', 'blurb', 'bookingUrl', 'mapsQuery']) {
      if (!s[key] || typeof s[key] !== 'string') fail(`stays.json: "${s.name || '?'}" missing "${key}"`);
    }
    if (!AREAS[s.area]) fail(`stays.json: "${s.name}" has bad area "${s.area}"`);
    if (!PRICE_BANDS.has(s.priceBand)) fail(`stays.json: "${s.name}" has bad priceBand "${s.priceBand}"`);
    if (!s.bookingUrl.startsWith('https://www.booking.com/searchresults.html?ss=') || /\s/.test(s.bookingUrl))
      fail(`stays.json: "${s.name}" has bad bookingUrl`);
    if (s.phone !== undefined && !/^\+\d{10,15}$/.test(s.phone))
      fail(`stays.json: "${s.name}" phone must be E.164 like +2126XXXXXXXX`);
    if (s.whatsapp !== undefined && !/^\d{10,15}$/.test(s.whatsapp))
      fail(`stays.json: "${s.name}" whatsapp must be digits only like 2126XXXXXXXX`);
    if (s.image !== undefined && !existsSync(join(rootDir, 'public', s.image)))
      fail(`stays.json: "${s.name}" image missing: ${s.image}`);
  }
  return stays;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

export function renderStayEntry(s) {
  const waText = encodeURIComponent(`Hello ${s.name}, I'd like to inquire about availability.`);
  const btn = 'inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[44px]';
  const actions = [
    `<a href="${s.bookingUrl}" target="_blank" rel="noopener" class="${btn} bg-amber-700 hover:bg-amber-600 text-white">Book</a>`,
    ...(s.phone ? [`<a href="tel:${s.phone}" aria-label="Call ${esc(s.name)}" class="${btn} border-2 border-amber-500/50 text-amber-200 hover:bg-amber-500/10">Call</a>`] : []),
    ...(s.whatsapp ? [`<a href="https://wa.me/${s.whatsapp}?text=${waText}" target="_blank" rel="noopener" aria-label="Message ${esc(s.name)} on WhatsApp" class="${btn} border-2 border-amber-500/50 text-amber-200 hover:bg-amber-500/10">WhatsApp</a>`] : []),
    ...(s.verified === false ? [] : [`<a href="https://www.google.com/maps/dir/?api=1&amp;destination=${encodeURIComponent(s.mapsQuery)}" target="_blank" rel="noopener" class="${btn} text-amber-700 hover:text-amber-600">Directions 🧭</a>`]),
  ].join('\n              ');
  const photo = s.image
    ? `<img src="${s.image}" alt="${esc(s.name)}" loading="lazy" class="w-full h-48 object-cover">`
    : `<div class="w-full h-48 bg-stone-200 flex items-center justify-center text-4xl" aria-hidden="true">🏨</div>`;
  return `          <div data-stay="${esc(s.name)}" class="card-hover bg-white rounded-2xl overflow-hidden shadow-lg reveal">
            ${photo}
            <div class="p-6">
              <div class="flex items-center gap-2 mb-2">
                <span class="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">${s.priceBand}</span>
              </div>
              <h3 class="font-display text-2xl font-bold text-stone-800 mb-2">${esc(s.name)}</h3>
              <p class="text-stone-600 mb-4">${esc(s.blurb)}</p>
              <div class="flex flex-wrap gap-3">
              ${actions}
              </div>
            </div>
          </div>`;
}

export function renderStaySection(stays) {
  return Object.keys(AREAS).map((area) => {
    const cards = stays.filter((s) => s.area === area).map(renderStayEntry).join('\n');
    if (!cards) return '';
    return `    <!-- Stay: ${AREAS[area]} -->
    <h2 class="font-display text-2xl font-bold text-stone-800 mt-12 mb-6">${AREAS[area]}</h2>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
${cards}
    </div>`;
  }).filter(Boolean).join('\n');
}

export function buildPages(rootDir = root) {
  const dir = join(rootDir, 'src', 'templates');
  const pDir = join(dir, 'pages');
  const outDir = join(rootDir, 'public');
  const meta = JSON.parse(readFileSync(join(dir, 'pages.meta.json'), 'utf8'));
  const base = readFileSync(join(dir, 'base.html'), 'utf8');
  const nav = readFileSync(join(dir, 'nav.html'), 'utf8');
  const footer = readFileSync(join(dir, 'footer.html'), 'utf8');

  for (const slot of ['{{NAV}}', '{{CONTENT}}', '{{FOOTER}}', '{{TITLE}}', '{{DESCRIPTION}}', '{{CANONICAL}}', '{{ACTIVE_NAV}}']) {
    if (!base.includes(slot)) fail(`base.html missing slot ${slot}`);
  }

  const applyCond = (html, flags) =>
    html
      .replace(/<!--IF:(\w+)-->([\s\S]*?)<!--ENDIF-->/g, (_, key, body) => (flags[key] ? body : ''))
      .replace(/<!--IFNOT:(\w+)-->([\s\S]*?)<!--ENDIF-->/g, (_, key, body) => (flags[key] ? '' : body));

  const written = [];
  for (const [page, m] of Object.entries(meta)) {
    for (const key of ['title', 'description', 'canonical', 'activeNav']) {
      if (!m[key]) fail(`pages.meta.json: "${page}" missing "${key}"`);
    }
    let content;
    if (m.staySource) {
      const stays = validateStays(JSON.parse(readFileSync(join(dir, m.staySource), 'utf8')), rootDir);
      const intro = `    <!-- Stay intro -->
    <section class="py-20 md:py-28 bg-stone-100">
      <div class="max-w-7xl mx-auto px-4">
        <div class="text-center mb-14">
          <p class="text-amber-700 font-medium tracking-widest uppercase text-sm mb-4">
            Sleep
          </p>
          <h1 class="font-display text-[clamp(1.875rem,4vw+1rem,3rem)] font-bold text-stone-800 mb-6">
            Where to Stay in Tineghir
          </h1>
          <p class="text-stone-600 text-lg max-w-2xl mx-auto">
            Kasbah-hotels on the gorge road, family riads in town, and garden
            lodges in the palmeraie — book direct online, call, or message
            on WhatsApp.
          </p>
        </div>
${renderStaySection(stays)}
      </div>
    </section>`;
      content = intro;
    } else {
      if (!m.fragments || !m.fragments.length) fail(`pages.meta.json: "${page}" missing "fragments"`);
      content = m.fragments.map((f) => {
        const p = join(pDir, f);
        if (!existsSync(p)) fail(`missing fragment src/templates/pages/${f} (page "${page}")`);
        return readFileSync(p, 'utf8');
      }).join('\n');
    }
    let html = base
      .replaceAll('{{TITLE}}', m.title)
      .replaceAll('{{DESCRIPTION}}', m.description)
      .replaceAll('{{CANONICAL}}', m.canonical)
      .replaceAll('{{ACTIVE_NAV}}', m.activeNav)
      .replace('{{NAV}}', nav)
      .replace('{{CONTENT}}', content)
      .replace('{{FOOTER}}', footer);
    html = applyCond(html, { showMap: !!m.showMap, leaflet: !!m.leaflet });
    if (/\{\{|\}\}|IF:(showMap|leaflet)|IFNOT:/.test(html)) fail(`${page}.html has unreplaced template markers`);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, `${page}.html`), html.endsWith('\n') ? html : html + '\n');
    written.push(`${page}.html`);
  }

  // Validate internal page links resolve to generated pages.
  const built = new Set(readdirSync(outDir).filter((f) => f.endsWith('.html')));
  for (const page of Object.keys(meta)) {
    const html = readFileSync(join(outDir, `${page}.html`), 'utf8');
    for (const m of html.matchAll(/href="\.\/([a-z0-9-]+\.html)"/g)) {
      if (!built.has(m[1])) fail(`${page}.html links to missing ./${m[1]}`);
    }
  }

  console.log(`pages:build: wrote ${written.join(', ')}`);
  return written;
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) buildPages();
