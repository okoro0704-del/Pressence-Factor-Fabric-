/**
 * Deploy PFF Verified SBT Contract
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-pff-verified-sbt.ts --network polygon
 *   npx hardhat run scripts/deploy-pff-verified-sbt.ts --network mumbai (testnet)
 * 
 * Environment Variables Required:
 *   PRIVATE_KEY - Deployer private key
 *   POLYGON_RPC_URL - Polygon RPC endpoint
 */

import { ethers } from "hardhat";

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("🚀 DEPLOYING PFF VERIFIED SBT CONTRACT");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying from address:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "MATIC\n");

  if (balance === 0n) {
    throw new Error("❌ Deployer account has no MATIC. Please fund the account first.");
  }

  // Deploy PFFVerifiedSBT
  console.log("📦 Deploying PFFVerifiedSBT contract...");
  const PFFVerifiedSBT = await ethers.getContractFactory("PFFVerifiedSBT");
  const sbt = await PFFVerifiedSBT.deploy();
  
  await sbt.waitForDeployment();
  const sbtAddress = await sbt.getAddress();

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("✅ DEPLOYMENT SUCCESSFUL");
  console.log("═══════════════════════════════════════════════════════════════\n");
  
  console.log("📋 Contract Details:");
  console.log("   Name: PFF Verified SBT");
  console.log("   Symbol: PFF-SBT");
  console.log("   Address:", sbtAddress);
  console.log("   Owner:", deployer.address);
  console.log("   Network:", (await ethers.provider.getNetwork()).name);
  console.log("   Chain ID:", (await ethers.provider.getNetwork()).chainId);

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("📝 NEXT STEPS");
  console.log("═══════════════════════════════════════════════════════════════\n");
  
  console.log("1. Add to .env.local:");
  console.log(`   NEXT_PUBLIC_PFF_VERIFIED_SBT_ADDRESS=${sbtAddress}`);
  
  console.log("\n2. Add to Netlify environment variables:");
  console.log(`   netlify env:set NEXT_PUBLIC_PFF_VERIFIED_SBT_ADDRESS ${sbtAddress} --site pff3`);
  
  console.log("\n3. Verify contract on PolygonScan (optional):");
  console.log(`   npx hardhat verify --network polygon ${sbtAddress}`);
  
  console.log("\n4. Test minting an SBT:");
  console.log(`   npx hardhat run scripts/mint-test-sbt.ts --network polygon`);

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("🎉 DEPLOYMENT COMPLETE");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Save deployment info to file
  const fs = require("fs");
  const deploymentInfo = {
    contractName: "PFFVerifiedSBT",
    address: sbtAddress,
    deployer: deployer.address,
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployedAt: new Date().toISOString(),
    transactionHash: sbt.deploymentTransaction()?.hash,
  };

  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `${deploymentsDir}/PFFVerifiedSBT-${deploymentInfo.chainId}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved to: ${filename}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ DEPLOYMENT FAILED:");
    console.error(error);
    process.exit(1);
  });

