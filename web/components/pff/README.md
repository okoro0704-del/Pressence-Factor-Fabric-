# PFF Protocol Frontend - Zero Friction Sovereign Finance

Complete React implementation for the PFF (Prosperous Future Foundation) Protocol with **invisible wallets**, **gasless transactions**, and **imperial minimalist design**.

---

## 🎯 Features

### 1. **Invisible Wallet System**
- ✅ Auto-created wallet in browser (no signup, no password)
- ✅ Guest mode using Thirdweb Embedded Wallets
- ✅ Seamless user experience - wallet creation is invisible

### 2. **Gasless Execution**
- ✅ Account Abstraction (ERC-4337)
- ✅ Thirdweb Paymaster sponsors all gas fees
- ✅ Users never see gas prompts or need native tokens

### 3. **Real-Time Dashboard**
- ✅ Live balance display for VIDA CAP and ngnVIDA
- ✅ Dual-vault system (spendable + locked balances)
- ✅ Auto-formatting (divides uint256 by 10^18)
- ✅ Imperial Minimalist design (Deep Midnight Blue + Brushed Gold)

### 4. **Primary Actions**
- ✅ **Claim Wealth** - Vitalize citizenship (11 VIDA CAP distribution)
- ✅ **Convert to Naira** - Swap VIDA CAP to ngnVIDA (1:1,345,450 rate)

---

## 📦 Components

### Core Components

#### `PFFThirdwebProvider.tsx`
Configures Thirdweb with embedded wallets and Account Abstraction.

```tsx
import { PFFThirdwebProvider } from "@/components/pff/PFFThirdwebProvider";

<PFFThirdwebProvider>
  <YourApp />
</PFFThirdwebProvider>
```

#### `SovereignDashboard.tsx`
Real-time balance display with imperial minimalist design.

```tsx
import { SovereignDashboard } from "@/components/pff/SovereignDashboard";

<SovereignDashboard />
```

#### `ClaimWealthButton.tsx`
Triggers vitalization (11-unit VIDA CAP distribution).

```tsx
import { ClaimWealthButton } from "@/components/pff/ClaimWealthButton";

<ClaimWealthButton 
  nationAddress="0x5E8474D3BaaF27A4531F34f6fA8c9E237ce1ebb4"
  onSuccess={() => console.log("Claimed!")}
/>
```

#### `ConvertToNairaButton.tsx`
Swaps VIDA CAP to ngnVIDA with automatic approve + swap.

```tsx
import { ConvertToNairaButton } from "@/components/pff/ConvertToNairaButton";

<ConvertToNairaButton 
  onSuccess={() => console.log("Swapped!")}
/>
```

#### `PFFProtocolPage.tsx`
Complete page combining all components.

```tsx
import { PFFProtocolPage } from "@/components/pff/PFFProtocolPage";

<PFFProtocolPage />
```

---

## 🪝 Custom Hooks

### `usePFFSovereign`
Complete hook for all PFF Protocol interactions.

```tsx
import { usePFFSovereign } from "@/lib/pff/hooks/usePFFSovereign";

function MyComponent() {
  const {
    // Balances (formatted)
    vidaCapBalance,
    vidaCapSpendable,
    vidaCapLocked,
    ngnVidaBalance,
    
    // Raw balances (for calculations)
    vidaCapBalanceRaw,
    ngnVidaBalanceRaw,
    
    // Loading states
    isLoadingBalances,
    isClaimingCitizenship,
    isExecutingSwap,
    
    // Actions
    claimCitizenship,
    executeSwap,
    refreshBalances,
    
    // Errors
    error,
    clearError,
  } = usePFFSovereign();

  // Claim citizenship
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
      <p>ngnVIDA: {ngnVidaBalance}</p>
      <button onClick={handleClaim}>Claim Wealth</button>
      <button onClick={handleSwap}>Swap to Naira</button>
    </div>
  );
}
```

### `usePFFBalances`
Simplified hook for reading balances only.

```tsx
import { usePFFBalances } from "@/lib/pff/hooks/usePFFBalances";

const { vidaCap, ngnVida, isLoading, error, refetch } = usePFFBalances();
```

---

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
cd web
npm install @thirdweb-dev/react @thirdweb-dev/sdk
```

### 2. Configure Environment Variables

Create `.env.local`:

```bash
# Thirdweb Configuration
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id_here

# Smart Wallet Factory (Account Abstraction)
NEXT_PUBLIC_SMART_WALLET_FACTORY=0x...

# Paymaster URL (Gasless Transactions)
NEXT_PUBLIC_PAYMASTER_URL=https://...

