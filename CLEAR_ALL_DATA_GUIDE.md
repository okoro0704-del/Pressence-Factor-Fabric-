# 🗑️ Clear All Data - Fresh Start Guide

This guide explains how to completely clear all PFF Protocol data from both the frontend and Supabase database to start fresh.

---

## 📋 **What Will Be Cleared**

### **Frontend (Browser)**
- ✅ localStorage (biometric hashes, sovereign seed, device anchors)
- ✅ sessionStorage (temporary session data)
- ✅ Cookies (authentication tokens)
- ✅ IndexedDB (offline data storage)
- ✅ Service Worker cache (cached pages and assets)

### **Backend (Supabase)**
- ✅ All user profiles and identity data
- ✅ All biometric verification records
- ✅ All login requests and sessions
- ✅ All financial transactions and wallets
- ✅ All vitalization logs and VIDA distributions

---

## 🚀 **Step 1: Clear Frontend Data**

Open browser DevTools (F12) → Console tab → Paste and run:

```javascript
localStorage.clear();
sessionStorage.clear();
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
indexedDB.databases().then(dbs => dbs.forEach(db => indexedDB.deleteDatabase(db.name)));
caches.keys().then(names => names.forEach(name => caches.delete(name)));
navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(reg => reg.unregister()));
console.log('✅ All frontend data cleared!');
location.reload();
```

---

## 🗄️ **Step 2: Clear Supabase Database**

1. Go to: https://supabase.com/dashboard
2. Select your PFF Protocol project
3. Navigate to: **SQL Editor**
4. Copy the contents of `supabase/CLEAR_ALL_DATA.sql`
5. Paste into SQL Editor
6. Click **"Run"**
7. Wait for confirmation (all row counts = 0)

---

## ✅ **Verification**

### Frontend:
```javascript
console.log('localStorage:', localStorage.length); // Should be 0
console.log('sessionStorage:', sessionStorage.length); // Should be 0
```

### Supabase:
```sql
SELECT COUNT(*) FROM public.user_profiles; -- Should be 0
```

---

**🎉 You're now ready to start fresh!**
