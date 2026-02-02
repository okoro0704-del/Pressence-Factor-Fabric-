# 🔧 BUILD FAILURE FIX — NETLIFY DEPLOYMENT

**Issue:** Last build did not go through  
**Status:** 🔍 **DIAGNOSING & FIXING**  
**Date:** 2026-02-02

---

## 🚨 COMMON BUILD FAILURE CAUSES

### 1. **PWA Plugin Incompatibility** ⚠️
**Problem:** `@ducanh2912/next-pwa` is incompatible with `output: 'export'`  
**Error:** Build fails when trying to generate service worker for static export

### 2. **Netlify Plugin Conflict** ⚠️
**Problem:** `@netlify/plugin-nextjs` expects server-side rendering, not static export  
**Error:** Plugin tries to create serverless functions that don't exist

### 3. **Build Script Issues** ⚠️
**Problem:** `scripts/ensure-pwa-assets.js` may fail or cause issues  
**Error:** Pre-build script fails, blocking the main build

---

## ✅ SOLUTION: SIMPLIFIED BUILD CONFIGURATION

I'll provide two options:

### **Option A: Remove PWA (Recommended for Quick Fix)**
- Fastest solution
- Guaranteed to work
- Can add PWA back later

### **Option B: Keep PWA with Workarounds**
- More complex
- May require additional testing
- PWA features preserved

---

## 🚀 OPTION A: REMOVE PWA (RECOMMENDED)

This is the fastest way to get your build working.

### Step 1: Update `next.config.js`

**Replace entire file with:**

```javascript
/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Static export for Netlify
  output: 'export',
  
  // Required for static export
  images: {
    unoptimized: true,
  },
  
  // Disable trailing slashes (optional)
  trailingSlash: true,
  
  // React strict mode
  reactStrictMode: true,
  
  // Webpack configuration
  webpack: (config) => {
    config.resolve.modules = config.resolve.modules || [];
    config.resolve.modules.push(path.join(__dirname, 'node_modules'));
    return config;
  },
};

module.exports = nextConfig;
```

### Step 2: Update `package.json` Build Script

**Change from:**
```json
"build": "node scripts/ensure-pwa-assets.js && next build --webpack"
```

**To:**
```json
"build": "next build"
```

### Step 3: Update `web/netlify.toml`

**Remove this section if it exists:**
```toml
[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Step 4: Test Build Locally

```bash
cd web
npm run build
```

**Expected output:**
```
✓ Generating static pages (X/X)
✓ Finalizing page optimization
✓ Collecting build traces
✓ Build completed successfully
```

### Step 5: Deploy

```bash
git add .
git commit -m "fix: remove PWA for static export compatibility"
git push origin main
```

---

## 🔄 OPTION B: KEEP PWA (ADVANCED)

If you need PWA features, use this approach.

### Step 1: Conditional PWA Configuration

**Update `next.config.js`:**

```javascript
/** @type {import('next').NextConfig} */
const path = require('path');

// Only use PWA in development or non-export builds
const withPWA = process.env.DISABLE_PWA === 'true' 
  ? (config) => config 
  : require('@ducanh2912/next-pwa').default({
      dest: 'public',
      disable: process.env.NODE_ENV === 'development',
      register: true,
      skipWaiting: true,
    });

const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.modules = config.resolve.modules || [];
    config.resolve.modules.push(path.join(__dirname, 'node_modules'));
    return config;
  },
};

module.exports = withPWA(nextConfig);
```

### Step 2: Update Build Script

```json
"build": "DISABLE_PWA=true next build"
```

### Step 3: Update Netlify Environment

In Netlify dashboard:
1. Go to **Site settings** → **Environment variables**
2. Add: `DISABLE_PWA` = `true`

---

## 🔍 DEBUGGING BUILD FAILURES

### Check Netlify Build Logs

1. Go to **Deploys** tab in Netlify
2. Click on the failed deploy
3. Scroll to the error message
4. Look for:
   - `Error: ...`
   - `Module not found: ...`
   - `Build failed with exit code ...`

### Common Error Messages

#### Error: "Cannot use 'output: export' with PWA"
**Fix:** Use Option A (remove PWA)

#### Error: "Module not found: Can't resolve '@ducanh2912/next-pwa'"
**Fix:** Run `npm install` in web directory

#### Error: "scripts/ensure-pwa-assets.js not found"
**Fix:** Update build script to just `next build`

#### Error: "Build exceeded maximum time limit"
**Fix:** Simplify build (remove unnecessary plugins)

---

## 📊 VERIFICATION CHECKLIST

After applying fixes, verify:

- [ ] `next.config.js` has `output: 'export'`
- [ ] `next.config.js` has `images: { unoptimized: true }`
- [ ] `package.json` build script is simplified
- [ ] No PWA plugin (or conditionally disabled)
- [ ] No `@netlify/plugin-nextjs` in netlify.toml
- [ ] Local build succeeds: `npm run build`
- [ ] `out/` directory is generated
- [ ] `out/ArchitectCommandCenter.html` exists

---

## 🚀 QUICK FIX COMMANDS

Run these commands to apply Option A (recommended):

```bash
# Navigate to web directory
cd web

# Test build locally first
npm run build

# If successful, commit and push
git add .
git commit -m "fix: simplify build for static export"
git push origin main
```

---

## 📞 NEED MORE HELP?

If build still fails, provide:

1. **Full error message** from Netlify build logs
2. **Build command** used
3. **Node version** in Netlify (should be 18)
4. **Publish directory** setting (should be `out`)

---

**I'll now apply Option A (recommended fix) to your configuration files.**

