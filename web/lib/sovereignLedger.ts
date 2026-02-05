/**
 * Sovereign Ledger — fetch recent activity for Treasury (sovereign_ledger by phone_number).
 * All amounts use $1,000 VIDA anchor (VIDA_USD_DISPLAY).
 */

import { hasSupabase, supabase } from './supabase';

export interface SovereignLedgerEntry {
  id: string;
  timestamp: string;
  from_vault: string;
  to_vault: string;
  vida_cap_deducted: number;
  dllr_credited: number;
  exchange_rate: number;
  wallet_address: string;
  tx_hash: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  transaction_label: string | null;
}

const DEFAULT_LIMIT = 50;

/**
 * Fetch recent sovereign_ledger entries for the user (by phone_number).
 * Ordered by timestamp descending. Used for Treasury Recent Activity.
 */
export async function fetchRecentSovereignLedger(
  phoneNumber: string,
  limit: number = DEFAULT_LIMIT
): Promise<SovereignLedgerEntry[]> {
  if (!phoneNumber?.trim() || !hasSupabase() || !supabase) return [];

  const { data, error } = await (supabase as any)
    .from('sovereign_ledger')
    .select('id, timestamp, from_vault, to_vault, vida_cap_deducted, dllr_credited, exchange_rate, wallet_address, tx_hash, status, transaction_label')
    .eq('phone_number', phoneNumber.trim())
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    if (error.code === 'PGRST116' || error.message?.includes('phone_number')) return [];
    return [];
  }
  if (!Array.isArray(data)) return [];

  return data.map((row: Record<string, unknown>) => ({
    id: String(row.id ?? ''),
    timestamp: String(row.timestamp ?? ''),
    from_vault: String(row.from_vault ?? ''),
    to_vault: String(row.to_vault ?? ''),
    vida_cap_deducted: Number(row.vida_cap_deducted ?? 0),
    dllr_credited: Number(row.dllr_credited ?? 0),
    exchange_rate: Number(row.exchange_rate ?? 0),
    wallet_address: String(row.wallet_address ?? ''),
    tx_hash: String(row.tx_hash ?? ''),
    status: (row.status as 'PENDING' | 'CONFIRMED' | 'FAILED') ?? 'PENDING',
    transaction_label: row.transaction_label != null ? String(row.transaction_label) : null,
  }));
}

/** RSK block explorer base URL for tx links */
export const RSK_EXPLORER_TX_URL = 'https://explorer.rsk.co/tx';

/** True if tx_hash looks like an on-chain tx (0x + hex) and can be opened in explorer */
export function isExplorerTxHash(txHash: string): boolean {
  return typeof txHash === 'string' && txHash.startsWith('0x') && txHash.length >= 66;
}
