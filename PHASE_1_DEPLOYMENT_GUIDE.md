# 🚀 PHASE 1 DEPLOYMENT GUIDE
## PFF Protocol - Smart Contracts & Infrastructure Activation

**Status:** IN PROGRESS  
**Target:** Deploy all smart contracts and activate gasless infrastructure  
**Timeline:** Week 1

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### **1. Environment Setup**

Create `.env` file in project root:

```bash
# Deployer Private Key (KEEP SECRET!)
PRIVATE_KEY=your_private_key_here

# RPC Endpoints
POLYGON_RPC_URL=https://polygon-rpc.com
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com

# PolygonScan API Key (for contract verification)
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# Sentinel Webhook URL
SENTINEL_WEBHOOK_URL=https://pff3.netlify.app/api/sentinel/webhook
```

### **2. Fund Deployer Wallet**

- **Polygon Mainnet:** Minimum 5 MATIC (~$5 USD)
- **Mumbai Testnet:** Get free testnet MATIC from https://faucet.polygon.technology/

### **3. Install Dependencies**

```bash
cd contracts
npm install
```

---

## 🎯 DEPLOYMENT SEQUENCE

### **STEP 1: Deploy PFF Verified SBT**

**Purpose:** Soul-Bound Token for KYC verification

```bash
# Testnet (recommended first)
npx hardhat run scripts/deploy-pff-verified-sbt.ts --network mumbai

# Mainnet (after testing)
npx hardhat run scripts/deploy-pff-verified-sbt.ts --network polygon
```

**Expected Output:**
```
✅ DEPLOYMENT SUCCESSFUL
   Address: 0x...
   Owner: 0x...
```

**Action:** Copy the contract address and add to `.env.local`:
```bash
NEXT_PUBLIC_PFF_VERIFIED_SBT_ADDRESS=0x...
```

---

### **STEP 2: Test SBT Minting**

```bash
# Update .env with SBT address first
npx hardhat run scripts/mint-test-sbt.ts --network mumbai
```

**Expected Output:**
```
✅ SBT MINTED SUCCESSFULLY
   Token ID: 1
   Is Verified: true
```

---

### **STEP 3: Deploy Shared Account Factory**

**Purpose:** Factory for creating business shared accounts

```bash
# Testnet
npx hardhat run scripts/deploy-shared-account-factory.ts --network mumbai

# Mainnet
npx hardhat run scripts/deploy-shared-account-factory.ts --network polygon
```

**Expected Output:**
```
✅ DEPLOYMENT COMPLETE
   SharedAccount Implementation: 0x...
   SharedAccountFactory: 0x...
```

**Action:** Add to `.env.local`:
```bash
NEXT_PUBLIC_SHARED_ACCOUNT_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_SHARED_ACCOUNT_IMPLEMENTATION_ADDRESS=0x...
```

---

### **STEP 4: Verify Contracts on PolygonScan**

```bash
# Verify PFF Verified SBT
npx hardhat verify --network polygon <SBT_ADDRESS>

# Verify SharedAccount Implementation
npx hardhat verify --network polygon <IMPLEMENTATION_ADDRESS>

# Verify SharedAccountFactory
npx hardhat verify --network polygon <FACTORY_ADDRESS> \
  "<SBT_ADDRESS>" \
  "<IMPLEMENTATION_ADDRESS>" \
  "<WEBHOOK_URL>"
```

---

## 💳 THIRDWEB PAYMASTER SETUP

### **STEP 5: Activate Gasless Transactions**

1. **Go to Thirdweb Dashboard:**
   - Visit: https://thirdweb.com/dashboard
   - Sign in with your wallet

2. **Navigate to Account Abstraction:**
   - Click "Account Abstraction" in sidebar
   - Select "Paymasters"

3. **Fund Paymaster:**
   - Click "Add Funds"
   - Send **$50 worth of MATIC** to paymaster
   - This covers ~500-1000 gasless transactions

4. **Copy Paymaster URL:**
   - Click "Copy Paymaster URL"
   - Should look like: `https://polygon.bundler.thirdweb.com/v2/137/...`

5. **Add to Environment:**

```bash
# Add to web/.env.local
NEXT_PUBLIC_PAYMASTER_URL=https://polygon.bundler.thirdweb.com/v2/137/...

# Add to Netlify
netlify env:set NEXT_PUBLIC_PAYMASTER_URL "https://polygon.bundler.thirdweb.com/v2/137/..." --site pff3
```

---

## 🔧 SUPABASE EDGE FUNCTIONS

### **STEP 6: Deploy Gasless Mint Function**

1. **Set Environment Variables in Supabase:**

```bash
# Go to Supabase Dashboard → Project Settings → Edge Functions
# Add these secrets:

VIDA_MINTER_PRIVATE_KEY=<deployer_private_key>
VIDA_TOKEN_ADDRESS=0xDc6EFba149b47f6F6d77AC0523c51F204964C12E
NATIONAL_VAULT_ADDRESS=<your_national_vault_address>
SENTINEL_WALLET_ADDRESS=<your_sentinel_wallet_address>
POLYGON_RPC_URL=https://polygon-rpc.com
```

2. **Deploy Edge Function:**

```bash
cd supabase
supabase functions deploy gasless-mint
```

3. **Test Edge Function:**

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/gasless-mint \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+2348012345678", "recipientAddress": "0x..."}'
```

---

## ✅ POST-DEPLOYMENT VERIFICATION

### **Checklist:**

- [ ] PFF Verified SBT deployed and verified on PolygonScan
- [ ] Test SBT minted successfully
- [ ] Shared Account Factory deployed
- [ ] All contract addresses added to `.env.local`
- [ ] All contract addresses added to Netlify environment
- [ ] Paymaster funded with $50 MATIC
- [ ] Paymaster URL added to environment
- [ ] Supabase Edge Function deployed
- [ ] Edge Function environment variables set

---

## 📊 DEPLOYMENT SUMMARY

After completing Phase 1, you should have:

| Component | Status | Address |
|-----------|--------|---------|
| PFF Verified SBT | ✅ Deployed | `0x...` |
| Shared Account Implementation | ✅ Deployed | `0x...` |
| Shared Account Factory | ✅ Deployed | `0x...` |
| Thirdweb Paymaster | ✅ Funded | `$50 MATIC` |
| Supabase Edge Function | ✅ Deployed | `gasless-mint` |

---

## 🆘 TROUBLESHOOTING

### **Error: "Insufficient funds for gas"**
- Fund deployer wallet with more MATIC

### **Error: "Contract already deployed"**
- Check `deployments/` folder for existing deployment
- Use existing address or deploy to different network

### **Error: "PFF_VERIFIED_SBT_ADDRESS not set"**
- Add SBT address to `.env` file
- Restart terminal to reload environment

### **Paymaster not working**
- Verify Paymaster URL is correct
- Check Paymaster balance in Thirdweb dashboard
- Ensure network is Polygon (Chain ID 137)

---

## 📞 SUPPORT

If you encounter issues:
1. Check deployment logs in `deployments/` folder
2. Verify all environment variables are set
3. Test on Mumbai testnet first before mainnet

---

**Next:** [Phase 2 - Mock Data Purge](./PHASE_2_MOCK_DATA_PURGE.md)

