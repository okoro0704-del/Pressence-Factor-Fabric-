# 🏛️ PFF Protocol Dashboard - Complete Guide

## 📋 **Overview**

The PFF Protocol Dashboard is a **sovereign financial system** with zero friction:
- **No signups** - Wallet auto-created in browser
- **No passwords** - Guest mode authentication
- **No gas fees** - Account Abstraction (ERC-4337)

---

## 🎯 **What's Included**

### **Components**

1. **`PFFThirdwebProvider.tsx`** - Thirdweb configuration
   - Polygon Mainnet
   - Embedded Wallet (Guest Mode)
   - Account Abstraction
   - Paymaster integration

2. **`NationalPortfolio.tsx`** - Live balance display
   - VIDA CAP balance
   - ngnVIDA balance
   - 18-decimal formatting
   - Deep blue & gold styling
   - Auto-refresh

3. **`PFFDashboard.tsx`** - Complete dashboard
   - ConnectButton
   - National Portfolio
   - Action buttons
   - Info sections

4. **`ClaimWealthButton.tsx`** - Vitalization
   - Calls `vitalize()` on FoundationVault
   - Distributes 11 VIDA CAP
   - Gasless transaction
   - Confetti animation

5. **`ConvertToNairaButton.tsx`** - Currency swap
   - Calls `swapVidaToNgn()` on NationalTreasury
   - Handles approve + swap automatically
   - Gasless transactions
   - Exchange rate preview

### **Hooks**

1. **`usePFFSovereign.ts`** - Complete integration hook
   - Contract initialization
   - Live balance reading
   - `claimCitizenship()` function
   - `executeSwap()` function
   - Auto-formatting with 18-decimal divisor

2. **`usePFFBalances.ts`** - Balance reading hook
   - Fetches VIDA CAP balance
   - Fetches ngnVIDA balance
   - Auto-refresh on transactions

### **Configuration**

1. **`contracts.ts`** - Contract addresses & ABIs
   - VIDA CAP: `0xDc6EFba149b47f6F6d77AC0523c51F204964C12E`
   - ngnVIDA: `0x5dD456B88f2be6688E7A04f78471A3868bd06811`
   - FoundationVault: `0xD42C5b854319e43e2F9e2c387b13b84D1dF542E0`
   - NationalTreasury: `0x5E8474D3BaaF27A4531F34f6fA8c9E237ce1ebb4`

---

## 🚀 **Quick Start**

### **1. Verify Setup**
```bash
npm run verify-pff
```

### **2. Run Dashboard**
```bash
npm run pff-dashboard
```

### **3. Visit**
```
http://localhost:3000/pff-dashboard
```

---

## 💻 **Usage Examples**

### **Example 1: Complete Dashboard**
```tsx
import { PFFThirdwebProvider } from "@/components/pff/PFFThirdwebProvider";
import { PFFDashboard } from "@/components/pff/PFFDashboard";

export default function Page() {
  return (
    <PFFThirdwebProvider>
      <PFFDashboard />
    </PFFThirdwebProvider>
  );
}
```

### **Example 2: Custom Layout**
```tsx
import { PFFThirdwebProvider } from "@/components/pff/PFFThirdwebProvider";
import { NationalPortfolio } from "@/components/pff/NationalPortfolio";
import { ClaimWealthButton } from "@/components/pff/ClaimWealthButton";
import { ConnectWallet } from "@thirdweb-dev/react";

export default function CustomPage() {
  return (
    <PFFThirdwebProvider>
      <div className="my-layout">
        <ConnectWallet btnTitle="Connect" />
        <NationalPortfolio />
        <ClaimWealthButton nationAddress="0x5E8..." />
      </div>
    </PFFThirdwebProvider>
  );
}
```

