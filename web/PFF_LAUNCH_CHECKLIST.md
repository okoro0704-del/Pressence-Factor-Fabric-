# 🚀 PFF Protocol Frontend - Launch Checklist

## ✅ **Pre-Launch Checklist**

Use this checklist to ensure everything is ready before launching your PFF Protocol frontend.

---

## 📋 **Phase 1: Development Setup**

### **1.1 Dependencies**
- [ ] Node.js 18+ installed
- [ ] npm/yarn installed
- [ ] All dependencies installed (`npm install`)
- [ ] No dependency conflicts or warnings

**Verify:**
```bash
node --version  # Should be 18+
npm --version
cd web && npm install
```

### **1.2 Environment Configuration**
- [ ] `.env.local` file created (from `.env.pff.example`)
- [ ] `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` set
- [ ] `NEXT_PUBLIC_SMART_WALLET_FACTORY` set (optional)
- [ ] `NEXT_PUBLIC_PAYMASTER_URL` set (optional)
- [ ] All contract addresses verified

**Verify:**
```bash
cat .env.local | grep THIRDWEB_CLIENT_ID
```

### **1.3 Local Development**
- [ ] Development server starts without errors (`npm run dev`)
- [ ] Page loads at `http://localhost:3000/pff-protocol`
- [ ] No console errors in browser
- [ ] No TypeScript errors

**Verify:**
```bash
npm run dev
# Visit http://localhost:3000/pff-protocol
# Check browser console (F12)
```

---

## 🔧 **Phase 2: Thirdweb Configuration**

### **2.1 Thirdweb Account**
- [ ] Account created at https://thirdweb.com/dashboard
- [ ] Project created
- [ ] Client ID obtained
- [ ] Client ID added to `.env.local`

### **2.2 Embedded Wallets**
- [ ] Embedded Wallets enabled in dashboard
- [ ] Guest Mode enabled
- [ ] Auto-connect configured
- [ ] Test wallet creation works

**Test:**
```
Visit /pff-protocol → Wallet should auto-create
```

