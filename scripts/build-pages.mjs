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
    for (const key of ['title', 'description', 'canonical', 'activeNav', 'fragments']) {
      if (!m[key] || (Array.isArray(m[key]) && !m[key].length)) fail(`pages.meta.json: "${page}" missing "${key}"`);
    }
    const parts = m.fragments.map((f) => {
      const p = join(pDir, f);
      if (!existsSync(p)) fail(`missing fragment src/templates/pages/${f} (page "${page}")`);
      return readFileSync(p, 'utf8');
    });
    let html = base
      .replaceAll('{{TITLE}}', m.title)
      .replaceAll('{{DESCRIPTION}}', m.description)
      .replaceAll('{{CANONICAL}}', m.canonical)
      .replaceAll('{{ACTIVE_NAV}}', m.activeNav)
      .replace('{{NAV}}', nav)
      .replace('{{CONTENT}}', parts.join('\n'))
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
