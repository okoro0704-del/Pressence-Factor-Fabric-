#!/usr/bin/env node

/**
 * Fix for broken @magic-ext/oauth package
 * Creates missing core.js and core.mjs files
 */

const fs = require('fs');
const path = require('path');

const magicOAuthPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@thirdweb-dev',
  'wallets',
  'node_modules',
  '@magic-ext',
  'oauth',
  'dist',
  'es'
);

// Check if the directory exists
if (!fs.existsSync(magicOAuthPath)) {
  console.log('⚠️  @magic-ext/oauth not found - skipping fix');
  process.exit(0);
}

// Create core.js
const coreJsPath = path.join(magicOAuthPath, 'core.js');
const coreJsContent = `// Stub file to fix broken @magic-ext/oauth package
// This package is not actually used in the PFF Protocol
module.exports = {};
`;

fs.writeFileSync(coreJsPath, coreJsContent);
console.log('✅ Created', coreJsPath);

// Create core.mjs
const coreMjsPath = path.join(magicOAuthPath, 'core.mjs');
const coreMjsContent = `// Stub file to fix broken @magic-ext/oauth package
// This package is not actually used in the PFF Protocol
export default {};
`;

fs.writeFileSync(coreMjsPath, coreMjsContent);
console.log('✅ Created', coreMjsPath);

console.log('✅ @magic-ext/oauth fix applied successfully');

