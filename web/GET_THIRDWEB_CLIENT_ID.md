# 🔑 How to Get Your Thirdweb Client ID

## ⚡ Quick Steps (2 minutes)

### **Step 1: Create Thirdweb Account**

1. Visit: **https://thirdweb.com/dashboard**
2. Click **"Sign Up"** (top right)
3. Sign up with:
   - Email + Password, OR
   - Google account, OR
   - GitHub account
4. Verify your email (check inbox)

---

### **Step 2: Create a Project**

1. Once logged in, you'll see the dashboard
2. Click **"Create Project"** button
3. Enter project details:
   - **Name:** `PFF Protocol`
   - **Description:** `Sovereign Financial System`
4. Click **"Create"**

---

### **Step 3: Get Your Client ID**

1. You'll be taken to your project dashboard
2. Look for **"Client ID"** section (usually at the top)
3. Click **"Copy"** to copy your Client ID
4. It looks like: `abc123def456ghi789...`

**Save this!** You'll need it in the next step.

---

### **Step 4: Enable Required Features**

#### **4.1 Enable Embedded Wallets**

1. In your project dashboard, click **"Wallets"** tab (left sidebar)
2. Find **"Embedded Wallets"** section
3. Toggle it **ON** ✅
4. Under "Authentication Methods", enable **"Guest Mode"** ✅
5. Click **"Save"**

#### **4.2 Enable Account Abstraction (Optional but Recommended)**

1. Click **"Account Abstraction"** tab (left sidebar)
2. Toggle **"Smart Wallets"** ON ✅
3. Toggle **"Gasless Transactions"** ON ✅
4. Click **"Fund Paymaster"**
5. Add ~$10 worth of MATIC (Polygon)
6. Click **"Save"**

**Note:** If you skip this, users will need MATIC for gas fees.

---

### **Step 5: Add Client ID to Your Project**

1. Open your project folder
2. Navigate to: `web/.env.local`
3. Find this line:
   ```bash
   NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id_here
   ```
4. Replace `your_client_id_here` with your actual Client ID:
   ```bash
   NEXT_PUBLIC_THIRDWEB_CLIENT_ID=abc123def456ghi789...
   ```
5. Save the file

---

### **Step 6: Verify Setup**

```bash
cd web
npm run verify-pff
```

You should see:
```
✅ NEXT_PUBLIC_THIRDWEB_CLIENT_ID is configured
✅ All checks passed! Setup is complete.
```

---

## 🎉 **You're Done!**

Now run your dashboard:

```bash
npm run pff-dashboard
```

Visit: **http://localhost:3000/pff-dashboard**

---

## 🆘 **Troubleshooting**

### **Issue: "Client ID not found"**

**Check 1:** Is the Client ID in `.env.local`?
```bash
cat web/.env.local | grep THIRDWEB_CLIENT_ID
```

**Check 2:** Did you restart the dev server?
```bash
# Stop the server (Ctrl+C)
npm run dev
```

**Check 3:** Is the variable name correct?
- ✅ Correct: `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`
- ❌ Wrong: `THIRDWEB_CLIENT_ID` (missing `NEXT_PUBLIC_`)

---

### **Issue: "Embedded Wallets not working"**

**Solution:**
1. Go to Thirdweb dashboard
2. Click your project
3. Go to "Wallets" tab
4. Make sure "Embedded Wallets" is enabled ✅
5. Make sure "Guest Mode" is enabled ✅

---

### **Issue: "Transactions asking for gas fees"**

**This is normal if you didn't enable gasless transactions.**

**To enable gasless:**
1. Go to Thirdweb dashboard
2. Click "Account Abstraction" tab
3. Enable "Gasless Transactions"
4. Fund your paymaster with MATIC
5. Copy the Paymaster URL
6. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_PAYMASTER_URL=https://your-paymaster-url
   ```

---

## 💰 **Pricing**

### **Free Tier** (Perfect for Development)
- ✅ Embedded Wallets: Up to 1,000 wallets/month
- ✅ Smart Wallets: Unlimited
- ✅ API Calls: Unlimited
- ✅ Development: Free forever

### **Growth Tier** ($99/month)
- ✅ Embedded Wallets: Unlimited
- ✅ Everything in Free tier
- ✅ Priority support

### **Gasless Transactions**
- Pay-as-you-go based on gas usage
- ~$0.01-0.05 per transaction on Polygon
- Fund paymaster as needed

**Recommendation:** Start with Free tier for development!

---

## 📚 **Additional Resources**

- **Thirdweb Docs:** https://portal.thirdweb.com/
- **Embedded Wallets Guide:** https://portal.thirdweb.com/wallets/embedded-wallet
- **Account Abstraction Guide:** https://portal.thirdweb.com/wallets/smart-wallet
- **Support:** https://discord.gg/thirdweb

---

## ✅ **Checklist**

- [ ] Created Thirdweb account
- [ ] Created project named "PFF Protocol"
- [ ] Copied Client ID
- [ ] Enabled Embedded Wallets
- [ ] Enabled Guest Mode
- [ ] Added Client ID to `.env.local`
- [ ] Ran `npm run verify-pff`
- [ ] Saw "All checks passed!"

**Optional (for gasless):**
- [ ] Enabled Account Abstraction
- [ ] Funded paymaster with MATIC
- [ ] Added Paymaster URL to `.env.local`

---

## 🚀 **Next Steps**

Once you have your Client ID configured:

```bash
npm run pff-dashboard
```

Visit: **http://localhost:3000/pff-dashboard**

**Your PFF Protocol dashboard is ready!** 🎉

