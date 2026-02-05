-- Auto-Mint on Signup: when Face Pulse + Constitution are accepted, set balance to 5.00 and is_minted to true.
-- Trigger runs after INSERT on legal_approvals (constitution signed).

-- 1) Add is_minted to user_profiles if not present
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_minted BOOLEAN DEFAULT false;
COMMENT ON COLUMN public.user_profiles.is_minted IS 'true after constitution signed and 5 VIDA granted (auto-mint on signup).';

-- 2) Function: on constitution sign, set sovereign_internal_wallets.vida_cap_balance = 5 and user_profiles.is_minted = true
CREATE OR REPLACE FUNCTION public.on_constitution_signed_auto_mint()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  anchor text;
  uid uuid;
BEGIN
  anchor := TRIM(NEW.identity_anchor);
  IF anchor = '' THEN
    RETURN NEW;
  END IF;

  -- Get user_profiles.id for this phone (if exists)
  SELECT id INTO uid FROM user_profiles WHERE phone_number = anchor LIMIT 1;

  -- Upsert sovereign_internal_wallets: set vida_cap_balance to 5.00 (initial grant)
  INSERT INTO sovereign_internal_wallets (phone_number, dllr_balance, usdt_balance, vida_cap_balance, updated_at)
  VALUES (anchor, 0, 0, 5.00, NOW())
  ON CONFLICT (phone_number)
  DO UPDATE SET
    vida_cap_balance = GREATEST(sovereign_internal_wallets.vida_cap_balance, 5.00),
    updated_at = NOW();

  -- Mark user_profiles.is_minted = true (by phone_number; user_profiles may use phone_number as key)
  UPDATE user_profiles
  SET is_minted = true, updated_at = NOW()
  WHERE phone_number = anchor;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'on_constitution_signed_auto_mint failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.on_constitution_signed_auto_mint() IS 'Auto-mint: on constitution sign, set balance to 5 VIDA and is_minted true.';

-- 3) Trigger on legal_approvals AFTER INSERT
DROP TRIGGER IF EXISTS after_legal_approvals_insert_auto_mint ON legal_approvals;
CREATE TRIGGER after_legal_approvals_insert_auto_mint
  AFTER INSERT ON legal_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.on_constitution_signed_auto_mint();
