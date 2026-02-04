-- =====================================================
-- REFERRAL THRESHOLD & SENTINEL STAFF
-- When referral_count >= 10: promote CITIZEN -> SENTINEL_STAFF.
-- Staff Bounty: $100 to Corporate Wallet, $30 Salary Payout to Staff VIDA.
-- Architect: Isreal Okoro (mrfundzman)
-- =====================================================

-- 1) referral_count on user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS referral_count INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN user_profiles.referral_count IS 'Number of successful referrals; when >= 10 user is auto-promoted to SENTINEL_STAFF';

CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_count ON user_profiles(referral_count DESC);

-- 2) Referrals table (who referred whom)
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_phone TEXT NOT NULL,
  referred_phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(referred_phone)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_phone);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_phone);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at DESC);

COMMENT ON TABLE referrals IS 'Tracks referrer->referred for counting; one row per referred user.';

-- 3) Sync referral_count when a new referral is inserted
CREATE OR REPLACE FUNCTION sync_referral_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INT;
BEGIN
  SELECT count(*)::INT INTO new_count FROM referrals WHERE referrer_phone = NEW.referrer_phone;
  UPDATE user_profiles SET referral_count = new_count, updated_at = NOW() WHERE phone_number = NEW.referrer_phone;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS after_referral_insert_sync_count ON referrals;
CREATE TRIGGER after_referral_insert_sync_count
  AFTER INSERT ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION sync_referral_count();

-- 4) Add SENTINEL_STAFF to allowed roles
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('CITIZEN', 'GOVERNMENT_ADMIN', 'SENTINEL_OFFICER', 'MASTER_ARCHITECT', 'SENTINEL_STAFF'));

-- 5) Trigger: when referral_count >= 10 and role = CITIZEN -> set role = SENTINEL_STAFF
CREATE OR REPLACE FUNCTION promote_to_sentinel_staff_on_threshold()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_count >= 10 AND COALESCE(OLD.role, 'CITIZEN') = 'CITIZEN' AND NEW.role = 'CITIZEN' THEN
    NEW.role := 'SENTINEL_STAFF';
    INSERT INTO admin_action_logs (actor_identity_anchor, action_type, target_identity_anchor, old_value, new_value, metadata)
    VALUES ('system', 'ROLE_CHANGE', NEW.phone_number, 'CITIZEN', 'SENTINEL_STAFF', jsonb_build_object('reason', 'referral_threshold', 'referral_count', NEW.referral_count));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_profiles_referral_threshold_trigger ON user_profiles;
CREATE TRIGGER user_profiles_referral_threshold_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  WHEN (
    (OLD.referral_count IS DISTINCT FROM NEW.referral_count)
    AND NEW.referral_count >= 10
    AND NEW.role = 'CITIZEN'
  )
  EXECUTE FUNCTION promote_to_sentinel_staff_on_threshold();

-- Allow admin_action_logs actor to be 'system' for auto-promotion
-- (If admin_action_logs has a CHECK on actor, we may need to relax it; otherwise leave as-is.)

-- 6) Corporate Wallet (singleton: receives $100 Sentinel Fee per staff registration)
CREATE TABLE IF NOT EXISTS corporate_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  balance_usd NUMERIC(24, 2) NOT NULL DEFAULT 0,
  balance_vida NUMERIC(24, 8) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT corporate_wallet_singleton CHECK (id = '00000000-0000-0000-0000-000000000002'::uuid)
);

INSERT INTO corporate_wallet (id, balance_usd, balance_vida)
VALUES ('00000000-0000-0000-0000-000000000002'::uuid, 0, 0)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE corporate_wallet IS 'Corporate wallet: receives $100 Sentinel Fee per registration; pays $30 Salary to Staff VIDA.';

-- 7) Sentinel Staff Ledger (each registration-after-promotion: mint $100, payout $30)
CREATE TABLE IF NOT EXISTS sentinel_staff_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_phone TEXT NOT NULL,
  referred_phone TEXT NOT NULL,
  sentinel_fee_minted_usd NUMERIC(24, 2) NOT NULL DEFAULT 100,
  salary_payout_usd NUMERIC(24, 2) NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sentinel_staff_ledger_staff ON sentinel_staff_ledger(staff_phone);
