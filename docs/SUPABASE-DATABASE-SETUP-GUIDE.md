# Supabase Database Setup Guide — Architect's Command Center

**Date:** February 2, 2026  
**Status:** 🔧 **DATABASE SETUP REQUIRED**

---

## 🎯 CURRENT STATUS

✅ **Supabase Connection:** Working  
❌ **Database Tables:** Missing  
❌ **Seed Data:** Not loaded

**Errors Found:**
```
Could not find the table 'public.root_sovereign_devices' in the schema cache
Cannot coerce the result to a single JSON object (0 rows in sentinel_telemetry)
```

---

## 🔥 THE FIX: Run SQL Migration in Supabase

### Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project: `xbpomcmkzwunozrsbqxf`
3. Click **SQL Editor** in the left sidebar
4. Click **New query**

---

### Step 2: Copy and Run the Migration Script

**File:** `docs/SUPABASE-SETUP-COMMAND-CENTER.sql`

**Copy the entire contents of this file and paste it into the SQL Editor.**

The script will create:

1. ✅ `sentinel_telemetry` — Live telemetry data for Command Center
2. ✅ `sovereign_audit_log` — Action execution tracking
3. ✅ `root_sovereign_devices` — ROOT_SOVEREIGN_PAIR hardware binding
4. ✅ `national_liquidity_vaults` — National liquidity reserves
5. ✅ Auto-calculate trigger for 50:50 split
6. ✅ Seed data with initial values

---

### Step 3: Execute the Script

1. Click **Run** (or press `Ctrl+Enter`)
2. Wait for execution to complete (~5 seconds)
3. Check for success message: "Success. No rows returned"

---

### Step 4: Verify Tables Created

Run this verification query in SQL Editor:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'sentinel_telemetry',
    'sovereign_audit_log',
    'root_sovereign_devices',
    'national_liquidity_vaults'
  )
ORDER BY table_name;
```

**Expected Output:**
```
table_name
--------------------------
national_liquidity_vaults
root_sovereign_devices
sentinel_telemetry
sovereign_audit_log
```

---

### Step 5: Verify Seed Data

Run this query to check the telemetry data:

```sql
SELECT 
  active_sentinels_total,
  total_tributes_vida,
  state_share_vida,
  citizen_share_vida,
  last_updated
FROM sentinel_telemetry
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
```

**Expected Output:**
```
active_sentinels_total | total_tributes_vida | state_share_vida | citizen_share_vida | last_updated
-----------------------|---------------------|------------------|--------------------|--------------
1678                   | 12847.50000000      | 6423.75000000    | 6423.75000000      | 2026-02-02...
```

---

### Step 6: Enable Row Level Security (RLS) - Optional

For production security, enable RLS on tables:

```sql
-- Enable RLS
ALTER TABLE sentinel_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE sovereign_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE root_sovereign_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE national_liquidity_vaults ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anon key can read)
CREATE POLICY "Allow public read access" ON sentinel_telemetry
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON sovereign_audit_log
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON root_sovereign_devices
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON national_liquidity_vaults
  FOR SELECT USING (true);

-- Allow authenticated insert (for Action Center)
CREATE POLICY "Allow authenticated insert" ON sovereign_audit_log
  FOR INSERT WITH CHECK (true);
```

---

## 🚀 AFTER SETUP

### Test the Command Center

1. **Refresh your browser** (F5)
2. **Check browser console** (F12)
3. **Expected logs:**
   ```
   [SUPABASE INIT] ✅ Client created successfully
   [COMMAND CENTER] Fetching telemetry from Supabase...
   [COMMAND CENTER] Telemetry updated: {...}
   [COMMAND CENTER] Security status updated: {...}
   ```

4. **Verify UI displays:**
   - Active Sentinels: 1,678
   - Total Tributes: 12,847.50 VIDA
   - State Share (50%): 6,423.75 VIDA
   - Citizen Share (50%): 6,423.75 VIDA
   - National Liquidity: Nigeria, Ghana, US, UK vaults

---

## 📋 TROUBLESHOOTING

### Issue: "permission denied for table"

**Solution:** Enable RLS policies (see Step 6 above)

### Issue: "relation already exists"

**Solution:** The table already exists. Skip to verification queries.

### Issue: "function calculate_sovereign_split already exists"

**Solution:** Use `CREATE OR REPLACE FUNCTION` (already in script)

---

## 🔥 QUICK SETUP CHECKLIST

- [ ] Open Supabase Dashboard
- [ ] Go to SQL Editor
- [ ] Copy `docs/SUPABASE-SETUP-COMMAND-CENTER.sql`
- [ ] Paste and run in SQL Editor
- [ ] Verify tables created
- [ ] Verify seed data loaded
- [ ] (Optional) Enable RLS policies
- [ ] Refresh Command Center in browser
- [ ] Verify live data displays

---

**🎯 NEXT STEP:** Run the SQL script in Supabase SQL Editor and report back!

