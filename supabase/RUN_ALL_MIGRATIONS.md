# All SQL migrations – run in this order

> **⚠️ DO NOT RUN THIS FILE IN THE SUPABASE SQL EDITOR**
> This is a **documentation file** (Markdown), not SQL. Running it will cause a syntax error. Open the **.sql** files listed below, one at a time, in the SQL Editor.

**Important:** Run **one migration at a time** in the Supabase SQL Editor. Open each **.sql** file from `supabase/migrations/`, copy its contents (or run the file), then do the next. Do not paste multiple migration files into a single query.

If a migration fails (e.g. table already exists), you can skip it and continue.

---

## 1. Migration order (filenames)

Run each file in `supabase/migrations/` in this order:

1. `20260128000000_add_nation_to_presence_handshakes.sql`
2. `20260128100000_fix_presence_handshakes_columns.sql`
3. `20260128120000_foundation_vault_ledger.sql`
4. `20260202_create_national_block_reserves.sql`
5. `20260203000000_strict_biometric_matching.sql`
6. `20260203100000_identity_mismatch_alerts.sql`
7. `20260203200000_zero_persistence_session.sql`
8. **`20260203300000_multi_device_vitalization.sql`** ← creates `user_profiles`
9. `20260203400000_family_tree_inheritance.sql`
10. `20260204000000_sovereign_internal_wallets.sql`
11. `20260205000000_national_revenue_and_royalty_audit.sql`
12. `20260206000000_pff_partner_applications.sql`
13. `20260207000000_dual_source_sovereign_tax.sql`
14. `20260208000000_pff_sentinel_activations.sql`
15. `20260209000000_sentinel_licenses_and_business_ledger.sql`
16. `20260210000000_sentinel_security_tokens.sql`
17. `20260211000000_admin_roles_and_audit.sql`
18. `20260212000000_system_settings.sql`
19. `20260213000000_legal_approvals.sql`
20. `20260214000000_national_ballot_and_elections.sql`
21. `20260215000000_handle_new_user_and_genesis.sql`
22. `20260216000000_recovery_seed_columns.sql`
23. `20260217000000_referral_threshold_and_sentinel_staff.sql`
24. `20260218000000_reload_pgrst_schema.sql`
25. `20260219000000_save_recovery_seed_rpc.sql`
26. `20260220000000_recovery_seed_user_profile.sql`
27. `20260228000000_legal_approvals_signature_device.sql`
28. `20260229000000_external_scanner_tagging.sql`
29. `20260230000000_face_hash_user_profiles.sql`
30. `20260231000000_humanity_score_user_profiles.sql`
31. `20260232000000_evg_enterprise_verification_gateway.sql`
32. `20260233000000_mint_status_user_profiles.sql`
33. `20260234000000_auto_mint_on_constitution.sql`
34. `20260235000000_identity_bound_and_spending_unlocked.sql`
35. `20260236000000_user_profiles_rls_face_hash_rpc.sql`
36. `20260237000000_verified_vida_mint_receipt.sql`
37. `20260238000000_relayer_gas_alerts.sql`
38. `20260240000000_login_requests.sql`
39. `20260241000000_sentinel_device_limit_user_profiles.sql`
40. `20260242000000_sentinel_remote_commands.sql`
41. `20260243000000_login_requests_delete_policy.sql`
42. `20260244000000_sovereign_ledger_transaction_label.sql`
43. **`20260245000000_user_profiles_country_code.sql`** ← adds `country_code`
44. **`20260246000000_user_profiles_spendable_vida.sql`** ← adds `spendable_vida` (Treasury display; default 1 VIDA)
45. **`20260247000000_sovereign_ledger_phone_number.sql`** ← adds `phone_number` to sovereign_ledger (Recent Activity filter)

---

## 2. Minimal SQL (only `user_profiles` + `country_code`)

If you only need **`user_profiles`** and **`country_code`** (e.g. fresh project), run the two blocks below.

### Step A – Create `user_profiles` and related tables

Open and run the full contents of:

**`supabase/migrations/20260203300000_multi_device_vitalization.sql`**

(It creates `vitalization_requests`, `authorized_devices`, `user_profiles`, `guardian_recovery_requests`, `guardian_approvals`, indexes, RLS, triggers, views.)

### Step B – Add `country_code` to `user_profiles`

Run this in the SQL Editor (safe if `user_profiles` is missing; it will no-op until the table exists):

```sql
-- Globalize: country_code for VIDA distribution tracking.
-- No-op if user_profiles does not exist yet.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS country_code TEXT;

    COMMENT ON COLUMN public.user_profiles.country_code IS 'ISO 3166-1 alpha-2 (e.g. NG, US, GB). Set from phone country picker at verification for global distribution analytics.';

    CREATE INDEX IF NOT EXISTS idx_user_profiles_country_code
    ON public.user_profiles(country_code)
    WHERE country_code IS NOT NULL;
  END IF;
END $$;
```

---

## 3. Sovereign ledger (optional)

If you use the sovereign swap and need **`sovereign_ledger`** and **`transaction_label`**, run:

**`supabase/migrations/20260244000000_sovereign_ledger_transaction_label.sql`**

That file creates `sovereign_ledger` (if not exists) and adds `transaction_label`.
