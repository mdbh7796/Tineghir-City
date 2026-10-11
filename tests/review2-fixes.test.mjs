import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Free-distribution checks: debug APK artifact + Pages deploy, no Play signing.
test('android workflow builds debug APK only (no release/signing lane)', () => {
  const w = readFileSync('.github/workflows/android-build.yml', 'utf8');
  assert.match(w, /assembleDebug/);
  assert.match(w, /name: app-debug/);
  assert.doesNotMatch(w, /TINEGHIR_KEYSTORE/);
  assert.doesNotMatch(w, /bundleRelease/);
  assert.doesNotMatch(w, /jarsigner|apksigner/);
});

test('pages workflow publishes public/ to GitHub Pages', () => {
  const w = readFileSync('.github/workflows/pages.yml', 'utf8');
  assert.match(w, /upload-pages-artifact/);
  assert.match(w, /deploy-pages/);
  assert.match(w, /path: \.\/public/);
});

test('privacy page mentions on-device location use', () => {
  const p = readFileSync('public/privacy.html', 'utf8');
  assert.match(p, /on-device/i);
});

test('checked-in versionName matches package.json', () => {
  const g = readFileSync('android/app/build.gradle', 'utf8');
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.match(g, new RegExp(`versionName "${pkg.version}"`));
});
