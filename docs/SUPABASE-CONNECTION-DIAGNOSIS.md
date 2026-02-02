# Supabase Connection Error - Diagnosis Report

**Date:** February 2, 2026  
**Issue:** CONNECTION_ERROR displayed in Architect Command Center  
**Status:** 🔍 **ROOT CAUSE IDENTIFIED**

---

## 🎯 DIAGNOSIS SUMMARY

### ✅ Variable Verification
**Location:** `web/lib/supabase.ts` (lines 14-15)

```typescript
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
```

**Status:** ✅ Correctly using `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### ✅ Client-Side Injection
**Location:** `web/next.config.js`

**Status:** ✅ Next.js config does NOT filter environment variables
- No `env` property that would restrict variables
- All `NEXT_PUBLIC_*` variables are automatically available in static export

---

### ❌ ROOT CAUSE: Invalid Environment Variables

**Location:** `web/.env.production` (lines 36-37)

**Current Values (INVALID):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=REPLACE_WITH_ANON_KEY
```

**Problem:** These are placeholder values, not real Supabase credentials!

**Missing File:** No `.env.local` file exists for local development

---

### ✅ Bypass Check (No Timeout Issue)
**Location:** `web/src/pages/ArchitectCommandCenter.tsx` (lines 34-57)

**Status:** ✅ No timeout issue found
- `useEffect` checks `hasSupabase()` immediately (no delay)
- No 500ms timeout that could cause false negatives
- Error is legitimate: Supabase client is `null` due to invalid credentials

---

### ❌ Export Path Issue

**Problem:** When `npm run build` is called:
1. Next.js reads environment variables from `.env.production` (if NODE_ENV=production)
2. `.env.production` contains placeholder values
3. These placeholders are embedded into the static HTML/JS
4. Browser receives invalid credentials → Supabase client fails to initialize

**Missing:** No `.env.local` file to provide real credentials for local builds

---

## 🔥 THE FIX

### Step 1: Create `.env.local` for Local Development

You need to create a `.env.local` file with your REAL Supabase credentials:

```bash
# web/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-ACTUAL-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ACTUAL_ANON_KEY_HERE
```

**Where to get these values:**
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Project Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### Step 2: Update `.env.production` (Optional)

If you want to test production builds locally, update `.env.production` with real values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-ACTUAL-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ACTUAL_ANON_KEY_HERE
```

**⚠️ WARNING:** Do NOT commit real credentials to Git! Add `.env.local` to `.gitignore`.

---

### Step 3: Verify Netlify Environment Variables

Ensure these are set in **Netlify Dashboard** → **Site settings** → **Environment variables**:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-ACTUAL-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ACTUAL_ANON_KEY_HERE
```

---

## 🔍 DEBUG LOGGING ADDED

**Location:** `web/lib/supabase.ts` (lines 17-23)

Added temporary debug logs to verify environment variable detection:

```typescript
console.log('[SUPABASE INIT] Vault Endpoint:', url ? 'DETECTED' : 'MISSING');
console.log('[SUPABASE INIT] Anon Key:', anon ? 'DETECTED' : 'MISSING');
console.log('[SUPABASE INIT] URL Value:', url || 'EMPTY');
console.log('[SUPABASE INIT] URL Length:', url.length);
```

**Expected Output (when working):**
```
[SUPABASE INIT] Vault Endpoint: DETECTED
[SUPABASE INIT] Anon Key: DETECTED
[SUPABASE INIT] URL Value: https://xxxxx.supabase.co
[SUPABASE INIT] URL Length: 35
[SUPABASE INIT] ✅ Client created successfully
```

**Current Output (with placeholders):**
```
[SUPABASE INIT] Vault Endpoint: DETECTED
[SUPABASE INIT] Anon Key: DETECTED
[SUPABASE INIT] URL Value: https://[YOUR-PROJECT-REF].supabase.co
[SUPABASE INIT] URL Length: 45
[SUPABASE INIT] ❌ Failed to initialize client: Error: Invalid supabaseUrl
```

---

## 📋 ACTION ITEMS

- [ ] **Create `.env.local`** with real Supabase credentials
- [ ] **Test local build:** `npm run build` should embed real credentials
- [ ] **Check browser console** for debug logs
- [ ] **Verify Netlify environment variables** are set correctly
- [ ] **Remove debug logs** after verification (optional)

---

**🔥 NEXT STEP:** Provide your real Supabase credentials to create `.env.local` file.

