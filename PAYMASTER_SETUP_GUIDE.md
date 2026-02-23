# 💳 THIRDWEB PAYMASTER SETUP GUIDE
## Enable Gasless Transactions for PFF Protocol

**Purpose:** Allow users to perform blockchain transactions without paying gas fees  
**Cost:** $50 MATIC (covers ~500-1000 transactions)  
**Time:** 10 minutes

---

## 🎯 WHAT IS A PAYMASTER?

A **Paymaster** is a smart contract that pays gas fees on behalf of users, enabling **gasless transactions**. This is critical for PFF Protocol because:

1. **New users don't have MATIC** - They can't pay gas fees
2. **Better UX** - Users don't need to understand gas or buy crypto
3. **Onboarding** - Users can mint SBTs and receive VIDA without any crypto

---

## 📋 PREREQUISITES

- [ ] Thirdweb account (free)
- [ ] Wallet with $50 worth of MATIC
- [ ] PFF contracts deployed (Phase 1 complete)

---

## 🚀 STEP-BY-STEP SETUP

### **STEP 1: Create Thirdweb Account**

1. Go to: https://thirdweb.com/dashboard
2. Click "Sign In"
3. Connect your wallet (MetaMask, WalletConnect, etc.)
4. Complete account setup

---

### **STEP 2: Get Client ID**

1. In Thirdweb Dashboard, click "Settings" → "API Keys"
2. Click "Create API Key"
3. Name it: "PFF Protocol"
4. Copy the **Client ID** (starts with `592694ecd...`)
5. Save it to `.env.local`:

```bash
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=592694ecd2c638f524f961cfd7ab5956
```

---

### **STEP 3: Navigate to Account Abstraction**

1. In Thirdweb Dashboard sidebar, click **"Account Abstraction"**
2. Click **"Paymasters"**
3. Select **"Polygon"** network (Chain ID 137)

---

### **STEP 4: Fund Paymaster**

1. Click **"Add Funds"** button
2. Enter amount: **50 MATIC** (~$50 USD)
3. Confirm transaction in your wallet
4. Wait for confirmation (1-2 minutes)

**Expected Balance:** 50 MATIC

---

### **STEP 5: Copy Paymaster URL**

1. After funding, you'll see **"Paymaster URL"**
2. Click **"Copy"** button
3. URL format: `https://polygon.bundler.thirdweb.com/v2/137/<your-key>`

---

### **STEP 6: Add to Environment Variables**

#### **Local Development (.env.local)**

```bash
# Add to web/.env.local
NEXT_PUBLIC_PAYMASTER_URL=https://polygon.bundler.thirdweb.com/v2/137/YOUR_KEY_HERE
```

#### **Netlify Production**

```bash
# Run this command in terminal
netlify env:set NEXT_PUBLIC_PAYMASTER_URL "https://polygon.bundler.thirdweb.com/v2/137/YOUR_KEY_HERE" --site pff3
```

---

### **STEP 7: Configure Smart Wallet Factory (Optional)**

If you want to use a custom factory:

1. In Thirdweb Dashboard → Account Abstraction → Factories
2. Deploy a new factory or use default
3. Copy factory address
4. Add to `.env.local`:

```bash
NEXT_PUBLIC_SMART_WALLET_FACTORY=0x...
```

**Note:** Thirdweb provides a default factory, so this is optional.

---

## ✅ VERIFICATION

### **Test Gasless Transaction**

1. Start your development server:
```bash
cd web
npm run dev
```

2. Open browser: http://localhost:3000/welcome

3. Try to mint an SBT (should work without MATIC)

4. Check Thirdweb Dashboard → Paymasters → Usage
   - You should see transaction count increase
   - Balance should decrease slightly

---

## 📊 MONITORING PAYMASTER

### **Check Balance**

1. Go to Thirdweb Dashboard → Account Abstraction → Paymasters
2. View current balance
3. Set up alerts when balance is low

### **View Transaction History**

1. Click on your Paymaster
2. View "Recent Transactions"
3. See gas costs per transaction

### **Refill Paymaster**

When balance is low:
1. Click "Add Funds"
2. Send more MATIC
3. Recommended: Keep at least 10 MATIC balance

---

## 💰 COST ESTIMATION

| Transaction Type | Gas Cost (MATIC) | Transactions per $50 |
|------------------|------------------|----------------------|
| Mint SBT | ~0.05 MATIC | ~1000 |
| Transfer VIDA | ~0.03 MATIC | ~1666 |
| Create Shared Account | ~0.10 MATIC | ~500 |

**Average:** $50 covers approximately **500-1000 transactions**

---

## 🔧 TROUBLESHOOTING

### **Error: "Paymaster URL not set"**

**Solution:**
- Verify `NEXT_PUBLIC_PAYMASTER_URL` is in `.env.local`
- Restart development server
- Check Netlify environment variables

### **Error: "Insufficient paymaster balance"**

**Solution:**
- Check Paymaster balance in Thirdweb Dashboard
- Add more funds (minimum 5 MATIC)

### **Error: "Paymaster rejected transaction"**

**Solution:**
- Verify network is Polygon (Chain ID 137)
- Check Paymaster is configured for Polygon
- Ensure transaction is valid

### **Transactions still require gas**

**Solution:**
- Verify `gasless: true` in `PFFThirdwebProvider.tsx`
- Check Paymaster URL is correct
- Ensure Smart Wallet is being used (not regular wallet)

---

## 🎯 PRODUCTION CHECKLIST

Before going live:

- [ ] Paymaster funded with at least $50 MATIC
- [ ] Paymaster URL added to Netlify environment
- [ ] Test gasless SBT minting works
- [ ] Test gasless VIDA distribution works
- [ ] Set up low-balance alerts
- [ ] Monitor transaction costs daily

---

## 📞 SUPPORT

**Thirdweb Support:**
- Discord: https://discord.gg/thirdweb
- Docs: https://portal.thirdweb.com/account-abstraction

**PFF Protocol:**
- Check deployment logs
- Verify all environment variables
- Test on Mumbai testnet first

---

## 🔗 USEFUL LINKS

- Thirdweb Dashboard: https://thirdweb.com/dashboard
- Account Abstraction Docs: https://portal.thirdweb.com/account-abstraction
- Polygon Gas Tracker: https://polygonscan.com/gastracker
- Buy MATIC: https://www.coinbase.com/price/polygon

---

**Status:** ✅ Ready for deployment  
**Next:** Test gasless transactions on Mumbai testnet

