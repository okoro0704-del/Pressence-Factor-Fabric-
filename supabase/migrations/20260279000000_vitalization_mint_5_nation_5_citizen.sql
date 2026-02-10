-- Vitalization mint: 5 VIDA CAP to Nation (of the citizen), 5 to Citizen.
-- 1) RPC to credit nation's share atomically (nation of the citizen = global national_block_reserves for now).
-- 2) save_pillars_at_75: set humanity_score = 1.0 when marking VITALIZED so mint eligibility passes.

-- 1) Atomic credit to national reserve (used by foundationSeigniorage when minting 5 to nation).
CREATE OR REPLACE FUNCTION credit_nation_vitalization_vida_cap(p_amount NUMERIC DEFAULT 5)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID := '00000000-0000-0000-0000-000000000002';
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'amount must be positive');
  END IF;
  UPDATE national_block_reserves
  SET national_vida_minted = COALESCE(national_vida_minted, 0) + p_amount,
      last_updated = NOW()
  WHERE id = v_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'national_block_reserves row not found');
  END IF;
  RETURN jsonb_build_object('ok', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION credit_nation_vitalization_vida_cap(NUMERIC) IS 'Credit nation share (5 VIDA CAP) when a citizen vitalizes. One face = one mint.';

GRANT EXECUTE ON FUNCTION credit_nation_vitalization_vida_cap(NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION credit_nation_vitalization_vida_cap(NUMERIC) TO anon;
GRANT EXECUTE ON FUNCTION credit_nation_vitalization_vida_cap(NUMERIC) TO service_role;

-- Ensure humanity_score column exists (idempotent).
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS humanity_score NUMERIC(3,2) DEFAULT 0 NOT NULL;

-- 2) save_pillars_at_75: also set humanity_score = 1.0 (Proof of Personhood) so mint can run.
CREATE OR REPLACE FUNCTION save_pillars_at_75(
  p_phone_number TEXT,
  p_face_hash TEXT,
  p_palm_hash TEXT,
  p_device_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_updated_at TIMESTAMPTZ := NOW();
BEGIN
  IF NULLIF(TRIM(p_phone_number), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'phone_number required');
  END IF;
  IF NULLIF(TRIM(COALESCE(p_face_hash, '')), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'face_hash required');
  END IF;
  IF NULLIF(TRIM(COALESCE(p_palm_hash, '')), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'palm_hash required');
  END IF;
  IF NULLIF(TRIM(COALESCE(p_device_id, '')), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'device_id required');
  END IF;

  SELECT id INTO v_id FROM user_profiles WHERE phone_number = TRIM(p_phone_number) LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE user_profiles
    SET
      face_hash = TRIM(p_face_hash),
      palm_hash = TRIM(p_palm_hash),
      anchor_device_id = TRIM(p_device_id),
      vitalization_status = 'VITALIZED',
      humanity_score = 1.0,
      updated_at = v_updated_at
    WHERE id = v_id;
    RETURN jsonb_build_object('ok', true, 'action', 'updated');
  ELSE
    INSERT INTO user_profiles (phone_number, full_name, face_hash, palm_hash, anchor_device_id, vitalization_status, humanity_score, created_at, updated_at)
    VALUES (
      TRIM(p_phone_number),
      '—',
      TRIM(p_face_hash),
      TRIM(p_palm_hash),
      TRIM(p_device_id),
      'VITALIZED',
      1.0,
      v_updated_at,
      v_updated_at
    );
    RETURN jsonb_build_object('ok', true, 'action', 'inserted');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION save_pillars_at_75 IS 'Save Face, Palm, Device at 75%; set vitalization_status = VITALIZED and humanity_score = 1.0. Call before/after mint (5 to citizen, 5 to nation).';
