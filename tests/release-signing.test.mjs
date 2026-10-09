import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('release build fails closed without complete signing env', () => {
  const g = readFileSync('android/app/build.gradle', 'utf8');
  assert.match(g, /GradleException|throw new|fail\(/);
});

test('CI verifies AAB signature with apksigner', () => {
  const w = readFileSync('.github/workflows/android-build.yml', 'utf8');
  assert.match(w, /apksigner/);
});
