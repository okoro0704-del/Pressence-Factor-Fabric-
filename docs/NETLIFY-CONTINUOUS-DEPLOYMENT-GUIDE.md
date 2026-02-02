# 🚀 NETLIFY CONTINUOUS DEPLOYMENT GUIDE

**Project:** PFF Architect's Command Center  
**Framework:** Next.js 16 Static Export  
**Date:** 2026-02-02

---

## 📋 PREREQUISITES

Before starting, ensure you have:
- ✅ GitHub/GitLab/Bitbucket account with your PFF repository
- ✅ Netlify account (free tier works perfectly)
- ✅ Your code pushed to a Git repository
- ✅ Next.js configured for static export

---

## 🔧 STEP 1: CONFIGURE NEXT.JS FOR STATIC EXPORT

### 1.1 Update `next.config.js` (or `next.config.mjs`)

Create or update your Next.js config file:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true, // Required for static export
  },
  trailingSlash: true, // Optional: adds trailing slashes to URLs
};

module.exports = nextConfig;
```

**Location:** `web/next.config.js` or `web/next.config.mjs`

### 1.2 Update `package.json` Build Scripts

Add/update your build script in `web/package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "export": "next build",
    "lint": "next lint"
  }
}
```

---

## 🌐 STEP 2: CONNECT REPOSITORY TO NETLIFY

### Option A: Via Netlify Dashboard (Recommended)

1. **Go to Netlify Dashboard**
   - Visit: https://app.netlify.com/
   - Click **"Add new site"** → **"Import an existing project"**

2. **Connect Git Provider**
   - Choose your Git provider (GitHub, GitLab, or Bitbucket)
   - Authorize Netlify to access your repositories
   - Select your PFF repository

3. **Configure Build Settings**
   - **Base directory:** `web` (if your Next.js app is in the `web` folder)
   - **Build command:** `npm run build` or `yarn build`
   - **Publish directory:** `web/out` (or just `out` if base directory is `web`)
   - **Branch to deploy:** `main` or `master`

4. **Click "Deploy site"**

### Option B: Via Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Navigate to your web directory
cd web

# Initialize Netlify
netlify init

# Follow the prompts:
# - Create & configure a new site
# - Choose your team
# - Site name: pff-command-center (or your preferred name)
# - Build command: npm run build
# - Publish directory: out
```

---

## ⚙️ STEP 3: CREATE NETLIFY CONFIGURATION FILE

Create `netlify.toml` in your **repository root** (not in `web` folder):

```toml
# Netlify Configuration File
# Location: /netlify.toml (repository root)

[build]
  # Base directory for the build
  base = "web"
  
  # Build command
  command = "npm run build"
  
  # Publish directory (relative to base)
  publish = "out"

[build.environment]
  # Node version
  NODE_VERSION = "18"
  
  # Next.js telemetry
  NEXT_TELEMETRY_DISABLED = "1"

# Redirect rules for SPA routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  force = false

# Headers for security and caching
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

---

## 🔄 STEP 4: ENABLE CONTINUOUS DEPLOYMENT

### 4.1 Automatic Deploys on Git Push

Once connected, Netlify automatically:
- ✅ Detects commits to your main branch
- ✅ Runs the build command
- ✅ Deploys the static files
- ✅ Provides a unique URL for each deploy

### 4.2 Deploy Previews for Pull Requests

Enable deploy previews in Netlify settings:

1. Go to **Site settings** → **Build & deploy** → **Deploy contexts**
2. Enable **"Deploy previews"**
3. Choose **"Any pull request against your production branch"**

Now every PR gets a unique preview URL!

---

## 🎯 STEP 5: CONFIGURE ENVIRONMENT VARIABLES (Optional)

If you have environment variables:

1. Go to **Site settings** → **Build & deploy** → **Environment**
2. Click **"Add variable"**
3. Add your variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.yourbackend.com
   NEXT_PUBLIC_SITE_URL=https://pff-command-center.netlify.app
   ```

**Note:** Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser in Next.js.

---

## 📦 STEP 6: VERIFY BUILD LOCALLY

Before pushing, test your build locally:

```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Build for production
npm run build

# Check the output directory
ls -la out/

# Test locally with a static server
npx serve out
```

Visit `http://localhost:3000` to verify the build works.

---

## 🚀 STEP 7: DEPLOY!

### First Deployment

```bash
# Commit your changes
git add .
git commit -m "feat: configure Netlify continuous deployment"

# Push to main branch
git push origin main
```

Netlify will automatically:
1. Detect the push
2. Start the build
3. Deploy to production
4. Provide a URL like: `https://pff-command-center.netlify.app`

### Subsequent Deployments

Every time you push to `main`:
```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

Netlify automatically rebuilds and deploys! 🎉

---

## 🔍 STEP 8: MONITOR BUILDS

### Via Netlify Dashboard

1. Go to **Deploys** tab
2. See real-time build logs
3. Check deploy status (Success/Failed)
4. View deploy preview URLs

### Via Netlify CLI

```bash
# Check deploy status
netlify status

# View recent deploys
netlify deploy --list

# Open site in browser
netlify open:site
```

---

## 🛠️ TROUBLESHOOTING

### Build Fails with "Command not found"

**Solution:** Ensure `package.json` has the correct build script:
```json
{
  "scripts": {
    "build": "next build"
  }
}
```

### Build Succeeds but Site is Blank

**Solution:** Check publish directory in `netlify.toml`:
```toml
[build]
  publish = "out"  # Should match Next.js output directory
```

### 404 on Page Refresh

**Solution:** Add redirect rule in `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Build Takes Too Long

**Solution:** Add build timeout in `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "out"
  
[build.processing]
  skip_processing = false
```

---

## 🎨 STEP 9: CUSTOM DOMAIN (Optional)

### Add Custom Domain

1. Go to **Domain settings** → **Add custom domain**
2. Enter your domain: `command.pff.world`
3. Follow DNS configuration instructions
4. Netlify provides free SSL certificate

### DNS Configuration

Add these records to your DNS provider:

```
Type: A
Name: @
Value: 75.2.60.5

Type: CNAME
Name: www
Value: pff-command-center.netlify.app
```

---

## 📊 CONTINUOUS DEPLOYMENT WORKFLOW

```
┌─────────────────┐
│  Code Changes   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Git Commit    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Git Push      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Netlify Detects │
│   New Commit    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Run Build Cmd  │
│ npm run build   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Build Success  │
│   Generate out/ │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deploy to CDN   │
│  Global Edge    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Site Live!    │
│ https://...app  │
└─────────────────┘
```

---

## ✅ CHECKLIST

- [ ] Next.js configured with `output: 'export'`
- [ ] `netlify.toml` created in repository root
- [ ] Repository connected to Netlify
- [ ] Build settings configured correctly
- [ ] Local build tested successfully
- [ ] First deployment successful
- [ ] Custom domain configured (optional)
- [ ] Deploy previews enabled for PRs
- [ ] Environment variables added (if needed)

---

## 🎉 SUCCESS!

Your PFF Architect's Command Center now has:
- ✅ **Automatic deployments** on every push
- ✅ **Deploy previews** for pull requests
- ✅ **Global CDN** distribution
- ✅ **Free SSL** certificate
- ✅ **Instant rollbacks** if needed

**Every push to `main` = Automatic deployment!** 🚀

---

**THE ARCHITECT'S COMMAND CENTER IS NOW LIVE ON NETLIFY.**

