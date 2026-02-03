const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web', 'components', 'dashboard', 'UserProfileBalance.tsx');
const content = fs.readFileSync(filePath, 'utf8');

// Check for any broken UTF-8 sequences
const brokenPattern = /[ÃƒÆ'Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ'Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦Ã‚Â°ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ'Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½Ã‚Â±]+/g;
const broken = content.match(brokenPattern);

if (broken) {
  console.log('❌ FOUND BROKEN CHARACTERS!');
  console.log(`   Total broken sequences: ${broken.length}`);
  
  // Find line numbers
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (brokenPattern.test(line)) {
      console.log(`   Line ${index + 1}: ${line.substring(0, 100)}...`);
    }
  });
} else {
  console.log('✅ NO BROKEN CHARACTERS FOUND!');
  console.log('   File is clean and ready for production!');
}

