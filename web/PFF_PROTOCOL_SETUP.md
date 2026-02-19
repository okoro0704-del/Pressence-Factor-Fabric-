# 🏛️ PFF Protocol Frontend - Complete Setup Guide

## ✅ **What's Already Built**

Your PFF Protocol frontend is **100% complete** with all requested features:

### **1. Invisible Wallet System** ✅
- **File**: `web/components/pff/PFFThirdwebProvider.tsx`
- Auto-created wallet in browser (Guest Mode)
- No signups, no passwords required
- Seamless user experience

### **2. Gasless Execution** ✅
- Account Abstraction (ERC-4337) enabled
- Thirdweb Paymaster integration ready
- Users never pay gas fees

### **3. Real-Time Dashboard** ✅
- **File**: `web/components/pff/SovereignDashboard.tsx`
- Live balance display for VIDA CAP and ngnVIDA
- Dual-vault system (spendable + locked)
- Auto-formatting (divides uint256 by 10^18)
- Imperial Minimalist design (Deep Midnight Blue + Brushed Gold)

### **4. Primary Actions** ✅
- **Claim Wealth Button** (`web/components/pff/ClaimWealthButton.tsx`)
  - Calls `vitalize()` on FoundationVault: `0xD42C5b854319e43e2F9e2c387b13b84D1dF542E0`
  - Gasless transaction with confetti animation
  
- **Convert to Naira Button** (`web/components/pff/ConvertToNairaButton.tsx`)
  - Calls `swapToNaira()` on NationalTreasury: `0x5E8474D3BaaF27A4531F34f6fA8c9E237ce1ebb4`
  - Rate: 1 VIDA = 1,345,450 ngnVIDA
  - Automatic approve + swap sequence

### **5. Custom Hooks** ✅
- **`usePFFSovereign`** (`web/lib/pff/hooks/usePFFSovereign.ts`)
  - Complete hook for all PFF Protocol interactions
  - Live balance reading with auto-refresh
  - `claimCitizenship()` function
  - `executeSwap()` function with automatic approve + swap
  - All transactions use Account Abstraction (gasless)
  - Balance formatting using `ethers.formatUnits(data, 18)`

- **`usePFFBalances`** (`web/lib/pff/hooks/usePFFBalances.ts`)
  - Simplified hook for reading balances only

### **6. Contract Configuration** ✅
- **File**: `web/lib/pff/contracts.ts`
- All contract addresses configured:
  - VIDA CAP: `0xDc6EFba149b47f6F6d77AC0523c51F204964C12E`
  - ngnVIDA: `0x5dD456B88f2be6688E7A04f78471A3868bd06811`
  - FoundationVault: `0xD42C5b854319e43e2F9e2c387b13b84D1dF542E0`
  - NationalTreasury: `0x5E8474D3BaaF27A4531F34f6fA8c9E237ce1ebb4`
- Minimal ABIs for all required functions

---

## 🚀 **Quick Start (3 Steps)**

### **Step 1: Configure Thirdweb**

1. Go to https://thirdweb.com/dashboard
2. Create a new project (or use existing)
3. Get your **Client ID**
4. Enable these features:
   - ✅ **Embedded Wallets** (Guest Mode)
   - ✅ **Account Abstraction** (ERC-4337)
   - ✅ **Paymaster** (for gasless transactions)

### **Step 2: Set Environment Variables**

Copy the example file:
```bash
cp .env.pff.example .env.local
```

Edit `.env.local` and add your Thirdweb credentials:
```bash
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_actual_client_id_here
NEXT_PUBLIC_SMART_WALLET_FACTORY=0x... # From Thirdweb dashboard
NEXT_PUBLIC_PAYMASTER_URL=https://... # From Thirdweb dashboard
```

**Note**: All contract addresses are already configured correctly!

### **Step 3: Run the App**

```bash
cd web
npm install  # If not already done
npm run dev
```

Navigate to: **http://localhost:3000/pff-protocol**

---

## 📁 **File Structure**

