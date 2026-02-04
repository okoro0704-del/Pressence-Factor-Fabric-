-- ============================================================================
-- DUAL-SOURCE SOVEREIGN TAX — Treasury Ledger Update
-- foundation_vault_ledger: corporate_royalty_inflow (2%) and national_levy_inflow (3%)
-- for clear auditing. Both deductions happen in Priority Lock before any other splits.
-- ============================================================================

ALTER TABLE public.foundation_vault_ledger
  ADD COLUMN IF NOT EXISTS corporate_royalty_inflow NUMERIC(20, 8) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS national_levy_inflow     NUMERIC(20, 8) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.foundation_vault_ledger.corporate_royalty_inflow IS '2% of worldwide revenue processed through PFF (corporate tribute).';
COMMENT ON COLUMN public.foundation_vault_ledger.national_levy_inflow IS '3% of National Block gross inflow (national levy), deducted before VIDA/DLLR distribution.';
