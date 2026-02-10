-- ============================================================================
-- NATIONAL TREASURY FEED — Backend feeds frontend with one RPC + Realtime.
-- Total vitalized citizens, nation's minted VIDA CAP, locked, national liquidity, liquid pool.
-- ============================================================================

-- 1) RPC: Single payload for frontend (ledger_stats + national_block_reserves).
CREATE OR REPLACE FUNCTION get_national_treasury_feed()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ledger RECORD;
  v_national RECORD;
  v_vitalized_count INTEGER;
BEGIN
  -- Vitalized citizens on earth (source of truth)
  SELECT count(*)::INTEGER INTO v_vitalized_count
  FROM user_profiles
  WHERE vitalization_status IN ('VITALIZED', 'Master_Vitalization');

  -- Global ledger row
  SELECT total_reserve_vida, total_vitalized_count, total_minted_vida
  INTO v_ledger
  FROM ledger_stats
  WHERE id = '00000000-0000-0000-0000-000000000001'
  LIMIT 1;

  -- National block reserves (nation's share: locked, liquidity, liquid pool)
  SELECT
    national_vault_vida_cap,
    national_vault_locked,
    national_vida_minted,
    vida_cap_liquidity,
    vida_cap_liquidity_reserved,
    national_vida_pool_vida_cap,
    national_vida_circulating,
    vida_price_usd,
    naira_rate,
    last_updated
  INTO v_national
  FROM national_block_reserves
  WHERE id = '00000000-0000-0000-0000-000000000002'
  LIMIT 1;

  RETURN jsonb_build_object(
    'ok', true,
    'total_vitalized_citizens', COALESCE(v_vitalized_count, 0),
    'total_vitalized_count', COALESCE(v_ledger.total_vitalized_count, v_vitalized_count, 0),
    'total_reserve_vida', COALESCE((v_ledger.total_reserve_vida)::NUMERIC, 0),
    'total_minted_vida', COALESCE((v_ledger.total_minted_vida)::NUMERIC, 0),
    'total_minted_vida_cap_nation', COALESCE((v_national.national_vida_minted)::NUMERIC, 0),
    'vida_cap_locked', CASE WHEN COALESCE(v_national.national_vault_locked, true) THEN COALESCE((v_national.national_vault_vida_cap)::NUMERIC, 0) ELSE 0 END,
    'national_vault_vida_cap', COALESCE((v_national.national_vault_vida_cap)::NUMERIC, 0),
    'national_vault_locked', COALESCE(v_national.national_vault_locked, true),
    'national_liquidity', COALESCE((v_national.vida_cap_liquidity)::NUMERIC, 0) + COALESCE((v_national.national_vida_pool_vida_cap)::NUMERIC, 0),
    'vida_cap_liquidity', COALESCE((v_national.vida_cap_liquidity)::NUMERIC, 0),
    'liquid_pool', COALESCE((v_national.national_vida_pool_vida_cap)::NUMERIC, 0),
    'national_vida_circulating', COALESCE((v_national.national_vida_circulating)::NUMERIC, 0),
    'vida_price_usd', COALESCE((v_national.vida_price_usd)::NUMERIC, 1000),
    'naira_rate', COALESCE((v_national.naira_rate)::NUMERIC, 1400),
    'last_updated', v_national.last_updated
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION get_national_treasury_feed IS 'Backend → Frontend: single payload with total vitalized citizens, nation minted VIDA CAP, locked, national liquidity, liquid pool. Frontend subscribes to ledger_stats + national_block_reserves Realtime.';

GRANT EXECUTE ON FUNCTION get_national_treasury_feed() TO anon;
GRANT EXECUTE ON FUNCTION get_national_treasury_feed() TO authenticated;
GRANT EXECUTE ON FUNCTION get_national_treasury_feed() TO service_role;

-- 2) Keep ledger_stats.total_vitalized_count in sync when user_profiles vitalization changes.
CREATE OR REPLACE FUNCTION sync_ledger_stats_vitalized_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT count(*)::INTEGER INTO v_count
  FROM user_profiles
  WHERE vitalization_status IN ('VITALIZED', 'Master_Vitalization');

  UPDATE ledger_stats
  SET total_vitalized_count = v_count,
      last_updated = NOW()
  WHERE id = '00000000-0000-0000-0000-000000000001';

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_ledger_stats_vitalized ON user_profiles;
CREATE TRIGGER trigger_sync_ledger_stats_vitalized
  AFTER INSERT OR UPDATE OF vitalization_status OR DELETE
  ON user_profiles
  FOR EACH STATEMENT
  EXECUTE FUNCTION sync_ledger_stats_vitalized_count();

COMMENT ON FUNCTION sync_ledger_stats_vitalized_count IS 'When user_profiles vitalization changes, update ledger_stats.total_vitalized_count so frontend feed is correct.';

-- 3) One-time sync of ledger_stats.total_vitalized_count from current user_profiles count.
UPDATE ledger_stats
SET total_vitalized_count = (
  SELECT count(*)::INTEGER FROM user_profiles WHERE vitalization_status IN ('VITALIZED', 'Master_Vitalization')
),
last_updated = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';
