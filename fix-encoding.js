const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web', 'components', 'dashboard', 'UserProfileBalance.tsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

console.log('Before fix - checking for broken characters...');

// Count all broken UTF-8 sequences
const brokenPattern = /[ÃƒÆ'Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ'Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦Ã‚Â°ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ'Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½Ã‚Â±]+/g;
const brokenMatches = content.match(brokenPattern);
console.log(`Found ${brokenMatches ? brokenMatches.length : 0} broken character sequences`);

// Fix 1: Broken Naira symbols in "Naira:" labels
content = content.replace(
  /Naira: <span className="font-mono text-\[#00ff41\]">[^{]+\{/g,
  'Naira: <span className="font-mono text-[#00ff41]">₦{'
);

// Fix 2: Broken emojis in percentage lines
content = content.replace(
  /(<p className="text-\[10px\] text-\[#6b6b70\] mt-3 uppercase tracking-wide">)[^<]*?(\d+%)/g,
  '$1$2'
);

// Fix 3: Broken emoji before "Swap" button
content = content.replace(
  /(<span className="relative z-10 text-sm uppercase tracking-wider">)[^S]+Swap/g,
  '$1Swap'
);

// Fix 4: Broken Naira symbol in "Naira Equivalent" section
content = content.replace(
  /(Naira Equivalent<\/span>\s*<span className="text-sm font-mono text-\[#00ff41\]">\s*)[^{]+\{/g,
  '$1₦{'
);

// Fix 5: Nuclear option - remove ANY remaining broken UTF-8 sequences
content = content.replace(/[ÃƒÆ'Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ'Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦Ã‚Â°ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ'Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½Ã‚Â±]+/g, '');

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ NUCLEAR FIX: Removed ALL broken UTF-8 characters!');
console.log('   - Fixed broken Naira symbols → ₦');
console.log('   - Removed broken emoji before "Swap" button');
console.log('   - Fixed "Naira Equivalent" display');
console.log('   - Removed all remaining broken UTF-8 sequences');

