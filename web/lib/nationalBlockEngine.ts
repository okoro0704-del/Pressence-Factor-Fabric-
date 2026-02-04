/**
 * National Block Engine — 3% of National Block gross inflow.
 * Every National Block automatically deducts 3% of total gross inflow before
 * distributing any VIDA or DLLR to local citizens or government.
 * Applied in Priority Lock simultaneously with Corporate 2% before any other splits.
 */

import { supabase } from './supabase';

/** 3% National Levy — deducted from National Block gross inflow before VIDA/DLLR distribution. */
export const NATIONAL_LEVY_PERCENT = 0.03;

export interface NationalBlockDeductionInput {
  /** National Block identifier (e.g. reserve id, region code). */
  blockId: string;
  /** Total gross inflow to the block (VIDA or specified currency). */
  grossInflow: number;
  currency?: string;
  reference?: string;
}

export interface NationalBlockDeductionResult {
  blockId: string;
  grossInflow: number;
  nationalLevy3: number;
  netDistributable: number;
  currency: string;
  reference?: string;
}

/**
 * Calculate 3% National Levy on gross inflow; net distributable = gross - 3%.
 * Does NOT persist; use recordNationalBlockDeduction or applyPriorityLockDeductions for ledger.
 */
export function calculateNationalBlockDeduction(
  input: NationalBlockDeductionInput
): NationalBlockDeductionResult {
  const grossInflow = Number(input.grossInflow) || 0;
  const nationalLevy3 = grossInflow * NATIONAL_LEVY_PERCENT;
  const netDistributable = grossInflow - nationalLevy3;
  const currency = input.currency ?? 'VIDA';
  return {
    blockId: input.blockId,
    grossInflow,
    nationalLevy3,
    netDistributable,
    currency,
    reference: input.reference,
  };
}

/**
 * Record 3% National Levy to foundation_vault_ledger (national_levy_inflow).
 * Use when recording national levy only. For Priority Lock (2% + 3% together), use applyPriorityLockDeductions.
 */
export async function recordNationalBlockDeduction(
  input: NationalBlockDeductionInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const computed = calculateNationalBlockDeduction(input);
  try {
    const { error } = await (supabase as any)
      .from('foundation_vault_ledger')
      .insert({
        citizen_id: `NATIONAL_BLOCK_${input.blockId}`,
        vida_amount: 0,
        corporate_royalty_inflow: 0,
        national_levy_inflow: computed.nationalLevy3,
        source_type: 'national_levy_3',
        reference: input.reference ?? null,
        created_at: new Date().toISOString(),
      });
    if (error) return { ok: false, error: error.message ?? 'Vault insert failed' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
