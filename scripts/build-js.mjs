// Bundles src/js/*.js -> public/script.js, copies standalone shell modules
// -> public/js/, and stamps src/sw.js -> public/sw.js.
// Sources live in src/; public/ output is committed for Capacitor webDir.
// Usage: node scripts/build-js.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'src', 'js');
const pubDir = join(root, 'public');
const outJs = join(pubDir, 'script.js');
const outSw = join(pubDir, 'sw.js');

// Modules concatenated into public/script.js, in execution order.
const ORDER = [
  'attractions-data.js',
  'reveal.js',
  'lightbox.js',
  'map.js',
  'cards.js',
  'sort.js',
  'back.js',
];

// Modules copied to public/js/ and loaded by their own <script> tags.
const STANDALONE = [
  'drawer.js',
  'tools.js',
];

const files = ORDER.filter((f) => {
  try { readFileSync(join(srcDir, f)); return true; }
  catch { console.error(`build:js: missing src/js/${f}`); process.exit(1); }
});
// Guard against orphan modules silently excluded from the build.
const onDisk = readdirSync(srcDir).filter((f) => f.endsWith('.js')).sort();
const extra = onDisk.filter((f) => !ORDER.includes(f) && !STANDALONE.includes(f));
if (extra.length) {
  console.error(`build:js: unlisted src/js files: ${extra.join(', ')} — add to ORDER or STANDALONE`);
  process.exit(1);
}

const header = `// Built from src/js/*.js — do not edit directly. Run: npm run build:js\n`;
const body = files.map((f) => `// --- src/js/${f} ---\n` + readFileSync(join(srcDir, f), 'utf8').trim()).join('\n\n');
writeFileSync(outJs, header + body + '\n');
console.log(`build:js: wrote public/script.js from ${files.join(', ')}`);

mkdirSync(join(pubDir, 'js'), { recursive: true });
for (const f of STANDALONE) {
  const src = join(srcDir, f);
  if (!existsSync(src)) {
    console.error(`build:js: missing src/js/${f}`);
    process.exit(1);
  }
  const out = `// Built from src/js/${f} — do not edit directly. Run: npm run build:js\n`
    + readFileSync(src, 'utf8').trim() + '\n';
  writeFileSync(join(pubDir, 'js', f), out);
  console.log(`build:js: wrote public/js/${f} from src/js/${f}`);
}

// Service worker: src/sw.js is canonical, public/sw.js is the deployed copy.
// CACHE_VERSION is stamped from a hash of every source + shell asset the SW
// serves cache-first. Hashing only CSS/bundle JS let standalone modules, fonts,
// and icons go stale forever; include the whole SHELL list instead.
const swSrc = readFileSync(join(root, 'src', 'sw.js'), 'utf8');
if (!swSrc.includes('__SW_VERSION__')) {
  console.error('build:js: src/sw.js missing __SW_VERSION__ token — cannot stamp CACHE_VERSION');
  process.exit(1);
}
const shellBlock = swSrc.match(/const SHELL = \[([\s\S]*?)\];/);
if (!shellBlock) {
  console.error('build:js: src/sw.js missing SHELL array — cannot hash shell assets');
  process.exit(1);
}
const shellPaths = [...shellBlock[1].matchAll(/'([^']+)'/g)]
  .map((m) => m[1])
  .filter((p) => p !== './');
const shellFiles = shellPaths.map((p) => join(pubDir, p.replace(/^\.\//, '')));
for (const f of shellFiles) {
  if (!existsSync(f)) {
    console.error(`build:js: SHELL asset missing: ${f.replace(root + '/', '')}`);
    process.exit(1);
  }
}

// Generated shell files are already represented by their sources above.
// Hashing the built copies would make the cache version depend on build
// order/environment (CI regenerated index.html/style.css and produced a
// different hash than the committed build).
const GENERATED_SHELL = new Set([
  'index.html',
  'style.css',
  'script.js',
  'js/drawer.js',
  'js/tools.js',
]);
const staticShellFiles = shellPaths
  .map((p) => p.replace(/^\.\//, ''))
  .filter((p) => p && !GENERATED_SHELL.has(p))
  .map((p) => join(pubDir, p));

const versionInputs = [
  join(root, 'src', 'input.css'),
  join(root, 'src', 'sw.js'),
  ...files.map((f) => join(srcDir, f)),
  ...STANDALONE.map((f) => join(srcDir, f)),
  ...staticShellFiles,
];
const hash = createHash('sha256');
for (const f of versionInputs) hash.update(readFileSync(f));
const swVersion = `tineghir-${hash.digest('hex').slice(0, 10)}`;

const sw = swSrc.replace(/(const CACHE_VERSION = )'__SW_VERSION__';/, `$1'${swVersion}';`);
writeFileSync(outSw, sw.endsWith('\n') ? sw : sw + '\n');
console.log(`build:js: wrote public/sw.js from src/sw.js (${swVersion}, ${versionInputs.length} hash inputs)`);