CREATE INDEX IF NOT EXISTS idx_sentinel_staff_ledger_created ON sentinel_staff_ledger(created_at DESC);

COMMENT ON TABLE sentinel_staff_ledger IS 'Per registration by SENTINEL_STAFF: $100 to corporate, $30 salary to staff VIDA.';

-- 8) RPC: Record a referral (call when a new user registers with referrer_phone). Idempotent per referred_phone.
CREATE OR REPLACE FUNCTION record_referral(referrer_phone text, referred_phone text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NULLIF(TRIM(referrer_phone), '') IS NULL OR NULLIF(TRIM(referred_phone), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'referrer_phone and referred_phone required');
  END IF;
  IF referrer_phone = referred_phone THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Cannot self-refer');
  END IF;

  INSERT INTO referrals (referrer_phone, referred_phone)
  VALUES (TRIM(referrer_phone), TRIM(referred_phone))
  ON CONFLICT (referred_phone) DO NOTHING;

  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- 9) RPC: Process staff bounty for a registration (mint $100 to corporate, $30 to staff VIDA). Call after vitalization when referrer is SENTINEL_STAFF.
CREATE OR REPLACE FUNCTION process_staff_bounty(staff_phone text, referred_phone text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  staff_role text;
  corp_id uuid := '00000000-0000-0000-0000-000000000002'::uuid;
  salary_vida numeric := 30.0 / 1000.0;  -- $30 USD = 0.03 VIDA at $1000/VIDA
BEGIN
  SELECT role INTO staff_role FROM user_profiles WHERE phone_number = staff_phone;
  IF staff_role IS NULL OR staff_role <> 'SENTINEL_STAFF' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'User is not SENTINEL_STAFF');
  END IF;

  -- Mint $100 to corporate wallet
  UPDATE corporate_wallet SET balance_usd = balance_usd + 100, updated_at = NOW() WHERE id = corp_id;

  -- $30 Salary Payout: credit staff's VIDA (sovereign_internal_wallets)
  INSERT INTO sovereign_internal_wallets (phone_number, dllr_balance, usdt_balance, vida_cap_balance)
  VALUES (staff_phone, 0, 0, COALESCE((SELECT vida_cap_balance FROM sovereign_internal_wallets WHERE phone_number = staff_phone), 0) + salary_vida)
  ON CONFLICT (phone_number) DO UPDATE SET
    vida_cap_balance = sovereign_internal_wallets.vida_cap_balance + salary_vida,
    updated_at = NOW();

  -- Ledger entry
  INSERT INTO sentinel_staff_ledger (staff_phone, referred_phone, sentinel_fee_minted_usd, salary_payout_usd)
  VALUES (staff_phone, referred_phone, 100, 30);

  RETURN jsonb_build_object('ok', true, 'sentinel_fee_minted_usd', 100, 'salary_payout_usd', 30);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION process_staff_bounty IS 'For each registration by SENTINEL_STAFF: mint $100 to corporate wallet, pay $30 VIDA to staff.';

-- 10) Sovereign Sentinel Staff ID (Verifiable Credential storage)
CREATE TABLE IF NOT EXISTS sovereign_sentinel_staff_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  credential_type TEXT NOT NULL DEFAULT 'SovereignSentinelStaffID',
  credential_payload JSONB NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sentinel_staff_credentials_phone ON sovereign_sentinel_staff_credentials(phone_number);

COMMENT ON TABLE sovereign_sentinel_staff_credentials IS 'Verifiable Credential: Sovereign Sentinel Staff ID for official proof to authorities.';

