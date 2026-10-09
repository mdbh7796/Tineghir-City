import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

test('AndroidManifest blocks cleartext traffic', () => {
  const xml = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
  assert.match(xml, /usesCleartextTraffic="false"/);
});

test('build.gradle has release signing from env', () => {
  const g = readFileSync('android/app/build.gradle', 'utf8');
  assert.match(g, /signingConfigs\s*\{\s*release/);
  assert.match(g, /TINEGHIR_KEYSTORE/);
});

test('capacitor config defines splash background', () => {
  const c = readFileSync('capacitor.config.ts', 'utf8');
  assert.match(c, /backgroundColor/);
});

test('launcher icons exist for all densities', () => {
  for (const d of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
    assert.ok(existsSync(`android/app/src/main/res/mipmap-${d}/ic_launcher.png`), d);
  }
});
