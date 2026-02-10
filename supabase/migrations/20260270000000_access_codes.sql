-- Access codes: one-time codes for the access gate (until cutoff). Architect generates; user validates.
-- Used by /api/v1/access-codes/validate and /api/v1/access-codes/generate.

CREATE TABLE IF NOT EXISTS public.access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_by_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- If table already existed without these columns, add them (idempotent)
ALTER TABLE public.access_codes ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.access_codes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.access_codes ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;
ALTER TABLE public.access_codes ADD COLUMN IF NOT EXISTS created_by_phone TEXT;
ALTER TABLE public.access_codes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_access_codes_phone ON public.access_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON public.access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_expires ON public.access_codes(expires_at);

COMMENT ON TABLE public.access_codes IS 'One-time access codes for the access gate. Architect generates; user validates by phone + code.';

ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

-- Only service/backend need to insert/select; anon can call RPCs
DROP POLICY IF EXISTS "Service full access access_codes" ON public.access_codes;
CREATE POLICY "Service full access access_codes" ON public.access_codes FOR ALL USING (true);

-- Validate: check code for phone, mark used, return ok + phone_number
CREATE OR REPLACE FUNCTION public.validate_access_code(p_phone_number text, p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
BEGIN
  IF NULLIF(TRIM(COALESCE(p_phone_number, '')), '') IS NULL OR NULLIF(TRIM(COALESCE(p_code, '')), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'phone_number and code required');
  END IF;
  SELECT id, phone_number INTO v_row
  FROM public.access_codes
  WHERE phone_number = TRIM(p_phone_number) AND code = TRIM(p_code)
    AND used_at IS NULL AND expires_at > NOW()
  LIMIT 1;
  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid code or phone number');
  END IF;
  UPDATE public.access_codes SET used_at = NOW() WHERE id = v_row.id;
  RETURN jsonb_build_object('ok', true, 'phone_number', v_row.phone_number);
END;
$$;

-- Generate: create a new code for the given phone (Architect only; caller enforces)
CREATE OR REPLACE FUNCTION public.generate_access_code(p_phone_number text, p_created_by_phone text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_expires_at timestamptz;
BEGIN
  IF NULLIF(TRIM(COALESCE(p_phone_number, '')), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'phone_number required');
  END IF;
  v_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
  v_expires_at := NOW() + interval '7 days';
  INSERT INTO public.access_codes (phone_number, code, expires_at, created_by_phone)
  VALUES (TRIM(p_phone_number), v_code, v_expires_at, NULLIF(TRIM(COALESCE(p_created_by_phone, '')), ''));
  RETURN jsonb_build_object('ok', true, 'code', v_code, 'phone_number', TRIM(p_phone_number));
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_access_code(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_access_code(text, text) TO anon, authenticated;
