# 🏅 Sovereign Verified Badge Component

## Overview

The `SovereignVerifiedBadge` component checks if a user owns the PFF Verified SBT (Soul-Bound Token) and displays the appropriate UI:

- ✅ **If user owns the SBT**: Display a gold "Sovereign Verified" badge
- ❌ **If user doesn't own the SBT**: Show a "Complete KYC" button

---

## Features

- **Automatic SBT Detection**: Uses ERC721 `balanceOf` to check ownership
- **Imperial Minimalist Design**: Gold gradient badge matching PFF Protocol branding
- **Mobile Responsive**: Touch-friendly buttons (44px minimum)
- **Loading States**: Shows spinner while checking verification status
- **Customizable KYC Flow**: Pass custom `onKYCClick` handler

---

## Setup

### 1. Deploy PFF Verified SBT Contract

Deploy an ERC721 Soul-Bound Token (non-transferable) contract on Polygon Mainnet.

**Example Contract Features:**
- ERC721 standard
- Non-transferable (override `transferFrom` to revert)
- Minted to users after KYC completion
- One token per verified user

### 2. Configure Environment Variable

Add the contract address to `web/.env.local`:

```bash
# PFF Verified SBT (Soul-Bound Token) - KYC Verification Badge
NEXT_PUBLIC_PFF_VERIFIED_SBT_ADDRESS=0xYourContractAddressHere
```

### 3. Add to Netlify Environment Variables

For production deployment, add the same variable in Netlify:

1. Go to: https://app.netlify.com/sites/pff3/settings/env
2. Add variable: `NEXT_PUBLIC_PFF_VERIFIED_SBT_ADDRESS`
3. Value: Your deployed SBT contract address

---

## Usage

### Basic Usage

```tsx
import { SovereignVerifiedBadge } from "@/components/pff/SovereignVerifiedBadge";

function MyComponent() {
  return (
    <div>
      <h1>User Profile</h1>
      <SovereignVerifiedBadge />
    </div>
  );
}
```

### With Custom KYC Handler

```tsx
import { SovereignVerifiedBadge } from "@/components/pff/SovereignVerifiedBadge";
import { useRouter } from "next/navigation";

function MyComponent() {
  const router = useRouter();

  const handleKYCClick = () => {
    // Redirect to KYC page
    router.push("/kyc");
    
    // Or open a modal
    // setKYCModalOpen(true);
    
    // Or trigger external KYC flow
    // window.open("https://kyc.pffprotocol.com", "_blank");
  };

  return (
    <div>
      <h1>User Profile</h1>
      <SovereignVerifiedBadge onKYCClick={handleKYCClick} />
    </div>
  );
}
```

---

## Component States

### 1. Loading State
Shows while checking SBT ownership:
```
[Spinner] Checking verification...
```

### 2. Verified State (User owns SBT)
Gold badge with checkmark:
```
[✓] SOVEREIGN VERIFIED
```

### 3. Unverified State (User doesn't own SBT)
Gold button prompting KYC:
```
[!] COMPLETE KYC
```

### 4. No Wallet Connected
Component doesn't render if no wallet is connected.

---

## Integration Example

The badge is already integrated into `SovereignIDDisplay.tsx`:

```tsx
<div className="id-status-row">
  <p className="id-status">Guest Session Active</p>
  <SovereignVerifiedBadge />
</div>
```

This displays the badge next to the user's Sovereign ID on the PFF Dashboard.

---

## Styling

The component uses inline styles with the imperial minimalist design system:

- **Colors**: Deep blue (#0a1628, #1a2942) and gold (#d4af37, #f0c952)
- **Typography**: Uppercase, letter-spacing for emphasis
- **Animations**: Smooth transitions and hover effects
- **Mobile**: Responsive padding and font sizes

---

## SBT Contract Requirements

Your PFF Verified SBT contract must implement:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract PFFVerifiedSBT is ERC721 {
    constructor() ERC721("PFF Verified", "PFFV") {}

    // Mint to verified users (only callable by KYC admin)
    function mint(address to, uint256 tokenId) external onlyAdmin {
        _mint(to, tokenId);
    }

    // Override to make non-transferable (Soul-Bound)
    function transferFrom(address, address, uint256) public pure override {
        revert("PFF Verified SBT: Soul-bound tokens cannot be transferred");
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert("PFF Verified SBT: Soul-bound tokens cannot be transferred");
    }
}
```

---

## Testing

1. **Without SBT**: Visit `/pff-dashboard` - should see "Complete KYC" button
2. **With SBT**: Mint an SBT to your wallet - should see "Sovereign Verified" badge
3. **Click KYC Button**: Should trigger your custom handler or log to console

---

## Troubleshooting

### Badge doesn't appear
- Check that `NEXT_PUBLIC_PFF_VERIFIED_SBT_ADDRESS` is set
- Verify the contract address is correct
- Check browser console for errors

### Always shows "Complete KYC"
- Verify you own the SBT token (check on block explorer)
- Ensure you're connected with the correct wallet
- Check that the SBT contract implements `balanceOf` correctly

### Build errors
- Ensure all imports are correct
- Check that Thirdweb SDK is installed
- Verify TypeScript types are correct

---

## Future Enhancements

- [ ] Add token metadata display (verification date, KYC level)
- [ ] Show verification expiry date
- [ ] Add "Renew KYC" button for expired tokens
- [ ] Display verification tier (Basic, Advanced, Premium)
- [ ] Add animation when verification status changes

---

## Related Components

- `SovereignIDDisplay.tsx` - Displays wallet address and verification badge
- `PFFDashboard.tsx` - Main dashboard integrating all PFF components
- `PFFThirdwebProvider.tsx` - Thirdweb provider with guest wallet configuration

