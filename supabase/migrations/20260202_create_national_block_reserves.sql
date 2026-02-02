-- ============================================================================
-- NATIONAL BLOCK RESERVES TABLE
-- Tracks the circulation of National VIDA currency separately from Architect's share
-- ============================================================================

-- Create national_block_reserves table
CREATE TABLE IF NOT EXISTS public.national_block_reserves (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000002',
  
  -- NATIONAL STABILITY RESERVE (70%)
  national_vault_vida_cap DECIMAL(20, 2) NOT NULL DEFAULT 3.5,
  national_vault_locked BOOLEAN NOT NULL DEFAULT true,
  
  -- NATIONAL LIQUIDITY (30%) - Split into two sub-sections
  -- Sub-section 1: VIDA CAP Liquidity (15%)
  vida_cap_liquidity DECIMAL(20, 2) NOT NULL DEFAULT 0.75,
  vida_cap_liquidity_reserved DECIMAL(20, 2) NOT NULL DEFAULT 0.0,
  
  -- Sub-section 2: National VIDA Pool (15%)
  national_vida_pool_vida_cap DECIMAL(20, 2) NOT NULL DEFAULT 0.75,
  national_vida_minted DECIMAL(20, 2) NOT NULL DEFAULT 0.0,
  national_vida_circulating DECIMAL(20, 2) NOT NULL DEFAULT 0.0,
  national_vida_burned DECIMAL(20, 2) NOT NULL DEFAULT 0.0,
  
  -- Exchange rates (for reference)
  vida_price_usd DECIMAL(20, 2) NOT NULL DEFAULT 1000.0,
  naira_rate DECIMAL(20, 2) NOT NULL DEFAULT 1400.0,
  
  -- Metadata
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT DEFAULT 'system',
  
  -- Ensure singleton pattern
  CONSTRAINT single_national_reserve CHECK (id = '00000000-0000-0000-0000-000000000002')
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_national_block_reserves_id ON public.national_block_reserves(id);

-- Enable Row Level Security
ALTER TABLE public.national_block_reserves ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to national block reserves"
  ON public.national_block_reserves
  FOR SELECT
  TO public
  USING (true);

-- Create policy for authenticated write access
CREATE POLICY "Allow authenticated write access to national block reserves"
  ON public.national_block_reserves
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert initial singleton record
INSERT INTO public.national_block_reserves (
  id,
  national_vault_vida_cap,
  national_vault_locked,
  vida_cap_liquidity,
  vida_cap_liquidity_reserved,
  national_vida_pool_vida_cap,
  national_vida_minted,
  national_vida_circulating,
  national_vida_burned,
  vida_price_usd,
  naira_rate,
  updated_by
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  3.5,
  true,
  0.75,
  0.0,
  0.75,
  0.0,
  0.0,
  0.0,
  1000.0,
  1400.0,
  'genesis_initialization'
) ON CONFLICT (id) DO NOTHING;

-- Create function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_national_block_reserves_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update timestamp
DROP TRIGGER IF EXISTS trigger_update_national_block_reserves_timestamp ON public.national_block_reserves;
CREATE TRIGGER trigger_update_national_block_reserves_timestamp
  BEFORE UPDATE ON public.national_block_reserves
  FOR EACH ROW
  EXECUTE FUNCTION update_national_block_reserves_timestamp();

-- Grant permissions
GRANT SELECT ON public.national_block_reserves TO anon;
GRANT SELECT ON public.national_block_reserves TO authenticated;
GRANT ALL ON public.national_block_reserves TO service_role;

-- Add comment
COMMENT ON TABLE public.national_block_reserves IS 'Tracks National VIDA currency circulation and dual vault system (70% Stability Reserve + 30% Liquidity split into VIDA CAP and National VIDA)';

