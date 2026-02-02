#!/usr/bin/env node
/**
 * PFF Production Deployment Verification Script
 * Genesis Protocol v1.0
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * Verifies production environment configuration and readiness
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkmark() {
  return `${colors.green}✓${colors.reset}`;
}

function crossmark() {
  return `${colors.red}✗${colors.reset}`;
}

function warning() {
  return `${colors.yellow}⚠${colors.reset}`;
}

// ============================================================================
// ENVIRONMENT FILE CHECKS
// ============================================================================

function checkEnvFile(filePath, requiredVars) {
  log(`\nChecking ${filePath}...`, 'cyan');
  
  if (!fs.existsSync(filePath)) {
    log(`  ${crossmark()} File not found: ${filePath}`, 'red');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const vars = {};
  
  lines.forEach(line => {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) {
      vars[match[1]] = match[2];
    }
  });
  
  let allPresent = true;
  
  requiredVars.forEach(varName => {
    if (!vars[varName] || vars[varName].includes('REPLACE_WITH') || vars[varName].includes('your-')) {
      log(`  ${crossmark()} Missing or placeholder: ${varName}`, 'red');
      allPresent = false;
    } else {
      log(`  ${checkmark()} ${varName}`);
    }
  });
  
  return allPresent;
}

// ============================================================================
// BACKEND VERIFICATION
// ============================================================================

function verifyBackend() {
  log('\n═══════════════════════════════════════════════════════', 'blue');
  log('BACKEND VERIFICATION', 'blue');
  log('═══════════════════════════════════════════════════════', 'blue');
  
  const backendEnv = path.join(__dirname, '../backend/.env');
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'VAULT_AES_KEY',
    'RSK_RPC_URL',
    'VITALIE_MODE',
    'NETWORK_ID',
  ];
  
  const isValid = checkEnvFile(backendEnv, requiredVars);
  
  // Check for production mode
  const content = fs.readFileSync(backendEnv, 'utf8');
  if (content.includes('VITALIE_MODE=PURE_SOVRYN')) {
    log(`  ${checkmark()} VITALIE_MODE set to PURE_SOVRYN`, 'green');
  } else {
    log(`  ${warning()} VITALIE_MODE not set to PURE_SOVRYN`, 'yellow');
  }
  
  if (content.includes('NETWORK_ID=SOVRYN_MAINNET_GENESIS')) {
    log(`  ${checkmark()} NETWORK_ID set to SOVRYN_MAINNET_GENESIS`, 'green');
  } else {
    log(`  ${warning()} NETWORK_ID not set to SOVRYN_MAINNET_GENESIS`, 'yellow');
  }
  
  return isValid;
}

// ============================================================================
// WEB VERIFICATION
// ============================================================================

function verifyWeb() {
  log('\n═══════════════════════════════════════════════════════', 'blue');
  log('WEB APPLICATION VERIFICATION', 'blue');
  log('═══════════════════════════════════════════════════════', 'blue');
  
  const webEnv = path.join(__dirname, '../web/.env.local');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_PFF_BACKEND_URL',
    'NEXT_PUBLIC_RSK_RPC_URL',
    'NEXT_PUBLIC_VITALIE_MODE',
  ];
  
  const isValid = checkEnvFile(webEnv, requiredVars);
  
  // Check for mock data disabled
  const content = fs.readFileSync(webEnv, 'utf8');
  if (content.includes('NEXT_PUBLIC_USE_MOCK_DATA=false')) {
    log(`  ${checkmark()} Mock data disabled`, 'green');
  } else {
    log(`  ${crossmark()} Mock data still enabled!`, 'red');
  }
  
  return isValid;
}

// ============================================================================
// FILE STRUCTURE VERIFICATION
// ============================================================================

function verifyFileStructure() {
  log('\n═══════════════════════════════════════════════════════', 'blue');
  log('FILE STRUCTURE VERIFICATION', 'blue');
  log('═══════════════════════════════════════════════════════', 'blue');
  
  const requiredFiles = [
    'backend/.env.production',
    'web/.env.production',
    'web/lib/dataService.ts',
    'docs/PRODUCTION-DEPLOYMENT.md',
  ];
  
  let allPresent = true;
  
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      log(`  ${checkmark()} ${file}`, 'green');
    } else {
      log(`  ${crossmark()} Missing: ${file}`, 'red');
      allPresent = false;
    }
  });
  
  return allPresent;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  log('\n╔═══════════════════════════════════════════════════════╗', 'cyan');
  log('║   PFF PRODUCTION DEPLOYMENT VERIFICATION SCRIPT       ║', 'cyan');
  log('║   Genesis Protocol v1.0                               ║', 'cyan');
  log('║   Architect: Isreal Okoro (mrfundzman)                ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════╝', 'cyan');
  
  const results = {
    fileStructure: verifyFileStructure(),
    backend: verifyBackend(),
    web: verifyWeb(),
  };
  
  log('\n═══════════════════════════════════════════════════════', 'blue');
  log('VERIFICATION SUMMARY', 'blue');
  log('═══════════════════════════════════════════════════════', 'blue');
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    log(`\n${checkmark()} All checks passed! Ready for production deployment.`, 'green');
    log('\nNext steps:', 'cyan');
    log('  1. Review docs/PRODUCTION-DEPLOYMENT.md', 'cyan');
    log('  2. Deploy backend: cd backend && npm run build', 'cyan');
    log('  3. Deploy web: cd web && npm run build', 'cyan');
    log('  4. Run database migrations', 'cyan');
    process.exit(0);
  } else {
    log(`\n${crossmark()} Some checks failed. Please fix the issues above.`, 'red');
    process.exit(1);
  }
}

main();

