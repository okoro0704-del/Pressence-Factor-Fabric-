/**
 * Version bump across package.json, Info.plist, and build.gradle.
 * Uses VERSION (semver, e.g. 1.2.3) and BUILD_NUMBER (integer) from env.
 * If VERSION omitted, bumps patch from package.json. If BUILD_NUMBER omitted, uses 1.
 *
 * Usage: VERSION=1.2.3 BUILD_NUMBER=42 node scripts/version-bump.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PKG_PATH = path.join(ROOT, 'package.json');

const VERSION = process.env.VERSION;
const BUILD_NUMBER = process.env.BUILD_NUMBER || process.env.GITHUB_RUN_NUMBER || '1';

const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
const prev = pkg.version;

let next;
if (VERSION) {
  next = VERSION;
} else {
  const [major, minor, patch] = prev.split('.').map(Number);
  next = `${major}.${minor}.${(patch || 0) + 1}`;
}

pkg.version = next;
fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');
console.log('Bumped package.json version:', prev, '->', next);

const build = String(BUILD_NUMBER).replace(/\D/g, '') || '1';

const plistPaths = [
  path.join(ROOT, 'ios', 'PFFMobile', 'Info.plist'),
  path.join(ROOT, 'ios', 'PFF', 'Info.plist'),
  path.join(ROOT, 'ios', 'mobile', 'Info.plist'),
];
for (const plistPath of plistPaths) {
  if (!fs.existsSync(plistPath)) continue;
  let content = fs.readFileSync(plistPath, 'utf8');
  content = content.replace(
    /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]*(<\/string>)/,
    `$1${next}$2`
  );
  content = content.replace(
    /(<key>CFBundleVersion<\/key>\s*<string>)[^<]*(<\/string>)/,
    `$1${build}$2`
  );
  fs.writeFileSync(plistPath, content);
  console.log('Updated', path.relative(ROOT, plistPath));
  break;
}

const gradlePath = path.join(ROOT, 'android', 'app', 'build.gradle');
if (fs.existsSync(gradlePath)) {
  let content = fs.readFileSync(gradlePath, 'utf8');
  content = content.replace(
    /versionCode\s*=\s*\d+|versionCode\s+\d+/,
    `versionCode ${build}`
  );
  content = content.replace(
    /versionName\s*=\s*["'][^"']*["']|versionName\s+["'][^"']*["']/,
    `versionName "${next}"`
  );
  fs.writeFileSync(gradlePath, content);
  console.log('Updated android/app/build.gradle');
}

console.log('Version:', next, 'Build:', build);
