# PFF Sovereign Economic OS — Bitcoin Layer 2 (Rootstock)

A complete 4-contract ecosystem for the Prosperous Future Foundation (PFF) built on Rootstock (RSK), Bitcoin's Layer 2 network.

## 🏗️ Architecture Overview

### Core Contracts

1. **FoundationVault.sol** — VIDA CAP Token (ERC20)
   - 1 Trillion VIDA CAP pre-mint
   - Dual-Vault System (spendable + locked balances)
   - 11-unit vitalization logic
   - Chainlink price feed integration
   - Foundation global reserve (hardlocked until board activation)

2. **SentinelGate.sol** — RBAC & License Management
   - Role-based access control (Architect, Foundation, Partner Banks, External Banks)
   - License stamps (ADRS, BPS, SSS) with expiry tracking
   - Hardstop modifiers (instant revert on expired licenses)
   - Fee splits (30-40% Architect, 60-70% Foundation)
   - Partner bank discounts (50% off)

3. **SentinelSuite.sol** — ADRS + BPS
   - **ADRS**: Automated Debt Recovery System (query locked collateral, execute recovery)
   - **BPS**: Borderless Payment System (gasless meta-transactions via ERC-2771)
   - Loan tracking and default management
   - Cross-border payment processing

4. **NationalTreasury.sol** — SAMM (Sovereign Automated Market Maker)
   - Dual-liquidity pool (ngnVIDA + VIDA CAP)
   - 1:1 peg with Nigerian Naira (NGN)
   - Chainlink oracles for price feeds
   - Swap functionality (VIDA CAP ↔ ngnVIDA)
   - No burning logic (all VIDA CAP remains in pools)

---

## 💰 Tokenomics

### VIDA CAP Token
- **Total Supply**: 1,000,000,000,000 (1 Trillion)
- **Pre-mint**: 100% to FoundationVault contract
- **Decimals**: 18
- **Symbol**: VIDA

### Dual-Vault System
Every address has two balances:
- **Spendable**: Liquid balance (transferable)
- **Locked**: Collateral balance (non-transferable until unlocked)

### 11-Unit Vitalization Distribution

When a citizen is vitalized, 11 VIDA CAP are distributed:

```
Citizen:    1 spendable + 4 locked = 5 VIDA CAP
Nation:     1 spendable + 4 locked = 5 VIDA CAP
Sentinel:   $100 USD equivalent (dynamic based on Chainlink price feed)
Foundation: Remainder of 11th unit (hardlocked until board activation)
```

**Example** (assuming VIDA CAP = $1,000 USD):
- Citizen: 5 VIDA CAP (1 spendable, 4 locked)
- Nation: 5 VIDA CAP (1 spendable, 4 locked)
- Sentinel: 0.1 VIDA CAP ($100 / $1,000)
- Foundation: 0.9 VIDA CAP (hardlocked)

---

## 🔐 Security Features

- **OpenZeppelin 5.0** security-audited libraries
- **AccessControl** role-based permissions
- **ReentrancyGuard** on critical functions
- **CEI Pattern** (Checks-Effects-Interactions)
- **Chainlink Oracles** for reliable price feeds
- **ERC-2771** meta-transaction support (gasless UX)
- **Hardstop Modifiers** (instant revert on expired licenses)

---

## 🚀 Deployment

### Prerequisites

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts @chainlink/contracts
```

### Environment Variables

Create `.env` file:

```bash
# Deployer
PRIVATE_KEY=your_private_key_here

# Addresses
ARCHITECT_ADDRESS=0x...
SENTINEL_WALLET=0x...
FOUNDATION_WALLET=0x...

# RSK Network
RSK_RPC_URL=https://public-node.rsk.co
RSK_TESTNET_RPC_URL=https://public-node.testnet.rsk.co

# Chainlink Oracles (RSK Mainnet)
VIDA_USD_PRICE_FEED=0x...
NGN_USD_PRICE_FEED=0x...

# ERC2771 Trusted Forwarder
TRUSTED_FORWARDER=0x...
```

### Deploy to RSK Testnet

```bash
npx hardhat run rsk/scripts/deploy-rsk.js --network rskTestnet
```

### Deploy to RSK Mainnet

```bash
npx hardhat run rsk/scripts/deploy-rsk.js --network rsk
```

---

## 📊 Contract Interactions

### 1. Vitalize a Citizen

```solidity
// Called by SentinelGate (requires SENTINEL_ROLE)
foundationVault.vitalize(citizenAddress, nationAddress);
```

**Result**:
- Citizen receives 1 spendable + 4 locked VIDA CAP
- Nation receives 1 spendable + 4 locked VIDA CAP
- Sentinel wallet receives $100 USD equivalent
- Foundation reserve increases by remainder

### 2. Onboard a Bank

```solidity
// Called by Architect
sentinelGate.onboardBank(bankAddress, isPartner);
```

**Fee**: 1000 VIDA CAP (500 VIDA CAP for partner banks)
**Result**: Bank receives PFF verification and can purchase licenses

### 3. Grant ADRS License

```solidity
// Called by Architect
sentinelGate.grantADRSLicense(bankAddress, durationDays);
```

**Fee**: 500 VIDA CAP/year (250 VIDA CAP for partner banks)
**Result**: Bank can query locked collateral and execute debt recovery

### 4. Process Borderless Payment (Gasless)

```solidity
// Called by bank (via meta-transaction)
sentinelSuite.processBorderlessPayment(recipientAddress, amount, "NGN");
```

**Result**: Gasless cross-border payment (relayer pays gas)

### 5. Swap VIDA CAP for ngnVIDA

```solidity
// Called by user
nationalTreasury.swapVidaToNgn(vidaCapAmount);
```

**Result**: User receives ngnVIDA (pegged 1:1 with Nigerian Naira)

---

## 🔧 Administrative Functions

### Activate Foundation Board

```solidity
foundationVault.activateBoard(); // Architect only
```

Unlocks foundation global reserve for use.

### Update Fee Splits

```solidity
sentinelGate.updateFeeSplit(architectPercent, foundationPercent);
```

Adjust revenue split (Architect: 30-40%, Foundation: 60-70%).

### Add Liquidity to SAMM

```solidity
nationalTreasury.addLiquidity(vidaCapAmount); // Treasury role
```

Adds VIDA CAP to liquidity pool and mints equivalent ngnVIDA.

---

## 📈 Metrics & Monitoring

### FoundationVault Metrics

```solidity
(
  uint256 totalSupply,
  uint256 contractSpendable,
  uint256 contractLocked,
  uint256 foundationReserve,
  uint256 citizensVitalized,
  uint256 nationsVitalized,
  bool boardActive
) = foundationVault.getSystemMetrics();
```

### SentinelGate Metrics

```solidity
(
  uint256 banksOnboarded,
  uint256 partnerBanks,
  uint256 externalBanks,
  uint256 feesCollected,
  uint256 architectPercent,
  uint256 foundationPercent
) = sentinelGate.getSystemMetrics();
```

### SentinelSuite Metrics

```solidity
// ADRS Metrics
(
  uint256 loansCreated,
  uint256 loansDefaulted,
  uint256 loansRecovered,
  uint256 collateralRecovered
) = sentinelSuite.getADRSMetrics();

