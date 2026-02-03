const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web', 'components', 'dashboard', 'UserProfileBalance.tsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('Fixing remaining broken characters on specific lines...');

// Fix line 182 (index 181) - Swap button
if (lines[181] && lines[181].includes('Swap')) {
  const before = lines[181];
  lines[181] = lines[181].replace(/tracking-wider">.*?Swap/, 'tracking-wider">Swap');
  if (before !== lines[181]) {
    console.log('✅ Fixed line 182 (Swap button)');
  }
}

// Fix line 234 (index 233) - Naira Equivalent
if (lines[233] && lines[233].includes('yourShareNaira')) {
  const before = lines[233];
  lines[233] = lines[233].replace(/text-\[#00ff41\]">.*?\{yourShareNaira/, 'text-[#00ff41]">₦{yourShareNaira');
  if (before !== lines[233]) {
    console.log('✅ Fixed line 234 (Naira Equivalent)');
  }
}

// Write back
const newContent = lines.join('\n');
fs.writeFileSync(filePath, newContent, 'utf8');

console.log('\n✅ All broken characters fixed!');

