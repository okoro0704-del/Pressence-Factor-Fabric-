# Run SQL in this order (Supabase SQL Editor)

> **⚠️ DO NOT paste this file into the SQL Editor.** This is a guide. Open each **.sql** file listed below, copy *that* file’s contents, and paste *that* into the SQL Editor.

If you get **"column citizen_id does not exist"**, the `presence_handshakes` table was created with the wrong structure. Use this order.

---

## Option 1: Fresh database (recommended)

Run **one** of these, in order:

### Step 1 – Full schema

1. Open **Supabase Dashboard** → **SQL Editor** → New query.
2. Copy the **entire** contents of `backend/src/db/schema.sql` from this repo.
3. Paste and click **Run**.

That creates all tables, including `presence_handshakes` with `citizen_id` and `nation`.

---

## Option 2: You already have `presence_handshakes` without `citizen_id`

If `presence_handshakes` already exists (e.g. only `id` and `nation`) and you get "column citizen_id does not exist":

### Step 1 – Create `citizens` first (if missing)

Run the **first part** of `backend/src/db/schema.sql` up to and including the `citizens` table and its indexes (lines for `CREATE TABLE citizens` and `CREATE INDEX ... citizens`). Skip guardian_anchor if you don’t need it yet, but you **must** have `citizens`.

### Step 2 – Fix `presence_handshakes`

Run the contents of:

**`supabase/migrations/20260128100000_fix_presence_handshakes_columns.sql`**

That script drops `presence_handshakes` and recreates it with `citizen_id`, `nation`, and all required columns.

### Step 3 – Rest of schema (optional)

If you want the full app (vault, economic layer, etc.), run the remainder of `backend/src/db/schema.sql` (the_living_record, economic tables, etc.) **after** Step 2.

---

## Then

- **Realtime:** In **Database**, find **presence_handshakes** and check the **Realtime enabled** column is ON (or run the `ALTER PUBLICATION supabase_realtime ADD TABLE presence_handshakes;` from the SQL script).
- **Backend:** Use the same Supabase DB and run the backend with `DATABASE_URL` set to your Supabase connection string so handshakes (with `citizen_id` and `nation`) are written by the API.
