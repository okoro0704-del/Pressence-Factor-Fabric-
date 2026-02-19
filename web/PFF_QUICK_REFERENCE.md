# 🎯 PFF Protocol - Quick Reference Card

## 📦 **Import Statements**

```tsx
// Main hook (recommended)
import { usePFFSovereign } from "@/lib/pff/hooks/usePFFSovereign";

// Balance-only hook
import { usePFFBalances } from "@/lib/pff/hooks/usePFFBalances";

// Components
import { PFFThirdwebProvider } from "@/components/pff/PFFThirdwebProvider";
import { SovereignDashboard } from "@/components/pff/SovereignDashboard";
import { ClaimWealthButton } from "@/components/pff/ClaimWealthButton";
import { ConvertToNairaButton } from "@/components/pff/ConvertToNairaButton";
import { PFFProtocolPage } from "@/components/pff/PFFProtocolPage";

// Contract config
import { PFF_CONTRACTS, EXCHANGE_RATES } from "@/lib/pff/contracts";
```

---

## 🪝 **usePFFSovereign Hook**

### **Complete Example**

```tsx
const {
  // Formatted balances (e.g., "1,345,450.00")
  vidaCapBalance,      // Total VIDA CAP
  vidaCapSpendable,    // Spendable (liquid)
  vidaCapLocked,       // Locked (collateral)
  ngnVidaBalance,      // Nigerian VIDA
  
  // Raw balances (BigInt for calculations)
  vidaCapBalanceRaw,
  ngnVidaBalanceRaw,
  
  // Loading states
  isLoadingBalances,
  isClaimingCitizenship,
  isExecutingSwap,
  
  // Actions
  claimCitizenship,    // (nationAddress: string) => Promise<void>
  executeSwap,         // (amount: string) => Promise<void>
  refreshBalances,     // () => void
  
  // Errors
  error,               // string | null
  clearError,          // () => void
} = usePFFSovereign();
```

---

## 🎬 **Action Functions**

### **1. Claim Citizenship (Vitalize)**

```tsx
// Claim 11 VIDA CAP distribution
await claimCitizenship("0x5E8474D3BaaF27A4531F34f6fA8c9E237ce1ebb4");

// Distribution:
// - 5 VIDA CAP to citizen (1 spendable + 4 locked)
// - 5 VIDA CAP to nation (1 spendable + 4 locked)
// - ~0.1 VIDA CAP to sentinel ($100 USD)
// - ~0.9 VIDA CAP to foundation (hardlocked)
```

### **2. Execute Swap (VIDA → ngnVIDA)**

```tsx
// Swap 100 VIDA CAP to ngnVIDA
await executeSwap("100");

// Automatically handles:
// 1. Approve VIDA CAP for NationalTreasury
// 2. Execute swap
// 3. Refresh balances

// Exchange rate: 1 VIDA = 1,345,450 ngnVIDA
```

### **3. Refresh Balances**

```tsx
// Manually refresh balances
refreshBalances();

// Auto-refreshes after:
// - claimCitizenship() success
// - executeSwap() success
```

---

## 📊 **Contract Addresses**

```tsx
import { PFF_CONTRACTS } from "@/lib/pff/contracts";

PFF_CONTRACTS.FOUNDATION_VAULT    // 0xD42C5b854319e43e2F9e2c387b13b84D1dF542E0
PFF_CONTRACTS.NATIONAL_TREASURY   // 0x5E8474D3BaaF27A4531F34f6fA8c9E237ce1ebb4
PFF_CONTRACTS.VIDA_CAP_TOKEN      // 0xDc6EFba149b47f6F6d77AC0523c51F204964C12E
PFF_CONTRACTS.NGN_VIDA_TOKEN      // 0x5dD456B88f2be6688E7A04f78471A3868bd06811
```

---

## 💱 **Exchange Rates**

```tsx
import { EXCHANGE_RATES } from "@/lib/pff/contracts";

EXCHANGE_RATES.VIDA_TO_NGN  // 1,345,450 (1 VIDA = 1,345,450 ngnVIDA)
EXCHANGE_RATES.NGN_TO_VIDA  // 0.00000074... (1 ngnVIDA = 0.00000074 VIDA)
```

---

## 🎨 **Design Tokens**

```tsx
// Colors
const colors = {
  midnightBlue: "#0a1628",
  deepBlue: "#1a2942",
  brushedGold: "#d4af37",
  brightGold: "#f0c952",
  pureGold: "#ffd700",
};

// Typography
const typography = {
  heading: "uppercase, letter-spacing: 0.05em",
  body: "rgba(255, 255, 255, 0.8)",
};
```

