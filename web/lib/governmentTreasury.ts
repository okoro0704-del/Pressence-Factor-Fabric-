/**
 * National Government Treasury Dashboard — data fetching.
 * 50% Reserve Counter, Citizen Impact Feed, Treasury Growth (30 days).
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_PFF_BACKEND_URL || '';
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

/** Total 5.00 VIDA entries to government_treasury_vault (from sovereign_mint_ledger). */
export async function fetchReserveCounter(): Promise<number> {
  if (!BACKEND_URL) return 0;
  try {
    const res = await fetch(`${BACKEND_URL}/economic/vida-cap/national-reserve-accumulated`);
    if (!res.ok) return 0;
    const data = await res.json();
    return Number(data.totalNationalReserveAccumulated) || 0;
  } catch {
    return 0;
  }
}

/** Citizen Impact Feed: recent government_treasury_vault entries (3-of-4 verified → +5 VIDA). */
export async function fetchCitizenImpactFeed(limit = 50): Promise<CitizenImpactEntry[]> {
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/economic/treasury/citizen-impact?limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data.entries) ? data.entries : [];
      }
    } catch {
      // fallback to mock
    }
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
  if (BACKEND_URL) {
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
  if (BACKEND_URL) {
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
