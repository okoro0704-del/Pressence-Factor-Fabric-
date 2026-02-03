const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web', 'components', 'dashboard', 'UserProfileBalance.tsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

console.log('Before fix - checking for broken characters...');
const brokenNairaPattern = /Naira: <span className="font-mono text-\[#00ff41\]">[^{]+\{/g;
const brokenEmojiPattern = /tracking-wide">[^<]*?(\d+%)/g;

const nairaMatches = content.match(brokenNairaPattern);
const emojiMatches = content.match(brokenEmojiPattern);

console.log(`Found ${nairaMatches ? nairaMatches.length : 0} broken Naira symbols`);
console.log(`Found ${emojiMatches ? emojiMatches.length : 0} lines with broken emojis`);

// Fix broken Naira symbols - replace everything between > and { with just ₦
content = content.replace(
  /Naira: <span className="font-mono text-\[#00ff41\]">[^{]+\{/g,
  'Naira: <span className="font-mono text-[#00ff41]">₦{'
);

// Fix broken emojis in percentage lines - remove everything before the percentage
content = content.replace(
  /(<p className="text-\[10px\] text-\[#6b6b70\] mt-3 uppercase tracking-wide">)[^<]*?(\d+%)/g,
  '$1$2'
);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ Fixed all broken characters!');
console.log('   - Replaced broken Naira symbols with ₦');
console.log('   - Removed broken emoji characters');

