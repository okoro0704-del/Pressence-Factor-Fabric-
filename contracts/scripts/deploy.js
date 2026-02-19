/**
 * PFF Global Nation — Deployment Script
 * 
 * Deploys all four contracts in the correct order:
 * 1. SovereignVida (VIDA token)
 * 2. NationalBlockNG (National treasury)
 * 3. FoundationVault (Foundation reserves)
 * 4. SovrynSentinelGate (Central controller)
 * 
 * Then links everything together and grants necessary roles.
 */

const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("\n🚀 PFF Global Nation — Smart Contract Deployment");
  console.log("================================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Configuration
  const ARCHITECT_ADDRESS = process.env.ARCHITECT_ADDRESS || deployer.address;
  console.log("Architect address:", ARCHITECT_ADDRESS);
  console.log("Network:", hre.network.name, "\n");

  // ============================================================================
  // STEP 1: Deploy SovereignVida Token
  // ============================================================================
  console.log("📝 Step 1: Deploying SovereignVida token...");
  
  const SovereignVida = await ethers.getContractFactory("SovereignVida");
  
  // For initial deployment, we'll use temporary addresses and update them later
  const tempNationalAddress = deployer.address;
  const tempFoundationAddress = deployer.address;
  
  const vidaToken = await SovereignVida.deploy(
    tempNationalAddress,
    tempFoundationAddress,
    ARCHITECT_ADDRESS
  );
  await vidaToken.waitForDeployment();
  const vidaAddress = await vidaToken.getAddress();
  
  console.log("✅ SovereignVida deployed to:", vidaAddress);
  console.log("   - Pre-mint: 110,000,000 VIDA");
  console.log("   - Max supply: 1,000,000,000 VIDA\n");

  // ============================================================================
  // STEP 2: Deploy NationalBlockNG
  // ============================================================================
  console.log("📝 Step 2: Deploying NationalBlockNG vault...");
  
  const NationalBlockNG = await ethers.getContractFactory("NationalBlockNG");
  const nationalBlock = await NationalBlockNG.deploy(vidaAddress, ARCHITECT_ADDRESS);
  await nationalBlock.waitForDeployment();
  const nationalAddress = await nationalBlock.getAddress();
  
  console.log("✅ NationalBlockNG deployed to:", nationalAddress);
  console.log("   - Purpose: National treasury for Nigeria");
  console.log("   - Receives: 5.0 VIDA per citizen\n");

  // ============================================================================
  // STEP 3: Deploy FoundationVault
  // ============================================================================
  console.log("📝 Step 3: Deploying FoundationVault...");
  
  const FoundationVault = await ethers.getContractFactory("FoundationVault");
  const foundationVault = await FoundationVault.deploy(vidaAddress, ARCHITECT_ADDRESS);
  await foundationVault.waitForDeployment();
  const foundationAddress = await foundationVault.getAddress();
  
  console.log("✅ FoundationVault deployed to:", foundationAddress);
  console.log("   - Purpose: Credit engine with collateral locking");
  console.log("   - Receives: 1.0 VIDA per citizen\n");

  // ============================================================================
  // STEP 4: Deploy SovrynSentinelGate
  // ============================================================================
  console.log("📝 Step 4: Deploying SovrynSentinelGate controller...");
  
  const SovrynSentinelGate = await ethers.getContractFactory("SovrynSentinelGate");
  const sentinelGate = await SovrynSentinelGate.deploy(ARCHITECT_ADDRESS);
  await sentinelGate.waitForDeployment();
  const sentinelAddress = await sentinelGate.getAddress();
  
  console.log("✅ SovrynSentinelGate deployed to:", sentinelAddress);
  console.log("   - Purpose: Central vitalization controller");
  console.log("   - Distributes: 11 VIDA per citizen (5+5+1 split)\n");

  // ============================================================================
  // STEP 5: Link Contracts
  // ============================================================================
  console.log("📝 Step 5: Linking contracts together...");
  
  // Link contracts in SovrynSentinelGate
  const linkTx = await sentinelGate.linkContracts(vidaAddress, nationalAddress, foundationAddress);
  await linkTx.wait();
  console.log("✅ Contracts linked in SovrynSentinelGate\n");

  // ============================================================================
  // STEP 6: Grant Roles
  // ============================================================================
  console.log("📝 Step 6: Granting roles...");
  
  // Grant MINTER_ROLE to SovrynSentinelGate
  const grantMinterTx = await vidaToken.grantMinterRole(sentinelAddress);
  await grantMinterTx.wait();
  console.log("✅ MINTER_ROLE granted to SovrynSentinelGate");
  
  // Grant SENTINEL_ROLE to SovrynSentinelGate in NationalBlockNG
  const grantNationalSentinelTx = await nationalBlock.grantSentinelRole(sentinelAddress);
  await grantNationalSentinelTx.wait();
  console.log("✅ SENTINEL_ROLE granted in NationalBlockNG");
  
  // Grant SENTINEL_ROLE to SovrynSentinelGate in FoundationVault
  const grantFoundationSentinelTx = await foundationVault.grantSentinelRole(sentinelAddress);
  await grantFoundationSentinelTx.wait();
  console.log("✅ SENTINEL_ROLE granted in FoundationVault\n");

  // ============================================================================
  // STEP 7: Verify Deployment
  // ============================================================================
  console.log("📝 Step 7: Verifying deployment...");
  
  const isMinter = await vidaToken.isMinter(sentinelAddress);
  const totalSupply = await vidaToken.totalSupply();
  const circulatingSupply = await vidaToken.circulatingSupply();
  
  console.log("✅ Verification complete:");
  console.log("   - SentinelGate is minter:", isMinter);
  console.log("   - Total VIDA supply:", ethers.formatEther(totalSupply), "VIDA");
  console.log("   - Circulating supply:", ethers.formatEther(circulatingSupply), "VIDA\n");

  // ============================================================================
  // DEPLOYMENT SUMMARY
  // ============================================================================
  console.log("================================================");
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("================================================\n");
  
  console.log("Contract Addresses:");
  console.log("-------------------");
  console.log("SovereignVida:        ", vidaAddress);
  console.log("NationalBlockNG:      ", nationalAddress);
  console.log("FoundationVault:      ", foundationAddress);
  console.log("SovrynSentinelGate:   ", sentinelAddress);
  console.log("");

  console.log("Environment Variables (add to .env):");
  console.log("-------------------------------------");
  console.log(`VIDA_TOKEN_ADDRESS=${vidaAddress}`);
  console.log(`NATIONAL_BLOCK_ADDRESS=${nationalAddress}`);
  console.log(`FOUNDATION_VAULT_ADDRESS=${foundationAddress}`);
  console.log(`SENTINEL_GATE_ADDRESS=${sentinelAddress}`);
  console.log("");

  console.log("Next Steps:");
  console.log("-----------");
  console.log("1. Update web/.env.production with contract addresses");
  console.log("2. Verify contracts on block explorer (if mainnet)");
  console.log("3. Test vitalization flow with test wallet");
  console.log("4. Add banking partners (UBA, Access Bank, etc.)");
  console.log("5. Monitor vitalization metrics\n");

  // Save deployment info to file
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    architect: ARCHITECT_ADDRESS,
    timestamp: new Date().toISOString(),
    contracts: {
      SovereignVida: vidaAddress,
      NationalBlockNG: nationalAddress,
      FoundationVault: foundationAddress,
      SovrynSentinelGate: sentinelAddress,
    },
    metrics: {
      totalSupply: ethers.formatEther(totalSupply),
      circulatingSupply: ethers.formatEther(circulatingSupply),
    },
  };

  const deploymentPath = `./deployments/${hre.network.name}-deployment.json`;
  fs.mkdirSync("./deployments", { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Deployment info saved to: ${deploymentPath}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

