# ⚡ PFF Protocol - 5-Minute Quickstart

Get your PFF Protocol dashboard running in 5 minutes!

---

## 🎯 **What You're Building**

A sovereign financial dashboard with:
- ✅ **Invisible Wallet** - Auto-created, no signup
- ✅ **Live Balances** - VIDA CAP & ngnVIDA from Polygon blockchain
- ✅ **Gasless Transactions** - Users never pay gas fees
- ✅ **Imperial Design** - Deep blue & brushed gold

---

## 🚀 **Quickstart (5 Steps)**

### **Step 1: Get Thirdweb Client ID** (2 minutes)

```
1. Visit: https://thirdweb.com/dashboard
2. Sign up (free)
3. Create project → Name it "PFF Protocol"
4. Copy your Client ID
5. Enable "Embedded Wallets" → Enable "Guest Mode"
```

---

### **Step 2: Configure Environment** (1 minute)

```bash
cd web
cp .env.pff.example .env.local
```

Edit `.env.local` and replace `your_client_id_here` with your actual Client ID:

```bash
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=abc123def456...
```

---

### **Step 3: Verify Setup** (30 seconds)

```bash
node scripts/verify-pff-setup.js
```

This checks if everything is configured correctly.

---

### **Step 4: Install Dependencies** (1 minute)

```bash
npm install
```

---

### **Step 5: Run** (30 seconds)

```bash
npm run dev
```

Visit: **http://localhost:3000/pff-dashboard**

---

## ✅ **What You Should See**

1. **"Enter Protocol" button** - Click it
2. **Wallet auto-creates** - No signup required!
3. **National Portfolio displays** - Shows VIDA CAP & ngnVIDA balances
4. **Action buttons** - "Claim Wealth" and "Convert to Naira"

---

## 🎨 **Features**

| Feature | Status |
|---------|--------|
| Invisible Wallet (Guest Mode) | ✅ |
| Live Blockchain Balances | ✅ |
| 18-Decimal Formatting | ✅ |
| Deep Blue & Gold Design | ✅ |
| Vitalize Button | ✅ |
| Swap Button | ✅ |
| Gasless Transactions | ⚠️ Optional |

---

## 🔐 **Optional: Enable Gasless Transactions**

If you want users to NEVER pay gas fees:

1. In Thirdweb dashboard → "Account Abstraction"
2. Enable "Gasless Transactions"
3. Fund paymaster with ~$10 MATIC
4. Copy Paymaster URL
5. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_PAYMASTER_URL=https://your-paymaster-url
   ```

**If you skip this:** Users will need MATIC for gas (but everything else works!)

---

## 📚 **Next Steps**

### **Test the Dashboard**
```bash
# Visit /pff-dashboard
# Click "Enter Protocol"
# Check balances display
# Try "Claim Wealth" button
# Try "Convert to Naira" button
```

### **Customize**
- Edit `web/components/pff/PFFDashboard.tsx` for layout changes
- Edit `web/components/pff/NationalPortfolio.tsx` for styling
- Edit `web/lib/pff/contracts.ts` for contract addresses

### **Deploy**
```bash
npm run build
# Deploy to Vercel, Netlify, or any hosting platform
```

---

## 🆘 **Troubleshooting**

### **"Client ID not found"**
```bash
# Check .env.local exists
ls -la .env.local

# Check Client ID is set
cat .env.local | grep THIRDWEB_CLIENT_ID

# Restart dev server
npm run dev
```

### **"Wallet not connecting"**
- Check Thirdweb dashboard - is "Embedded Wallets" enabled?
- Check browser console (F12) for errors
- Try incognito mode

### **"Balances showing 0.00"**
- Wallet needs to be vitalized first (click "Claim Wealth")
- Check you're on Polygon Mainnet
- Click refresh button in National Portfolio

---

## 📖 **Full Documentation**

- **Setup Guide:** `web/PFF_SETUP_REQUIRED.md`
- **Integration Guide:** `web/PFF_INTEGRATION_GUIDE.md`
- **Testing Guide:** `web/PFF_TESTING_GUIDE.md`
- **Quick Reference:** `web/PFF_QUICK_REFERENCE.md`

---

## 🎉 **You're Done!**

Your PFF Protocol dashboard is running!

```bash
npm run dev
# Visit http://localhost:3000/pff-dashboard
```

**Zero friction. Zero signups. Zero gas fees.** 🚀

