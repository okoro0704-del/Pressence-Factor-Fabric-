/**
 * PFF × Sovryn Bridge — Master Handshake.
 * Presence proof → Presence_Verified signal → redirect to Sovryn Wealth Dashboard.
 */

import { fetchChallenge, generatePresenceProof } from '@/lib/handshake';
import { getBrowserProvider, ensureRSK, getConnectedAddress } from './wallet';
import { SOVRYN_WEALTH_DASHBOARD_URL } from './config';

const MASTER_HANDSHAKE_API = '/api/master-handshake';
const STORAGE_KEY = 'pff_master_handshake';

export type MasterHandshakeResult = { ok: true; redirectUrl: string } | { ok: false; error: string };

function storageGet(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

function storageSet(data: Record<string, number>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function isMasterHandshakeComplete(address: string | null): boolean {
  if (!address) return false;
  const map = storageGet();
  return !!map[address.toLowerCase()];
}

export function setMasterHandshakeComplete(address: string): void {
  const map = storageGet();
  map[address.toLowerCase()] = Date.now();
  storageSet(map);
}

/**
 * Run Master Handshake: presence proof → attestation → redirect to Sovryn.
 * 1. Connect wallet, ensure RSK.
 * 2. Fetch challenge, generatePresenceProof (3D/biometric scan).
 * 3. POST /api/master-handshake with proof + address.
 * 4. On success: store locally, redirect to Sovryn Wealth Dashboard.
 */
export async function runMasterHandshake(): Promise<MasterHandshakeResult> {
  const addr = await getConnectedAddress();
  if (!addr) {
    return { ok: false, error: 'Connect your wallet first.' };
  }

  const ok = await ensureRSK();
  if (!ok) {
    return { ok: false, error: 'Switch to Rootstock (RSK) in your wallet.' };
  }

  const challenge = await fetchChallenge();
  if (!challenge) {
    return { ok: false, error: 'Could not fetch challenge. Connect to the internet and try again.' };
  }

  const result = await generatePresenceProof(undefined, challenge);
  if (!result.success || !result.proof) {
    return { ok: false, error: result.error ?? 'Presence verification failed.' };
  }

  const { handshakeId, ...proof } = result.proof;
  const body = { address: addr, handshakeId, proof: { ...proof, handshakeId } };

  let res: Response;
  try {
    res = await fetch(MASTER_HANDSHAKE_API, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Request failed.' };
  }

  const data = (await res.json()) as { ok?: boolean; error?: string; redirectUrl?: string };
  if (!res.ok) {
    return { ok: false, error: data.error ?? `Request failed (${res.status}).` };
  }

  if (!data.ok || !data.redirectUrl) {
    return { ok: false, error: data.error ?? 'Master handshake failed.' };
  }

  setMasterHandshakeComplete(addr);
  const url = data.redirectUrl || SOVRYN_WEALTH_DASHBOARD_URL;
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
  return { ok: true, redirectUrl: url };
}
