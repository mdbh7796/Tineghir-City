import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('release build fails closed without complete signing env', () => {
  const g = readFileSync('android/app/build.gradle', 'utf8');
  assert.match(g, /GradleException|throw new|fail\(/);
});

test('CI verifies AAB signature with jarsigner', () => {
  const w = readFileSync('.github/workflows/android-build.yml', 'utf8');
  assert.match(w, /jarsigner/);
});

test('generic CI build job stays green without signing secrets', () => {
  const w = readFileSync('.github/workflows/android-build.yml', 'utf8');
  const buildJob = w.slice(w.indexOf('\n  build:'), w.indexOf('\n  release:'));
  // Job-level env: every Gradle invocation (including assembleDebug, which
  // configures the release block too) must see the CI opt-out.
  assert.match(buildJob, /runs-on: ubuntu-latest\r?\n    env:\r?\n      ALLOW_UNSIGNED_RELEASE: "1"/);
});
