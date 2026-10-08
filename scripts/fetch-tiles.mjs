// Fetches the bundled offline-map archive at build time.
// Reads public/tiles.json (committed pointer, never the archive itself):
//   { version, releaseUrl, sha256, bbox, minZoom, maxZoom, asset }
// Downloads releaseUrl -> public/tiles/<basename(asset)>, verifies SHA256.
// Exit codes: 0 = archive present and verified (or skipped, see below).
//   Missing manifest (no release published yet) warns and exits 0 — the
//   offline layer stays dormant until the tiles.json bump PR lands.
//   Any download or hash failure with a manifest present exits non-zero.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const manifestPath = join(publicDir, 'tiles.json');

const fail = (msg) => {
  console.error(`tiles:fetch: ${msg}`);
  process.exit(1);
};

if (!existsSync(manifestPath)) {
  console.log('tiles:fetch: no public/tiles.json (no tile release yet) — skipping, offline layer dormant.');
  process.exit(0);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch (e) {
  fail(`cannot parse public/tiles.json: ${e.message}`);
}
for (const key of ['releaseUrl', 'sha256', 'asset']) {
  if (!manifest[key] || typeof manifest[key] !== 'string') fail(`tiles.json missing "${key}"`);
}

const target = join(publicDir, manifest.asset);
mkdirSync(dirname(target), { recursive: true });

const sha256File = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

if (existsSync(target)) {
  if (sha256File(target) === manifest.sha256.toLowerCase()) {
    console.log(`tiles:fetch: ${manifest.asset} present and verified — skipping download.`);
    process.exit(0);
  }
  console.log('tiles:fetch: existing archive hash mismatch — re-downloading.');
  unlinkSync(target);
}

console.log(`tiles:fetch: downloading ${manifest.releaseUrl}`);
let res;
try {
  res = await fetch(manifest.releaseUrl);
} catch (e) {
  fail(`download failed: ${e.message}`);
}
if (!res.ok) fail(`download failed: HTTP ${res.status} for ${manifest.releaseUrl}`);
writeFileSync(target, Buffer.from(await res.arrayBuffer()));

if (sha256File(target) !== manifest.sha256.toLowerCase()) {
  unlinkSync(target);
  fail('SHA256 mismatch — archive deleted. Check the release asset and tiles.json.');
}
console.log(`tiles:fetch: verified ${manifest.asset}`);
