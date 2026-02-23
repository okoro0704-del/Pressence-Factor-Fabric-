# 🚀 EXECUTE PHASE 1 - QUICK START GUIDE
## Deploy PFF Protocol Smart Contracts & Activate Infrastructure

**Time Required:** 2-3 hours  
**Cost:** ~$55 USD ($5 gas + $50 Paymaster)  
**Difficulty:** Intermediate

---

## ⚡ QUICK START (3 COMMANDS)

If you're experienced with blockchain deployment:

```bash
# 1. Deploy all contracts
npx hardhat run scripts/deploy-all-phase1.ts --network polygon

# 2. Copy environment variables
cat deployments/phase1-137.env >> web/.env.local

# 3. Follow Paymaster & Edge Functions guides
```

**Then:** See `PAYMASTER_SETUP_GUIDE.md` and `SUPABASE_EDGE_FUNCTIONS_GUIDE.md`

---

## 📖 DETAILED WALKTHROUGH

### **STEP 1: Prepare Environment (5 minutes)**

1. **Create `.env` file in project root:**

```bash
# Copy example
cp .env.example .env

# Edit .env and add:
PRIVATE_KEY=your_deployer_private_key_here
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGONSCAN_API_KEY=your_polygonscan_api_key
SENTINEL_WEBHOOK_URL=https://pff3.netlify.app/api/sentinel/webhook
```

2. **Fund deployer wallet:**
   - Send 5 MATIC to your deployer address
   - Check balance: https://polygonscan.com/address/YOUR_ADDRESS

3. **Install dependencies:**

```bash
cd contracts
npm install
```

---

### **STEP 2: Deploy Smart Contracts (30 minutes)**

#### **Option A: Deploy All at Once (Recommended)**

```bash
# Deploy all Phase 1 contracts
npx hardhat run scripts/deploy-all-phase1.ts --network polygon
```

**Expected Output:**
```
✅ PFF Verified SBT deployed: 0x...
✅ Shared Account Implementation deployed: 0x...
✅ Shared Account Factory deployed: 0x...
💾 Deployment results saved: deployments/phase1-137.json
💾 Environment variables saved: deployments/phase1-137.env
```

#### **Option B: Deploy One by One**

```bash
# 1. Deploy SBT
npx hardhat run scripts/deploy-pff-verified-sbt.ts --network polygon

# 2. Test SBT minting
npx hardhat run scripts/mint-test-sbt.ts --network polygon

# 3. Deploy Shared Account Factory
npx hardhat run scripts/deploy-shared-account-factory.ts --network polygon
```

---

### **STEP 3: Update Environment Variables (10 minutes)**

1. **Copy deployment addresses:**

```bash
# View deployment results
cat deployments/phase1-137.env
```

2. **Add to `web/.env.local`:**

```bash
# Append to existing .env.local
cat deployments/phase1-137.env >> web/.env.local
```

3. **Add to Netlify:**

```bash
# Set each variable
netlify env:set NEXT_PUBLIC_PFF_VERIFIED_SBT_ADDRESS "0x..." --site pff3
netlify env:set NEXT_PUBLIC_SHARED_ACCOUNT_IMPLEMENTATION_ADDRESS "0x..." --site pff3
netlify env:set NEXT_PUBLIC_SHARED_ACCOUNT_FACTORY_ADDRESS "0x..." --site pff3
```

---

### **STEP 4: Activate Thirdweb Paymaster (15 minutes)**

**Follow:** `PAYMASTER_SETUP_GUIDE.md`

**Quick Steps:**
1. Go to https://thirdweb.com/dashboard
2. Account Abstraction → Paymasters
3. Fund with $50 MATIC
4. Copy Paymaster URL
5. Add to `.env.local` and Netlify

```bash
# Add to web/.env.local
NEXT_PUBLIC_PAYMASTER_URL=https://polygon.bundler.thirdweb.com/v2/137/YOUR_KEY

# Add to Netlify
netlify env:set NEXT_PUBLIC_PAYMASTER_URL "https://polygon.bundler.thirdweb.com/v2/137/YOUR_KEY" --site pff3
```

