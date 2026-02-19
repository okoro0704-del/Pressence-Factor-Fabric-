/**
 * PFF Sovereign Economic OS — RSK Deployment Script
 * 
 * Deploys all four contracts in the correct order:
 * 1. FoundationVault (VIDA CAP token with 1T pre-mint)
 * 2. SentinelGate (RBAC and license management)
 * 3. SentinelSuite (ADRS + BPS with meta-transactions)
 * 4. NationalTreasury (SAMM with dual-liquidity pool)
 * 
 * Then links everything together and configures Chainlink oracles.
 */

const hre = require("hardhat");
const { ethers } = require("hardhat");

// RSK Mainnet Chainlink Oracle Addresses
const RSK_CHAINLINK_ORACLES = {
  // Note: These are placeholder addresses - update with actual RSK Chainlink feeds
  VIDA_USD: "0x0000000000000000000000000000000000000001", // VIDA/USD price feed
  NGN_USD: "0x0000000000000000000000000000000000000002",  // NGN/USD price feed
};

// ERC2771 Trusted Forwarder (for gasless meta-transactions)
const TRUSTED_FORWARDER = "0x0000000000000000000000000000000000000003"; // Update with actual forwarder

async function main() {
  console.log("\n🚀 PFF Sovereign Economic OS — RSK Deployment");
  console.log("================================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "RBTC\n");

  // Configuration
  const ARCHITECT_ADDRESS = process.env.ARCHITECT_ADDRESS || deployer.address;
  const SENTINEL_WALLET = process.env.SENTINEL_WALLET || deployer.address;
  const FOUNDATION_WALLET = process.env.FOUNDATION_WALLET || deployer.address;
  
  console.log("Configuration:");
  console.log("  Architect:", ARCHITECT_ADDRESS);
  console.log("  Sentinel Wallet:", SENTINEL_WALLET);
  console.log("  Foundation Wallet:", FOUNDATION_WALLET);
  console.log("  Network:", hre.network.name, "\n");

  // ============================================================================
  // STEP 1: Deploy FoundationVault (VIDA CAP Token)
  // ============================================================================
  console.log("📝 Step 1: Deploying FoundationVault (VIDA CAP)...");
  
  const FoundationVault = await ethers.getContractFactory("FoundationVault");
  const foundationVault = await FoundationVault.deploy(
    ARCHITECT_ADDRESS,
    SENTINEL_WALLET,
    RSK_CHAINLINK_ORACLES.VIDA_USD
  );
  await foundationVault.waitForDeployment();
  const vaultAddress = await foundationVault.getAddress();
  
  console.log("✅ FoundationVault deployed to:", vaultAddress);
  console.log("   - Total Supply: 1,000,000,000,000 VIDA CAP (1 Trillion)");
  console.log("   - Dual-Vault System: Spendable + Locked balances");
  console.log("   - Chainlink Oracle: VIDA/USD price feed\n");

  // ============================================================================
  // STEP 2: Deploy SentinelGate (RBAC & License Management)
  // ============================================================================
  console.log("📝 Step 2: Deploying SentinelGate...");
  
  const SentinelGate = await ethers.getContractFactory("SentinelGate");
  const sentinelGate = await SentinelGate.deploy(
    vaultAddress,
    ARCHITECT_ADDRESS,
    FOUNDATION_WALLET
  );
  await sentinelGate.waitForDeployment();
  const gateAddress = await sentinelGate.getAddress();
  
  console.log("✅ SentinelGate deployed to:", gateAddress);
  console.log("   - RBAC: Architect, Foundation, Partner Banks, External Banks");
  console.log("   - License Stamps: ADRS, BPS, SSS");
  console.log("   - Fee Splits: 35% Architect, 65% Foundation\n");

  // ============================================================================
  // STEP 3: Deploy SentinelSuite (ADRS + BPS)
  // ============================================================================
  console.log("📝 Step 3: Deploying SentinelSuite (ADRS + BPS)...");
  
  const SentinelSuite = await ethers.getContractFactory("SentinelSuite");
  const sentinelSuite = await SentinelSuite.deploy(
    vaultAddress,
    gateAddress,
    TRUSTED_FORWARDER,
    ARCHITECT_ADDRESS
  );
  await sentinelSuite.waitForDeployment();
  const suiteAddress = await sentinelSuite.getAddress();
  
  console.log("✅ SentinelSuite deployed to:", suiteAddress);
  console.log("   - ADRS: Automated Debt Recovery System");
  console.log("   - BPS: Borderless Payment System (Gasless)");
  console.log("   - ERC2771: Meta-transaction support\n");

  // ============================================================================
  // STEP 4: Deploy NationalTreasury (SAMM)
  // ============================================================================
  console.log("📝 Step 4: Deploying NationalTreasury (SAMM)...");
  
  const NationalTreasury = await ethers.getContractFactory("NationalTreasury");
  const nationalTreasury = await NationalTreasury.deploy(
    vaultAddress,
    RSK_CHAINLINK_ORACLES.NGN_USD,
    RSK_CHAINLINK_ORACLES.VIDA_USD,
    ARCHITECT_ADDRESS
  );
  await nationalTreasury.waitForDeployment();
  const treasuryAddress = await nationalTreasury.getAddress();
  
  console.log("✅ NationalTreasury deployed to:", treasuryAddress);
  console.log("   - SAMM: Sovereign Automated Market Maker");
  console.log("   - Dual-Liquidity: ngnVIDA + VIDA CAP");
  console.log("   - 1:1 Peg: ngnVIDA = 1 Nigerian Naira\n");

  // ============================================================================
  // STEP 5: Grant Roles
  // ============================================================================
  console.log("📝 Step 5: Granting roles...");
  
  // Grant SENTINEL_ROLE to SentinelGate in FoundationVault
  const grantSentinelTx = await foundationVault.grantSentinelRole(gateAddress);
  await grantSentinelTx.wait();
  console.log("✅ SENTINEL_ROLE granted to SentinelGate in FoundationVault");
  
  // Grant FOUNDATION_ROLE to Foundation wallet
  const grantFoundationTx = await foundationVault.grantFoundationRole(FOUNDATION_WALLET);
  await grantFoundationTx.wait();
  console.log("✅ FOUNDATION_ROLE granted to Foundation wallet\n");

  // ============================================================================
  // STEP 6: Verify Deployment
  // ============================================================================
  console.log("📝 Step 6: Verifying deployment...");
  
  const metrics = await foundationVault.getSystemMetrics();
  
  console.log("✅ Verification complete:");
  console.log("   - Total Supply:", ethers.formatEther(metrics.totalSupply_), "VIDA CAP");
  console.log("   - Contract Spendable:", ethers.formatEther(metrics.contractSpendable), "VIDA CAP");
  console.log("   - Foundation Reserve:", ethers.formatEther(metrics.foundationReserve), "VIDA CAP");
  console.log("   - Board Active:", metrics.boardActive, "\n");

  // ============================================================================
  // DEPLOYMENT SUMMARY
  // ============================================================================
  console.log("================================================");
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("================================================\n");
  
  console.log("Contract Addresses:");
  console.log("-------------------");
  console.log("FoundationVault:      ", vaultAddress);
  console.log("SentinelGate:         ", gateAddress);
  console.log("SentinelSuite:        ", suiteAddress);
  console.log("NationalTreasury:     ", treasuryAddress);
  console.log("");

  console.log("Environment Variables (add to .env):");
  console.log("-------------------------------------");
  console.log(`FOUNDATION_VAULT_ADDRESS=${vaultAddress}`);
  console.log(`SENTINEL_GATE_ADDRESS=${gateAddress}`);
  console.log(`SENTINEL_SUITE_ADDRESS=${suiteAddress}`);
  console.log(`NATIONAL_TREASURY_ADDRESS=${treasuryAddress}`);
  console.log("");

  console.log("Next Steps:");
  console.log("-----------");
  console.log("1. Update Chainlink oracle addresses in deployment script");
  console.log("2. Update ERC2771 trusted forwarder address");
  console.log("3. Test vitalization flow with test citizen");
  console.log("4. Onboard partner banks (UBA, Access Bank, etc.)");
  console.log("5. Grant ADRS/BPS/SSS licenses to banks");
  console.log("6. Add liquidity to NationalTreasury SAMM");
  console.log("7. Test ngnVIDA <-> VIDA CAP swaps");
  console.log("8. Monitor peg health and adjust as needed\n");

  // Save deployment info to file
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    architect: ARCHITECT_ADDRESS,
    sentinelWallet: SENTINEL_WALLET,
    foundationWallet: FOUNDATION_WALLET,
    timestamp: new Date().toISOString(),
    contracts: {
      FoundationVault: vaultAddress,
      SentinelGate: gateAddress,
      SentinelSuite: suiteAddress,
      NationalTreasury: treasuryAddress,
    },
    oracles: {
      vidaUsdPriceFeed: RSK_CHAINLINK_ORACLES.VIDA_USD,
      ngnUsdPriceFeed: RSK_CHAINLINK_ORACLES.NGN_USD,
    },
    configuration: {
      trustedForwarder: TRUSTED_FORWARDER,
      totalSupply: ethers.formatEther(metrics.totalSupply_),
      vitalizationUnits: "11 VIDA CAP",
      sentinelSiphon: "$100 USD equivalent",
    },
  };

  const deploymentPath = `./deployments/rsk-${hre.network.name}-deployment.json`;
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

