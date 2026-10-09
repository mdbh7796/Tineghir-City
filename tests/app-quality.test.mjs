import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('splash uses brand background and launch theme', () => {
  const s = readFileSync('android/app/src/main/res/values/styles.xml', 'utf8');
  assert.match(s, /Theme\.SplashScreen/);
  assert.match(s, /#1c1917|colorPrimaryDark/);
});

test('location rationale strings explain on-device use', () => {
  const s = readFileSync('android/app/src/main/res/values/strings.xml', 'utf8');
  assert.match(s, /location_rationale_title/);
  assert.match(s, /on-device|on-device|device/i);
});

test('capacitor config sets android background', () => {
  const c = readFileSync('capacitor.config.ts', 'utf8');
  assert.match(c, /backgroundColor.*#1c1917/);
});