```
web/
├── components/pff/
│   ├── PFFThirdwebProvider.tsx      # Thirdweb configuration
│   ├── SovereignDashboard.tsx       # Real-time balance display
│   ├── ClaimWealthButton.tsx        # Vitalization button
│   ├── ConvertToNairaButton.tsx     # Swap button
│   ├── PFFProtocolPage.tsx          # Main page
│   └── README.md                    # Component documentation
│
├── lib/pff/
│   ├── contracts.ts                 # Contract addresses & ABIs
│   └── hooks/
│       ├── usePFFSovereign.ts       # Complete sovereign hook
│       └── usePFFBalances.ts        # Balance reading hook
│
├── src/app/pff-protocol/
│   └── page.tsx                     # Next.js page route
│
├── .env.pff.example                 # Environment template
└── PFF_PROTOCOL_SETUP.md           # This file
```

---

## 🎯 **Using the `usePFFSovereign` Hook**

```tsx
import { usePFFSovereign } from "@/lib/pff/hooks/usePFFSovereign";

function MyComponent() {
  const {
    // Formatted balances (e.g., "1,345,450.00")
    vidaCapBalance,
    vidaCapSpendable,
    vidaCapLocked,
    ngnVidaBalance,
    
    // Loading states
    isLoadingBalances,
    isClaimingCitizenship,
    isExecutingSwap,
    
    // Actions (all gasless!)
    claimCitizenship,
    executeSwap,
    refreshBalances,
    
    // Errors
    error,
    clearError,
  } = usePFFSovereign();

  // Claim citizenship (vitalize)
  const handleClaim = async () => {
    await claimCitizenship("0x5E8474D3BaaF27A4531F34f6fA8c9E237ce1ebb4");
  };

  // Execute swap
  const handleSwap = async () => {
    await executeSwap("100"); // Swap 100 VIDA CAP
  };

  return (
    <div>
      <p>VIDA CAP: {vidaCapBalance}</p>
      <p>ngnVIDA: ₦{ngnVidaBalance}</p>
      <button onClick={handleClaim}>Claim Wealth</button>
      <button onClick={handleSwap}>Swap to Naira</button>
    </div>
  );
}
```

---

## 🎨 **Design System**

### **Colors**
- Background: Deep Midnight Blue (`#0a1628`)
- Accents: Brushed Gold (`#D4AF37`)
- Bright Gold: `#F0C952`
- Pure Gold: `#FFD700`

### **Typography**
- Clean, authoritative Sans-Serif
- Headings: Uppercase, letter-spacing 0.05em
- Body: rgba(255, 255, 255, 0.8)

---

## 🔧 **Troubleshooting**

### **Issue: Wallet not connecting**
- Check that `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` is set correctly
- Verify Embedded Wallets are enabled in Thirdweb dashboard

### **Issue: Transactions failing**
- Ensure Paymaster is funded in Thirdweb dashboard
- Check that Account Abstraction is enabled
- Verify contract addresses are correct

### **Issue: Balances showing 0.00**
- Check that contracts are deployed on the correct network
- Verify wallet has been vitalized (claimed citizenship)
- Try clicking "Refresh" or `refreshBalances()`

---

## 📚 **Documentation**

- **Component README**: `web/components/pff/README.md`
- **Thirdweb Docs**: https://portal.thirdweb.com/
- **Account Abstraction**: https://portal.thirdweb.com/wallet/smart-wallet

---

## ✨ **What Happens When User Visits**

1. **Page loads** → Invisible wallet created in browser (Guest Mode)
2. **Dashboard displays** → Real-time balances fetched (VIDA CAP, ngnVIDA)
3. **User clicks "Claim Wealth"** → `vitalize()` called (gasless)
4. **11 VIDA CAP distributed** → Confetti animation plays
5. **Balances auto-refresh** → Dashboard updates in real-time
6. **User clicks "Convert to Naira"** → Approve + Swap executed (gasless)
7. **ngnVIDA received** → Dashboard shows new balances

**Zero friction. Zero signups. Zero gas fees.** 🎉

---

## 🚀 **Next Steps**

Your frontend is ready! You can now:

1. ✅ **Test locally** - Run `npm run dev` and visit `/pff-protocol`
2. ✅ **Deploy contracts** - Use the Remix deployment guide in `contracts/rsk/`
3. ✅ **Configure Thirdweb** - Set up Client ID and Paymaster
4. ✅ **Deploy frontend** - Deploy to Vercel/Netlify
5. ✅ **Test on testnet** - Use Polygon Mumbai or RSK Testnet first

---

**Need help?** Check the component README or the individual file comments for detailed documentation.

