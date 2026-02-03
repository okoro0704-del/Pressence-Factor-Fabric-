const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web', 'components', 'dashboard', 'UserProfileBalance.tsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('Fixing line 234 - Naira Equivalent...');

// Line 234 is index 233
if (lines[233]) {
  const before = lines[233];
  console.log('Before:', before.substring(0, 100));
  
  // Replace everything from start of content to { with just spaces and ₦
  lines[233] = lines[233].replace(/^(\s*).*?\{yourShareNaira/, '$1₦{yourShareNaira');
  
  console.log('After:', lines[233].substring(0, 100));
  
  if (before !== lines[233]) {
    console.log('✅ Fixed!');
  } else {
    console.log('❌ No change - pattern did not match');
  }
}

// Write back
const newContent = lines.join('\n');
fs.writeFileSync(filePath, newContent, 'utf8');

console.log('\n✅ Done!');

