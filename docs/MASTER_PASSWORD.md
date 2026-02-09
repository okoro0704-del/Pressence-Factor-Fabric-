# Master password (Architect only)

**One permanent numeric-only password to access the app from any device, anytime.**

- **Password:** `202604070001` (numbers only; the UI accepts digits only)
- It never expires. Save it somewhere safe.
- On the first page, click **"Log in with master password"**, enter this password (digits only), then tap **Log in**. You will be taken to the app and can use it from that device until you clear site data.

To change the password later (use numbers only): run in Supabase SQL Editor (replace `NEW_NUMERIC_PASSWORD` with your new numeric password):

```sql
UPDATE public.master_access
SET password_hash = encode(digest('NEW_NUMERIC_PASSWORD', 'sha256'), 'hex')
WHERE id = 1;
```

Requires the `pgcrypto` extension (already enabled by the migration).
