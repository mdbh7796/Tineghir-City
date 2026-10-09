import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import sharp from 'sharp';

test('store graphics meet Play dimensions', async () => {
  assert.ok(existsSync('store/icon-512.png'));
  assert.ok(existsSync('store/feature-graphic-1024x500.png'));
  const icon = await sharp('store/icon-512.png').metadata();
  assert.equal(icon.width, 512);
  assert.equal(icon.height, 512);
  const feat = await sharp('store/feature-graphic-1024x500.png').metadata();
  assert.equal(feat.width, 1024);
  assert.equal(feat.height, 500);
  assert.ok(existsSync('store/screenshots/phone-1.png'));
  const ph = await sharp('store/screenshots/phone-1.png').metadata();
  assert.ok(ph.width >= 1080, `phone screenshot width ${ph.width} < 1080`);
});

test('store listing copy is complete', () => {
  assert.ok(existsSync('store/listing-en.md'));
  const l = readFileSync('store/listing-en.md', 'utf8');
  assert.match(l, /Tineghir/);
  assert.match(l, /privacy\.html/);
  assert.match(l, /Travel/);
});
