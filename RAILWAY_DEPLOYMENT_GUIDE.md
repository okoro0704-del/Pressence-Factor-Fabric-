# 🚀 Railway Deployment Guide - PFF Sentinel Backend

**Date:** 2026-02-23  
**Objective:** Deploy Sentinel Backend to Railway in 5 minutes

---

## 📋 **PRE-DEPLOYMENT CHECKLIST**

### **✅ What's Ready:**
- ✅ Backend code complete (`backend/` directory)
- ✅ Environment configuration ready (`backend/.env.production`)
- ✅ All dependencies listed in `package.json`
- ✅ TypeScript build configured
- ✅ Supabase Database already deployed
- ✅ Polygon contracts configured

### **📝 What You'll Need:**
1. GitHub account (to connect Railway)
2. Railway account (free - sign up at https://railway.app)
3. Supabase credentials (from Supabase Dashboard)
4. 5 minutes of your time

---

## 🎯 **STEP-BY-STEP DEPLOYMENT**

### **STEP 1: Prepare Backend for Deployment (2 minutes)**

First, let's make sure the backend has the correct start script and build configuration.

**Files to verify:**
- `backend/package.json` - Start scripts
- `backend/.env.production` - Environment template
- `backend/tsconfig.json` - TypeScript config

---

### **STEP 2: Create Railway Account (1 minute)**

1. Go to: https://railway.app/
2. Click **"Start a New Project"**
3. Click **"Login with GitHub"**
4. Authorize Railway to access your GitHub account

---

### **STEP 3: Deploy from GitHub (2 minutes)**

1. **In Railway Dashboard:**
   - Click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose your PFF repository
   - Railway will detect it's a monorepo

2. **Configure Root Directory:**
   - Railway will ask: "Where is your app?"
   - Set **Root Directory:** `backend`
   - Railway will auto-detect `package.json`

3. **Configure Build & Start Commands:**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - Railway auto-detects these from `package.json`

4. **Click "Deploy"**
   - Railway will start building
   - Wait 1-2 minutes for build to complete

---

### **STEP 4: Add Environment Variables (3 minutes)**

**In Railway Dashboard → Your Project → Variables tab:**

Add these environment variables (copy from `backend/.env.production`):

#### **Required Variables:**
```bash
NODE_ENV=production
PORT=4000

# Database (Get from Supabase Dashboard)
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Supabase
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]

# Polygon Configuration
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGON_CHAIN_ID=137

# Contract Addresses
VIDA_CAP_TOKEN_ADDRESS=0xc226fFb538b6f80F05d5F0Ee0758E5D85a42DE0C
NGN_VIDA_TOKEN_ADDRESS=0xe814561AdB492f8ff3019194337A17E9cba9fEFd
SENTINEL_VAULT_ADDRESS=0xBaF30D2fe8F8fb41F3053Ce68C4619A283B60211
NATIONAL_TREASURY_ADDRESS=0x4c81E768f4B201bCd7E924f671ABA1B162786b48
FOUNDATION_VAULT_ADDRESS=0xDD8046422Bbeba12FD47DE854639abF7FB6E0858

# Economic Configuration
CITIZEN_VAULT_VIDA=5.0
NATIONAL_TREASURY_VIDA=5.0
FOUNDATION_VAULT_VIDA=1.0
TOTAL_VIDA_PER_VITALIZATION=11.0

# Security
JWT_SECRET=[GENERATE-RANDOM-32-BYTE-HEX]
VAULT_AES_KEY=[GENERATE-RANDOM-32-BYTE-HEX]
```

**To generate secrets:**
```bash
# Run in terminal to generate random keys
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### **STEP 5: Get Backend URL (1 minute)**

1. **After deployment completes:**
   - Railway will show: **"Deployment successful"**
   - Click on **"Settings"** tab
   - Find **"Domains"** section
   - Railway auto-generates a URL like: `https://pff-backend-production.up.railway.app`

2. **Copy this URL** - you'll need it for the frontend

---

### **STEP 6: Update Frontend Environment Variable (2 minutes)**

1. **Go to Netlify Dashboard:**
   - Select your site (sovrn.netlify.app)
   - Go to **Site Settings → Environment Variables**

2. **Add new variable:**
   - **Key:** `NEXT_PUBLIC_PFF_BACKEND_URL`
   - **Value:** `https://pff-backend-production.up.railway.app` (your Railway URL)
   - Click **"Save"**

3. **Redeploy frontend:**
   - Go to **Deploys** tab
   - Click **"Trigger deploy"**
   - Wait 1-2 minutes

---

### **STEP 7: Test End-to-End (2 minutes)**

1. **Test backend health:**
   - Visit: `https://pff-backend-production.up.railway.app/health`
   - Should see: `{"status":"ok","service":"pff-backend"}`

2. **Test vitalization flow:**
   - Visit: `https://sovrn.netlify.app/welcome`
   - Complete vitalization flow
   - Verify VIDA distribution
   - Verify Badge displays

---

## 🎉 **SUCCESS CHECKLIST**

After deployment, verify:

- [ ] Backend deployed to Railway
- [ ] Backend health endpoint returns `{"status":"ok"}`
- [ ] Frontend environment variable set
- [ ] Frontend redeployed
- [ ] Vitalization flow works end-to-end
- [ ] VIDA distribution executes
- [ ] Database updates correctly
- [ ] Badge displays on success

---

## 🔧 **TROUBLESHOOTING**

### **Issue: Build fails on Railway**
**Solution:** Check Railway logs for errors. Common issues:
- Missing dependencies in `package.json`
- TypeScript errors
- Missing environment variables

### **Issue: Backend starts but crashes**
**Solution:** Check Railway logs. Common issues:
- Database connection string incorrect
- Missing required environment variables
- Port configuration (Railway auto-assigns PORT)

### **Issue: Frontend can't reach backend**
**Solution:**
- Verify `NEXT_PUBLIC_PFF_BACKEND_URL` is set in Netlify
- Verify Railway backend is running
- Check CORS configuration in backend

### **Issue: Database connection fails**
**Solution:**
- Verify `DATABASE_URL` is correct
- Get connection string from Supabase Dashboard → Settings → Database
- Use **Transaction Pooler** connection string (port 6543)

---

## 📊 **DEPLOYMENT ARCHITECTURE**

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              NETLIFY (Frontend)                              │
│              https://sovrn.netlify.app                       │
│              ✅ DEPLOYED                                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ NEXT_PUBLIC_PFF_BACKEND_URL
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              RAILWAY (Backend)                               │
│              https://pff-backend-production.up.railway.app   │
│              ✅ DEPLOYED (after this guide)                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ DATABASE_URL
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE (Database)                             │
│              PostgreSQL                                      │
│              ✅ DEPLOYED                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 **NEXT STEPS AFTER DEPLOYMENT**

1. **Monitor Railway Logs:**
   - Railway Dashboard → Your Project → Logs
   - Watch for any errors or warnings

2. **Set up Custom Domain (Optional):**
   - Railway Settings → Domains
   - Add custom domain like `api.pff.com`

3. **Enable Auto-Deploy:**
   - Railway auto-deploys on every GitHub push to main branch
   - Already enabled by default

4. **Monitor Usage:**
   - Railway Dashboard → Metrics
   - Track requests, memory, CPU usage

---

## 💰 **RAILWAY PRICING**

**Free Tier:**
- $5 free credit per month
- Enough for development and testing
- Auto-sleeps after inactivity (wakes on request)

**Paid Tier (if needed):**
- $5/month base + usage
- No auto-sleep
- Better performance

---

## ✅ **READY TO DEPLOY?**

**Let me know when you're ready and I'll help you through each step!**

**Or if you need me to:**
1. Verify backend configuration before deployment
2. Generate security keys (JWT_SECRET, VAULT_AES_KEY)
3. Help troubleshoot any issues during deployment

Let's get your Sentinel Backend live! 🚀

