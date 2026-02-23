# 🔧 PFF Protocol - What You Need to Set Up

## ⚡ **Quick Answer**

You only need **ONE thing** to get started:

### **Thirdweb Client ID** (Required)

Everything else is optional or already configured!

---

## 📋 **Step-by-Step Setup**

### **Step 1: Get Thirdweb Client ID** (5 minutes)

This is the **ONLY required step** to make your dashboard work.

#### **1.1 Create Thirdweb Account**
1. Go to https://thirdweb.com/dashboard
2. Sign up (free account)
3. Verify your email

#### **1.2 Create a Project**
1. Click "Create Project"
2. Name it: "PFF Protocol"
3. Click "Create"

#### **1.3 Get Your Client ID**
1. In your project dashboard, find "Client ID"
2. Copy the Client ID (looks like: `abc123def456...`)
3. Save it - you'll need it in the next step

#### **1.4 Enable Required Features**
In your Thirdweb project dashboard:

1. **Enable Embedded Wallets:**
   - Go to "Wallets" tab
   - Enable "Embedded Wallets"
   - Enable "Guest Mode" ✅

2. **Enable Account Abstraction (Optional but Recommended):**
   - Go to "Account Abstraction" tab
   - Enable "Smart Wallets"
   - Enable "Gasless Transactions"
   - Fund your paymaster with a small amount (e.g., $10 worth of MATIC)

---

### **Step 2: Configure Environment Variables** (2 minutes)

#### **2.1 Create `.env.local` file**

```bash
cd web
cp .env.pff.example .env.local
```

#### **2.2 Edit `.env.local`**

Open `.env.local` and add your Thirdweb Client ID:

```bash
# ============================================================================
# REQUIRED - Get from https://thirdweb.com/dashboard
# ============================================================================
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_actual_client_id_here

# ============================================================================
# OPTIONAL - Only needed for gasless transactions
# ============================================================================
# NEXT_PUBLIC_SMART_WALLET_FACTORY=0x...
# NEXT_PUBLIC_PAYMASTER_URL=https://...

# ============================================================================
# ALREADY CONFIGURED - No changes needed
# ============================================================================
NEXT_PUBLIC_VIDA_CAP_TOKEN_ADDRESS=0xc226fFb538b6f80F05d5F0Ee0758E5D85a42DE0C
NEXT_PUBLIC_NGN_VIDA_TOKEN_ADDRESS=0xe814561AdB492f8ff3019194337A17E9cba9fEFd
NEXT_PUBLIC_SENTINEL_VAULT_ADDRESS=0xBaF30D2fe8F8fb41F3053Ce68C4619A283B60211
NEXT_PUBLIC_NATIONAL_TREASURY_ADDRESS=0x4c81E768f4B201bCd7E924f671ABA1B162786b48
NEXT_PUBLIC_FOUNDATION_VAULT_ADDRESS=0xDD8046422Bbeba12FD47DE854639abF7FB6E0858
NEXT_PUBLIC_NATION_ADDRESS=0x4c81E768f4B201bCd7E924f671ABA1B162786b48
NEXT_PUBLIC_CHAIN_ID=137
```

**That's it!** Just replace `your_actual_client_id_here` with your real Client ID.

---

### **Step 3: Install Dependencies** (1 minute)

```bash
cd web
npm install
```

This installs all required packages including:
- `@thirdweb-dev/react`
- `@thirdweb-dev/sdk`
- `ethers`
- `canvas-confetti`

---

### **Step 4: Run the App** (30 seconds)

```bash
npm run dev
```

Visit: **http://localhost:3000/pff-dashboard**

---

## ✅ **What's Already Configured**

You don't need to set these up - they're already done:

### **Smart Contract Addresses** ✅
- VIDA CAP Token: `0xDc6EFba149b47f6F6d77AC0523c51F204964C12E`
- ngnVIDA Token: `0x5dD456B88f2be6688E7A04f78471A3868bd06811`
- FoundationVault: `0xD42C5b854319e43e2F9e2c387b13b84D1dF542E0`
- NationalTreasury: `0x5E8474D3BaaF27A4531F34f6fA8c9E237ce1ebb4`

### **Network Configuration** ✅
- Polygon Mainnet (Chain ID: 137)
- RPC URL (Thirdweb provides default)

### **Contract ABIs** ✅
- All ABIs configured in `web/lib/pff/contracts.ts`
- Includes: balanceOf, vitalize, swapVidaToNgn, approve, etc.

### **Components** ✅
- PFFThirdwebProvider
- NationalPortfolio
- ClaimWealthButton
- ConvertToNairaButton
- PFFDashboard

### **Hooks** ✅
- usePFFSovereign
- usePFFBalances

---

## 🔐 **Optional: Enable Gasless Transactions**

