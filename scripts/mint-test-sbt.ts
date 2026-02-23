/**
 * Mint Test SBT
 * 
 * Usage:
 *   npx hardhat run scripts/mint-test-sbt.ts --network polygon
 * 
 * Environment Variables Required:
 *   PRIVATE_KEY - Contract owner private key
 *   NEXT_PUBLIC_PFF_VERIFIED_SBT_ADDRESS - Deployed SBT contract address
 */

import { ethers } from "hardhat";

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("🎫 MINTING TEST PFF VERIFIED SBT");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const sbtAddress = process.env.NEXT_PUBLIC_PFF_VERIFIED_SBT_ADDRESS;
  
  if (!sbtAddress || sbtAddress === "0x0000000000000000000000000000000000000000") {
    throw new Error("❌ NEXT_PUBLIC_PFF_VERIFIED_SBT_ADDRESS not set in .env");
  }

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("📍 Minting from address:", signer.address);

  // Connect to deployed contract
  const PFFVerifiedSBT = await ethers.getContractFactory("PFFVerifiedSBT");
  const sbt = PFFVerifiedSBT.attach(sbtAddress);

  // Test recipient (you can change this to any address)
  const recipient = signer.address; // Mint to deployer for testing
  const metadataURI = "ipfs://QmTest123/metadata.json"; // Placeholder metadata

  console.log("📋 Minting Details:");
  console.log("   Recipient:", recipient);
  console.log("   Metadata URI:", metadataURI);
  console.log("   Contract:", sbtAddress);

  // Check if address already has SBT
  const existingTokenId = await sbt.addressToTokenId(recipient);
  if (existingTokenId > 0n) {
    console.log("\n⚠️  Address already has SBT (Token ID:", existingTokenId.toString(), ")");
    
    const isRevoked = await sbt.isRevoked(existingTokenId);
    const isVerified = await sbt.isVerified(recipient);
    
    console.log("   Revoked:", isRevoked);
    console.log("   Verified:", isVerified);
    
    return;
  }

  // Mint SBT
  console.log("\n⏳ Minting SBT...");
  const tx = await sbt.mintSBT(recipient, metadataURI);
  console.log("   Transaction hash:", tx.hash);
  
  console.log("⏳ Waiting for confirmation...");
  const receipt = await tx.wait();
  
  console.log("\n✅ SBT MINTED SUCCESSFULLY");
  console.log("   Block number:", receipt?.blockNumber);
  console.log("   Gas used:", receipt?.gasUsed.toString());

  // Get token ID
  const tokenId = await sbt.addressToTokenId(recipient);
  console.log("   Token ID:", tokenId.toString());

  // Verify
  const isVerified = await sbt.isVerified(recipient);
  const balance = await sbt.balanceOf(recipient);
  const tokenURI = await sbt.tokenURI(tokenId);

  console.log("\n📊 Verification:");
  console.log("   Is Verified:", isVerified);
  console.log("   Balance:", balance.toString());
  console.log("   Token URI:", tokenURI);

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("🎉 TEST MINT COMPLETE");
  console.log("═══════════════════════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ MINTING FAILED:");
    console.error(error);
    process.exit(1);
  });