### **2.3 Account Abstraction (Gasless)**
- [ ] Account Abstraction enabled in dashboard
- [ ] Smart Wallet factory deployed (or using Thirdweb's)
- [ ] Paymaster configured
- [ ] Paymaster funded with native tokens (MATIC/RBTC)
- [ ] Test gasless transaction works

**Test:**
```
Click "Claim Wealth" → No MetaMask popup should appear
```

---

## 🔗 **Phase 3: Smart Contract Verification**

### **3.1 Contract Deployment**
- [ ] FoundationVault deployed at `0xD42C5b854319e43e2F9e2c387b13b84D1dF542E0`
- [ ] NationalTreasury deployed at `0x5E8474D3BaaF27A4531F34f6fA8c9E237ce1ebb4`
- [ ] VIDA CAP Token at `0xDc6EFba149b47f6F6d77AC0523c51F204964C12E`
- [ ] ngnVIDA Token at `0x5dD456B88f2be6688E7A04f78471A3868bd06811`
- [ ] All contracts verified on block explorer

**Verify:**
```
Visit PolygonScan/RSK Explorer
Search for each contract address
Check "Contract" tab shows verified code
```

### **3.2 Contract Functions**
- [ ] `vitalize()` function exists on FoundationVault
- [ ] `getVaultBalances()` function exists on FoundationVault
- [ ] `swapVidaToNgn()` function exists on NationalTreasury
- [ ] `balanceOf()` function exists on both tokens
- [ ] `approve()` function exists on VIDA CAP token

**Verify:**
```
Check contract ABIs on block explorer
Or use Remix IDE to verify function signatures
```

### **3.3 Contract Permissions**
- [ ] NationalTreasury has approval to mint ngnVIDA
- [ ] Paymaster has sufficient funds
- [ ] Test vitalization works (11 VIDA distributed)
- [ ] Test swap works (approve + swap)

---

## 🧪 **Phase 4: Functional Testing**

### **4.1 Invisible Wallet**
- [ ] Wallet auto-creates on page load
- [ ] No signup/password prompts
- [ ] Wallet address displays in dashboard
- [ ] Wallet persists on page refresh
- [ ] Wallet persists after browser close/reopen

### **4.2 Balance Display**
- [ ] VIDA CAP balance displays correctly
- [ ] VIDA CAP spendable displays correctly
- [ ] VIDA CAP locked displays correctly
- [ ] ngnVIDA balance displays correctly
- [ ] Balances formatted with commas (e.g., "1,345,450.00")
- [ ] Loading spinners show while fetching
- [ ] No raw uint256 values displayed

### **4.3 Claim Wealth (Vitalization)**
- [ ] Button is clickable
- [ ] No gas prompt appears
- [ ] Transaction processes successfully
- [ ] Confetti animation plays
- [ ] Balances auto-refresh
- [ ] VIDA CAP increases by 5 (1 spendable + 4 locked)
- [ ] Success message displays
- [ ] Can only claim once (error on second attempt)

### **4.4 Convert to Naira (Swap)**
- [ ] Input field accepts numbers
- [ ] MAX button fills spendable balance
- [ ] Conversion preview shows correct rate (1:1,345,450)
- [ ] No gas prompt appears
- [ ] Approve transaction executes
- [ ] Swap transaction executes
- [ ] Balances auto-refresh
- [ ] VIDA CAP decreases by swap amount
- [ ] ngnVIDA increases by (amount × 1,345,450)
- [ ] Error shows if insufficient balance

### **4.5 Error Handling**
- [ ] Invalid amount shows error
- [ ] Insufficient balance shows error
- [ ] Network errors show retry option
- [ ] Errors auto-dismiss after 5 seconds
- [ ] User can manually clear errors

---

## 🎨 **Phase 5: Visual/UX Testing**

### **5.1 Design System**
- [ ] Background is Deep Midnight Blue (#0a1628)
- [ ] Accents are Brushed Gold (#D4AF37)
- [ ] Typography is clean Sans-Serif
- [ ] Headings are uppercase with letter-spacing
- [ ] Hover effects work smoothly
- [ ] Buttons have gold gradient
- [ ] Cards have subtle borders and shadows

### **5.2 Responsive Design**
- [ ] Mobile (< 768px) - Layout stacks vertically
- [ ] Tablet (768px - 1024px) - Grid adjusts
- [ ] Desktop (> 1024px) - Full layout
- [ ] Text is readable on all screen sizes
- [ ] Buttons are tappable on mobile
- [ ] No horizontal scrolling

### **5.3 Animations**
- [ ] Confetti plays on vitalization
- [ ] Loading spinners rotate smoothly
- [ ] Hover transitions are smooth
- [ ] Button states change smoothly
- [ ] No janky animations

---

## 🔐 **Phase 6: Security & Performance**

### **6.1 Security**
- [ ] No private keys exposed in code
- [ ] Environment variables not committed to git
- [ ] HTTPS enabled (production)
- [ ] No console.log with sensitive data
- [ ] Transaction amounts validated
- [ ] Replay protection works (can't vitalize twice)

### **6.2 Performance**
- [ ] Page loads in < 3 seconds
- [ ] Balance fetching is fast (< 2 seconds)
- [ ] Transactions complete in < 10 seconds
- [ ] No memory leaks (check DevTools)
- [ ] Images/assets optimized

### **6.3 Browser Compatibility**
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## 📚 **Phase 7: Documentation**

### **7.1 User Documentation**
- [ ] README explains how to use the app
- [ ] Setup guide is clear and complete
- [ ] Quick reference is available
- [ ] Testing guide is comprehensive

### **7.2 Developer Documentation**
- [ ] Code is well-commented
- [ ] Component README exists
- [ ] Hook documentation is clear
- [ ] Environment variables documented

---

## 🚀 **Phase 8: Deployment**

### **8.1 Build**
- [ ] Production build succeeds (`npm run build`)
- [ ] No build errors or warnings
- [ ] Build output is optimized
- [ ] Environment variables work in production

**Verify:**
```bash
npm run build
npm run start
# Visit http://localhost:3000/pff-protocol
```

### **8.2 Deployment Platform**
- [ ] Platform chosen (Vercel/Netlify/etc.)
- [ ] Environment variables set on platform
- [ ] Domain configured (if custom)
- [ ] SSL certificate active
- [ ] Deployment successful

### **8.3 Post-Deployment**
- [ ] Production URL works
- [ ] All features work in production
- [ ] No console errors in production
- [ ] Analytics/monitoring set up (optional)

---

## ✅ **Final Pre-Launch Checklist**

Before announcing to users:

- [ ] All tests pass
- [ ] No critical bugs
- [ ] Gasless transactions work
- [ ] Balances display correctly
- [ ] Design matches specifications
- [ ] Mobile works perfectly
- [ ] Documentation is complete
- [ ] Support plan in place

---

## 🎉 **Launch Day**

### **Soft Launch**
1. [ ] Share with small group of testers
2. [ ] Monitor for issues
3. [ ] Collect feedback
4. [ ] Fix any critical bugs

### **Full Launch**
1. [ ] Announce to community
2. [ ] Monitor server/paymaster
3. [ ] Watch for errors
4. [ ] Respond to user feedback

---

## 📊 **Post-Launch Monitoring**

### **Daily Checks**
- [ ] Paymaster has sufficient funds
- [ ] No error spikes in logs
- [ ] Transactions completing successfully
- [ ] User feedback is positive

### **Weekly Checks**
- [ ] Review analytics
- [ ] Check contract balances
- [ ] Update documentation if needed
- [ ] Plan improvements

---

## 🆘 **Emergency Contacts**

- **Thirdweb Support:** https://thirdweb.com/support
- **Contract Issues:** Check block explorer
- **Frontend Issues:** Check browser console

---

## 📝 **Notes**

Use this space for launch-specific notes:

```
Launch Date: _______________
Network: Polygon / RSK (circle one)
Paymaster Balance: _______________
Initial Users: _______________
```

---

**Ready to launch? Check every box above, then GO! 🚀**

