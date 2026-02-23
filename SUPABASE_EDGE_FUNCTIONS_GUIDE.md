# 🔧 SUPABASE EDGE FUNCTIONS DEPLOYMENT GUIDE
## Deploy Gasless Minting & Relayer Functions

**Purpose:** Enable backend-triggered gasless VIDA minting and gas relaying  
**Time:** 15 minutes  
**Cost:** Free (included in Supabase plan)

---

## 📋 PREREQUISITES

- [ ] Supabase project created
- [ ] Supabase CLI installed
- [ ] PFF contracts deployed (Phase 1 complete)
- [ ] Deployer wallet with VIDA minting permissions

---

## 🚀 INSTALLATION

### **STEP 1: Install Supabase CLI**

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# NPM (all platforms)
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

---

### **STEP 2: Login to Supabase**

```bash
supabase login
```

This will open a browser window. Sign in with your Supabase account.

---

### **STEP 3: Link to Your Project**

```bash
cd supabase
supabase link --project-ref YOUR_PROJECT_REF
```

**Find your project ref:**
1. Go to Supabase Dashboard
2. Select your project
3. URL format: `https://app.supabase.com/project/YOUR_PROJECT_REF`
4. Copy the project ref (e.g., `abcdefghijklmnop`)

---

## 🔐 ENVIRONMENT VARIABLES

### **STEP 4: Set Edge Function Secrets**

```bash
# Navigate to supabase directory
cd supabase

# Set secrets (one by one)
supabase secrets set VIDA_MINTER_PRIVATE_KEY=your_deployer_private_key_here
supabase secrets set VIDA_TOKEN_ADDRESS=0xDc6EFba149b47f6F6d77AC0523c51F204964C12E
supabase secrets set NATIONAL_VAULT_ADDRESS=your_national_vault_address
supabase secrets set SENTINEL_WALLET_ADDRESS=your_sentinel_wallet_address
supabase secrets set POLYGON_RPC_URL=https://polygon-rpc.com
supabase secrets set RELAYER_MIN_RBTC=0.001
```

**Important:** Keep `VIDA_MINTER_PRIVATE_KEY` secret! Never commit to Git.

---

### **STEP 5: Verify Secrets**

```bash
supabase secrets list
```

Expected output:
```
VIDA_MINTER_PRIVATE_KEY: ***
VIDA_TOKEN_ADDRESS: 0xDc6E...
NATIONAL_VAULT_ADDRESS: 0x...
SENTINEL_WALLET_ADDRESS: 0x...
POLYGON_RPC_URL: https://polygon-rpc.com
RELAYER_MIN_RBTC: 0.001
```

---

## 📦 DEPLOY FUNCTIONS

### **STEP 6: Deploy gasless-mint Function**

```bash
supabase functions deploy gasless-mint
```

Expected output:
```
✅ Deployed Function gasless-mint
   URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/gasless-mint
```

---

### **STEP 7: Deploy relayer-gas Function**

```bash
supabase functions deploy relayer-gas
```

Expected output:
```
✅ Deployed Function relayer-gas
   URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/relayer-gas
```

---

## ✅ TESTING

### **STEP 8: Test gasless-mint Function**

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/gasless-mint \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+2348012345678",
    "recipientAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "txHash": "0x...",
  "recipientAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "amount": "5.0"
}
```

---

### **STEP 9: Test relayer-gas Function**

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/relayer-gas \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+2348012345678",
    "recipientAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "txHash": "0x...",
  "amount": "0.001"
}
```

---

## 📊 MONITORING

### **View Function Logs**

```bash
# Real-time logs
supabase functions logs gasless-mint --tail

# Last 100 logs
supabase functions logs gasless-mint --limit 100
```

### **Check Invocations**

1. Go to Supabase Dashboard
2. Navigate to "Edge Functions"
3. Click on function name
4. View "Invocations" tab

---

## 🔧 TROUBLESHOOTING

### **Error: "VIDA_MINTER_PRIVATE_KEY not set"**

**Solution:**
```bash
supabase secrets set VIDA_MINTER_PRIVATE_KEY=your_private_key
supabase functions deploy gasless-mint
```

### **Error: "Insufficient funds for gas"**

**Solution:**
- Fund the minter wallet with MATIC
- Check balance: https://polygonscan.com/address/YOUR_MINTER_ADDRESS

### **Error: "Function not found"**

**Solution:**
```bash
# Redeploy function
supabase functions deploy gasless-mint
```

### **Error: "CORS error"**

**Solution:**
- Edge functions automatically handle CORS
- Verify `Authorization` header is set
- Check Supabase anon key is correct

---

## 🔄 UPDATING FUNCTIONS

### **Redeploy After Code Changes**

```bash
# Make changes to supabase/functions/gasless-mint/index.ts
# Then redeploy:
supabase functions deploy gasless-mint
```

### **Update Secrets**

```bash
# Update a secret
supabase secrets set VIDA_TOKEN_ADDRESS=0xNEW_ADDRESS

# Redeploy to apply changes
supabase functions deploy gasless-mint
```

---

## 📋 PRODUCTION CHECKLIST

Before going live:

- [ ] All secrets set correctly
- [ ] Minter wallet funded with MATIC
- [ ] Functions deployed successfully
- [ ] Test minting works
- [ ] Test relayer works
- [ ] Monitor function logs
- [ ] Set up error alerts

---

## 🔗 USEFUL COMMANDS

```bash
# List all functions
supabase functions list

# View function details
supabase functions inspect gasless-mint

# Delete a function
supabase functions delete gasless-mint

# View all secrets
supabase secrets list

# Unset a secret
supabase secrets unset VIDA_MINTER_PRIVATE_KEY
```

---

## 📞 SUPPORT

**Supabase Support:**
- Docs: https://supabase.com/docs/guides/functions
- Discord: https://discord.supabase.com
- GitHub: https://github.com/supabase/supabase

**PFF Protocol:**
- Check function logs for errors
- Verify all secrets are set
- Test on testnet first

---

**Status:** ✅ Ready for deployment  
**Next:** Test gasless minting from PFF Dashboard

