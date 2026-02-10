-- Ghost Vault + Registrar proxy + orphan check support.
-- 1) pending_dispense: when scan is on a device already registered to another user (Registrar), credit 1 VIDA here.
-- 2) Ghost vault: vault keyed by face_hash only (no credential_id/passkey required for initial mint).
-- 3) check_for_orphan_vault: detect when face matches a vault with no device bound.

-- Registrar proxy: 1 VIDA ($1000) credited to Registrar's profile when someone vitalizes on their device.
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS pending_dispense NUMERIC(20, 8) NOT NULL DEFAULT 0;
COMMENT ON COLUMN public.user_profiles.pending_dispense IS 'VIDA credited to Registrar when another user vitalizes on this device (1 VIDA spendable).';

-- Ghost vault: allow profile/wallet keyed by face only (phone_number = ghost:face_hash_prefix).
-- No schema change needed; app uses phone_number = ''ghost'' || :face_hash for ghost rows.
-- Ensure sovereign_internal_wallets can have phone_number like ghost:...
-- (no constraint change if phone_number is TEXT and unique per row)

-- Orphan vault: profile has face_hash but no primary_sentinel_device_id = Ghost / unbound.
-- check_for_orphan_vault(face_hash) returns true when such a row exists.
CREATE OR REPLACE FUNCTION check_for_orphan_vault(p_face_hash TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT;
  v_has_face BOOLEAN;
  v_has_device BOOLEAN;
BEGIN
  IF NULLIF(TRIM(p_face_hash), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'is_orphan', false, 'error', 'face_hash required');
  END IF;

  SELECT phone_number, (face_hash IS NOT NULL AND TRIM(face_hash) <> ''),
         (primary_sentinel_device_id IS NOT NULL AND TRIM(primary_sentinel_device_id) <> '')
  INTO v_phone, v_has_face, v_has_device
  FROM user_profiles
  WHERE TRIM(face_hash) = TRIM(p_face_hash)
  LIMIT 1;

  IF v_phone IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'is_orphan', false, 'bind_phone', null);
  END IF;

  -- Orphan = has face_hash but no device bound (or is ghost placeholder)
  IF v_has_face AND (NOT v_has_device OR v_phone LIKE 'ghost:%') THEN
    RETURN jsonb_build_object('ok', true, 'is_orphan', true, 'bind_phone', v_phone);
  END IF;

  RETURN jsonb_build_object('ok', true, 'is_orphan', false, 'bind_phone', v_phone);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'is_orphan', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION check_for_orphan_vault(TEXT) IS 'Returns is_orphan true when face_hash matches a vault with no device bound (Ghost). Prompt: Bind your 4 VIDA Treasury to this device?';

GRANT EXECUTE ON FUNCTION check_for_orphan_vault(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_for_orphan_vault(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION check_for_orphan_vault(TEXT) TO service_role;