### **Example 3: Using the Hook**
```tsx
import { usePFFSovereign } from "@/lib/pff/hooks/usePFFSovereign";

function MyComponent() {
  const {
    vidaCapBalance,      // "1,345,450.00"
    ngnVidaBalance,      // "0.00"
    claimCitizenship,    // Function
    executeSwap,         // Function
    isLoadingBalances,   // Boolean
    error,               // String | null
  } = usePFFSovereign();

  const handleClaim = async () => {
    await claimCitizenship("0x5E8474D3BaaF27A4531F34f6fA8c9E237ce1ebb4");
  };

  const handleSwap = async () => {
    await executeSwap("100"); // Swap 100 VIDA CAP
  };

  return (
    <div>
      <p>VIDA CAP: {vidaCapBalance}</p>
      <p>ngnVIDA: ₦{ngnVidaBalance}</p>
      <button onClick={handleClaim}>Claim</button>
      <button onClick={handleSwap}>Swap</button>
    </div>
  );
}
```

---

## 🎨 **Styling**

All components use the **Imperial Minimalist** design system:

```css
/* Colors */
--midnight-blue: #0a1628;
--deep-blue: #1a2942;
--brushed-gold: #d4af37;

/* Typography */
font-family: sans-serif;
text-transform: uppercase;
letter-spacing: 0.05em;

/* Backgrounds */
background: linear-gradient(135deg, #0a1628 0%, #1a2942 100%);

/* Borders */
border: 2px solid rgba(212, 175, 55, 0.3);
```

---

## 🔗 **Smart Contract Functions**

### **FoundationVault (0xD42C...2E0)**

**Read:**
- `balanceOf(address)` → uint256
- `getVaultBalances(address)` → (spendable, locked, total)

**Write (Gasless):**
- `vitalize(address citizen, address nation)` → Distributes 11 VIDA CAP

### **NationalTreasury (0x5E84...bF4)**

**Read:**
- `calculateNgnVidaAmount(uint256)` → uint256

**Write (Gasless):**
- `swapVidaToNgn(uint256)` → uint256

### **VIDA CAP Token (0xDc6E...12E)**

**Read:**
- `balanceOf(address)` → uint256

**Write (Gasless):**
- `approve(address spender, uint256 amount)` → bool

### **ngnVIDA Token (0x5dD4...811)**

**Read:**
- `balanceOf(address)` → uint256

---

## ⚡ **Gasless Transactions**

All transactions use **Account Abstraction (ERC-4337)**:

1. User clicks button
2. Smart Wallet prepares transaction
3. Paymaster sponsors gas
4. Transaction executes
5. User pays nothing!

**Configuration:**
```tsx
smartWallet({
  factoryAddress: SMART_WALLET_FACTORY,
  gasless: true,
})
```

---

## 🧪 **Testing**

### **Test 1: Wallet Connection**
```
1. Visit /pff-dashboard
2. Click "Enter Protocol"
3. ✅ Wallet auto-creates
4. ✅ Address appears
```

### **Test 2: Balance Display**
```
1. National Portfolio displays
2. ✅ VIDA CAP shows formatted balance
3. ✅ ngnVIDA shows formatted balance
4. ✅ No raw uint256 values
```

### **Test 3: Vitalization**
```
1. Click "Claim Wealth"
2. ✅ No gas prompt (if gasless enabled)
3. ✅ Transaction processes
4. ✅ 11 VIDA CAP distributed
5. ✅ Balances auto-refresh
```

### **Test 4: Swap**
```
1. Enter amount
2. ✅ Preview shows exchange rate
3. Click "Convert to Naira"
4. ✅ Approve + Swap execute
5. ✅ Balances update
```

---

## 📚 **Documentation**

- **Quickstart:** `web/PFF_QUICKSTART.md`
- **Setup Guide:** `web/PFF_SETUP_REQUIRED.md`
- **Integration Guide:** `web/PFF_INTEGRATION_GUIDE.md`
- **Testing Guide:** `web/PFF_TESTING_GUIDE.md`
- **Quick Reference:** `web/PFF_QUICK_REFERENCE.md`

---

## 🎉 **You're Ready!**

Everything is configured and ready to use:

```bash
npm run pff-dashboard
```

**Zero friction. Zero signups. Zero gas fees.** 🚀

