/**
 * Financial Engine — Dual-Source Sovereign Tax with Priority Lock.
 * Corporate 2% (worldwide revenue) and National 3% (block gross inflow) are deducted
 * simultaneously and FIRST, before any Government or Citizen VIDA/DLLR distribution.
 */

import { supabase } from './supabase';
import { calculateCorporateTribute } from './corporateTribute';
import { calculateNationalBlockDeduction } from './nationalBlockEngine';

/** 2% Corporate Royalty (worldwide revenue through PFF) — see corporateTribute.ts */
export const CORPORATE_ROYALTY_PERCENT = 0.02;

/** 3% National Levy (National Block gross inflow) — see nationalBlockEngine.ts */
export const NATIONAL_LEVY_PERCENT = 0.03;

/** Total Foundation deduction in Priority Lock (2% + 3% = 5%) before any other splits. */
export const PRIORITY_LOCK_TOTAL_PERCENT = CORPORATE_ROYALTY_PERCENT + NATIONAL_LEVY_PERCENT;

/** 2% conversion levy on VIDA→DLLR (routed to PFF_FOUNDATION_VAULT). */
export const CONVERSION_LEVY_PERCENT = 0.02;

export interface NationalBlockRevenueInput {
  /** Identifier for the national block (e.g. reserve id, region code). */
  blockId: string;
  /** Gross revenue amount entering the block (in VIDA or specified currency). */
  grossRevenue: number;
  /** Currency unit for display/audit (e.g. 'VIDA', 'USD'). */
  currency?: string;
  /** Optional partner/company id for corporate 2% audit. */
  partnerId?: string;
  reference?: string;
}

export interface NationalBlockRevenueResult {
  grossRevenue: number;
  corporateRoyalty2: number;
  nationalLevy3: number;
  foundationDeduction5: number;
  netDistributable: number;
  currency: string;
  blockId: string;
  reference?: string;
}

export interface PriorityLockInput {
  /** Gross revenue (e.g. worldwide revenue through PFF / National Block gross inflow). */
  grossRevenue: number;
  blockId: string;
  currency?: string;
  partnerId?: string;
  reference?: string;
}

export interface PriorityLockResult {
  grossRevenue: number;
  corporateRoyalty2: number;
  nationalLevy3: number;
  netDistributable: number;
  currency: string;
  blockId: string;
  reference?: string;
}

/**
 * Priority Lock: compute 2% Corporate + 3% National simultaneously, before any other splits.
 * Returns amounts for ledger/audit; use applyPriorityLockDeductions to persist to foundation_vault_ledger.
 */
export function calculatePriorityLockDeductions(input: PriorityLockInput): PriorityLockResult {
  const grossRevenue = Number(input.grossRevenue) || 0;
  const corporate = calculateCorporateTribute({ grossRevenue, partnerId: input.partnerId, currency: input.currency, reference: input.reference });
  const national = calculateNationalBlockDeduction({ blockId: input.blockId, grossInflow: grossRevenue, currency: input.currency, reference: input.reference });
  const netDistributable = grossRevenue - corporate.corporateRoyalty2 - national.nationalLevy3;
  const currency = input.currency ?? 'VIDA';
  return {
    grossRevenue,
    corporateRoyalty2: corporate.corporateRoyalty2,
    nationalLevy3: national.nationalLevy3,
    netDistributable,
    currency,
    blockId: input.blockId,
    reference: input.reference,
  };
}

/**
 * Apply Priority Lock: write 2% (corporate_royalty_inflow) and 3% (national_levy_inflow) to foundation_vault_ledger
 * in a single row, simultaneously, before any other splits. Used by recordNationalBlockRevenue.
 */
