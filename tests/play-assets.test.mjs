import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

// PNG IHDR: 8-byte signature, then length(4) + "IHDR"(4), width(4), height(4),
// bitDepth(1), colourType(1). Offsets below are absolute from file start.
function pngSize(path) {
  const b = readFileSync(path);
  assert.equal(b.subarray(1, 4).toString('latin1'), 'PNG', `${path} is not a PNG`);
  return {
    width: b.readUInt32BE(16),
    height: b.readUInt32BE(20),
    colorType: b.readUInt8(25), // 6/4 = alpha, 2/0/3 = no alpha
  };
}

test('Play graphics generator exists', () => {
  assert.ok(existsSync('scripts/play-graphics.mjs'));
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.match(pkg.scripts['play:graphics'], /play-graphics\.mjs/);
});

test('Play app icon is 512x512', () => {
  const f = 'assets/play/icon-512.png';
  assert.ok(existsSync(f), `${f} missing — run npm run play:graphics`);
  const s = pngSize(f);
  assert.equal(s.width, 512);
  assert.equal(s.height, 512);
});

test('Play feature graphic is 1024x500 with no alpha', () => {
  const f = 'assets/play/feature-graphic-1024x500.png';
  assert.ok(existsSync(f), `${f} missing — run npm run play:graphics`);
  const s = pngSize(f);
  assert.equal(s.width, 1024);
  assert.equal(s.height, 500);
  assert.ok(s.colorType === 2 || s.colorType === 0 || s.colorType === 3, `feature graphic must have no alpha (colorType ${s.colorType})`);
});

test('Play phone screenshots are 1080x1920 and at least two', () => {
  const dir = 'assets/play/screenshots';
  assert.ok(existsSync(dir), `${dir} missing — run npm run play:graphics`);
  const shots = readdirSync(dir).filter((f) => f.endsWith('.png'));
  assert.ok(shots.length >= 2, 'Play requires at least 2 phone screenshots');
  for (const f of shots) {
    const s = pngSize(`${dir}/${f}`);
    assert.equal(s.width, 1080, `${f} width`);
    assert.equal(s.height, 1920, `${f} height`);
  }
});
