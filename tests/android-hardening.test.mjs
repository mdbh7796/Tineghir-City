import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

test('AndroidManifest blocks cleartext traffic', () => {
  const xml = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
  assert.match(xml, /usesCleartextTraffic="false"/);
});

test('build.gradle defines debug suffix with optional env release signing', () => {
  const g = readFileSync('android/app/build.gradle', 'utf8');
  assert.match(g, /applicationIdSuffix ".debug"/);
  assert.match(g, /TINEGHIR_KEYSTORE_PATH/);
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

test('AndroidManifest declares only expected permissions', () => {
  const xml = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
  for (const p of ['android.permission.INTERNET', 'android.permission.ACCESS_COARSE_LOCATION', 'android.permission.ACCESS_FINE_LOCATION']) {
    assert.ok(xml.includes(p), `missing ${p}`);
  }
  assert.doesNotMatch(xml, /ACCESS_BACKGROUND_LOCATION/);
  assert.doesNotMatch(xml, /RECORD_AUDIO|CAMERA/);
});

test('Android location rationale documented in privacy + strings', () => {
  const doc = readFileSync('docs/PRIVACY.md', 'utf8');
  assert.match(doc, /ACCESS_COARSE_LOCATION|on-device/i);
  const strings = readFileSync('android/app/src/main/res/values/strings.xml', 'utf8');
  assert.match(strings, /location_rationale/i);
});