---

### **STEP 5: Deploy Supabase Edge Functions (20 minutes)**

**Follow:** `SUPABASE_EDGE_FUNCTIONS_GUIDE.md`

**Quick Steps:**

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link project
cd supabase
supabase link --project-ref YOUR_PROJECT_REF

# 4. Set secrets
supabase secrets set VIDA_MINTER_PRIVATE_KEY=your_private_key
supabase secrets set VIDA_TOKEN_ADDRESS=0xDc6EFba149b47f6F6d77AC0523c51F204964C12E
supabase secrets set POLYGON_RPC_URL=https://polygon-rpc.com

# 5. Deploy functions
supabase functions deploy gasless-mint
supabase functions deploy relayer-gas
```

---

### **STEP 6: Test Everything (15 minutes)**

1. **Start development server:**

```bash
cd web
npm run dev
```

2. **Test Welcome Flow:**
   - Visit: http://localhost:3000/welcome
   - Complete Step 1 (Biometric capture)
   - Complete Step 2 (Sentinel linking)
   - Complete Step 3 (VIDA distribution)

3. **Verify Gasless Transactions:**
   - Check Thirdweb Dashboard → Paymasters → Usage
   - Should see transaction count increase
   - Balance should decrease slightly

4. **Check Edge Function Logs:**

```bash
supabase functions logs gasless-mint --tail
```

---

## ✅ SUCCESS CRITERIA

Phase 1 is complete when:

- [ ] All 3 contracts deployed and verified on PolygonScan
- [ ] Environment variables set in `.env.local` and Netlify
- [ ] Paymaster funded with $50 MATIC
- [ ] Paymaster URL configured
- [ ] Edge functions deployed and responding
- [ ] Test SBT minted successfully (gasless)
- [ ] Welcome flow works end-to-end

---

## 📊 DEPLOYMENT CHECKLIST

Use `PHASE_1_CHECKLIST.md` for detailed tracking.

**Quick Check:**
```bash
# Verify all environment variables are set
grep "NEXT_PUBLIC_PFF_VERIFIED_SBT_ADDRESS" web/.env.local
grep "NEXT_PUBLIC_PAYMASTER_URL" web/.env.local

# Check Netlify variables
netlify env:list --site pff3 | grep PFF_VERIFIED_SBT
```

---

## 🚨 TROUBLESHOOTING

### **"Insufficient funds for gas"**
- Fund deployer wallet with more MATIC

### **"PFF_VERIFIED_SBT_ADDRESS not set"**
- Copy address from deployment output
- Add to `.env` file
- Restart terminal

### **"Paymaster rejected transaction"**
- Check Paymaster balance
- Verify Paymaster URL is correct
- Ensure network is Polygon (Chain ID 137)

### **"Edge function not found"**
- Redeploy: `supabase functions deploy gasless-mint`
- Check project is linked: `supabase projects list`

---

## 📞 NEED HELP?

**Documentation:**
- Full Guide: `PHASE_1_DEPLOYMENT_GUIDE.md`
- Paymaster: `PAYMASTER_SETUP_GUIDE.md`
- Edge Functions: `SUPABASE_EDGE_FUNCTIONS_GUIDE.md`
- Checklist: `PHASE_1_CHECKLIST.md`

**Support:**
- Thirdweb Discord: https://discord.gg/thirdweb
- Supabase Discord: https://discord.supabase.com

---

## 🎯 WHAT'S NEXT?

After Phase 1:

1. **Phase 2:** Mock Data Purge (Week 2)
2. **Phase 3:** Sentinel Brain Activation (Week 3)
3. **Phase 4:** Production Hardening (Week 4)

**Vitalization Progress:** 65% → 85% ✅

---

**Status:** 🚀 READY TO EXECUTE  
**Start Time:** [Record when you begin]  
**Completion Time:** [Record when finished]

