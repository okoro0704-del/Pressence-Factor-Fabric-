/**
 * Foundation Seigniorage Protocol — Dual-Minting on Root Identity creation only.
 * Per new identity (first device): 10 VIDA CAP to user wallet, 1 VIDA to PFF_FOUNDATION_VAULT.
 * Grant trigger: Constitution signed + humanity check. Single-mint guard: if (vidaCapMinted) rejectMint().
 * Device linking MUST NOT mint again.
 */

import { supabase } from './supabase';
import { getOrCreateSovereignWallet } from './sovereignInternalWallet';
import { hasSignedConstitution } from './legalApprovals';
import { getHumanityCheck, isEligibleForMint } from './humanityScore';
import { rejectMintIfAlreadyMinted } from './sovereignIdentityGuard';

/** VIDA CAP minted to user when 3-of-4 gate clears. */
export const USER_VIDA_ON_VERIFY = 10;

/** VIDA minted to PFF Foundation Vault per verification (audit in foundation_vault_ledger). */
export const FOUNDATION_VIDA_ON_VERIFY = 1;

/** Options for mint: faceHash is the sole criterion for "already minted" (one face = one mint). */
export type MintFoundationSeigniorageOptions = {
  citizenId?: string;
  /** When provided, mint authority is the face; guard and ledger use face_hash. One face = one mint. */
  faceHash?: string;
};

/**
 * Execute dual-mint ONLY on Root Identity creation. Minting authority is the Face (one face = one mint).
 * Rejects if this face has already minted, regardless of device or phone. Pass faceHash when available.
 */
export async function mintFoundationSeigniorage(
  phoneNumber: string,
  options?: MintFoundationSeigniorageOptions | string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const opts = typeof options === 'string' ? { citizenId: options } : (options ?? {});
  const citizenIdForAudit = opts.citizenId ?? phoneNumber;
  const faceHash = typeof opts.faceHash === 'string' ? opts.faceHash.trim() : undefined;
  const faceHashNormalized = faceHash && faceHash.length === 64 && /^[0-9a-fA-F]+$/.test(faceHash) ? faceHash.toLowerCase() : undefined;

  if (!supabase) {
    return { ok: false, error: 'Supabase not available' };
  }

  try {
    // Single-mint guard: by face when faceHash provided (authority = face); else fallback to phone for backward compat.
    const guard = faceHashNormalized
      ? await rejectMintIfAlreadyMinted(faceHashNormalized, { byFace: true })
      : await rejectMintIfAlreadyMinted(phoneNumber);
    if (!guard.ok) return guard;

    // Grant trigger: Constitution must be signed and recorded before any mint.
    const signed = await hasSignedConstitution(phoneNumber);
    if (!signed) {
      return { ok: false, error: 'Constitution must be signed before grant. Complete the Biometric Signature on the Sovereign Constitution.' };
    }

    // Anti-Bot Protocol: Mint only if humanity_score is 1.0 and biometric is from external device.
    const humanityResult = await getHumanityCheck(phoneNumber);
    if (!humanityResult.ok) {
      return { ok: false, error: humanityResult.error };
    }
    if (!isEligibleForMint(humanityResult.data)) {
      return {
        ok: false,
        error: 'Proof of Personhood required. Complete a Triple-Pillar scan with an external biometric device to unlock minting.',
      };
    }

    // Idempotent: already minted for this face (or citizen when no faceHash)?
    if (faceHashNormalized) {
      const { data: existingByFace } = await (supabase as any)
        .from('foundation_vault_ledger')
        .select('id')
        .eq('source_type', 'seigniorage')
        .eq('face_hash', faceHashNormalized)
        .limit(1)
        .maybeSingle();
      if (existingByFace) return { ok: true };
    } else {
      const { data: existing } = await (supabase as any)
        .from('foundation_vault_ledger')
        .select('id')
        .eq('citizen_id', citizenIdForAudit)
        .limit(1)
        .maybeSingle();
      if (existing) return { ok: true };
    }

    const wallet = await getOrCreateSovereignWallet(phoneNumber);
    if (!wallet) {
      return { ok: false, error: 'Could not get or create sovereign wallet' };
    }

    // 1) Mint 10 VIDA to user's wallet
    const { error: updateError } = await (supabase as any)
      .from('sovereign_internal_wallets')
      .update({
        vida_cap_balance: (wallet.vida_cap_balance ?? 0) + USER_VIDA_ON_VERIFY,
        updated_at: new Date().toISOString(),
      })
      .eq('phone_number', phoneNumber);

    if (updateError) {
      console.error('[FoundationSeigniorage] User mint failed:', updateError);
      return { ok: false, error: updateError.message ?? 'User mint failed' };
    }

    // 2) Record 1 VIDA to foundation_vault_ledger (PFF_FOUNDATION_VAULT). face_hash = who minted (one face = one mint).
    const { error: ledgerError } = await (supabase as any)
      .from('foundation_vault_ledger')
      .insert({
        citizen_id: citizenIdForAudit,
        face_hash: faceHashNormalized ?? null,
        vida_amount: FOUNDATION_VIDA_ON_VERIFY,
        corporate_royalty_inflow: 0,
        national_levy_inflow: 0,
        source_type: 'seigniorage',
        created_at: new Date().toISOString(),
      });

    if (ledgerError) {
      console.error('[FoundationSeigniorage] Foundation ledger insert failed:', ledgerError);
      return { ok: false, error: ledgerError.message ?? 'Foundation ledger failed' };
    }

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[FoundationSeigniorage]', msg);
    return { ok: false, error: msg };
  }
}

/**
 * Total Foundation Reserve (sum of VIDA in foundation_vault_ledger).
 * Used for "Total Foundation Reserve: [X] VIDA" in SovereignWallet.
 */
export async function getTotalFoundationReserve(): Promise<number> {
  if (!supabase) return 0;
  try {
    const { data, error } = await (supabase as any)
      .from('foundation_vault_ledger')
      .select('vida_amount');
    if (error || !data || !Array.isArray(data)) return 0;
    return data.reduce((sum: number, row: { vida_amount?: number }) => sum + (Number(row?.vida_amount) ?? 0), 0);
  } catch {
    return 0;
  }
}

/** 2% conversion levy on VIDA→DLLR (routed to PFF_FOUNDATION_VAULT). */
export const CONVERSION_LEVY_PERCENT = 0.02;

/**
 * Route 2% conversion levy to PFF_FOUNDATION_VAULT when user converts VIDA to DLLR.
 * Call this from updateSovereignWalletConvertVidaToDllr with the levy amount (vidaAmount * 0.02).
 */
export async function routeConversionLevyToFoundation(
  phoneNumber: string,
  levyVidaAmount: number,
  reference?: string
): Promise<boolean> {
  if (!supabase || levyVidaAmount <= 0) return false;
  try {
    const { error } = await (supabase as any)
      .from('foundation_vault_ledger')
      .insert({
        citizen_id: phoneNumber,
        vida_amount: levyVidaAmount,
        corporate_royalty_inflow: 0,
        national_levy_inflow: 0,
        source_type: 'conversion_levy_2',
        reference: reference ?? null,
        created_at: new Date().toISOString(),
      });
    return !error;
  } catch {
    return false;
  }
}
