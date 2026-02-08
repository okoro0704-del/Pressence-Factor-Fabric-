#!/usr/bin/env node
/** Write public/version.json with unique build timestamp so Netlify recognizes every push as a New Reality. */
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const versionPath = path.join(publicDir, 'version.json');

const payload = {
  buildTimestamp: Date.now(),
  version: process.env.npm_package_version || '1.0.0',
  buildId: `build-${Date.now()}`,
};

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(versionPath, JSON.stringify(payload, null, 2), 'utf8');
console.log('[write-version]', versionPath, payload);
