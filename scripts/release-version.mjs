// Single source of truth for Play release identity.
// versionName = package.json version; versionCode = 1 + count of v* tags
// (or VERSION_CODE env override). Run with --apply to write both files.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

export function versionCodeFor(tags) {
  if (process.env.VERSION_CODE) return parseInt(process.env.VERSION_CODE, 10);
  return 1 + tags.filter((t) => /^v\d/.test(t)).length;
}

export function currentVersion() {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  let tags = [];
  try {
    tags = execSync('git tag --list "v*"', { encoding: 'utf8' }).split('\n').filter(Boolean);
  } catch { tags = []; }
  return { name: pkg.version, code: versionCodeFor(tags) };
}

if (process.argv.includes('--apply')) {
  const { name, code } = currentVersion();
  const gradlePath = 'android/app/build.gradle';
  let g = readFileSync(gradlePath, 'utf8');
  g = g.replace(/versionCode \d+/, `versionCode ${code}`).replace(/versionName "[^"]+"/, `versionName "${name}"`);
  writeFileSync(gradlePath, g);
  console.log(`release-version: versionName=${name} versionCode=${code}`);
}
