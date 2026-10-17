import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Free-distribution checks: debug APK artifact + Pages deploy + tag release lane.
test('android workflow builds debug APK; tag release signs and attaches APK', () => {
  const w = readFileSync('.github/workflows/android-build.yml', 'utf8');
  assert.match(w, /assembleDebug/);
  assert.match(w, /name: app-debug/);
  const releaseJob = w.slice(w.indexOf('\n  release:'));
  assert.match(releaseJob, /startsWith\(github\.ref, 'refs\/tags\/v'\)/);
  assert.match(releaseJob, /TINEGHIR_KEYSTORE_BASE64/);
  assert.match(releaseJob, /tiles:fetch -- --release/);
  assert.ok(
    releaseJob.indexOf('tiles:fetch -- --release') < releaseJob.indexOf('assembleRelease'),
    'tiles must be fetched before the release build'
  );
  assert.match(releaseJob, /release-version.*--apply/);
  assert.match(releaseJob, /assembleRelease/);
  assert.match(releaseJob, /apksigner verify/);
  // Play lane: signed AAB built and verified alongside the APK.
  assert.match(releaseJob, /bundleRelease/);
  assert.match(releaseJob, /jarsigner -verify/);
  assert.match(releaseJob, /app-release\.aab/);
  assert.match(releaseJob, /gh release create/);
  assert.match(releaseJob, /gh release upload/);
  // Debug lane stays secret-free.
  const buildJob = w.slice(w.indexOf('\n  build:'), w.indexOf('\n  release:'));
  assert.doesNotMatch(buildJob, /TINEGHIR_KEYSTORE/);
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