-- 11) Update admin_set_user_role to allow SENTINEL_STAFF as valid new_role
CREATE OR REPLACE FUNCTION admin_set_user_role(
  actor_phone text,
  target_phone text,
  new_role text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_role text;
  actor_is_master boolean;
BEGIN
  IF new_role NOT IN ('CITIZEN', 'GOVERNMENT_ADMIN', 'SENTINEL_OFFICER', 'MASTER_ARCHITECT', 'SENTINEL_STAFF') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  SELECT EXISTS (SELECT 1 FROM user_profiles WHERE phone_number = actor_phone AND role = 'MASTER_ARCHITECT') INTO actor_is_master;
  IF NOT actor_is_master THEN
    RAISE EXCEPTION 'Only MASTER_ARCHITECT can set role';
  END IF;

  SELECT role INTO old_role FROM user_profiles WHERE phone_number = target_phone;
  IF old_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  UPDATE user_profiles SET role = new_role, updated_at = NOW() WHERE phone_number = target_phone;

  INSERT INTO admin_action_logs (actor_identity_anchor, action_type, target_identity_anchor, old_value, new_value)
  VALUES (actor_phone, 'ROLE_CHANGE', target_phone, old_role, new_role);

  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- 12) RPC: Staff Portal stats (citizens onboarded, monthly performance bonus)
CREATE OR REPLACE FUNCTION get_staff_portal_stats(staff_phone text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  staff_role text;
  citizens_onboarded bigint;
  monthly_bonus_usd numeric;
  current_month_start timestamptz;
BEGIN
  current_month_start := date_trunc('month', NOW())::timestamptz;

  SELECT role INTO staff_role FROM user_profiles WHERE phone_number = staff_phone;
  IF staff_role IS NULL OR staff_role <> 'SENTINEL_STAFF' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not SENTINEL_STAFF');
  END IF;

  SELECT count(*) INTO citizens_onboarded FROM sentinel_staff_ledger l WHERE l.staff_phone = get_staff_portal_stats.staff_phone;

  SELECT coalesce(sum(salary_payout_usd), 0) INTO monthly_bonus_usd
  FROM sentinel_staff_ledger
  WHERE staff_phone = get_staff_portal_stats.staff_phone AND created_at >= current_month_start;

  RETURN jsonb_build_object(
    'ok', true,
    'citizens_onboarded', citizens_onboarded,
    'monthly_bonus_usd', monthly_bonus_usd
  );
END;
$$;

COMMENT ON FUNCTION get_staff_portal_stats IS 'Staff Portal: total citizens onboarded and monthly salary bonus for SENTINEL_STAFF.';

-- 13) RPC: Issue Sovereign Sentinel Staff ID (Verifiable Credential)
CREATE OR REPLACE FUNCTION issue_sentinel_staff_credential(staff_phone text, staff_full_name text DEFAULT '')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  staff_role text;
  cred jsonb;
  issued_at timestamptz := NOW();
  name_val text;
BEGIN
  SELECT role, full_name INTO staff_role, name_val FROM user_profiles WHERE phone_number = staff_phone;
  IF staff_role IS NULL OR staff_role <> 'SENTINEL_STAFF' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not SENTINEL_STAFF');
  END IF;
  name_val := COALESCE(NULLIF(TRIM(staff_full_name), ''), name_val, 'Staff');

  cred := jsonb_build_object(
    'type', 'SovereignSentinelStaffID',
    'credentialSubject', jsonb_build_object(
      'id', 'tel:' || staff_phone,
      'phone', staff_phone,
      'fullName', name_val,
      'role', 'SENTINEL_STAFF',
      'issuer', 'PFF Sovereign Network',
      'issued', to_char(issued_at, 'YYYY-MM-DD"T"HH24:MI:SS.MSOF'),
      'proofOfEmployment', true
    ),
    'issued', to_char(issued_at, 'YYYY-MM-DD"T"HH24:MI:SS.MSOF')
  );

  INSERT INTO sovereign_sentinel_staff_credentials (phone_number, credential_type, credential_payload)
  VALUES (staff_phone, 'SovereignSentinelStaffID', cred)
  ON CONFLICT (phone_number) DO UPDATE SET credential_payload = EXCLUDED.credential_payload, issued_at = NOW();

  RETURN jsonb_build_object('ok', true, 'credential', cred);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION issue_sentinel_staff_credential IS 'Issue Verifiable Credential: Sovereign Sentinel Staff ID for official proof to authorities.';
