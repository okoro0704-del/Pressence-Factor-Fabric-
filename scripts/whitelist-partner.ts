/**
 * @file Whitelist Partner Script
 * @description Script to whitelist partners in the SharedAccountFactory
 */

import { ethers } from "hardhat";

async function main() {
  console.log("🔐 Whitelisting Partner in SharedAccountFactory...\n");
  
  // Get deployer account (must be factory owner)
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "MATIC\n");
  
  // ============================================================================
  // CONFIGURATION
  // ============================================================================
  
  const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_SHARED_ACCOUNT_FACTORY_ADDRESS || "";
  
  if (!FACTORY_ADDRESS || FACTORY_ADDRESS === "0x0000000000000000000000000000000000000000") {
    throw new Error("❌ NEXT_PUBLIC_SHARED_ACCOUNT_FACTORY_ADDRESS not set");
  }
  
  // Partner to whitelist (update these values)
  const PARTNER_ADDRESS = process.argv[2] || "";
  const PARTNER_NAME = process.argv[3] || "";
  
  if (!PARTNER_ADDRESS || !PARTNER_NAME) {
    console.log("Usage: npx hardhat run scripts/whitelist-partner.ts --network polygon <partner_address> <partner_name>");
    console.log("");
    console.log("Example:");
    console.log('  npx hardhat run scripts/whitelist-partner.ts --network polygon 0x123... "UBA (United Bank for Africa)"');
    process.exit(1);
  }
  
  if (!ethers.utils.isAddress(PARTNER_ADDRESS)) {
    throw new Error("❌ Invalid partner address");
  }
  
  console.log("Configuration:");
  console.log("- Factory Address:", FACTORY_ADDRESS);
  console.log("- Partner Address:", PARTNER_ADDRESS);
  console.log("- Partner Name:", PARTNER_NAME);
  console.log("");
  
  // ============================================================================
  // WHITELIST PARTNER
  // ============================================================================
  
  console.log("📝 Whitelisting partner...");
  
  const factory = await ethers.getContractAt("SharedAccountFactory", FACTORY_ADDRESS);
  
  // Check if already whitelisted
  const isAlreadyWhitelisted = await factory.whitelistedPartners(PARTNER_ADDRESS);
  
  if (isAlreadyWhitelisted) {
    const existingName = await factory.partnerNames(PARTNER_ADDRESS);
    console.log("⚠️  Partner is already whitelisted as:", existingName);
    console.log("");
    
    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    const answer = await new Promise<string>((resolve) => {
      readline.question("Do you want to update the partner name? (yes/no): ", resolve);
    });
    
    readline.close();
    
    if (answer.toLowerCase() !== "yes") {
      console.log("❌ Cancelled");
      process.exit(0);
    }
  }
  
  // Whitelist the partner
  const tx = await factory.whitelistPartner(PARTNER_ADDRESS, PARTNER_NAME);
  console.log("Transaction hash:", tx.hash);
  
  console.log("⏳ Waiting for confirmation...");
  const receipt = await tx.wait();
  
  console.log("✅ Partner whitelisted successfully!");
  console.log("Block number:", receipt.blockNumber);
  console.log("");
  
  // ============================================================================
  // VERIFY
  // ============================================================================
  
  console.log("📝 Verifying...");
  
  const isWhitelisted = await factory.whitelistedPartners(PARTNER_ADDRESS);
  const partnerName = await factory.partnerNames(PARTNER_ADDRESS);
  
  console.log("Verification:");
  console.log("- Is Whitelisted:", isWhitelisted);
  console.log("- Partner Name:", partnerName);
  console.log("");
  
  if (!isWhitelisted || partnerName !== PARTNER_NAME) {
    throw new Error("❌ Verification failed");
  }
  
  console.log("✅ Verification successful");
  console.log("");
  
  // ============================================================================
  // SUMMARY
  // ============================================================================
  
  console.log("=" .repeat(80));
  console.log("🎉 PARTNER WHITELISTED");
  console.log("=" .repeat(80));
  console.log("");
  console.log("Partner Details:");
  console.log("----------------");
  console.log("Address:", PARTNER_ADDRESS);
  console.log("Name:", PARTNER_NAME);
  console.log("");
  console.log("Next Steps:");
  console.log("-----------");
  console.log("1. Share integration documentation with the partner");
  console.log("2. Provide them with the factory address:", FACTORY_ADDRESS);
  console.log("3. Test account creation with a verified Sovereign ID");
  console.log("");
  console.log("Integration Example:");
  console.log("--------------------");
  console.log("Visit: https://pff3.netlify.app/partners/uba");
  console.log("");
  console.log("=" .repeat(80));
}

// Execute script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

