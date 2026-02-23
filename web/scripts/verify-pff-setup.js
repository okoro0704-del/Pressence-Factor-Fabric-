#!/usr/bin/env node

/**
 * PFF Protocol Setup Verification Script
 * 
 * Checks if everything is configured correctly before running the app
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 PFF Protocol Setup Verification\n');
console.log('='.repeat(50));

let hasErrors = false;
let hasWarnings = false;

// ============================================================================
// Check 1: Environment File
// ============================================================================

console.log('\n📄 Checking environment configuration...');

const envPath = path.join(__dirname, '..', '.env.local');
const envExamplePath = path.join(__dirname, '..', '.env.pff.example');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local not found');
  console.log('   Run: cp .env.pff.example .env.local');
  hasErrors = true;
} else {
  console.log('✅ .env.local exists');
  
  // Check for Thirdweb Client ID
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (!envContent.includes('NEXT_PUBLIC_THIRDWEB_CLIENT_ID')) {
    console.log('❌ NEXT_PUBLIC_THIRDWEB_CLIENT_ID not found in .env.local');
    hasErrors = true;
  } else if (envContent.includes('your_client_id_here') || envContent.includes('your_thirdweb_client_id_here')) {
    console.log('⚠️  NEXT_PUBLIC_THIRDWEB_CLIENT_ID is set to placeholder value');
    console.log('   Get your Client ID from: https://thirdweb.com/dashboard');
    hasWarnings = true;
  } else {
    console.log('✅ NEXT_PUBLIC_THIRDWEB_CLIENT_ID is configured');
  }
  
  // Check for optional gasless config
  if (!envContent.includes('NEXT_PUBLIC_PAYMASTER_URL') || envContent.includes('NEXT_PUBLIC_PAYMASTER_URL=')) {
    console.log('⚠️  Gasless transactions not configured (optional)');
    console.log('   Users will need MATIC for gas fees');
    hasWarnings = true;
  } else {
    console.log('✅ Gasless transactions configured');
  }
}

// ============================================================================
// Check 2: Required Files
// ============================================================================

console.log('\n📦 Checking required files...');

const requiredFiles = [
  'components/pff/PFFThirdwebProvider.tsx',
  'components/pff/NationalPortfolio.tsx',
  'components/pff/PFFDashboard.tsx',
  'components/pff/ClaimWealthButton.tsx',
  'components/pff/ConvertToNairaButton.tsx',
  'lib/pff/contracts.ts',
  'lib/pff/hooks/usePFFSovereign.ts',
  'src/app/pff-dashboard/page.tsx',
];

let missingFiles = 0;
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Missing: ${file}`);
    missingFiles++;
    hasErrors = true;
  }
});

if (missingFiles === 0) {
  console.log(`✅ All ${requiredFiles.length} required files present`);
}

// ============================================================================
// Check 3: Dependencies
// ============================================================================

console.log('\n📚 Checking dependencies...');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.log('❌ package.json not found');
  hasErrors = true;
} else {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = {
    '@thirdweb-dev/react': '^4.9.4',
    '@thirdweb-dev/sdk': '^4.0.99',
    'ethers': '^5.7.2',
    'canvas-confetti': '^1.9.4',
    'lucide-react': '^0.563.0',
    'next': '^16.1.6',
    'react': '18.2.0',
  };
  
  let missingDeps = 0;
  Object.keys(requiredDeps).forEach(dep => {
    if (!deps[dep]) {
      console.log(`❌ Missing dependency: ${dep}`);
      missingDeps++;
      hasErrors = true;
    }
  });
  
  if (missingDeps === 0) {
    console.log('✅ All required dependencies present');
  }
  
  // Check if node_modules exists
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('⚠️  node_modules not found');
    console.log('   Run: npm install');
    hasWarnings = true;
  } else {
    console.log('✅ node_modules installed');
  }
}

// ============================================================================
// Check 4: Contract Configuration
// ============================================================================

console.log('\n🔗 Checking contract configuration...');

const contractsPath = path.join(__dirname, '..', 'lib', 'pff', 'contracts.ts');
if (!fs.existsSync(contractsPath)) {
  console.log('❌ contracts.ts not found');
  hasErrors = true;
} else {
  const contractsContent = fs.readFileSync(contractsPath, 'utf8');
  
  const requiredAddresses = [
    '0xc226fFb538b6f80F05d5F0Ee0758E5D85a42DE0C', // VIDA CAP
    '0xe814561AdB492f8ff3019194337A17E9cba9fEFd', // ngnVIDA
    '0xBaF30D2fe8F8fb41F3053Ce68C4619A283B60211', // Sentinel Vault
    '0x4c81E768f4B201bCd7E924f671ABA1B162786b48', // NationalTreasury
    '0xDD8046422Bbeba12FD47DE854639abF7FB6E0858', // FoundationVault
  ];
  
  let missingAddresses = 0;
  requiredAddresses.forEach(address => {
    if (!contractsContent.includes(address)) {
      console.log(`❌ Missing contract address: ${address}`);
      missingAddresses++;
      hasErrors = true;
    }
  });
  
  if (missingAddresses === 0) {
    console.log('✅ All 4 contract addresses configured');
  }
}

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(50));
console.log('\n📊 Verification Summary:\n');

if (hasErrors) {
  console.log('❌ Setup has ERRORS - please fix before running');
  console.log('\nNext steps:');
  console.log('1. Fix the errors listed above');
  console.log('2. Run this script again: node scripts/verify-pff-setup.js');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Setup has WARNINGS - app will work but with limitations');
  console.log('\nYou can proceed with:');
  console.log('  npm run dev');
  console.log('\nOr fix warnings first for full functionality.');
  process.exit(0);
} else {
  console.log('✅ All checks passed! Setup is complete.');
  console.log('\n🚀 Ready to launch:');
  console.log('  npm run dev');
  console.log('\nThen visit:');
  console.log('  http://localhost:3000/pff-dashboard');
  console.log('\n🎉 Your PFF Protocol dashboard is ready!\n');
  process.exit(0);
}

