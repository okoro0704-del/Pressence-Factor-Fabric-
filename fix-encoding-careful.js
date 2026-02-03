const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web', 'components', 'dashboard', 'UserProfileBalance.tsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

console.log('Before fix - checking for broken characters...');

// CAREFUL FIX: Only replace specific broken sequences, not all special characters

// Fix 1: Broken Naira symbol pattern (very specific)
const brokenNaira = 'ÃƒÆ'Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ'Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ'Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦';
let count1 = (content.match(new RegExp(brokenNaira.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
console.log(`Found ${count1} broken Naira symbols`);
content = content.split(brokenNaira).join('₦');

// Fix 2: Broken unlock emoji pattern (before "20% Spendable Reserve")
const brokenUnlock = 'ÃƒÆ'Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ'Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ'Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ'Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ ';
let count2 = (content.match(new RegExp(brokenUnlock.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
console.log(`Found ${count2} broken unlock emojis`);
content = content.split(brokenUnlock).join('');

// Fix 3: Broken lock emoji pattern (before "80% Sovereign Guarantee")
const brokenLock = 'ÃƒÆ'Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ'Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ'Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂºÃƒÆ'Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ'Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ'Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ'Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ';
let count3 = (content.match(new RegExp(brokenLock.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
console.log(`Found ${count3} broken lock emojis`);
content = content.split(brokenLock).join('');

// Fix 4: Broken emoji before "Swap" button
const brokenSwap = 'ÃƒÆ'Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ'Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ'Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ'Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± ';
let count4 = (content.match(new RegExp(brokenSwap.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
console.log(`Found ${count4} broken emojis before Swap`);
content = content.split(brokenSwap).join('');

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ CAREFUL FIX: Removed specific broken UTF-8 sequences!');
console.log(`   - Fixed ${count1} broken Naira symbols → ₦`);
console.log(`   - Removed ${count2} broken unlock emojis`);
console.log(`   - Removed ${count3} broken lock emojis`);
console.log(`   - Removed ${count4} broken emojis before Swap`);
console.log('   - Preserved all quotes and syntax!');

