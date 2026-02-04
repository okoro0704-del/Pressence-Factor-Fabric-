/**
 * Corporate Tribute — 2% of total worldwide revenue processed through PFF.
 * Companies remit 2% of their worldwide user-revenue to the PFF Foundation.
 * Applied in Priority Lock simultaneously with National 3% before any other splits.
 */

import { supabase } from './supabase';

/** 2% Corporate Royalty — worldwide revenue processed through PFF remitted to Foundation. */
export const CORPORATE_ROYALTY_PERCENT = 0.02;

export interface CorporateTributeInput {
  /** Gross worldwide revenue processed through PFF (this event or period). */
  grossRevenue: number;
  /** Partner or company identifier for audit. */
  partnerId?: string;
  /** Currency unit (e.g. 'VIDA', 'USD'). */
  currency?: string;
  reference?: string;
  /** True when this revenue is from a Dependent account. */
  isFromDependentAccount?: boolean;
  /** True when Guardian uses Dependent's account for a corporate transaction. 2% only applies in this case for dependents. */
  isCorporateTransaction?: boolean;
}

export interface CorporateTributeResult {
  grossRevenue: number;
  corporateRoyalty2: number;
  currency: string;
  partnerId?: string;
  reference?: string;
}

/**
 * Calculate 2% Corporate Tribute on worldwide revenue.
 * Does NOT persist; use recordCorporateTribute or applyPriorityLockDeductions for ledger.
 */
export function calculateCorporateTribute(input: CorporateTributeInput): CorporateTributeResult {
  const grossRevenue = Number(input.grossRevenue) || 0;
  const corporateRoyalty2 = grossRevenue * CORPORATE_ROYALTY_PERCENT;
  const currency = input.currency ?? 'VIDA';
  return {
    grossRevenue,
    corporateRoyalty2,
    currency,
    partnerId: input.partnerId,
    reference: input.reference,
  };
}

/**
 * Record 2% Corporate Tribute to foundation_vault_ledger (corporate_royalty_inflow).
 * Use when recording corporate royalty only. For Priority Lock (2% + 3% together), use applyPriorityLockDeductions.
 * Deduction mapping: For Dependent accounts, 2% Corporate Royalty only triggers when Guardian uses
 * the Dependent's account for a corporate transaction (isFromDependentAccount && isCorporateTransaction).
 */
export async function recordCorporateTribute(
  input: CorporateTributeInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  if (input.isFromDependentAccount === true && input.isCorporateTransaction !== true) {
    return { ok: true };
  }
  const computed = calculateCorporateTribute(input);
  try {
    const { error } = await (supabase as any)
      .from('foundation_vault_ledger')
      .insert({
        citizen_id: input.partnerId ?? 'corporate_worldwide',
        vida_amount: 0,
        corporate_royalty_inflow: computed.corporateRoyalty2,
        national_levy_inflow: 0,
        source_type: 'corporate_royalty_2',
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
