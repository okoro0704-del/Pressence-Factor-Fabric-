/**
 * National Government Treasury Dashboard — data fetching.
 * 50% Reserve Counter, Citizen Impact Feed, Treasury Growth (30 days).
 * Prefer Supabase (national_block_reserves, user_profiles); fallback to backend URL or hardcoded sovereignty.
 */

import { supabase, hasSupabase } from './supabase';
import { FALLBACK_TOTAL_NATIONAL_RESERVE_ACCUMULATED } from './sovereigntyFallbacks';

/** Only attempt backend fetch when set; otherwise use Supabase/fallback so UI stays functional. */
const BACKEND_URL = (process.env.NEXT_PUBLIC_PFF_BACKEND_URL ?? '').trim();
const hasBackend = (): boolean => BACKEND_URL.length > 0;
const GOVERNMENT_TREASURY_VIDA = 5.0;

export interface CitizenImpactEntry {
  id: string;
  pffId: string;
  amountVida: number;
  createdAt: string;
  message: string;
}

export interface TreasuryGrowthDay {
  date: string;
  totalVida: number;
  cumulativeVida: number;
}

/** Role check: only GOVERNMENT_ADMIN can access treasury. Set via localStorage or backend. */
export function isGovernmentAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  const role = localStorage.getItem('pff_user_role');
  if (role === 'GOVERNMENT_ADMIN') return true;
  const allowlist = process.env.NEXT_PUBLIC_GOVERNMENT_ADMIN_PFF_IDS;
  if (allowlist && typeof allowlist === 'string') {
    const pffId = localStorage.getItem('pff_id') || '';
    return allowlist.split(',').map((s) => s.trim()).includes(pffId);
  }
  return false;
}

/** Total National Reserve Accumulated — from Supabase national_block_reserves, else backend, else hardcoded sovereignty. */
export async function fetchReserveCounter(): Promise<number> {
  try {
    if (hasSupabase()) {
      const { data, error } = await supabase
        .from('national_block_reserves')
        .select('national_vault_vida_cap, vida_cap_liquidity, national_vida_pool_vida_cap')
        .eq('id', '00000000-0000-0000-0000-000000000002')
        .maybeSingle();
      if (!error && data) {
        const total =
          Number(data.national_vault_vida_cap) + Number(data.vida_cap_liquidity) + Number(data.national_vida_pool_vida_cap);
        return total > 0 ? total : FALLBACK_TOTAL_NATIONAL_RESERVE_ACCUMULATED;
      }
    }
    if (hasBackend()) {
      const res = await fetch(`${BACKEND_URL}/economic/vida-cap/national-reserve-accumulated`);
      if (res.ok) {
        const data = await res.json();
        const n = Number(data.totalNationalReserveAccumulated);
        if (n > 0) return n;
      }
    }
  } catch {
    // fall through to fallback
  }
  return FALLBACK_TOTAL_NATIONAL_RESERVE_ACCUMULATED;
}

/** Citizen Impact Feed: from Supabase user_profiles (recent vitalized), else backend, else mock. */
export async function fetchCitizenImpactFeed(limit = 50): Promise<CitizenImpactEntry[]> {
  try {
    if (hasSupabase()) {
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('id, phone_number, updated_at')
        .eq('is_fully_verified', true)
        .not('updated_at', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(limit);
      if (!error && Array.isArray(profiles) && profiles.length > 0) {
        return profiles.map((p: { id: string; phone_number?: string; updated_at: string }) => ({
          id: p.id,
          pffId: p.phone_number || p.id.slice(0, 8),
          amountVida: GOVERNMENT_TREASURY_VIDA,
          createdAt: p.updated_at,
          message: 'New Citizen Verified → +5.00 VIDA to Treasury',
        }));
      }
    }
    if (hasBackend()) {
      const res = await fetch(`${BACKEND_URL}/economic/treasury/citizen-impact?limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.entries) && data.entries.length > 0) return data.entries;
      }
    }
  } catch {
    // fallback to mock
  }
  return getMockCitizenImpactFeed(limit);
}

function getMockCitizenImpactFeed(limit: number): CitizenImpactEntry[] {
  const entries: CitizenImpactEntry[] = [];
  const now = Date.now();
  for (let i = 0; i < limit; i++) {
    const createdAt = new Date(now - i * 120000).toISOString();
    entries.push({
      id: `impact-${i}`,
      pffId: `pff_${String(Math.random()).slice(2, 10)}`,
      amountVida: GOVERNMENT_TREASURY_VIDA,
      createdAt,
      message: 'New Citizen Verified → +5.00 VIDA to Treasury',
    });
  }
  return entries;
}

/** Treasury growth over last 30 days (cumulative 5 VIDA per citizen). */
export async function fetchTreasuryGrowthLast30Days(): Promise<TreasuryGrowthDay[]> {
  if (hasBackend()) {
    try {
      const res = await fetch(`${BACKEND_URL}/economic/treasury/growth?days=30`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.days)) {
          return data.days.map((d: { date: string; totalVida: number; cumulativeVida: number }) => ({
            date: d.date,
            totalVida: d.totalVida,
            cumulativeVida: d.cumulativeVida,
          }));
        }
      }
    } catch {
      // fallback to mock
    }
  }
  return getMockTreasuryGrowth30();
}

function getMockTreasuryGrowth30(): TreasuryGrowthDay[] {
  const days: TreasuryGrowthDay[] = [];
  let cumulative = 0;
  const base = 120;
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const add = Math.floor(base + Math.random() * 40);
    cumulative += add;
    days.push({ date: dateStr, totalVida: add, cumulativeVida: cumulative });
  }
  return days;
}

/** Placeholder: total DLLR converted by citizens in block (from Sovryn/bridge). */
export async function fetchTotalDllrConvertedInBlock(): Promise<number | null> {
  if (hasBackend()) {
    try {
      const res = await fetch(`${BACKEND_URL}/economic/treasury/dllr-converted`);
      if (res.ok) {
        const data = await res.json();
        return typeof data.totalDllr === 'number' ? data.totalDllr : null;
      }
    } catch {
      // ignore
    }
  }
  return null;
}
