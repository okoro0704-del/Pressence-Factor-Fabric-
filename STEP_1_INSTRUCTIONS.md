# 🚀 STEP 1: ENVIRONMENT SETUP - MANUAL INSTRUCTIONS

## ✅ PROGRESS SO FAR

I've successfully set up:
- ✅ Hardhat installed and configured
- ✅ OpenZeppelin contracts installed
- ✅ Project structure organized
- ✅ `.env.example` created in root directory

---

## ⚠️ CURRENT ISSUE

The `@chainlink/contracts` package is taking too long to install via npm. Let's proceed with a manual approach.

---

## 📋 YOUR NEXT STEPS

### **STEP 1.1: Install Chainlink Contracts Manually**

Open a **new PowerShell terminal** and run:

```powershell
cd "C:\Users\Hp\Desktop\PFF - Copy"
npm install @chainlink/contracts --legacy-peer-deps
```

**Wait for this to complete** (may take 2-3 minutes).

---

### **STEP 1.2: Create `.env` File**

Once Chainlink is installed, create your `.env` file:

```powershell
cp .env.example .env
```

Then open `.env` in a text editor and fill in:

```bash
# Your deployer wallet private key (from MetaMask)
PRIVATE_KEY=your_private_key_here_without_0x_prefix

# Polygon RPC (you can use the default)
POLYGON_RPC_URL=https://polygon-rpc.com

# PolygonScan API Key (get from https://polygonscan.com/apis)
POLYGONSCAN_API_KEY=your_api_key_here

# Sentinel webhook (already set)
SENTINEL_WEBHOOK_URL=https://pff3.netlify.app/api/sentinel/webhook
```

---

### **STEP 1.3: Get Your Private Key**

1. Open MetaMask
2. Click your account → **Account Details**
3. Click **Export Private Key**
4. Enter your MetaMask password
5. **Copy the private key** (without `0x`)
6. Paste into `.env` as `PRIVATE_KEY=...`

⚠️ **NEVER share this key or commit it to Git!**

---

### **STEP 1.4: Fund Your Wallet**

You need **5 MATIC** on Polygon Mainnet:

1. Buy MATIC on an exchange (Coinbase, Binance, etc.)
2. Withdraw to your deployer address
3. **Select Polygon Network** (not Ethereum!)
4. Check balance: https://polygonscan.com/address/YOUR_ADDRESS

---

### **STEP 1.5: Compile Contracts**

After Chainlink is installed:

```powershell
npx hardhat compile
```

Expected output:
```
Compiled 8 Solidity files successfully
```

---

### **STEP 1.6: Verify Setup**

Run the verification script:

```powershell
npx hardhat run scripts/verify-setup.ts --network polygon
```

This will check:
- ✅ Environment variables are set
- ✅ Network connection works
- ✅ Deployer wallet has sufficient MATIC
- ✅ Contracts are compiled

---

## 🎯 SUCCESS CRITERIA

You're ready for Step 2 when:

- [ ] `@chainlink/contracts` installed successfully
- [ ] `.env` file created with your private key
- [ ] Deployer wallet has 5 MATIC
- [ ] `npx hardhat compile` succeeds
- [ ] `npx hardhat run scripts/verify-setup.ts --network polygon` shows "✅ SETUP VERIFICATION PASSED"

---

## 📞 WHEN READY

Once you see **"✅ SETUP VERIFICATION PASSED"**, paste the output here and I'll guide you to **Step 2: Deploy PFF Verified SBT Contract**.

---

## 🔧 TROUBLESHOOTING

### **Chainlink installation stuck**

Try:
```powershell
npm cache clean --force
npm install @chainlink/contracts --legacy-peer-deps --verbose
```

### **"PRIVATE_KEY not set" error**

- Make sure `.env` file is in the root directory (not `contracts/`)
- Verify the private key has no `0x` prefix
- Restart your terminal after creating `.env`

### **"Insufficient funds" error**

- Check your wallet balance on PolygonScan
- Make sure you're on Polygon Mainnet (not Ethereum)
- Send at least 5 MATIC to your deployer address

---

**Current Status:** ⏳ Waiting for Chainlink installation and `.env` setup