// BPS Metrics
(
  uint256 paymentsProcessed,
  uint256 volumeTransferred
) = sentinelSuite.getBPSMetrics();
```

### NationalTreasury Metrics

```solidity
(
  uint256 swapsVidaToNgn,
  uint256 swapsNgnToVida,
  uint256 volumeSwapped,
  uint256 feesCollected,
  uint256 currentSwapFee,
  bool pegHealthy
) = nationalTreasury.getSAMMMetrics();
```

---

## 📋 License Fees

| License Type | Annual Fee (External) | Annual Fee (Partner) | Description |
|--------------|----------------------|---------------------|-------------|
| **Onboarding** | 1,000 VIDA CAP | 500 VIDA CAP | One-time PFF verification |
| **ADRS** | 500 VIDA CAP | 250 VIDA CAP | Automated Debt Recovery |
| **BPS** | 500 VIDA CAP | 250 VIDA CAP | Borderless Payments |
| **SSS** | 1,500 VIDA CAP | 750 VIDA CAP | Full Sentinel Suite |

**Fee Split**:
- Onboarding: 100% to Foundation
- Annual Licenses: 35% Architect, 65% Foundation

---

## 🔗 Contract Dependencies

```
FoundationVault (VIDA CAP Token)
    ↓
SentinelGate (RBAC & Licenses)
    ↓
SentinelSuite (ADRS + BPS)
    ↓
NationalTreasury (SAMM)
```

**External Dependencies**:
- OpenZeppelin Contracts 5.0
- Chainlink Oracles (VIDA/USD, NGN/USD)
- ERC2771 Trusted Forwarder (for gasless transactions)

---

## 🧪 Testing

Run the test suite:

```bash
npx hardhat test rsk/test/PFFSovereignOS.test.js
```

---

## 🌐 Network Configuration

### RSK Mainnet
- **Chain ID**: 30
- **RPC**: https://public-node.rsk.co
- **Explorer**: https://explorer.rsk.co
- **Currency**: RBTC (Bitcoin)

### RSK Testnet
- **Chain ID**: 31
- **RPC**: https://public-node.testnet.rsk.co
- **Explorer**: https://explorer.testnet.rsk.co
- **Faucet**: https://faucet.rsk.co

---

## 📚 Key Concepts

### Dual-Vault System
Every address maintains two separate balances:
- **Spendable**: Can be transferred freely (ERC20 standard)
- **Locked**: Serves as collateral, cannot be transferred until unlocked

### Vitalization
One-time identity verification that distributes 11 VIDA CAP:
- 5 to citizen (1 spendable, 4 locked)
- 5 to nation (1 spendable, 4 locked)
- ~0.1 to sentinel ($100 USD equivalent)
- ~0.9 to foundation (hardlocked)

### SAMM (Sovereign Automated Market Maker)
Maintains 1:1 peg between ngnVIDA and Nigerian Naira:
- Uses Chainlink oracles for accurate pricing
- 0.5% swap fee
- No burning (all VIDA CAP remains in circulation)

### Meta-Transactions (ERC-2771)
Enables gasless user experience:
- Users sign transactions off-chain
- Relayers submit transactions and pay gas
- Users pay fees in VIDA CAP instead of RBTC

---

## 🚨 Important Notes

1. **Chainlink Oracles**: Update placeholder addresses with actual RSK Chainlink feeds before mainnet deployment
2. **Trusted Forwarder**: Deploy or configure ERC2771 forwarder for gasless transactions
3. **Security Audit**: Conduct professional security audit before mainnet deployment
4. **Gas Optimization**: RSK gas costs are lower than Ethereum but higher than sidechains
5. **Bitcoin Finality**: RSK inherits Bitcoin's security but has ~30 second block times

---

## 📞 Support

For questions or issues:
- **Documentation**: See individual contract files for detailed NatSpec comments
- **Architecture**: Review this README and deployment script
- **Testing**: Run test suite for usage examples

---

## 📄 License

MIT License - See individual contract files for SPDX identifiers

---

**Built with ❤️ for the Prosperous Future Foundation**

