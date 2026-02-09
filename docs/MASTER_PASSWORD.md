# Master password (Architect only)

**One permanent numeric-only password to access the app from any device, anytime.**

- **Password:** `202604070001` (numbers only; the UI accepts digits only)
- It never expires. Save it somewhere safe.
- **To make it work in production:** In Netlify → Site settings → Environment variables, add `PFF_MASTER_PASSWORD` = `202604070001` (or your chosen numeric password). Then redeploy. The API checks this first, so the password works even before running Supabase migrations.
- On the first page, scroll to the **bottom** to the **Sign in** section. Enter your master password (numbers only) and tap **Log in**. You will be taken to the app.

To change the password later (use numbers only): run in Supabase SQL Editor (replace `NEW_NUMERIC_PASSWORD` with your new numeric password):

```sql
UPDATE public.master_access
SET password_hash = encode(digest('NEW_NUMERIC_PASSWORD', 'sha256'), 'hex')
WHERE id = 1;
```

Requires the `pgcrypto` extension (already enabled by the migration).
