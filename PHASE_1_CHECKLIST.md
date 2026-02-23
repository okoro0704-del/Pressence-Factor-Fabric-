# ✅ PHASE 1 DEPLOYMENT CHECKLIST
## PFF Protocol - Smart Contracts & Infrastructure Activation

**Target:** Deploy all contracts and activate gasless infrastructure  
**Timeline:** Week 1  
**Status:** IN PROGRESS

---

## 📋 PRE-DEPLOYMENT

### **Environment Setup**
- [ ] Create `.env` file in project root
- [ ] Add `PRIVATE_KEY` (deployer wallet)
- [ ] Add `POLYGON_RPC_URL`
- [ ] Add `POLYGONSCAN_API_KEY` (for verification)
- [ ] Add `SENTINEL_WEBHOOK_URL`

### **Wallet Funding**
- [ ] Fund deployer wallet with 5 MATIC (Polygon Mainnet)
- [ ] OR get testnet MATIC from faucet (Mumbai Testnet)

### **Dependencies**
- [ ] Run `cd contracts && npm install`
- [ ] Verify Hardhat is installed
- [ ] Test compilation: `npx hardhat compile`

---

## 🎯 SMART CONTRACT DEPLOYMENT

### **1.1: PFF Verified SBT**
- [ ] Deploy to testnet: `npx hardhat run scripts/deploy-pff-verified-sbt.ts --network mumbai`
- [ ] Test minting: `npx hardhat run scripts/mint-test-sbt.ts --network mumbai`
- [ ] Deploy to mainnet: `npx hardhat run scripts/deploy-pff-verified-sbt.ts --network polygon`
- [ ] Verify on PolygonScan: `npx hardhat verify --network polygon <ADDRESS>`
- [ ] Copy contract address
- [ ] Add to `web/.env.local`: `NEXT_PUBLIC_PFF_VERIFIED_SBT_ADDRESS=0x...`
- [ ] Add to Netlify: `netlify env:set NEXT_PUBLIC_PFF_VERIFIED_SBT_ADDRESS 0x... --site pff3`

### **1.2: Shared Account Factory**
- [ ] Ensure SBT address is set in `.env`
- [ ] Deploy to testnet: `npx hardhat run scripts/deploy-shared-account-factory.ts --network mumbai`
- [ ] Deploy to mainnet: `npx hardhat run scripts/deploy-shared-account-factory.ts --network polygon`
- [ ] Verify contracts on PolygonScan
- [ ] Copy both addresses (Implementation + Factory)
- [ ] Add to `web/.env.local`:
  - `NEXT_PUBLIC_SHARED_ACCOUNT_IMPLEMENTATION_ADDRESS=0x...`
  - `NEXT_PUBLIC_SHARED_ACCOUNT_FACTORY_ADDRESS=0x...`
- [ ] Add to Netlify environment variables

### **1.3: Master Deployment (Optional - All at Once)**
- [ ] Run: `npx hardhat run scripts/deploy-all-phase1.ts --network polygon`
- [ ] Copy environment variables from `deployments/phase1-137.env`
- [ ] Add all variables to `web/.env.local`
- [ ] Add all variables to Netlify

---

## 💳 THIRDWEB PAYMASTER

### **1.4: Paymaster Setup**
- [ ] Create Thirdweb account at https://thirdweb.com/dashboard
- [ ] Get Client ID from Settings → API Keys
- [ ] Add to `.env.local`: `NEXT_PUBLIC_THIRDWEB_CLIENT_ID=...`
- [ ] Navigate to Account Abstraction → Paymasters
- [ ] Select Polygon network (Chain ID 137)
- [ ] Fund Paymaster with $50 MATIC
- [ ] Copy Paymaster URL
- [ ] Add to `.env.local`: `NEXT_PUBLIC_PAYMASTER_URL=https://polygon.bundler.thirdweb.com/v2/137/...`
- [ ] Add to Netlify: `netlify env:set NEXT_PUBLIC_PAYMASTER_URL "..." --site pff3`
- [ ] Test gasless transaction

**Reference:** See `PAYMASTER_SETUP_GUIDE.md`

---

## 🔧 SUPABASE EDGE FUNCTIONS

### **1.5: Edge Functions Deployment**
- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Login: `supabase login`
- [ ] Link project: `supabase link --project-ref YOUR_REF`
- [ ] Set secrets:
  - [ ] `supabase secrets set VIDA_MINTER_PRIVATE_KEY=...`
  - [ ] `supabase secrets set VIDA_TOKEN_ADDRESS=0xDc6EFba149b47f6F6d77AC0523c51F204964C12E`
  - [ ] `supabase secrets set NATIONAL_VAULT_ADDRESS=...`
  - [ ] `supabase secrets set SENTINEL_WALLET_ADDRESS=...`
  - [ ] `supabase secrets set POLYGON_RPC_URL=https://polygon-rpc.com`
