# Option C: One-off migration guide

> **⚠️ DO NOT paste this file into the Supabase SQL Editor.** This is a guide. In the SQL Editor, run only the contents of **.sql** files from `supabase/migrations/` (one file at a time, in the order listed).

Use this when you want to **run all migrations once** on your Supabase project (e.g. fresh project or fixing 404/406 errors).

---

## Prerequisites

- A Supabase project (e.g. `xbpomcmkzwunozrsbqxf.supabase.co`).
- Either:
  - **Path A:** Supabase Dashboard access (browser), or  
  - **Path B:** [Supabase CLI](https://supabase.com/docs/guides/cli) installed and logged in.

---

## Path A: One-off via Supabase Dashboard (no CLI)

**1. Open your project**

- Go to [supabase.com/dashboard](https://supabase.com/dashboard) → your project.
- Click **SQL Editor** in the left sidebar.

**2. Run migrations one file at a time**

- In your repo, open `supabase/migrations/`.
- Run the files **in this exact order** (by filename):

| # | Filename |
|---|----------|
| 1 | `20260128000000_add_nation_to_presence_handshakes.sql` |
| 2 | `20260128100000_fix_presence_handshakes_columns.sql` |
| 3 | `20260128120000_foundation_vault_ledger.sql` |
| 4 | `20260202_create_national_block_reserves.sql` |
| 5 | `20260203000000_strict_biometric_matching.sql` |
| 6 | `20260203100000_identity_mismatch_alerts.sql` |
| 7 | `20260203200000_zero_persistence_session.sql` |
| 8 | `20260203300000_multi_device_vitalization.sql` |
| 9 | `20260203400000_family_tree_inheritance.sql` |
| 10 | `20260204000000_sovereign_internal_wallets.sql` |
| 11 | `20260205000000_national_revenue_and_royalty_audit.sql` |
| 12 | `20260206000000_pff_partner_applications.sql` |
| 13 | `20260207000000_dual_source_sovereign_tax.sql` |
| 14 | `20260208000000_pff_sentinel_activations.sql` |
| 15 | `20260209000000_sentinel_licenses_and_business_ledger.sql` |
| 16 | `20260210000000_sentinel_security_tokens.sql` |
| 17 | `20260211000000_admin_roles_and_audit.sql` |
| 18 | `20260212000000_system_settings.sql` |
| 19 | `20260213000000_legal_approvals.sql` |
| 20 | `20260214000000_national_ballot_and_elections.sql` |
| 21 | `20260215000000_handle_new_user_and_genesis.sql` |
| 22 | `20260216000000_recovery_seed_columns.sql` |
| 23 | `20260217000000_referral_threshold_and_sentinel_staff.sql` |
| 24 | `20260218000000_reload_pgrst_schema.sql` |
| 25 | `20260219000000_save_recovery_seed_rpc.sql` |
| 26 | `20260220000000_recovery_seed_user_profile.sql` |
| 27 | `20260228000000_legal_approvals_signature_device.sql` |
| 28 | `20260228000000_unified_profiles_realtime.sql` |
| 29 | `20260229000000_external_scanner_tagging.sql` |
| 30 | `20260230000000_face_hash_user_profiles.sql` |
| 31 | `20260231000000_humanity_score_user_profiles.sql` |
| 32 | `20260232000000_evg_enterprise_verification_gateway.sql` |
| 33 | `20260233000000_mint_status_user_profiles.sql` |
| 34 | `20260234000000_auto_mint_on_constitution.sql` |
| 35 | `20260235000000_identity_bound_and_spending_unlocked.sql` |
| 36 | `20260236000000_user_profiles_rls_face_hash_rpc.sql` |
| 37 | `20260237000000_verified_vida_mint_receipt.sql` |
| 38 | `20260238000000_relayer_gas_alerts.sql` |
| 39 | `20260240000000_login_requests.sql` |
| 40 | `20260241000000_sentinel_device_limit_user_profiles.sql` |
| 41 | `20260242000000_sentinel_remote_commands.sql` |
| 42 | `20260243000000_login_requests_delete_policy.sql` |
| 43 | `20260244000000_sovereign_ledger_transaction_label.sql` |
| 44 | `20260245000000_user_profiles_country_code.sql` |
| 45 | `20260246000000_user_profiles_spendable_vida.sql` |
| 46 | `20260247000000_sovereign_ledger_phone_number.sql` |
| 47 | `20260248000000_user_profiles_biometric_hash.sql` |
| 48 | `20260248000000_user_profiles_biometric_strictness.sql` |
| 49 | `20260249000000_day_zero_and_master_architect.sql` |
| 50 | `20260250000000_master_architect_locked_vida_device_model.sql` |
| 51 | `20260251000000_login_requests_pairing_bridge.sql` |
| 52 | `20260252000000_trust_level_and_device_terminate.sql` |
| 53 | `20260252000000_trust_level_soft_start.sql` |
| 54 | `20260253000000_vitalization_9day_ritual.sql` |
| 55 | `20260254000000_palm_hash_user_profiles.sql` |
| 56 | `20260254000000_user_profiles_palm_hash.sql` |
| 57 | `20260255000000_sentinel_activation_debit_and_status.sql` |
| 58 | `20260255000000_waitlist.sql` |
| 59 | `20260256000000_national_citizen_vault_locks.sql` |
| 60 | `20260257000000_add_verified_at_presence_handshakes.sql` |
| 61 | `20260258000000_presence_handshakes_liveness_verified_at.sql` |
| 62 | `20260259000000_presence_handshakes_optional_columns.sql` |
| 63 | `20260260000000_sovereign_memory_vault.sql` |
| 64 | `20260261000000_memory_vault_vibration_scope.sql` |
| 65 | `20260262000000_quad_pillar_work_site.sql` |
| 66 | `20260263000000_sovereign_device_handshake.sql` |
| 67 | `20260263100000_device_registry.sql` |
| 68 | `20260264000000_initial_release_sentinel_auto_debit.sql` |
| 69 | `20260265000000_ledger_stats.sql` |
| 70 | `20260266000000_user_balances.sql` |
| 71 | `20260267000000_four_pillars_anchor.sql` |
| 72 | `20260268000000_save_at_75_vitalized.sql` |
| 73 | `20260269000000_add_anchor_columns_if_missing.sql` |
| 74 | `20260270000000_access_codes.sql` |
| 75 | `20260271000000_master_password.sql` |
| 76 | `20260272000000_master_password_numeric_only.sql` |
| 77 | `20260273000000_master_password_update_rpc.sql` |
| 78 | `20260274000000_citizen_root_master_identity_anchor.sql` |
| 79 | `20260275000000_user_profiles_sovereign_root.sql` |
| 80 | `20260276000000_foundation_vault_ledger_face_hash.sql` |
| 81 | `20260277000000_device_anchors.sql` |
| 82 | `20260278000000_get_vitalization_status_rpc.sql` |
| 83 | `20260279000000_vitalization_mint_5_nation_5_citizen.sql` |
| 84 | `20260280000000_national_treasury_feed_rpc.sql` |

**For each file:**

1. Open `supabase/migrations/<filename>` in your editor.
2. Copy the **entire** contents (Ctrl+A, Ctrl+C).
3. In Supabase **SQL Editor**, paste and click **Run**.
4. If you see “already exists” or similar, you can **skip** that migration and continue.
5. Repeat for the next file in the list.

**Tip:** Use two windows: one with the migrations folder open, one with the Supabase SQL Editor. That way you can run them in order without losing your place.

---

## Path B: One-off via Supabase CLI (single command)

**1. Install Supabase CLI** (if needed)

- **Windows (PowerShell):**  
  `scoop install supabase`  
  or download from [GitHub Releases](https://github.com/supabase/cli/releases).
- **npm:**  
  `npm install -g supabase`

**2. Log in and link the project**

In PowerShell (or your terminal), from the **project root** (where `supabase/` lives):

```powershell
cd "c:\Users\Hp\Desktop\PFF - Copy"
supabase login
supabase link --project-ref xbpomcmkzwunozrsbqxf
```

Use your **Project ref** from: Dashboard → Project Settings → General → Reference ID.

**3. Push all migrations once**

```powershell
supabase db push
```

This applies every migration in `supabase/migrations/` that has **not** been run yet. It’s the one-off command: run it once and you’re done.

**4. Confirm**

- In the Dashboard: **Database** → **Tables** — you should see `user_profiles`, `ledger_stats`, `national_block_reserves`, `vitalization_requests`, `authorized_devices`, etc.
- Or run a quick query in SQL Editor:  
  `SELECT 1 FROM ledger_stats LIMIT 1;`  
  It should run without “relation does not exist”.

---

## If something fails

- **“relation already exists” / “already exists”**  
  That migration (or part of it) was already applied. Skip that file (Dashboard) or let CLI skip it; continue with the next.

- **“column does not exist”**  
  An earlier migration that adds that column wasn’t run or failed. Run the migrations in order from the list above.

- **Permission / RLS errors**  
  Run the migrations as a user that can create tables and run DDL (e.g. Dashboard SQL Editor uses the project’s DB role). Don’t run them as a restricted app user.

---

## Summary

| Method              | Steps                                                                 |
|---------------------|-----------------------------------------------------------------------|
| **Dashboard (Path A)** | Open SQL Editor → run each of the 84 files in order (copy/paste → Run). |
| **CLI (Path B)**       | `supabase login` → `supabase link --project-ref YOUR_REF` → `supabase db push`. |

Do this **once**; after that, your app should stop hitting 404/406 for `ledger_stats`, `national_block_reserves`, `vitalization_requests`, `authorized_devices`, etc.