If you want **truly gasless** transactions (recommended):

### **Option A: Use Thirdweb's Paymaster** (Easiest)

1. In Thirdweb dashboard, go to "Account Abstraction"
2. Enable "Gasless Transactions"
3. Add funds to your paymaster (e.g., $10 worth of MATIC)
4. Copy the Paymaster URL
5. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_PAYMASTER_URL=https://your-paymaster-url
   ```

### **Option B: Deploy Your Own Paymaster** (Advanced)

1. Deploy an ERC-4337 paymaster contract
2. Fund it with MATIC
3. Use your paymaster URL

### **Option C: Skip Gasless** (Users Pay Gas)

If you skip this, users will need:
- MATIC in their wallet for gas fees
- MetaMask or similar wallet

---

## 🧪 **Testing Your Setup**

### **Test 1: Basic Connection**
```bash
npm run dev
# Visit http://localhost:3000/pff-dashboard
# ✅ Page should load without errors
```

### **Test 2: Wallet Creation**
```
1. Click "Enter Protocol" button
2. ✅ Wallet should auto-create (no signup!)
3. ✅ Address should appear in dashboard
```

### **Test 3: Balance Display**
```
1. National Portfolio should display
2. ✅ VIDA CAP balance shows (formatted)
3. ✅ ngnVIDA balance shows (formatted)
```

### **Test 4: Transactions**
```
1. Click "Claim Wealth"
2. ✅ If gasless enabled: No MetaMask popup
3. ✅ If gasless disabled: MetaMask asks for approval
4. ✅ Transaction completes
5. ✅ Balances update
```

---

## 🐛 **Troubleshooting**

### **Issue: "Client ID not found"**
**Solution:** 
```bash
# Check .env.local exists
ls -la .env.local

# Check Client ID is set
cat .env.local | grep THIRDWEB_CLIENT_ID

# Make sure it starts with NEXT_PUBLIC_
# Restart dev server after changing .env.local
```

### **Issue: "Wallet not connecting"**
**Solution:**
1. Check Thirdweb dashboard - is "Embedded Wallets" enabled?
2. Check browser console (F12) for errors
3. Try clearing browser cache
4. Try incognito/private mode

### **Issue: "Balances showing 0.00"**
**Solution:**
1. Check wallet has been vitalized (claimed citizenship)
2. Check contracts are deployed on Polygon Mainnet
3. Check contract addresses are correct
4. Try clicking refresh button

### **Issue: "Transaction failing"**
**Solution:**
1. If gasless enabled: Check paymaster has funds
2. If gasless disabled: Check wallet has MATIC for gas
3. Check contract functions exist (use PolygonScan)
4. Check browser console for error messages

---

## 📊 **What You'll Spend**

### **Free Tier (Recommended for Testing)**
- Thirdweb account: **FREE**
- Embedded Wallets: **FREE** (up to 1,000 wallets/month)
- Development: **FREE**

### **Production (When You Launch)**
- Thirdweb Pro: **$99/month** (for unlimited wallets)
- Paymaster funding: **~$10-50/month** (depends on transaction volume)
- Total: **~$100-150/month**

### **Alternative: No Gasless**
- Thirdweb account: **FREE**
- Users pay their own gas: **$0 for you**
- Total: **FREE** (but worse UX for users)

---

## 🚀 **Quick Start Checklist**

- [ ] Create Thirdweb account
- [ ] Create project
- [ ] Get Client ID
- [ ] Enable Embedded Wallets (Guest Mode)
- [ ] Copy `.env.pff.example` to `.env.local`
- [ ] Add Client ID to `.env.local`
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Visit `/pff-dashboard`
- [ ] Test wallet creation
- [ ] Test balance display

**Optional (for gasless):**
- [ ] Enable Account Abstraction in Thirdweb
- [ ] Fund paymaster
- [ ] Add paymaster URL to `.env.local`

---

## 📞 **Need Help?**

### **Thirdweb Support**
- Docs: https://portal.thirdweb.com/
- Discord: https://discord.gg/thirdweb
- Support: https://thirdweb.com/support

### **PFF Protocol Docs**
- Integration Guide: `web/PFF_INTEGRATION_GUIDE.md`
- Quick Reference: `web/PFF_QUICK_REFERENCE.md`
- Testing Guide: `web/PFF_TESTING_GUIDE.md`

---

## ⏱️ **Total Setup Time**

- **Minimum (no gasless):** ~10 minutes
- **Recommended (with gasless):** ~20 minutes
- **First time (reading docs):** ~30 minutes

---

## 🎉 **You're Ready!**

Once you have your Thirdweb Client ID in `.env.local`, everything works!

```bash
npm run dev
# Visit http://localhost:3000/pff-dashboard
```

**That's it!** 🚀

