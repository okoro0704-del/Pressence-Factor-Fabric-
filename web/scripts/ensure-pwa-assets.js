/**
 * Ensure PWA icons exist. Creates placeholder PNGs if missing.
 * Run before `next build`. Uses minimal 1x1 PNG; replace with real mrfundzman assets.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ICONS = path.join(ROOT, 'public', 'icons');
const MINIMAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

fs.mkdirSync(ICONS, { recursive: true });
SIZES.forEach((s) => {
  const p = path.join(ICONS, `icon-${s}.png`);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, MINIMAL_PNG);
    console.log('Created placeholder:', `icon-${s}.png`);
  }
});
