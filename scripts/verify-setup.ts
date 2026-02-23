/**
 * Verify Phase 1 Deployment Setup
 * 
 * Checks:
 * - Environment variables are set
 * - Deployer wallet has sufficient MATIC
 * - RPC connection works
 * - Hardhat is configured correctly
 * 
 * Usage:
 *   npx hardhat run scripts/verify-setup.ts --network polygon
 */

import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("🔍 PHASE 1 DEPLOYMENT SETUP VERIFICATION");
  console.log("═══════════════════════════════════════════════════════════════\n");

  let hasErrors = false;

  // ============================================================================
  // CHECK 1: Environment Variables
  // ============================================================================

  console.log("📋 Checking Environment Variables...\n");

  const requiredVars = [
    "PRIVATE_KEY",
    "POLYGON_RPC_URL",
  ];

  const optionalVars = [
    "POLYGONSCAN_API_KEY",
    "SENTINEL_WEBHOOK_URL",
  ];

  requiredVars.forEach((varName) => {
    const value = process.env[varName];
    if (!value || value.includes("your_") || value.includes("here")) {
      console.log(`   ❌ ${varName} - NOT SET or using placeholder`);
      hasErrors = true;
    } else {
      const masked = varName === "PRIVATE_KEY" 
        ? `${value.substring(0, 6)}...${value.substring(value.length - 4)}`
        : value;
      console.log(`   ✅ ${varName} - ${masked}`);
    }
  });

  optionalVars.forEach((varName) => {
    const value = process.env[varName];
    if (!value || value.includes("your_") || value.includes("here")) {
      console.log(`   ⚠️  ${varName} - Not set (optional)`);
    } else {
      console.log(`   ✅ ${varName} - ${value}`);
    }
  });

  // ============================================================================
  // CHECK 2: Network Connection
  // ============================================================================

  console.log("\n🌐 Checking Network Connection...\n");

  try {
    const network = await ethers.provider.getNetwork();
    console.log(`   ✅ Connected to: ${network.name}`);
    console.log(`   ✅ Chain ID: ${network.chainId}`);

    const blockNumber = await ethers.provider.getBlockNumber();
    console.log(`   ✅ Latest block: ${blockNumber}`);
  } catch (error) {
    console.log(`   ❌ Network connection failed: ${error}`);
    hasErrors = true;
  }

  // ============================================================================
  // CHECK 3: Deployer Wallet
  // ============================================================================

  console.log("\n💰 Checking Deployer Wallet...\n");

  try {
    const [deployer] = await ethers.getSigners();
    console.log(`   ✅ Deployer address: ${deployer.address}`);

    const balance = await ethers.provider.getBalance(deployer.address);
    const balanceInMatic = ethers.formatEther(balance);
    console.log(`   💵 Balance: ${balanceInMatic} MATIC`);

    const minBalance = 5; // Minimum 5 MATIC required
    if (parseFloat(balanceInMatic) < minBalance) {
      console.log(`   ❌ Insufficient balance! Need at least ${minBalance} MATIC`);
      console.log(`   📍 Fund this address: ${deployer.address}`);
      hasErrors = true;
    } else {
      console.log(`   ✅ Sufficient balance for deployment`);
    }
  } catch (error) {
    console.log(`   ❌ Wallet check failed: ${error}`);
    hasErrors = true;
  }

  // ============================================================================
  // CHECK 4: Hardhat Configuration
  // ============================================================================

  console.log("\n⚙️  Checking Hardhat Configuration...\n");

  try {
    const config = await import("../hardhat.config.js");
    console.log(`   ✅ Hardhat config loaded`);
    console.log(`   ✅ Solidity version: ${config.default.solidity.version}`);
    console.log(`   ✅ Optimizer enabled: ${config.default.solidity.settings.optimizer.enabled}`);
  } catch (error) {
    console.log(`   ❌ Hardhat config error: ${error}`);
    hasErrors = true;
  }

  // ============================================================================
  // CHECK 5: Contract Compilation
  // ============================================================================

  console.log("\n🔨 Checking Contract Compilation...\n");

  try {
    // Try to get contract factory (this will fail if not compiled)
    await ethers.getContractFactory("PFFVerifiedSBT");
    console.log(`   ✅ PFFVerifiedSBT compiled`);

    await ethers.getContractFactory("SharedAccount");
    console.log(`   ✅ SharedAccount compiled`);

    await ethers.getContractFactory("SharedAccountFactory");
    console.log(`   ✅ SharedAccountFactory compiled`);
  } catch (error) {
    console.log(`   ⚠️  Contracts not compiled yet`);
    console.log(`   💡 Run: npx hardhat compile`);
  }

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================

  console.log("\n═══════════════════════════════════════════════════════════════");
  
  if (hasErrors) {
    console.log("❌ SETUP VERIFICATION FAILED");
    console.log("═══════════════════════════════════════════════════════════════\n");
    console.log("📝 Action Required:\n");
    console.log("1. Fix the errors listed above");
    console.log("2. Run this script again to verify");
    console.log("3. Once all checks pass, proceed with deployment\n");
    process.exit(1);
  } else {
    console.log("✅ SETUP VERIFICATION PASSED");
    console.log("═══════════════════════════════════════════════════════════════\n");
    console.log("🚀 Ready to Deploy!\n");
    console.log("Next Steps:");
    console.log("1. Deploy contracts: npx hardhat run scripts/deploy-all-phase1.ts --network polygon");
    console.log("2. Or deploy individually: npx hardhat run scripts/deploy-pff-verified-sbt.ts --network polygon\n");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Verification script failed:");
    console.error(error);
    process.exit(1);
  });

