-- Force PostgREST to reload schema cache (fixes "Schema Cache" errors for new columns).
-- Call via Supabase RPC: select reload_pgrst_schema();
-- Admin-only: use from API route gated by NEXT_PUBLIC_ADMIN_PHONE.

CREATE OR REPLACE FUNCTION reload_pgrst_schema()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
END;
$$;

COMMENT ON FUNCTION reload_pgrst_schema() IS 'Notifies PostgREST to reload schema cache; call from Admin Settings only.';

-- Allow service_role and authenticated (API may use anon with admin check)
GRANT EXECUTE ON FUNCTION reload_pgrst_schema() TO service_role;
GRANT EXECUTE ON FUNCTION reload_pgrst_schema() TO authenticated;
GRANT EXECUTE ON FUNCTION reload_pgrst_schema() TO anon;
