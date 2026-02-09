# Master password (Architect only)

**One permanent password to access the app from any device, anytime.**

- **Password:** `PFF-Master-7Apr2026-K9xL2nQ`
- It never expires. Save it somewhere safe (e.g. password manager).
- On the first page, click **"Log in with master password"**, enter this password, then tap **Log in**. You will be taken to the app and can use it from that device until you clear site data.

To change the password later: run in Supabase SQL Editor (replace `NEW_PASSWORD` with your new password):

```sql
UPDATE public.master_access
SET password_hash = encode(digest('NEW_PASSWORD', 'sha256'), 'hex')
WHERE id = 1;
```

Requires the `pgcrypto` extension (already enabled by the migration).
