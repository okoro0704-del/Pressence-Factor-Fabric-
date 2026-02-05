-- Pending Mint: mobile completes Face + GPS only; hub completes with industrial scanner.
-- mint_status: null (legacy), 'PENDING_HARDWARE' (mobile initial reg), 'MINTED' (after hub or full flow).

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS mint_status TEXT DEFAULT NULL;

COMMENT ON COLUMN public.user_profiles.mint_status IS 'PENDING_HARDWARE = mobile initial reg; MINTED = after hub scanner or full flow.';

CREATE INDEX IF NOT EXISTS idx_user_profiles_mint_status ON public.user_profiles(mint_status) WHERE mint_status IS NOT NULL;
