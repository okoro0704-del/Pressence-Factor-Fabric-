/**
 * @file Deploy Shared Account Factory
 * @description Deployment script for SharedAccountFactory and SharedAccount contracts
 */

import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying PFF Shared Account Factory...\n");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "MATIC\n");
  
  // ============================================================================
  // CONFIGURATION
  // ============================================================================
  
  // PFF Verified SBT address (must be deployed first)
  const PFF_VERIFIED_SBT_ADDRESS = process.env.NEXT_PUBLIC_PFF_VERIFIED_SBT_ADDRESS || "";
  
  // Sentinel webhook URL
  const SENTINEL_WEBHOOK_URL = process.env.SENTINEL_WEBHOOK_URL || "https://sentinel.pffprotocol.com/webhooks/account-created";
  
  if (!PFF_VERIFIED_SBT_ADDRESS || PFF_VERIFIED_SBT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    throw new Error("❌ PFF_VERIFIED_SBT_ADDRESS not set in environment variables");
  }
  
  console.log("Configuration:");
  console.log("- PFF Verified SBT:", PFF_VERIFIED_SBT_ADDRESS);
  console.log("- Sentinel Webhook:", SENTINEL_WEBHOOK_URL);
  console.log("");
  
  // ============================================================================
  // STEP 1: Deploy SharedAccount Implementation
  // ============================================================================
  
  console.log("📝 Step 1: Deploying SharedAccount implementation...");
  
  const SharedAccount = await ethers.getContractFactory("SharedAccount");
  const sharedAccount = await SharedAccount.deploy();
  await sharedAccount.deployed();
  
  console.log("✅ SharedAccount deployed to:", sharedAccount.address);
  console.log("");
  
  // ============================================================================
  // STEP 2: Deploy SharedAccountFactory
  // ============================================================================
  
  console.log("📝 Step 2: Deploying SharedAccountFactory...");
  
  const SharedAccountFactory = await ethers.getContractFactory("SharedAccountFactory");
  const factory = await SharedAccountFactory.deploy(
    PFF_VERIFIED_SBT_ADDRESS,
    sharedAccount.address,
    SENTINEL_WEBHOOK_URL
  );
  await factory.deployed();
  
  console.log("✅ SharedAccountFactory deployed to:", factory.address);
  console.log("");
  
  // ============================================================================
  // STEP 3: Verify Deployment
  // ============================================================================
  
  console.log("📝 Step 3: Verifying deployment...");
  
  const verifiedSBT = await factory.pffVerifiedSBT();
  const implementation = await factory.sharedAccountImplementation();
  const webhookURL = await factory.sentinelWebhookURL();
  
  console.log("Verification:");
  console.log("- PFF Verified SBT:", verifiedSBT);
  console.log("- Implementation:", implementation);
  console.log("- Webhook URL:", webhookURL);
  console.log("");
  
  if (verifiedSBT !== PFF_VERIFIED_SBT_ADDRESS) {
    throw new Error("❌ PFF Verified SBT address mismatch");
  }
  
  if (implementation !== sharedAccount.address) {
    throw new Error("❌ Implementation address mismatch");
  }
  
  console.log("✅ Deployment verified successfully");
  console.log("");
  
  // ============================================================================
  // STEP 4: Display Summary
  // ============================================================================
  
  console.log("=" .repeat(80));
  console.log("🎉 DEPLOYMENT COMPLETE");
  console.log("=" .repeat(80));
  console.log("");
  console.log("Contract Addresses:");
  console.log("-------------------");
  console.log("SharedAccount Implementation:", sharedAccount.address);
  console.log("SharedAccountFactory:", factory.address);
  console.log("");
  console.log("Next Steps:");
  console.log("-----------");
  console.log("1. Update .env.local:");
  console.log(`   NEXT_PUBLIC_SHARED_ACCOUNT_FACTORY_ADDRESS=${factory.address}`);
  console.log(`   NEXT_PUBLIC_SHARED_ACCOUNT_IMPLEMENTATION_ADDRESS=${sharedAccount.address}`);
  console.log("");
  console.log("2. Update Netlify environment variables with the same values");
  console.log("");
  console.log("3. Whitelist partners:");
  console.log(`   await factory.whitelistPartner("0x...", "Partner Name")`);
  console.log("");
  console.log("4. Verify contracts on PolygonScan:");
  console.log(`   npx hardhat verify --network polygon ${sharedAccount.address}`);
  console.log(`   npx hardhat verify --network polygon ${factory.address} "${PFF_VERIFIED_SBT_ADDRESS}" "${sharedAccount.address}" "${SENTINEL_WEBHOOK_URL}"`);
  console.log("");
  console.log("=" .repeat(80));
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

