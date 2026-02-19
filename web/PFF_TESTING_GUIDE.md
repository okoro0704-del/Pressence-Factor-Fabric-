# 🧪 PFF Protocol Frontend - Testing Guide

## ✅ **Pre-Flight Checklist**

Before testing, ensure you have:

- [ ] **Thirdweb Client ID** configured in `.env.local`
- [ ] **Smart contracts deployed** on Polygon/RSK
- [ ] **Paymaster funded** for gasless transactions
- [ ] **Node.js 18+** installed
- [ ] **Dependencies installed** (`npm install`)

---

## 🚀 **Step 1: Local Development Setup**

### **1.1 Install Dependencies**

```bash
cd web
npm install
```

### **1.2 Configure Environment**

```bash
# Copy the example file
cp .env.pff.example .env.local

# Edit .env.local
nano .env.local  # or use your preferred editor
```

Add your Thirdweb credentials:

```bash
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_actual_client_id_here
NEXT_PUBLIC_SMART_WALLET_FACTORY=0x... # From Thirdweb dashboard
NEXT_PUBLIC_PAYMASTER_URL=https://... # From Thirdweb dashboard
```

### **1.3 Start Development Server**

```bash
npm run dev
```

Navigate to: **http://localhost:3000/pff-protocol**

---

## 🧪 **Step 2: Manual Testing**

### **Test 1: Invisible Wallet Creation**

**Expected Behavior:**
1. Visit `/pff-protocol`
2. Wallet is created automatically in browser
3. No signup/password prompts
4. Dashboard shows wallet address (e.g., `0x1234...5678`)

**Verification:**
```tsx
// Check browser console
console.log("Wallet created:", address);
```

**✅ Pass Criteria:**
- Wallet address appears in dashboard header
- No user interaction required
- Wallet persists on page refresh

---

### **Test 2: Real-Time Balance Display**

**Expected Behavior:**
1. Dashboard shows three balance cards:
   - VIDA CAP (Spendable)
   - Collateral (Locked)
   - ngnVIDA (National Currency)
2. Balances are formatted (e.g., "1,345,450.00")
3. Loading spinners appear while fetching

**Verification:**
```tsx
const { vidaCapBalance, vidaCapSpendable, vidaCapLocked, ngnVidaBalance } = usePFFSovereign();
console.log({ vidaCapBalance, vidaCapSpendable, vidaCapLocked, ngnVidaBalance });
```

**✅ Pass Criteria:**
- Balances display as formatted numbers (not raw uint256)
- Loading state shows before data loads
- All three cards render correctly

---

### **Test 3: Claim Wealth (Vitalization)**

**Expected Behavior:**
1. Click "Claim Wealth" button
2. No gas prompt appears (gasless)
3. Transaction processes
4. Confetti animation plays on success
5. Balances auto-refresh
6. Button shows success state

**Verification:**
```tsx
// Check transaction in browser console
console.log("Vitalization TX:", tx);

// Verify balances increased
// Before: 0.00 VIDA CAP
// After: 5.00 VIDA CAP (1 spendable + 4 locked)
```

**✅ Pass Criteria:**
- No MetaMask/wallet popup
- Transaction completes without user paying gas
- Confetti animation plays
- VIDA CAP balance increases by 5
- ngnVIDA balance remains 0 (until swap)

---

### **Test 4: Convert to Naira (Swap)**

**Expected Behavior:**
1. Enter amount (e.g., "1")
2. Preview shows conversion (1 VIDA = 1,345,450 ngnVIDA)
3. Click "Convert to Naira"
4. No gas prompt appears (gasless)
5. Two transactions execute:
   - Approve VIDA CAP
   - Swap VIDA to ngnVIDA
6. Balances auto-refresh

**Verification:**
```tsx
// Check swap calculation
const expectedNgn = 1 * 1_345_450; // 1,345,450
console.log("Expected ngnVIDA:", expectedNgn);

// Verify balances after swap
// VIDA CAP: 4.00 (5 - 1)
// ngnVIDA: 1,345,450.00
```

**✅ Pass Criteria:**
- No MetaMask/wallet popup
- Both approve + swap execute automatically
- VIDA CAP balance decreases
- ngnVIDA balance increases
- Conversion rate is correct (1:1,345,450)

---

### **Test 5: Error Handling**

**Test 5.1: Insufficient Balance**

```tsx
// Try to swap more than available
await executeSwap("1000"); // If you only have 5 VIDA
```

**Expected:** Error message displays "Insufficient spendable balance"

**Test 5.2: Invalid Amount**

```tsx
// Try to swap 0 or negative
await executeSwap("0");
await executeSwap("-5");
```

