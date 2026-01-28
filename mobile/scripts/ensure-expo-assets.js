/**
 * Ensure Expo icon/splash/favicon assets exist. Copies placeholders if missing.
 * Run before `expo prebuild` or `eas build`.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets', 'images');
const PLACEHOLDER = path.join(ASSETS, 'lagos-skyline.png');

const FILES = ['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png'];

if (!fs.existsSync(PLACEHOLDER)) {
  const buf = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );
  fs.mkdirSync(ASSETS, { recursive: true });
  fs.writeFileSync(PLACEHOLDER, buf);
}

FILES.forEach((f) => {
  const dest = path.join(ASSETS, f);
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(PLACEHOLDER, dest);
    console.log('Created placeholder:', f);
  }
});
