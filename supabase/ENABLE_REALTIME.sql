-- Enable Supabase Realtime for tables that the app subscribes to.
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor).
-- Tables already in the publication are skipped (no error).

DO $$
BEGIN
  -- user_profiles: backend sync, profile updates
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;
  END IF;
  -- login_requests: computer waits for phone to approve
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'login_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.login_requests;
  END IF;
  -- vitalization_requests: pending device approval
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'vitalization_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vitalization_requests;
  END IF;
  -- sovereign_internal_wallets: wallet balance updates
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'sovereign_internal_wallets') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sovereign_internal_wallets;
  END IF;
  -- ledger_stats: national treasury / pulse bar
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'ledger_stats') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ledger_stats;
  END IF;
  -- national_block_reserves: treasury feed
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'national_block_reserves') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.national_block_reserves;
  END IF;
  -- device_session_terminate: terminate session signal
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'device_session_terminate') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.device_session_terminate;
  END IF;
END $$;