**Expected:** Error message displays "Invalid amount"

**Test 5.3: Network Error**

```tsx
// Disconnect internet, try transaction
```

**Expected:** Error message displays with retry option

**✅ Pass Criteria:**
- All errors display user-friendly messages
- Error messages auto-dismiss after 5 seconds
- User can retry failed transactions

---

## 🔍 **Step 3: Browser Console Testing**

### **Test Hook Directly**

Open browser console on `/pff-protocol` page:

```javascript
// Access the hook data (if exposed via window for debugging)
// Or add this to your component temporarily:

const TestComponent = () => {
  const sovereign = usePFFSovereign();
  
  useEffect(() => {
    window.pffSovereign = sovereign;
  }, [sovereign]);
  
  return null;
};

// Then in console:
window.pffSovereign.vidaCapBalance
window.pffSovereign.claimCitizenship("0x5E8474D3BaaF27A4531F34f6fA8c9E237ce1ebb4")
window.pffSovereign.executeSwap("1")
```

---

## 📊 **Step 4: Network Inspection**

### **Check Thirdweb API Calls**

1. Open DevTools → Network tab
2. Filter by "thirdweb"
3. Verify:
   - Embedded wallet creation
   - Account Abstraction calls
   - Paymaster sponsorship

### **Check Blockchain Calls**

1. Filter by "rpc" or "polygon"
2. Verify:
   - `eth_call` for balance reads
   - `eth_sendTransaction` for writes
   - No `eth_estimateGas` (gasless)

---

## 🎨 **Step 5: Visual/UI Testing**

### **Design System Verification**

**Colors:**
- [ ] Background: Deep Midnight Blue (#0a1628)
- [ ] Accents: Brushed Gold (#D4AF37)
- [ ] Hover effects: Bright Gold (#F0C952)

**Typography:**
- [ ] Headings: Uppercase, letter-spacing 0.05em
- [ ] Body: Clean Sans-Serif
- [ ] Numbers: Bold, large, readable

**Animations:**
- [ ] Confetti on vitalization
- [ ] Smooth hover transitions
- [ ] Loading spinners

**Responsive:**
- [ ] Mobile (< 768px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (> 1024px)

---

## 🔐 **Step 6: Security Testing**

### **Test 6.1: Wallet Persistence**

1. Claim citizenship
2. Close browser
3. Reopen `/pff-protocol`
4. **Expected:** Same wallet, balances persist

### **Test 6.2: Transaction Replay Protection**

1. Claim citizenship once
2. Try to claim again
3. **Expected:** Error "Already vitalized"

### **Test 6.3: Amount Validation**

1. Try to swap more than spendable balance
2. **Expected:** Transaction reverts with error

---

## 📝 **Step 7: Automated Testing (Optional)**

### **Create Test File**

```tsx
// __tests__/pff-protocol.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { PFFProtocolPage } from '@/components/pff/PFFProtocolPage';

describe('PFF Protocol', () => {
  it('renders dashboard', () => {
    render(<PFFProtocolPage />);
    expect(screen.getByText(/Sovereign Treasury/i)).toBeInTheDocument();
  });

  it('shows balance cards', async () => {
    render(<PFFProtocolPage />);
    await waitFor(() => {
      expect(screen.getByText(/VIDA CAP/i)).toBeInTheDocument();
      expect(screen.getByText(/ngnVIDA/i)).toBeInTheDocument();
    });
  });
});
```

### **Run Tests**

```bash
npm test
```

---

## ✅ **Final Checklist**

Before deploying to production:

- [ ] All manual tests pass
- [ ] No console errors
- [ ] Gasless transactions work
- [ ] Balances display correctly
- [ ] Error handling works
- [ ] Design matches specifications
- [ ] Mobile responsive
- [ ] Wallet persists across sessions
- [ ] Confetti animation works
- [ ] Exchange rate is correct (1:1,345,450)

---

## 🐛 **Common Issues & Solutions**

### **Issue: "Client ID not found"**
**Solution:** Check `.env.local` has `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`

### **Issue: "Paymaster error"**
**Solution:** Fund your paymaster in Thirdweb dashboard

### **Issue: "Transaction reverted"**
**Solution:** Check contract is deployed and addresses are correct

### **Issue: Balances showing as huge numbers**
**Solution:** Verify `formatBalance()` is dividing by 10^18

---

## 📞 **Support**

If tests fail, check:
1. `web/components/pff/README.md` - Component documentation
2. `web/PFF_PROTOCOL_SETUP.md` - Setup guide
3. `web/PFF_QUICK_REFERENCE.md` - Quick reference
4. Browser console for error messages

---

**Happy Testing! 🎉**

