-- Master Identity Anchor: single sovereign root hash from Pillar 1 (Face), Pillar 2 (Palm), Pillar 3 (Identity Anchor).
-- Once stored, login only needs to verify that the current scan matches a portion of this root (one-way recognition).
-- Individual pillar hashes are not stored here; only the combined master root.

ALTER TABLE public.citizens
  ADD COLUMN IF NOT EXISTS citizen_root TEXT;

COMMENT ON COLUMN public.citizens.citizen_root IS 'Master Identity Anchor: SHA-256(face_hash || palm_hash || identity_anchor_hash). Set once after pillars verified; individual hashes cleared from client. One-way recognition at login.';

CREATE INDEX IF NOT EXISTS idx_citizens_citizen_root ON public.citizens(citizen_root) WHERE citizen_root IS NOT NULL;

-- RPC: Set citizen_root for a citizen identified by device_id and key_id (e.g. after generateSovereignRoot on client).
-- Caller must have computed the master root; this only persists it. Does not store individual hashes.
CREATE OR REPLACE FUNCTION set_citizen_root(
  p_device_id TEXT,
  p_key_id TEXT,
  p_citizen_root TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
BEGIN
  IF NULLIF(TRIM(COALESCE(p_device_id, '')), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'device_id required');
  END IF;
  IF NULLIF(TRIM(COALESCE(p_key_id, '')), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'key_id required');
  END IF;
  IF NULLIF(TRIM(COALESCE(p_citizen_root, '')), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'citizen_root required');
  END IF;

  UPDATE citizens
  SET citizen_root = TRIM(p_citizen_root),
      updated_at = NOW()
  WHERE device_id = TRIM(p_device_id)
    AND key_id = TRIM(p_key_id);

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'citizen not found for device_id and key_id');
  END IF;
  RETURN jsonb_build_object('ok', true, 'updated', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION set_citizen_root IS 'Store Master Identity Anchor (sovereign root) for citizen. Individual pillar hashes must be cleared by client after this succeeds.';

GRANT EXECUTE ON FUNCTION set_citizen_root(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION set_citizen_root(TEXT, TEXT, TEXT) TO service_role;