export async function applyPriorityLockDeductions(
  input: PriorityLockInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const computed = calculatePriorityLockDeductions(input);
  try {
    const { error } = await (supabase as any)
      .from('foundation_vault_ledger')
      .insert({
        citizen_id: `NATIONAL_BLOCK_${input.blockId}`,
        vida_amount: 0,
        corporate_royalty_inflow: computed.corporateRoyalty2,
        national_levy_inflow: computed.nationalLevy3,
        source_type: 'priority_lock_2pct_3pct',
        reference: input.reference ?? null,
        created_at: new Date().toISOString(),
      });
    if (error) return { ok: false, error: error.message ?? 'Priority lock vault insert failed' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Calculate National Block revenue with Dual-Source Sovereign Tax (2% + 3% = 5% total).
 * Net distributable = gross - 2% - 3%. Does NOT persist.
 */
export function calculateNationalBlockRevenue(input: NationalBlockRevenueInput): NationalBlockRevenueResult {
  const lock = calculatePriorityLockDeductions({
    grossRevenue: input.grossRevenue,
    blockId: input.blockId,
    currency: input.currency,
    partnerId: input.partnerId,
    reference: input.reference,
  });
  return {
    grossRevenue: lock.grossRevenue,
    corporateRoyalty2: lock.corporateRoyalty2,
    nationalLevy3: lock.nationalLevy3,
    foundationDeduction5: lock.corporateRoyalty2 + lock.nationalLevy3,
    netDistributable: lock.netDistributable,
    currency: lock.currency,
    blockId: lock.blockId,
    reference: lock.reference,
  };
}

/**
 * Record National Block revenue: Priority Lock (2% + 3%) first to foundation_vault_ledger with
 * corporate_royalty_inflow and national_levy_inflow; then national_revenue_ledger and foundation_royalty_audit.
 */
export async function recordNationalBlockRevenue(
  input: NationalBlockRevenueInput
): Promise<{ ok: true; ledgerId: string; auditId: string } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not available' };
  const computed = calculateNationalBlockRevenue(input);

  try {
    // 1) Priority Lock: 2% + 3% to foundation_vault_ledger (corporate_royalty_inflow, national_levy_inflow) simultaneously
    const lockOk = await applyPriorityLockDeductions({
      grossRevenue: input.grossRevenue,
      blockId: input.blockId,
      currency: input.currency,
      partnerId: input.partnerId,
      reference: input.reference,
    });
    if (!lockOk.ok) return lockOk;

    // 2) Immutable audit log — proves Priority Lock was applied before any mint or other splits
    const { data: auditRow, error: auditError } = await (supabase as any)
      .from('foundation_royalty_audit')
      .insert({
        block_id: input.blockId,
        gross_revenue: computed.grossRevenue,
        foundation_deduction_5: computed.foundationDeduction5,
        net_distributable: computed.netDistributable,
        currency: computed.currency,
        reference: input.reference ?? null,
        step: 'priority_lock_2pct_3pct_before_splits',
      })
      .select('id')
      .single();
    if (auditError || !auditRow) {
      console.error('[FinancialEngine] foundation_royalty_audit insert failed:', auditError);
      return { ok: false, error: auditError?.message ?? 'Audit log failed' };
    }

    // 3) National revenue ledger — transparency (Gross, 5% total Foundation Deduction, Net Distributable)
    const { data: ledgerRow, error: ledgerError } = await (supabase as any)
      .from('national_revenue_ledger')
      .insert({
        block_id: input.blockId,
        gross_revenue: computed.grossRevenue,
        foundation_deduction_5: computed.foundationDeduction5,
        net_distributable: computed.netDistributable,
        currency: computed.currency,
        reference: input.reference ?? null,
      })
      .select('id')
      .single();
    if (ledgerError || !ledgerRow) {
      console.error('[FinancialEngine] national_revenue_ledger insert failed:', ledgerError);
      return { ok: false, error: ledgerError?.message ?? 'Ledger insert failed' };
    }

    return { ok: true, ledgerId: ledgerRow.id, auditId: auditRow.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[FinancialEngine]', msg);
    return { ok: false, error: msg };
  }
}

/** Row for National Block Contribution (which blocks generate the most royalty). */
export interface NationalBlockContributionRow {
  block_id: string;
  total_gross_revenue: number;
  total_foundation_deduction_5: number;
  total_net_distributable: number;
  currency: string;
  entry_count: number;
}

/**
 * Fetch National Block Contribution totals for Foundation Dashboard chart.
 * Returns blocks ordered by total_foundation_deduction_5 (most royalty first).
 */
export async function getNationalBlockContributions(): Promise<NationalBlockContributionRow[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await (supabase as any)
      .from('national_revenue_ledger')
      .select('block_id, gross_revenue, foundation_deduction_5, net_distributable, currency');
    if (error || !data || !Array.isArray(data)) return [];
    const byBlock = new Map<string, NationalBlockContributionRow>();
    for (const row of data) {
      const bid = String(row.block_id ?? '');
      const cur = byBlock.get(bid) ?? {
        block_id: bid,
        total_gross_revenue: 0,
        total_foundation_deduction_5: 0,
        total_net_distributable: 0,
        currency: row.currency ?? 'VIDA',
        entry_count: 0,
      };
      cur.total_gross_revenue += Number(row.gross_revenue ?? 0);
      cur.total_foundation_deduction_5 += Number(row.foundation_deduction_5 ?? 0);
      cur.total_net_distributable += Number(row.net_distributable ?? 0);
      cur.entry_count += 1;
      byBlock.set(bid, cur);
    }
    return Array.from(byBlock.values()).sort(
      (a, b) => b.total_foundation_deduction_5 - a.total_foundation_deduction_5
    );
  } catch {
    return [];
  }
}
