-- Binding Schema: identity_bound (true only when face_hash AND recovery_seed_hash are non-null).
-- Unlock Trigger: spending_unlocked = true when external_fingerprint_hash is saved.

-- 1) identity_bound: true only when both face_hash and recovery_seed_hash are non-null
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS identity_bound BOOLEAN DEFAULT false;
COMMENT ON COLUMN public.user_profiles.identity_bound IS 'True only when both face_hash and recovery_seed_hash are non-null (dual anchor bound).';

-- 2) spending_unlocked: set true by trigger when external_fingerprint_hash is saved
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS spending_unlocked BOOLEAN DEFAULT false;
COMMENT ON COLUMN public.user_profiles.spending_unlocked IS 'True after second biometric (external fingerprint) is saved; enables spending.';

-- 3) Sync identity_bound on INSERT/UPDATE: true only when face_hash and recovery_seed_hash are both non-null and non-empty
CREATE OR REPLACE FUNCTION public.sync_identity_bound()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.identity_bound := (
    COALESCE(TRIM(NEW.face_hash), '') <> ''
    AND COALESCE(TRIM(NEW.recovery_seed_hash), '') <> ''
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS before_user_profiles_sync_identity_bound ON public.user_profiles;
CREATE TRIGGER before_user_profiles_sync_identity_bound
  BEFORE INSERT OR UPDATE OF face_hash, recovery_seed_hash ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_identity_bound();

-- Backfill identity_bound for existing rows
UPDATE public.user_profiles
SET identity_bound = (
  COALESCE(TRIM(face_hash), '') <> '' AND COALESCE(TRIM(recovery_seed_hash), '') <> ''
)
WHERE identity_bound IS DISTINCT FROM (
  COALESCE(TRIM(face_hash), '') <> '' AND COALESCE(TRIM(recovery_seed_hash), '') <> ''
);

-- 4) Unlock trigger: when external_fingerprint_hash is set, set spending_unlocked = true
CREATE OR REPLACE FUNCTION public.set_spending_unlocked_on_fingerprint()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(TRIM(NEW.external_fingerprint_hash), '') <> '' THEN
    NEW.spending_unlocked := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS before_user_profiles_spending_unlocked ON public.user_profiles;
CREATE TRIGGER before_user_profiles_spending_unlocked
  BEFORE INSERT OR UPDATE OF external_fingerprint_hash ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_spending_unlocked_on_fingerprint();

-- Backfill spending_unlocked for existing rows that already have external_fingerprint_hash
UPDATE public.user_profiles
SET spending_unlocked = true
WHERE COALESCE(TRIM(external_fingerprint_hash), '') <> '' AND (spending_unlocked IS NOT true);
