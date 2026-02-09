-- Minting authority is the Face (human DNA). One face = one mint, regardless of device or phone.
-- Add face_hash to foundation_vault_ledger so we enforce "this face has already minted" globally.
-- Dependants (minors under parent) each have their own face and can mint once per face.

ALTER TABLE public.foundation_vault_ledger
  ADD COLUMN IF NOT EXISTS face_hash TEXT DEFAULT NULL;

COMMENT ON COLUMN public.foundation_vault_ledger.face_hash IS 'SHA-256 face hash that received this mint. One mint per face; device and phone are not the criteria.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_foundation_vault_ledger_face_hash_seigniorage
  ON public.foundation_vault_ledger(face_hash)
  WHERE source_type = 'seigniorage' AND face_hash IS NOT NULL;