- [ ] Deploy gasless-mint: `supabase functions deploy gasless-mint`
- [ ] Deploy relayer-gas: `supabase functions deploy relayer-gas`
- [ ] Test gasless-mint with curl
- [ ] Test relayer-gas with curl
- [ ] Monitor function logs

**Reference:** See `SUPABASE_EDGE_FUNCTIONS_GUIDE.md`

---

## 🌐 ENVIRONMENT VARIABLES UPDATE

### **1.6: Update All Environment Files**

#### **Local Development (`web/.env.local`)**
```bash
# Thirdweb
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=592694ecd2c638f524f961cfd7ab5956
NEXT_PUBLIC_PAYMASTER_URL=https://polygon.bundler.thirdweb.com/v2/137/...

# Smart Contracts
NEXT_PUBLIC_PFF_VERIFIED_SBT_ADDRESS=0x...
NEXT_PUBLIC_SHARED_ACCOUNT_IMPLEMENTATION_ADDRESS=0x...
NEXT_PUBLIC_SHARED_ACCOUNT_FACTORY_ADDRESS=0x...

# Existing PFF Contracts (already set)
NEXT_PUBLIC_FOUNDATION_VAULT_ADDRESS=0xD42C5b854319e43e2F9e2c387b13b84D1dF542E0
NEXT_PUBLIC_NATIONAL_TREASURY_ADDRESS=0x5E8474D3BaaF27A4531F34f6fA8c9E237ce1ebb4
NEXT_PUBLIC_VIDA_CAP_TOKEN_ADDRESS=0xDc6EFba149b47f6F6d77AC0523c51F204964C12E
NEXT_PUBLIC_NGN_VIDA_TOKEN_ADDRESS=0x5dD456B88f2be6688E7A04f78471A3868bd06811
```

#### **Netlify Production**
- [ ] Add all variables via Netlify UI or CLI
- [ ] Verify variables are set: `netlify env:list --site pff3`

---

## ✅ POST-DEPLOYMENT VERIFICATION

### **Testing**
- [ ] Start dev server: `cd web && npm run dev`
- [ ] Visit http://localhost:3000/welcome
- [ ] Test biometric capture (Step 1)
- [ ] Test SBT minting (should be gasless)
- [ ] Test Sentinel linking (Step 2)
- [ ] Test VIDA distribution (Step 3)
- [ ] Check Thirdweb Dashboard for paymaster usage
- [ ] Check Supabase Edge Function logs

### **Contract Verification**
- [ ] All contracts verified on PolygonScan
- [ ] Contract source code visible
- [ ] Read/Write functions accessible

### **Documentation**
- [ ] Save deployment addresses to `deployments/` folder
- [ ] Update README with new contract addresses
- [ ] Document any issues encountered

---

## 📊 DEPLOYMENT SUMMARY

After completing Phase 1, you should have:

| Component | Status | Value |
|-----------|--------|-------|
| PFF Verified SBT | ✅ Deployed | `0x...` |
| Shared Account Implementation | ✅ Deployed | `0x...` |
| Shared Account Factory | ✅ Deployed | `0x...` |
| Thirdweb Client ID | ✅ Configured | `592694...` |
| Paymaster Balance | ✅ Funded | `$50 MATIC` |
| Paymaster URL | ✅ Set | `https://...` |
| Edge Function: gasless-mint | ✅ Deployed | Live |
| Edge Function: relayer-gas | ✅ Deployed | Live |

---

## 🚨 CRITICAL BLOCKERS RESOLVED

After Phase 1 completion:

- ✅ **Paymaster Funded** - Gasless transactions enabled
- ✅ **SBT Contract Deployed** - KYC verification functional
- ✅ **Edge Functions Live** - Backend minting operational
- ✅ **Environment Variables Set** - All placeholders replaced

**Vitalization Score:** **85/100** (up from 65/100)

---

## 📞 TROUBLESHOOTING

### **Deployment Failed**
- Check deployer wallet has MATIC
- Verify RPC URL is correct
- Try increasing gas price in `hardhat.config.js`

### **Paymaster Not Working**
- Verify Paymaster URL is correct
- Check Paymaster balance in Thirdweb Dashboard
- Ensure network is Polygon (Chain ID 137)

### **Edge Function Errors**
- Check function logs: `supabase functions logs gasless-mint`
- Verify all secrets are set
- Ensure minter wallet has MATIC

---

## 🎯 NEXT STEPS

After Phase 1 completion:

1. **Phase 2:** Mock Data Purge (Week 2)
2. **Phase 3:** Sentinel Brain Activation (Week 3)
3. **Phase 4:** Production Hardening (Week 4)

---

**Status:** 🚀 READY TO EXECUTE  
**Estimated Time:** 2-3 hours  
**Cost:** ~$55 ($5 deployment gas + $50 Paymaster)

