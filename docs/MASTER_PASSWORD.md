# Master password (Architect only)

**One permanent numeric-only password to access the app from any device, anytime.**

- **Default password:** `202604070001` (numbers only). Change it to a stronger one in **Settings**.
- **To use your own password:** Log in (with the default if needed), go to **Settings**, find **Change master password**, enter current password, then your new password (numbers only, at least 8 digits). Save it somewhere safe. Use the new password at the bottom of the site from then on.
- **Optional (production):** In Netlify → Environment variables, set `PFF_MASTER_PASSWORD` to your preferred numeric password. That value is checked first when logging in.
- On the first page, scroll to the **bottom** to **Log in with master password**. Enter your password (numbers only) and tap **Log in**.

To change the password later (use numbers only): run in Supabase SQL Editor (replace `NEW_NUMERIC_PASSWORD` with your new numeric password):

```sql
UPDATE public.master_access
SET password_hash = encode(digest('NEW_NUMERIC_PASSWORD', 'sha256'), 'hex')
WHERE id = 1;
```

Requires the `pgcrypto` extension (already enabled by the migration).
