/**
 * Foundation Seigniorage Protocol — Instant 11-VIDA mint on Root Identity creation only.
 * One-time instant event (no 10-day or daily release). Face + Device = trigger.
 * 11 VIDA total: 5 → national reserve (Nigeria), 1 → foundation vault, 5 → user personal vault.
 * User vault: 1.0 spendable + 4.0 hard_locked (release at global_citizens >= 1B); then 0.1 Sentinel debit → 0.9 spendable, 4.1 locked.
 */

import { supabase } from './supabase';
import { getOrCreateSovereignWallet } from './sovereignInternalWallet';
import { hasSignedConstitution } from './legalApprovals';
import { getHumanityCheck, isEligibleForMint } from './humanityScore';
import { rejectMintIfAlreadyMinted } from './sovereignIdentityGuard';
import { setMintStatus } from './mintStatus';
import { executeSentinelActivationDebit } from './masterArchitectInit';

/** Total VIDA CAP minted per vitalization (11 = 5 nation + 1 foundation + 5 user). */
export const TOTAL_VIDA_MINTED_PER_VITALIZATION = 11;

/** VIDA CAP to citizen personal vault (sovereign_internal_wallets + user_profiles spendable/locked). */
export const CITIZEN_VIDA_ON_VERIFY = 5;

/** VIDA CAP to national reserve (national_block_reserves, tagged Nigeria) per vitalization. */
export const NATION_VIDA_ON_VERIFY = 5;

/** VIDA CAP to PFF Foundation Vault (foundation_vault_ledger) per vitalization. */
export const FOUNDATION_VIDA_ON_VERIFY = 1;

/** User allocation: 1.0 spendable, 4.0 hard_locked (release when global_citizens >= 1B). */
export const USER_SPENDABLE_VIDA = 1.0;
export const USER_HARD_LOCKED_VIDA = 4.0;

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

    // Proof of Personhood: humanity_score 1.0 (set when backend marks VITALIZED). Backfill if already VITALIZED.
    const humanityResult = await getHumanityCheck(phoneNumber);
    if (!humanityResult.ok) {
      return { ok: false, error: humanityResult.error };
    }
    if (!isEligibleForMint(humanityResult.data)) {
      const { data: profile } = await (supabase as any)
        .from('user_profiles')
        .select('vitalization_status')
        .eq('phone_number', phoneNumber.trim())
        .maybeSingle();
      const vitalized = profile?.vitalization_status === 'VITALIZED' || profile?.vitalization_status === 'Master_Vitalization';
      if (vitalized) {
        await (supabase as any).from('user_profiles').update({ humanity_score: 1.0, updated_at: new Date().toISOString() }).eq('phone_number', phoneNumber.trim());
      } else {
        return {
          ok: false,
          error: 'Proof of Personhood required. Complete vitalization (Face + Device) to unlock minting.',
        };
      }
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

    // 1) Credit 5 VIDA to national reserve (national_block_reserves — Nigeria)
    const { data: nationRpc, error: nationError } = await (supabase as any).rpc('credit_nation_vitalization_vida_cap', {
      p_amount: NATION_VIDA_ON_VERIFY,
    });
    if (nationError || (nationRpc && nationRpc.ok === false)) {
      console.error('[FoundationSeigniorage] Nation credit failed:', nationError ?? nationRpc?.error);
    }

    // 2) Record 1 VIDA to foundation_vault_ledger (PFF Foundation)
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

    // 3) User personal vault: 5 VIDA total — 1.0 spendable, 4.0 hard_locked (release at global_citizens >= 1B)
    const { error: walletUpdateError } = await (supabase as any)
      .from('sovereign_internal_wallets')
      .update({
        vida_cap_balance: (wallet.vida_cap_balance ?? 0) + CITIZEN_VIDA_ON_VERIFY,
        updated_at: new Date().toISOString(),
      })
      .eq('phone_number', phoneNumber);

    if (walletUpdateError) {
      console.error('[FoundationSeigniorage] Citizen wallet failed:', walletUpdateError);
      return { ok: false, error: walletUpdateError.message ?? 'Citizen mint failed' };
    }

    const profilePayload: Record<string, unknown> = {
      spendable_vida: USER_SPENDABLE_VIDA,
      locked_vida: USER_HARD_LOCKED_VIDA,
      is_minted: true,
      updated_at: new Date().toISOString(),
    };
    let { error: profileError } = await (supabase as any)
      .from('user_profiles')
      .update(profilePayload)
      .eq('phone_number', phoneNumber);
    if (profileError && /column.*locked_vida|does not exist/i.test(profileError.message ?? '')) {
      delete profilePayload.locked_vida;
      const retry = await (supabase as any).from('user_profiles').update(profilePayload).eq('phone_number', phoneNumber);
      profileError = retry.error;
    }
    if (profileError) {
      console.error('[FoundationSeigniorage] Profile spendable/locked failed:', profileError);
      return { ok: false, error: profileError.message ?? 'Failed to set user vault partition' };
    }

    // 4) Auto-debit 0.1 VIDA for Sentinel Activation → spendable 0.9, locked 4.1; sentinel_status ACTIVE
    await executeSentinelActivationDebit(phoneNumber.trim());

    await setMintStatus(phoneNumber.trim(), 'MINTED');
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
