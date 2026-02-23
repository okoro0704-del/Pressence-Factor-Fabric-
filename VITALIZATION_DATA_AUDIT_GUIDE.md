# 🔍 VITALIZATION DATA AUDIT & CLEANUP GUIDE

**Date:** February 22, 2026  
**Purpose:** Check current vitalization data state and optionally purge for clean start

---

## 📋 STEP 1: CHECK CURRENT DATA STATE

### **Go to Supabase Dashboard:**
1. Open: https://supabase.com/dashboard
2. Select your PFF project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### **Run Audit Script:**
1. Open the file: `scripts/check-vitalization-data.sql`
2. Copy the **entire contents**
3. Paste into Supabase SQL Editor
4. Click **Run** (or press `Ctrl+Enter`)

### **Review Results:**

The script will show you:

**1. User Profiles Summary:**
- Total records in `user_profiles` table
- How many users are VITALIZED
- How many users are NOT_VITALIZED
- Total spendable VIDA distributed
- Total locked VIDA

**2. Vitalization Log Summary:**
- Total vitalization events
- Success vs Failed vs Pending count
- Total VIDA distributed (citizen + treasury + foundation)
- First and last vitalization timestamps

**3. VIDA Distribution Log Summary:**
- Total distribution records
- Success vs Failed count
- Total VIDA distributed
- First and last distribution timestamps

**4. Sample Data:**
- Last 10 vitalized users
- Last 10 vitalization events
- Last 10 VIDA distributions

---

## 🧹 STEP 2: DECIDE IF CLEANUP IS NEEDED

### **When to Purge Data:**

✅ **Purge if:**
- You want a clean start for testing
- You have test/dummy data from development
- You want to reset all vitalization counters
- You're preparing for production launch

❌ **Don't Purge if:**
- You have real user data
- You're already in production
- You need to preserve audit logs

---

## 🗑️ STEP 3: PURGE DATA (OPTIONAL)

### **⚠️ WARNING: THIS CANNOT BE UNDONE**

If you decide to purge:

1. Open the file: `scripts/purge-vitalization-data.sql`
2. Copy the **entire contents**
3. Paste into Supabase SQL Editor
4. **Review the backup check** (first section shows what will be deleted)
5. Click **Run** (or press `Ctrl+Enter`)

### **What Gets Purged:**

1. **vitalization_log table:** All records deleted
2. **vida_distribution_log table:** All records deleted
3. **user_profiles table:** 
   - `vitalization_status` → 'NOT_VITALIZED'
   - `vitalized_at` → NULL
   - `vitalization_tx_hash` → NULL
   - `spendable_vida` → 0
   - `locked_vida` → 0
   - `is_minted` → false
   - `humanity_score` → 0

### **What's Preserved:**

- User profile records (phone_number, sovereign_id, etc.)
- Other user data (not vitalization-related)
- Table structure and migrations

---

## ✅ STEP 4: VERIFY CLEANUP

After running the purge script, it will automatically verify:

- ✅ `vitalization_log` has 0 records
- ✅ `vida_distribution_log` has 0 records
- ✅ `user_profiles` has 0 VITALIZED users

You should see:
```
✅ VITALIZATION DATA PURGE COMPLETE
Database is ready for clean vitalization testing
```

---

## 🎯 STEP 5: TEST VITALIZATION FLOW

After cleanup (or if data is already clean), test the vitalization flow:

### **1. Navigate to Welcome Page:**
```
https://pff3.netlify.app/welcome
```

### **2. Complete Vitalization:**
- Click "Initialize Camera"
- Allow camera permissions
- Click "Capture Biometric"
- Wait for "Sovereign Vitalized" message

### **3. Verify Database Updates:**

Run this query in Supabase SQL Editor:

```sql
-- Check latest vitalization
SELECT * FROM user_profiles 
WHERE vitalization_status = 'VITALIZED' 
ORDER BY vitalized_at DESC 
LIMIT 1;

-- Check latest vitalization log
SELECT * FROM vitalization_log 
ORDER BY timestamp DESC 
LIMIT 1;

-- Check latest VIDA distribution
SELECT * FROM vida_distribution_log 
ORDER BY timestamp DESC 
LIMIT 1;
```

You should see:
- ✅ User status = 'VITALIZED'
- ✅ spendable_vida = 5.00
- ✅ Vitalization log entry with SUCCESS status
- ✅ VIDA distribution log with 5+5+1 split

---

## 📊 EXPECTED CLEAN STATE

After purge, your database should show:

| Table | Records | Status |
|-------|---------|--------|
| vitalization_log | 0 | ✅ CLEAN |
| vida_distribution_log | 0 | ✅ CLEAN |
| user_profiles (VITALIZED) | 0 | ✅ CLEAN |

---

## 🔧 TROUBLESHOOTING

### **Issue: Tables don't exist**
**Solution:** Run the migrations first:
```sql
-- In Supabase SQL Editor, run these in order:
-- 1. supabase/migrations/20260280000000_vitalization_status.sql
-- 2. supabase/migrations/20260281000000_vitalization_log.sql
-- 3. supabase/migrations/20260282000000_vida_distribution_log.sql
```

### **Issue: Permission denied**
**Solution:** Make sure you're using the service role key in Supabase dashboard

### **Issue: Data still showing after purge**
**Solution:** Refresh the table view or run the verification queries again

---

## 📁 FILES REFERENCE

- **Audit Script:** `scripts/check-vitalization-data.sql`
- **Purge Script:** `scripts/purge-vitalization-data.sql`
- **Migrations:** `supabase/migrations/2026028*.sql`
- **API Endpoint:** `web/src/app/api/sovereign/pulse/route.ts`
- **Distribution Logic:** `web/src/lib/vida/distribution.ts`

---

**Ready to check your data? Run the audit script now!** 🚀

