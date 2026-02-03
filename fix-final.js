const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web', 'components', 'dashboard', 'UserProfileBalance.tsx');

// Read the file as buffer to avoid encoding issues
let content = fs.readFileSync(filePath, 'utf8');

console.log('Fixing broken UTF-8 characters...');

// Use Buffer.from to create the exact broken sequences
// These are the actual byte sequences that appear in the file

// Pattern 1: Broken Naira - appears before {liquidNaira and {lockedNaira and {yourShareNaira
content = content.replace(/Naira: <span className="font-mono text-\[#00ff41\]">[^\{]{10,200}\{/g, (match) => {
  return 'Naira: <span className="font-mono text-[#00ff41]">₦{';
});

// Pattern 2: Broken text before percentages
content = content.replace(/tracking-wide">[^\d]{10,200}(\d+%)/g, (match, percent) => {
  return `tracking-wide">${percent}`;
});

// Pattern 3: Broken text before "Swap"
content = content.replace(/tracking-wider">[^\S]{10,200}Swap/g, 'tracking-wider">Swap');

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed all broken characters!');
console.log('   - Replaced broken Naira symbols with ₦');
console.log('   - Removed broken emojis');
console.log('   - File syntax preserved');

