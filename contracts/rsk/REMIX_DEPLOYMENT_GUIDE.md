# 🎯 Remix IDE Deployment Guide - PFF Sovereign Economic OS

This guide walks you through deploying all 4 PFF contracts on **Remix IDE** to Rootstock (RSK) or any EVM-compatible network.

---

## 📋 Prerequisites

1. **MetaMask** wallet installed and configured
2. **RBTC** (Rootstock Bitcoin) for gas fees
3. **Remix IDE** open at https://remix.ethereum.org

---

## 🌐 Network Configuration

### Add RSK Testnet to MetaMask

1. Open MetaMask → Networks → Add Network
2. Enter the following details:

```
Network Name: RSK Testnet
RPC URL: https://public-node.testnet.rsk.co
Chain ID: 31
Currency Symbol: tRBTC
Block Explorer: https://explorer.testnet.rsk.co
```

3. Get testnet RBTC from faucet: https://faucet.rsk.co

### Add RSK Mainnet to MetaMask

```
Network Name: RSK Mainnet
RPC URL: https://public-node.rsk.co
Chain ID: 30
Currency Symbol: RBTC
Block Explorer: https://explorer.rsk.co
```

---

## 📝 Step-by-Step Deployment

### Step 1: Prepare Remix IDE

1. Go to https://remix.ethereum.org
2. Create a new workspace or use default
3. In the **File Explorer**, create a new folder: `PFF-Contracts`

---

### Step 2: Install OpenZeppelin Contracts

1. In Remix, go to **File Explorer**
2. Right-click on `contracts` folder → New File
3. Create a file named `package.json` with this content:

```json
{
  "dependencies": {
    "@openzeppelin/contracts": "^5.0.0",
    "@chainlink/contracts": "^0.8.0"
  }
}
```

4. Remix will automatically install dependencies

**Alternative**: Use GitHub imports (already included in contract files)

---

### Step 3: Upload Contract Files

Copy each contract file into Remix:

#### 3.1 Create `FoundationVault.sol`
1. Right-click `contracts` → New File → `FoundationVault.sol`
2. Copy the entire content from `contracts/rsk/FoundationVault.sol`
3. Paste into Remix

#### 3.2 Create `SentinelGate.sol`
1. Right-click `contracts` → New File → `SentinelGate.sol`
2. Copy the entire content from `contracts/rsk/SentinelGate.sol`
3. Paste into Remix

#### 3.3 Create `SentinelSuite.sol`
1. Right-click `contracts` → New File → `SentinelSuite.sol`
2. Copy the entire content from `contracts/rsk/SentinelSuite.sol`
3. Paste into Remix

#### 3.4 Create `NationalTreasury.sol`
1. Right-click `contracts` → New File → `NationalTreasury.sol`
2. Copy the entire content from `contracts/rsk/NationalTreasury.sol`
3. Paste into Remix

---

### Step 4: Compile Contracts

1. Click on **Solidity Compiler** tab (left sidebar)
2. Select compiler version: **0.8.20**
3. Enable **Optimization**: 200 runs
4. Click **Compile FoundationVault.sol**
5. Repeat for all 4 contracts
6. Verify no errors (warnings are OK)

---

### Step 5: Prepare Deployment Parameters

Before deploying, prepare these addresses:

```
ARCHITECT_ADDRESS: Your MetaMask address (you)
SENTINEL_WALLET: Address to receive $100 USD per vitalization
FOUNDATION_WALLET: Address to receive foundation fees

CHAINLINK ORACLES (RSK Testnet - Placeholder):
VIDA_USD_PRICE_FEED: 0x0000000000000000000000000000000000000001
NGN_USD_PRICE_FEED: 0x0000000000000000000000000000000000000002

ERC2771 TRUSTED FORWARDER (Placeholder):
TRUSTED_FORWARDER: 0x0000000000000000000000000000000000000003
```

⚠️ **Important**: Update oracle addresses with actual Chainlink feeds before mainnet deployment!

---

### Step 6: Deploy Contracts (IN ORDER!)

#### 6.1 Deploy FoundationVault

1. Click **Deploy & Run Transactions** tab
2. Environment: **Injected Provider - MetaMask**
3. Confirm MetaMask is connected to **RSK Testnet**
4. Select contract: **FoundationVault**
5. Enter constructor parameters:
   ```
   _ARCHITECT: 0xYourArchitectAddress
   _SENTINEL_WALLET: 0xYourSentinelWallet
   _VIDA_USD_PRICE_FEED: 0x0000000000000000000000000000000000000001
   ```
6. Click **Deploy**
7. Confirm transaction in MetaMask
8. **COPY THE DEPLOYED ADDRESS** → Save as `FOUNDATION_VAULT_ADDRESS`

---

#### 6.2 Deploy SentinelGate

1. Select contract: **SentinelGate**
2. Enter constructor parameters:
   ```
   _VIDA_TOKEN: [FOUNDATION_VAULT_ADDRESS from step 6.1]
   _ARCHITECT: 0xYourArchitectAddress
   _FOUNDATION_WALLET: 0xYourFoundationWallet
   ```