---

## 🔧 **Environment Variables**

```bash
# Required
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id

# Optional (Thirdweb provides defaults)
NEXT_PUBLIC_SMART_WALLET_FACTORY=0x...
NEXT_PUBLIC_PAYMASTER_URL=https://...

# Contract addresses (already configured)
NEXT_PUBLIC_FOUNDATION_VAULT_ADDRESS=0xD42C5b854319e43e2F9e2c387b13b84D1dF542E0
NEXT_PUBLIC_NATIONAL_TREASURY_ADDRESS=0x5E8474D3BaaF27A4531F34f6fA8c9E237ce1ebb4
NEXT_PUBLIC_VIDA_CAP_TOKEN_ADDRESS=0xDc6EFba149b47f6F6d77AC0523c51F204964C12E
NEXT_PUBLIC_NGN_VIDA_TOKEN_ADDRESS=0x5dD456B88f2be6688E7A04f78471A3868bd06811
NEXT_PUBLIC_NATION_ADDRESS=0x5E8474D3BaaF27A4531F34f6fA8c9E237ce1ebb4
```

---

## 🚀 **Quick Start Commands**

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.pff.example .env.local

# Edit .env.local with your Thirdweb Client ID

# Run development server
npm run dev

# Visit the page
# http://localhost:3000/pff-protocol
```

---

## 📱 **Component Usage**

### **Full Page**

```tsx
import { PFFThirdwebProvider } from "@/components/pff/PFFThirdwebProvider";
import { PFFProtocolPage } from "@/components/pff/PFFProtocolPage";

export default function Page() {
  return (
    <PFFThirdwebProvider>
      <PFFProtocolPage />
    </PFFThirdwebProvider>
  );
}
```

### **Custom Implementation**

```tsx
import { PFFThirdwebProvider } from "@/components/pff/PFFThirdwebProvider";
import { usePFFSovereign } from "@/lib/pff/hooks/usePFFSovereign";

function MyCustomDashboard() {
  const { 
    vidaCapBalance, 
    ngnVidaBalance, 
    claimCitizenship,
    executeSwap 
  } = usePFFSovereign();

  return (
    <div>
      <h1>My Balances</h1>
      <p>VIDA CAP: {vidaCapBalance}</p>
      <p>ngnVIDA: ₦{ngnVidaBalance}</p>
      
      <button onClick={() => claimCitizenship("0x5E8...")}>
        Claim Wealth
      </button>
      
      <button onClick={() => executeSwap("100")}>
        Swap 100 VIDA
      </button>
    </div>
  );
}

export default function Page() {
  return (
    <PFFThirdwebProvider>
      <MyCustomDashboard />
    </PFFThirdwebProvider>
  );
}
```

---

## ⚡ **Key Features**

| Feature | Status | Description |
|---------|--------|-------------|
| **Invisible Wallet** | ✅ | Auto-created in browser, no signup |
| **Gasless Transactions** | ✅ | Account Abstraction (ERC-4337) |
| **Real-Time Balances** | ✅ | Live data from blockchain |
| **Auto-Formatting** | ✅ | Divides uint256 by 10^18 |
| **Dual-Vault System** | ✅ | Spendable + Locked balances |
| **Imperial Design** | ✅ | Midnight Blue + Brushed Gold |
| **Confetti Animation** | ✅ | On successful vitalization |
| **Error Handling** | ✅ | Comprehensive try-catch blocks |

---

## 🐛 **Common Issues**

### **Balances showing 0.00**
```tsx
// Solution: Claim citizenship first
await claimCitizenship("0x5E8474D3BaaF27A4531F34f6fA8c9E237ce1ebb4");
```

### **Transaction failing**
```tsx
// Check error message
const { error } = usePFFSovereign();
console.log(error);

// Clear error
clearError();
```

### **Wallet not connecting**
```tsx
// Verify Thirdweb Client ID is set
console.log(process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID);
```

---

## 📚 **Documentation Links**

- **Component README**: `web/components/pff/README.md`
- **Setup Guide**: `web/PFF_PROTOCOL_SETUP.md`
- **Thirdweb Docs**: https://portal.thirdweb.com/
- **Account Abstraction**: https://portal.thirdweb.com/wallet/smart-wallet

---

**Built with ❤️ for the Prosperous Future Foundation**

