# 🚀 Deploy PFF Protocol to Netlify

## 📋 **Pre-Deployment Checklist**

Before deploying, you need to add the Thirdweb Client ID to Netlify's environment variables.

---

## ⚙️ **Step 1: Add Environment Variables to Netlify**

### **Option A: Via Netlify Dashboard (Recommended)**

1. Go to your Netlify dashboard: https://app.netlify.com/
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable**
5. Add the following:

```bash
# REQUIRED - Thirdweb Client ID
NEXT_PUBLIC_THIRDWEB_CLIENT_ID = 592694ecd2c638f524f961cfd7ab5956

# OPTIONAL - For gasless transactions
# NEXT_PUBLIC_PAYMASTER_URL = https://your-paymaster-url

# Already configured in netlify.toml (no need to add again)
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
```

6. Click **Save**

### **Option B: Via Netlify CLI**

```bash
cd web
netlify env:set NEXT_PUBLIC_THIRDWEB_CLIENT_ID "592694ecd2c638f524f961cfd7ab5956"
```

---

## 🚀 **Step 2: Deploy to Netlify**

### **Method 1: Using the Deploy Script (Recommended)**

```bash
cd web
./deploy-netlify.ps1
```

This will:
1. Push your code to Git
2. Trigger a Netlify build
3. Deploy to production

### **Method 2: Git Push (Auto-Deploy)**

If your Netlify site is connected to your Git repo:

```bash
cd ..
git add .
git commit -m "Add PFF Protocol dashboard"
git push origin main
```

Netlify will automatically build and deploy.

### **Method 3: Manual Build + Deploy**

```bash
cd web

# Build locally
npm run build

# Deploy to Netlify
npx netlify deploy --prod --dir=out
```

---

## 🔗 **Step 3: Link Netlify Site (First Time Only)**

If you haven't linked your site yet:

```bash
cd web
npx netlify link
```

Follow the prompts to select your site.

---

## ✅ **Verify Deployment**

After deployment:

1. Visit your Netlify site URL (e.g., `https://your-site.netlify.app`)
2. Navigate to `/pff-dashboard`
3. Click "Enter Protocol"
4. Check that wallet creates successfully
5. Check that balances display

---

## 🆘 **Troubleshooting**

### **Issue: "NEXT_PUBLIC_THIRDWEB_CLIENT_ID is undefined"**

**Solution:**
1. Go to Netlify dashboard → Site settings → Environment variables
2. Make sure `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` is set
3. Trigger a new deploy (Site settings → Deploys → Trigger deploy)

### **Issue: "Build failed"**

**Solution:**
1. Check build logs in Netlify dashboard
2. Make sure all dependencies are in `package.json`
3. Check that `next.config.js` has `output: 'export'`

### **Issue: "404 on /pff-dashboard"**

**Solution:**
1. Check that `src/app/pff-dashboard/page.tsx` exists
2. Rebuild: `npm run build`
3. Check `out/pff-dashboard/index.html` exists

---

## 📊 **What Gets Deployed**

Your deployment includes:

### **PFF Protocol Components**
- ✅ PFFThirdwebProvider (Polygon + Guest Mode)
- ✅ NationalPortfolio (Live balances)
- ✅ PFFDashboard (Complete dashboard)
- ✅ ClaimWealthButton (Vitalize)
- ✅ ConvertToNairaButton (Swap)

### **Smart Contract Integration**
- ✅ VIDA CAP Token: `0xDc6E...12E`
- ✅ ngnVIDA Token: `0x5dD4...811`
- ✅ FoundationVault: `0xD42C...2E0`
- ✅ NationalTreasury: `0x5E84...bF4`

### **Routes**
- ✅ `/` - Main landing page
- ✅ `/pff-dashboard` - PFF Protocol dashboard
- ✅ All other existing routes

---

## 🎯 **Post-Deployment**

After successful deployment:

### **1. Test the Dashboard**
```
Visit: https://your-site.netlify.app/pff-dashboard
- Click "Enter Protocol"
- Check wallet creation
- Check balance display
- Test vitalization (needs MATIC)
- Test swap (needs MATIC)
```

### **2. (Optional) Enable Gasless Transactions**
1. Go to Thirdweb dashboard
2. Enable Account Abstraction
3. Fund paymaster
4. Add `NEXT_PUBLIC_PAYMASTER_URL` to Netlify env vars
5. Redeploy

### **3. Share Your Dashboard**
```
Your PFF Protocol dashboard is live at:
https://your-site.netlify.app/pff-dashboard
```

---

## 🔄 **Future Deployments**

After the initial setup, deploying is easy:

### **Option 1: Git Push (Auto-Deploy)**
```bash
git add .
git commit -m "Update PFF Protocol"
git push origin main
```

### **Option 2: Deploy Script**
```bash
cd web
./deploy-netlify.ps1
```

### **Option 3: Netlify CLI**
```bash
cd web
npm run build
npx netlify deploy --prod --dir=out
```

---

## 📚 **Additional Resources**

- **Netlify Docs:** https://docs.netlify.com/
- **Next.js Static Export:** https://nextjs.org/docs/app/building-your-application/deploying/static-exports
- **Thirdweb Docs:** https://portal.thirdweb.com/

---

## 🎉 **You're Ready to Deploy!**

Just run:

```bash
cd web
./deploy-netlify.ps1
```

Or push to Git if auto-deploy is enabled.

**Your PFF Protocol dashboard will be live!** 🏛️✨

