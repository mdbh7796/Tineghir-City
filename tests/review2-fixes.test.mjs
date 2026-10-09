import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

test('release job runs npm steps at root and gradle in android/', () => {
  const w = readFileSync('.github/workflows/android-build.yml', 'utf8');
  const releaseJob = w.slice(w.indexOf('\n  release:'));
  assert.match(releaseJob, /cd android && \.\/gradlew bundleRelease/);
  assert.doesNotMatch(releaseJob, /working-directory: android\n        run: \.\/gradlew/);
  assert.match(releaseJob, /fetch-depth: 0|fetch-tags/);
});

test('versionCodeFor rejects non-numeric override instead of NaN', async () => {
  process.env.VERSION_CODE = 'abc';
  const mod = await import(`../scripts/release-version.mjs?x=${Date.now()}`);
  assert.throws(() => mod.versionCodeFor(['v1.0.0']), /VERSION_CODE/);
  delete process.env.VERSION_CODE;
  assert.equal(mod.versionCodeFor([]), 1);
});

test('privacy page and data safety agree: on-device, tile logs, backup', () => {
  const p = readFileSync('public/privacy.html', 'utf8');
  assert.match(p, /on-device/i);
  assert.match(p, /tile/i);
  assert.match(p, /backup/i);
  const ds = readFileSync('docs/PLAY-DATA-SAFETY.md', 'utf8');
  assert.match(ds, /ACCESS_FINE_LOCATION/);
  assert.match(ds, /No collection|no collection/i);
});

test('AAB verified with jarsigner, never apksigner', () => {
  const w = readFileSync('.github/workflows/android-build.yml', 'utf8');
  assert.match(w, /jarsigner/);
  assert.doesNotMatch(w, /apksigner/);
});

test('keystore docs require fingerprint record and forbid committing keys', () => {
  const d = readFileSync('docs/RELEASE-SIGNING.md', 'utf8');
  assert.match(d, /keytool -list|SHA-256|fingerprint/i);
  assert.match(d, /never commit|do not commit/i);
});

test('generic CI artifact is clearly unsigned', () => {
  const w = readFileSync('.github/workflows/android-build.yml', 'utf8');
  assert.match(w, /app-release-unsigned/);
});

test('draft screenshots are suffixed so they cannot ship silently', () => {
  assert.ok(existsSync('store/screenshots/phone-1-draft.png'));
  assert.ok(!existsSync('store/screenshots/phone-1.png'));
});

test('FR listing is an explicit TODO stub', () => {
  const f = readFileSync('store/listing-fr.md', 'utf8');
  assert.match(f, /TODO/i);
});

test('listing privacy URL equals meta canonical', () => {
  const meta = JSON.parse(readFileSync('src/templates/pages.meta.json', 'utf8'));
  const l = readFileSync('store/listing-en.md', 'utf8');
  assert.ok(l.includes(meta.privacy.canonical), `${meta.privacy.canonical} not in listing`);
});

test('checked-in versionName matches package.json', () => {
  const g = readFileSync('android/app/build.gradle', 'utf8');
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.match(g, new RegExp(`versionName "${pkg.version}"`));
});
