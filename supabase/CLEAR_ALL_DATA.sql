-- =====================================================
-- CLEAR ALL DATA FROM SUPABASE (FRESH START)
-- Deletes all rows from all tables while preserving schema
-- Run this in Supabase SQL Editor to start fresh
-- Architect: Isreal Okoro (mrfundzman)
-- =====================================================

-- IMPORTANT: This will delete ALL data. Make sure you want to do this!

-- Disable triggers temporarily to avoid cascading issues
SET session_replication_role = 'replica';

-- ============================================================================
-- CORE IDENTITY TABLES
-- ============================================================================

TRUNCATE TABLE public.user_profiles CASCADE;
TRUNCATE TABLE public.sentinel_identities CASCADE;
TRUNCATE TABLE public.citizens CASCADE;

-- ============================================================================
-- AUTHENTICATION & SESSION TABLES
-- ============================================================================

TRUNCATE TABLE public.login_requests CASCADE;
TRUNCATE TABLE public.vitalization_requests CASCADE;
TRUNCATE TABLE public.sovereign_device_handshake CASCADE;
TRUNCATE TABLE public.session_destruction_log CASCADE;
TRUNCATE TABLE public.zero_persistence_sessions CASCADE;

-- ============================================================================
-- BIOMETRIC & VERIFICATION TABLES
-- ============================================================================

TRUNCATE TABLE public.presence_handshakes CASCADE;
TRUNCATE TABLE public.identity_mismatch_alerts CASCADE;
TRUNCATE TABLE public.offline_verification_templates CASCADE;
TRUNCATE TABLE public.proof_of_life_checks CASCADE;

-- ============================================================================
-- ECONOMIC & FINANCIAL TABLES
-- ============================================================================

-- Clear wallet data (ALL data removed)
TRUNCATE TABLE public.sovereign_internal_wallets CASCADE;
TRUNCATE TABLE public.sovereign_ledger CASCADE;
TRUNCATE TABLE public.vida_distribution_log CASCADE;
TRUNCATE TABLE public.vitalization_log CASCADE;
TRUNCATE TABLE public.foundation_vault_ledger CASCADE;

-- Clear National Treasury data BUT PRESERVE VIDA PRICE
DO $$
DECLARE
  saved_price NUMERIC;
BEGIN
  -- Save the current VIDA price
  SELECT vida_price_usd INTO saved_price
  FROM public.national_block_reserves
  WHERE id = '00000000-0000-0000-0000-000000000002'
  LIMIT 1;

  -- If no price found, use default $1,000
  IF saved_price IS NULL THEN
    saved_price := 1000;
  END IF;

  -- Clear all treasury data
  TRUNCATE TABLE public.national_block_reserves CASCADE;

  -- Restore the row with ONLY the price preserved
  INSERT INTO public.national_block_reserves (
    id,
    vida_price_usd,
    last_updated
  ) VALUES (
    '00000000-0000-0000-0000-000000000002',
    saved_price,
    NOW()
  );

  RAISE NOTICE '💰 VIDA Price preserved: $%', saved_price;
END $$;

TRUNCATE TABLE public.national_revenue_audit CASCADE;
TRUNCATE TABLE public.sovereign_tax_ledger CASCADE;

-- ============================================================================
-- SENTINEL & DEVICE TABLES
-- ============================================================================

TRUNCATE TABLE public.sentinel_remote_commands CASCADE;
TRUNCATE TABLE public.pff_sentinel_activations CASCADE;
TRUNCATE TABLE public.sentinel_activation_log CASCADE;

-- ============================================================================
-- MESH & DARKNET TABLES
-- ============================================================================

TRUNCATE TABLE public.mesh_peers CASCADE;
TRUNCATE TABLE public.mesh_gossip_messages CASCADE;
TRUNCATE TABLE public.mesh_encrypted_hops CASCADE;
TRUNCATE TABLE public.mesh_offline_vitalizations CASCADE;

-- ============================================================================
-- GOVERNANCE & PARTNER TABLES
-- ============================================================================

TRUNCATE TABLE public.ai_governance_logs CASCADE;
TRUNCATE TABLE public.pff_partner_applications CASCADE;
TRUNCATE TABLE public.evg_partner_accounts CASCADE;

-- ============================================================================
-- MEMORY & PERSONAL DATA TABLES
-- ============================================================================

TRUNCATE TABLE public.sovereign_memory_vault CASCADE;
TRUNCATE TABLE public.the_living_record CASCADE;
TRUNCATE TABLE public.family_tree CASCADE;
TRUNCATE TABLE public.inheritance_beneficiaries CASCADE;

-- ============================================================================
-- MASTER DASHBOARD TABLES
-- ============================================================================

TRUNCATE TABLE public.master_heartbeat_sync CASCADE;
TRUNCATE TABLE public.global_metrics CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Count rows in key tables (should all be 0)
SELECT 
  'user_profiles' as table_name, COUNT(*) as row_count FROM public.user_profiles
UNION ALL
SELECT 'sentinel_identities', COUNT(*) FROM public.sentinel_identities
UNION ALL
SELECT 'citizens', COUNT(*) FROM public.citizens
UNION ALL
SELECT 'login_requests', COUNT(*) FROM public.login_requests
UNION ALL
SELECT 'presence_handshakes', COUNT(*) FROM public.presence_handshakes
UNION ALL
SELECT 'sovereign_internal_wallets', COUNT(*) FROM public.sovereign_internal_wallets
UNION ALL
SELECT 'vida_distribution_log', COUNT(*) FROM public.vida_distribution_log
UNION ALL
SELECT 'vitalization_log', COUNT(*) FROM public.vitalization_log
ORDER BY table_name;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ ALL DATA CLEARED SUCCESSFULLY!';
  RAISE NOTICE '📊 All tables have been truncated while preserving schema';
  RAISE NOTICE '🔄 You can now start fresh with clean data';
  RAISE NOTICE '⚠️  Remember to clear frontend localStorage as well';
END $$;

