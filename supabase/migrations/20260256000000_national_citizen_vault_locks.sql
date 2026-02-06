-- National_Vault: 70/30 lock + Diplomatic Lock (hasSignedSovereignClauses).
-- Citizen_Vault: 4/1 lock (4 locked, 1 released via 9-Day Ritual).
-- VITALIZATION_CAP and halving/burn are enforced in application logic.

-- 1) National Reserve (National_Vault): diplomatic flag and 70/30 split columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'national_reserve' AND column_name = 'has_signed_sovereign_clauses') THEN
    ALTER TABLE national_reserve ADD COLUMN has_signed_sovereign_clauses BOOLEAN NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'national_reserve' AND column_name = 'vida_locked_70') THEN
    ALTER TABLE national_reserve ADD COLUMN vida_locked_70 NUMERIC(20, 8) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'national_reserve' AND column_name = 'vida_spendable_30') THEN
    ALTER TABLE national_reserve ADD COLUMN vida_spendable_30 NUMERIC(20, 8) NOT NULL DEFAULT 0;
  END IF;
END $$;
COMMENT ON COLUMN public.national_reserve.has_signed_sovereign_clauses IS 'Diplomatic Lock: if false, the 70%% (vida_locked_70) remains untouchable until Sovereign Clauses are signed.';
COMMENT ON COLUMN public.national_reserve.vida_locked_70 IS '70%% of National_Vault share — locked until has_signed_sovereign_clauses is true.';
COMMENT ON COLUMN public.national_reserve.vida_spendable_30 IS '30%% of National_Vault share — spendable by state.';

-- 2) Citizen Vaults (Citizen_Vault): 4/1 lock — 4 VIDA locked, 1 VIDA released via daily Palm Scan ritual
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'citizen_vaults' AND column_name = 'vida_locked_4') THEN
    ALTER TABLE citizen_vaults ADD COLUMN vida_locked_4 NUMERIC(20, 8) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'citizen_vaults' AND column_name = 'vida_ritual_pool_1') THEN
    ALTER TABLE citizen_vaults ADD COLUMN vida_ritual_pool_1 NUMERIC(20, 8) NOT NULL DEFAULT 0;
  END IF;
END $$;
COMMENT ON COLUMN public.citizen_vaults.vida_locked_4 IS '4 VIDA locked (Citizen Heritage); not released by ritual.';
COMMENT ON COLUMN public.citizen_vaults.vida_ritual_pool_1 IS '1 VIDA released over 10 days via daily Palm Scan ($100/day until $1,000 spendable).';
