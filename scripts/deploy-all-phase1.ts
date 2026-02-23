/**
 * PHASE 1 MASTER DEPLOYMENT SCRIPT
 * 
 * Deploys all Phase 1 contracts in sequence:
 * 1. PFF Verified SBT
 * 2. Shared Account Implementation
 * 3. Shared Account Factory
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-all-phase1.ts --network mumbai (testnet)
 *   npx hardhat run scripts/deploy-all-phase1.ts --network polygon (mainnet)
 * 
 * Environment Variables Required:
 *   PRIVATE_KEY - Deployer private key
 *   POLYGON_RPC_URL - Polygon RPC endpoint
 *   SENTINEL_WEBHOOK_URL - Webhook URL for account creation events
 */

import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("🚀 PHASE 1 MASTER DEPLOYMENT");
  console.log("   PFF Protocol - Smart Contracts & Infrastructure");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("📍 Deployment Configuration:");
  console.log("   Deployer:", deployer.address);
  console.log("   Network:", network.name);
  console.log("   Chain ID:", network.chainId);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("   Balance:", ethers.formatEther(balance), "MATIC\n");

  if (balance === 0n) {
    throw new Error("❌ Deployer account has no MATIC. Please fund the account first.");
  }

  const deploymentResults: any = {
    network: network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {},
  };

  // ============================================================================
  // STEP 1: Deploy PFF Verified SBT
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("📝 STEP 1: Deploying PFF Verified SBT");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const PFFVerifiedSBT = await ethers.getContractFactory("PFFVerifiedSBT");
  console.log("⏳ Deploying contract...");
  const sbt = await PFFVerifiedSBT.deploy();
  await sbt.waitForDeployment();
  const sbtAddress = await sbt.getAddress();

  console.log("✅ PFF Verified SBT deployed:", sbtAddress);
  console.log("   Transaction:", sbt.deploymentTransaction()?.hash);
  
  deploymentResults.contracts.PFFVerifiedSBT = {
    address: sbtAddress,
    transactionHash: sbt.deploymentTransaction()?.hash,
  };

  // ============================================================================
  // STEP 2: Deploy Shared Account Implementation
  // ============================================================================

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("📝 STEP 2: Deploying Shared Account Implementation");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const SharedAccount = await ethers.getContractFactory("SharedAccount");
  console.log("⏳ Deploying contract...");
  const sharedAccount = await SharedAccount.deploy();
  await sharedAccount.waitForDeployment();
  const sharedAccountAddress = await sharedAccount.getAddress();

  console.log("✅ Shared Account Implementation deployed:", sharedAccountAddress);
  console.log("   Transaction:", sharedAccount.deploymentTransaction()?.hash);
  
  deploymentResults.contracts.SharedAccountImplementation = {
    address: sharedAccountAddress,
    transactionHash: sharedAccount.deploymentTransaction()?.hash,
  };

  // ============================================================================
  // STEP 3: Deploy Shared Account Factory
  // ============================================================================

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("📝 STEP 3: Deploying Shared Account Factory");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const webhookURL = process.env.SENTINEL_WEBHOOK_URL || "https://pff3.netlify.app/api/sentinel/webhook";
  console.log("   SBT Address:", sbtAddress);
  console.log("   Implementation:", sharedAccountAddress);
  console.log("   Webhook URL:", webhookURL);

  const SharedAccountFactory = await ethers.getContractFactory("SharedAccountFactory");
  console.log("\n⏳ Deploying contract...");
  const factory = await SharedAccountFactory.deploy(
    sbtAddress,
    sharedAccountAddress,
    webhookURL
  );
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  console.log("✅ Shared Account Factory deployed:", factoryAddress);
  console.log("   Transaction:", factory.deploymentTransaction()?.hash);
  
  deploymentResults.contracts.SharedAccountFactory = {
    address: factoryAddress,
    transactionHash: factory.deploymentTransaction()?.hash,
    config: {
      sbtAddress,
      implementation: sharedAccountAddress,
      webhookURL,
    },
  };

  // ============================================================================
  // STEP 4: Save Deployment Results
  // ============================================================================

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("💾 Saving Deployment Results");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `${deploymentsDir}/phase1-${network.chainId}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentResults, null, 2));
  console.log("✅ Deployment results saved:", filename);

  // Generate .env snippet
  const envSnippet = `
# Phase 1 Deployment - ${network.name} (Chain ID: ${network.chainId})
# Deployed: ${deploymentResults.deployedAt}

NEXT_PUBLIC_PFF_VERIFIED_SBT_ADDRESS=${sbtAddress}
NEXT_PUBLIC_SHARED_ACCOUNT_IMPLEMENTATION_ADDRESS=${sharedAccountAddress}
NEXT_PUBLIC_SHARED_ACCOUNT_FACTORY_ADDRESS=${factoryAddress}
`;

  const envFilename = `${deploymentsDir}/phase1-${network.chainId}.env`;
  fs.writeFileSync(envFilename, envSnippet.trim());
  console.log("✅ Environment variables saved:", envFilename);

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("🎉 PHASE 1 DEPLOYMENT COMPLETE");
  console.log("═══════════════════════════════════════════════════════════════\n");

  console.log("📋 Deployed Contracts:");
  console.log("   PFF Verified SBT:", sbtAddress);
  console.log("   Shared Account Implementation:", sharedAccountAddress);
  console.log("   Shared Account Factory:", factoryAddress);

  console.log("\n📝 Next Steps:");
  console.log("   1. Copy environment variables from:", envFilename);
  console.log("   2. Add to web/.env.local");
  console.log("   3. Add to Netlify environment variables");
  console.log("   4. Fund Thirdweb Paymaster with $50 MATIC");
  console.log("   5. Deploy Supabase Edge Functions");
  console.log("   6. Test SBT minting: npx hardhat run scripts/mint-test-sbt.ts --network", network.name);

  console.log("\n═══════════════════════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ DEPLOYMENT FAILED:");
    console.error(error);
    process.exit(1);
  });

