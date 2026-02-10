# VIDA CAP Mint and Sovryn Chain

## How the mint works

The **10 VIDA CAP** mint (5 to citizen, 5 to nation) is **internal only**: it updates Supabase tables (`sovereign_internal_wallets`, `national_block_reserves`, `foundation_vault_ledger`). It does **not** call the Sovryn chain or any blockchain. Your balance is stored in `sovereign_internal_wallets.vida_cap_balance`.

**Sovryn chain** is used later when you convert or withdraw (e.g. VIDA → DLLR, or send to an external wallet). The in-app “mint” does not depend on Sovryn being connected.

## What can block the mint

1. **Constitution not signed** — You must sign the Sovereign Constitution (Settings → Sign Constitution) with biometrics. The app now checks multiple phone formats so a mismatch (e.g. +234 vs 234) does not block.
2. **Humanity score** — Your profile must have `humanity_score = 1.0` (set when you complete vitalization). If you are already VITALIZED, the mint flow backfills this.
3. **“Already minted” guard** — Mint runs only once per identity. The guard now looks only at `foundation_vault_ledger` (not `user_profiles.is_minted`), so an old/stale `is_minted` flag no longer blocks a first real mint.
4. **Wallet** — `getOrCreateSovereignWallet(phone)` must succeed. If the row does not exist, it is created; if Supabase RLS blocks insert/update, mint will fail (check Netlify/Supabase logs).

## If mint still does not confirm

- On the **Dashboard**, if the mint fails you will see a banner: **“Mint not confirmed: [reason]”** and the same message is logged in the browser console (F12 → Console).
- In **Supabase**: check `legal_approvals` (row with your `identity_anchor` and `constitution_version = '1.0'`), `user_profiles` (your `phone_number`, `vitalization_status = 'VITALIZED'`, `humanity_score = 1`), and `foundation_vault_ledger` (no existing `citizen_id` = your phone with `source_type = 'seigniorage'`).
- Ensure **RLS** allows the anon (or authenticated) key to: read `legal_approvals`, read/update `user_profiles`, read/insert `foundation_vault_ledger`, read/update/insert `sovereign_internal_wallets`, and execute `credit_nation_vitalization_vida_cap`.