# PFF Contract Addresses
NEXT_PUBLIC_VIDA_CAP_TOKEN_ADDRESS=0xc226fFb538b6f80F05d5F0Ee0758E5D85a42DE0C
NEXT_PUBLIC_NGN_VIDA_TOKEN_ADDRESS=0xe814561AdB492f8ff3019194337A17E9cba9fEFd
NEXT_PUBLIC_SENTINEL_VAULT_ADDRESS=0xBaF30D2fe8F8fb41F3053Ce68C4619A283B60211
NEXT_PUBLIC_NATIONAL_TREASURY_ADDRESS=0x4c81E768f4B201bCd7E924f671ABA1B162786b48
NEXT_PUBLIC_FOUNDATION_VAULT_ADDRESS=0xDD8046422Bbeba12FD47DE854639abF7FB6E0858
NEXT_PUBLIC_NATION_ADDRESS=0x4c81E768f4B201bCd7E924f671ABA1B162786b48
```

### 3. Get Thirdweb Client ID

1. Go to https://thirdweb.com/dashboard
2. Create a new project
3. Copy your Client ID
4. Enable **Embedded Wallets** and **Account Abstraction**

### 4. Configure Paymaster (Gasless Transactions)

Option A: Use Thirdweb's Paymaster
1. In Thirdweb dashboard, enable "Gasless Transactions"
2. Add funds to your paymaster
3. Copy the paymaster URL

Option B: Deploy Your Own Paymaster
1. Deploy an ERC-4337 paymaster contract
2. Fund it with native tokens (MATIC/RBTC)
3. Use your paymaster URL

### 5. Use in Your App

```tsx
// app/pff-protocol/page.tsx
import { PFFThirdwebProvider } from "@/components/pff/PFFThirdwebProvider";
import { PFFProtocolPage } from "@/components/pff/PFFProtocolPage";

export default function PFFProtocol() {
  return (
    <PFFThirdwebProvider>
      <PFFProtocolPage />
    </PFFThirdwebProvider>
  );
}
```

---

## 🎨 Design System

### Colors

```css
--midnight-blue: #0a1628;
--deep-blue: #1a2942;
--brushed-gold: #d4af37;
--bright-gold: #f0c952;
--pure-gold: #ffd700;
```

### Typography

- **Font Family**: Clean, authoritative Sans-Serif
- **Headings**: Uppercase, letter-spacing 0.05em
- **Body**: rgba(255, 255, 255, 0.8)

### Components

- **Cards**: Rounded 12-16px, subtle borders, hover effects
- **Buttons**: Gradient gold, uppercase, bold
- **Inputs**: Transparent with gold borders

---

## 📊 Contract Addresses

| Contract | Address | Purpose |
|----------|---------|---------|
| **VIDA CAP Token** | `0xc226fFb538b6f80F05d5F0Ee0758E5D85a42DE0C` | ERC20 interface |
| **ngnVIDA Token** | `0xe814561AdB492f8ff3019194337A17E9cba9fEFd` | Nigerian VIDA (1:1 Naira) |
| **Sentinel Vault** | `0xBaF30D2fe8F8fb41F3053Ce68C4619A283B60211` | Security & Access Control |
| **NationalTreasury** | `0x4c81E768f4B201bCd7E924f671ABA1B162786b48` | SAMM, swap operations |
| **FoundationVault** | `0xDD8046422Bbeba12FD47DE854639abF7FB6E0858` | VIDA CAP token, vitalization |

---

## 🚀 Usage Examples

### Example 1: Simple Balance Display

```tsx
import { usePFFSovereign } from "@/lib/pff/hooks/usePFFSovereign";

export function BalanceCard() {
  const { vidaCapBalance, ngnVidaBalance, isLoadingBalances } = usePFFSovereign();

  if (isLoadingBalances) return <div>Loading...</div>;

  return (
    <div>
      <h2>Your Balances</h2>
      <p>VIDA CAP: {vidaCapBalance}</p>
      <p>ngnVIDA: ₦{ngnVidaBalance}</p>
    </div>
  );
}
```

### Example 2: Claim Citizenship Flow

```tsx
import { usePFFSovereign } from "@/lib/pff/hooks/usePFFSovereign";
import confetti from "canvas-confetti";

export function ClaimButton() {
  const { claimCitizenship, isClaimingCitizenship, error } = usePFFSovereign();

  const handleClaim = async () => {
    try {
      await claimCitizenship("0x5E8474D3BaaF27A4531F34f6fA8c9E237ce1ebb4");
      confetti({ particleCount: 150, spread: 70 });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <button onClick={handleClaim} disabled={isClaimingCitizenship}>
      {isClaimingCitizenship ? "Claiming..." : "Claim Wealth"}
    </button>
  );
}
```

### Example 3: Swap with Input

```tsx
import { usePFFSovereign } from "@/lib/pff/hooks/usePFFSovereign";
import { useState } from "react";

export function SwapForm() {
  const { executeSwap, isExecutingSwap, vidaCapSpendable } = usePFFSovereign();
  const [amount, setAmount] = useState("");

  const handleSwap = async () => {
    await executeSwap(amount);
    setAmount("");
  };

  return (
    <div>
      <input 
        type="number" 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
      />
      <p>Available: {vidaCapSpendable} VIDA</p>
      <button onClick={handleSwap} disabled={isExecutingSwap}>
        {isExecutingSwap ? "Swapping..." : "Swap to Naira"}
      </button>
    </div>
  );
}
```

---

## 🔒 Security Features

- ✅ **Account Abstraction** - No private key exposure
- ✅ **Gasless Transactions** - Paymaster sponsors all fees
- ✅ **Dual-Vault System** - Spendable + Locked balances
- ✅ **Auto-formatting** - Prevents uint256 overflow display issues
- ✅ **Error Handling** - Comprehensive try-catch blocks

---

## 📝 License

MIT License - Built for the Prosperous Future Foundation

---

**Need Help?** Check the individual component files for detailed NatSpec comments and usage examples.

