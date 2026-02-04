/**
 * Merchant Sales Ledger — daily intake and VIDA-to-Naira conversion.
 * In production, replace with Supabase/API; structure supports real-time sales.
 */

import { VIDA_PRICE_USD, NAIRA_RATE } from './sovereignHandshakeConstants';

export const VIDA_TO_NAIRA = VIDA_PRICE_USD * NAIRA_RATE;

export interface MerchantSale {
  id: string;
  amountVida: number;
  amountNaira: number;
  fromPhone?: string;
  createdAt: string; // ISO
  label?: string;
}

/** Mock daily sales for demo. Replace with API: GET /api/merchant/sales?from=...&to=... */
export async function getMerchantSales(
  walletAddress: string,
  fromDate?: Date,
  toDate?: Date
): Promise<MerchantSale[]> {
  // TODO: fetch from Supabase merchant_payments or backend
  const from = fromDate ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const to = toDate ?? new Date();
  const mock: MerchantSale[] = [
    {
      id: '1',
      amountVida: 0.05,
      amountNaira: 0.05 * VIDA_TO_NAIRA,
      createdAt: new Date().toISOString(),
      label: 'Sale',
    },
    {
      id: '2',
      amountVida: 0.02,
      amountNaira: 0.02 * VIDA_TO_NAIRA,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      label: 'Sale',
    },
  ].filter((s) => s.amountVida > 0);
  return mock;
}

export function totalVidaAndNaira(sales: MerchantSale[]): { totalVida: number; totalNaira: number } {
  const totalVida = sales.reduce((sum, s) => sum + s.amountVida, 0);
  const totalNaira = sales.reduce((sum, s) => sum + s.amountNaira, 0);
  return { totalVida, totalNaira };
}

/** Group sales by day (date string YYYY-MM-DD). */
export function groupSalesByDay(sales: MerchantSale[]): Map<string, MerchantSale[]> {
  const map = new Map<string, MerchantSale[]>();
  for (const s of sales) {
    const day = s.createdAt.slice(0, 10);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(s);
  }
  return map;
}
