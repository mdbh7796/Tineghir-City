import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

test('release job decodes upload key from secrets and names versioned AAB', () => {
  const w = readFileSync('.github/workflows/android-build.yml', 'utf8');
  assert.match(w, /TINEGHIR_KEYSTORE_BASE64/);
  assert.match(w, /release-version|--apply|versionCode/);
});

test('play release checklist documents internal track upload', () => {
  assert.ok(existsSync('docs/PLAY-RELEASE-CHECKLIST.md'));
  const d = readFileSync('docs/PLAY-RELEASE-CHECKLIST.md', 'utf8');
  assert.match(d, /internal testing/i);
  assert.match(d, /pre-launch report/i);
});