3. Click **Deploy**
4. Confirm transaction in MetaMask
5. **COPY THE DEPLOYED ADDRESS** → Save as `SENTINEL_GATE_ADDRESS`

---

#### 6.3 Deploy SentinelSuite

1. Select contract: **SentinelSuite**
2. Enter constructor parameters:
   ```
   _VIDA_TOKEN: [FOUNDATION_VAULT_ADDRESS]
   _SENTINEL_GATE: [SENTINEL_GATE_ADDRESS]
   _TRUSTED_FORWARDER: 0x0000000000000000000000000000000000000003
   _ARCHITECT: 0xYourArchitectAddress
   ```
3. Click **Deploy**
4. Confirm transaction in MetaMask
5. **COPY THE DEPLOYED ADDRESS** → Save as `SENTINEL_SUITE_ADDRESS`

---

#### 6.4 Deploy NationalTreasury

1. Select contract: **NationalTreasury**
2. Enter constructor parameters:
   ```
   _VIDA_TOKEN: [FOUNDATION_VAULT_ADDRESS]
   _NGN_USD_PRICE_FEED: 0x0000000000000000000000000000000000000002
   _VIDA_USD_PRICE_FEED: 0x0000000000000000000000000000000000000001
   _ARCHITECT: 0xYourArchitectAddress
   ```
3. Click **Deploy**
4. Confirm transaction in MetaMask
5. **COPY THE DEPLOYED ADDRESS** → Save as `NATIONAL_TREASURY_ADDRESS`

---

### Step 7: Link Contracts (Grant Roles)

#### 7.1 Grant SENTINEL_ROLE to SentinelGate

1. In **Deployed Contracts**, expand **FoundationVault**
2. Find function: `grantSentinelRole`
3. Enter parameter: `[SENTINEL_GATE_ADDRESS]`
4. Click **transact**
5. Confirm in MetaMask

#### 7.2 Grant FOUNDATION_ROLE to Foundation Wallet

1. In **FoundationVault**, find: `grantFoundationRole`
2. Enter parameter: `[FOUNDATION_WALLET_ADDRESS]`
3. Click **transact**
4. Confirm in MetaMask

---

### Step 8: Verify Deployment

#### 8.1 Check Total Supply

1. In **FoundationVault**, click `totalSupply`
2. Should return: `1000000000000000000000000000000` (1 Trillion with 18 decimals)

#### 8.2 Check System Metrics

1. In **FoundationVault**, click `getSystemMetrics`
2. Verify:
   - `totalSupply_`: 1,000,000,000,000 VIDA CAP
   - `contractSpendable`: 1,000,000,000,000 VIDA CAP
   - `citizensVitalized`: 0
   - `boardActive`: false

---

## ✅ Deployment Complete!

Save your deployed addresses:

```
FOUNDATION_VAULT_ADDRESS: 0x...
SENTINEL_GATE_ADDRESS: 0x...
SENTINEL_SUITE_ADDRESS: 0x...
NATIONAL_TREASURY_ADDRESS: 0x...
```

---

## 🧪 Test the System

### Test 1: Vitalize a Citizen

1. In **SentinelGate**, call `vitalize`:
   ```
   _CITIZEN: 0xTestCitizenAddress
   _NATION: 0xTestNationAddress
   ```
2. Check balances in **FoundationVault** using `getVaultBalances`

### Test 2: Onboard a Bank

1. In **SentinelGate**, call `onboardBank`:
   ```
   _BANK: 0xBankAddress
   _IS_PARTNER: true
   ```
2. Check license with `getLicenseStamp`

---

## 📊 Verify on Block Explorer

1. Go to https://explorer.testnet.rsk.co
2. Search for each contract address
3. Verify contract code (optional)

---

## 🚨 Important Notes

1. **Save all deployed addresses** - you'll need them for frontend integration
2. **Test on testnet first** before mainnet deployment
3. **Update oracle addresses** with actual Chainlink feeds
4. **Secure your private keys** - never share them
5. **Gas costs**: Each deployment costs ~0.01-0.05 RBTC

---

## 🔗 Next Steps

1. Update your web app environment variables:
   ```
   NEXT_PUBLIC_FOUNDATION_VAULT_ADDRESS=[FOUNDATION_VAULT_ADDRESS]
   NEXT_PUBLIC_SENTINEL_GATE_ADDRESS=[SENTINEL_GATE_ADDRESS]
   NEXT_PUBLIC_SENTINEL_SUITE_ADDRESS=[SENTINEL_SUITE_ADDRESS]
   NEXT_PUBLIC_NATIONAL_TREASURY_ADDRESS=[NATIONAL_TREASURY_ADDRESS]
   ```

2. Test vitalization flow from your web app
3. Onboard partner banks
4. Add liquidity to NationalTreasury SAMM

---

**Need help?** Check the main README.md for detailed contract documentation.

