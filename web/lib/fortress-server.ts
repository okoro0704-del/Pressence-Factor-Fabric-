/**
 * Fortress Security — server-side: challenge store, blocked IPs, fraud alert.
 * Challenge-by-session for Presence Proof verification. IP block on fraud/replay.
 */

import { NextRequest } from 'next/server';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const SESSION_COOKIE = 'pff_fortress_session';

interface ChallengeEntry {
  challengeBase64: string;
  createdAt: number;
}

const challengeStore = new Map<string, ChallengeEntry[]>();
const burnedNonces = new Set<string>();
const blockedIPs = new Set<string>();
const attestedAddresses = new Set<string>();

function b64UrlToBuf(s: string): Buffer | null {
  try {
    let b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    if (pad) b64 += '='.repeat(4 - pad);
    return Buffer.from(b64, 'base64');
  } catch {
    return null;
  }
}

function challengeBytesMatch(a: string, b: string): boolean {
  const x = b64UrlToBuf(a);
  const y = b64UrlToBuf(b);
  return !!x && !!y && x.length === y.length && x.equals(y);
}

function pruneChallenges(): void {
  const now = Date.now();
  for (const [k, list] of challengeStore.entries()) {
    const kept = list.filter((e) => now - e.createdAt <= CHALLENGE_TTL_MS);
    if (kept.length) challengeStore.set(k, kept);
    else challengeStore.delete(k);
  }
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

export function isBlocked(ip: string): boolean {
  return blockedIPs.has(ip);
}

export function blockIp(ip: string): void {
  blockedIPs.add(ip);
}

export function getSessionId(req: NextRequest): string | null {
  const c = req.cookies.get(SESSION_COOKIE);
  return c?.value ?? null;
}

export function sessionCookieName(): string {
  return SESSION_COOKIE;
}

/** Append challenge for session (one per Prove Presence). */
export function storeChallenge(sessionId: string, challengeBase64: string): void {
  pruneChallenges();
  const list = challengeStore.get(sessionId) ?? [];
  list.push({ challengeBase64, createdAt: Date.now() });
  challengeStore.set(sessionId, list);
}

/**
 * Find and consume stored challenge matching proofChallenge (byte-wise, padding-safe).
 * Returns the matched challenge or null.
 */
export function consumeMatchingChallenge(sessionId: string, proofChallengeB64: string): string | null {
  const list = challengeStore.get(sessionId);
  if (!list?.length) return null;
  const now = Date.now();
  const idx = list.findIndex(
    (e) =>
      now - e.createdAt <= CHALLENGE_TTL_MS &&
      challengeBytesMatch(e.challengeBase64, proofChallengeB64)
  );
  if (idx < 0) return null;
  const [e] = list.splice(idx, 1);
  if (!list.length) challengeStore.delete(sessionId);
  else challengeStore.set(sessionId, list);
  return e.challengeBase64;
}

/** Burn nonce (one-time use). Returns true if was never used, false if replay. */
export function burnNonce(handshakeId: string): boolean {
  if (burnedNonces.has(handshakeId)) return false;
  burnedNonces.add(handshakeId);
  return true;
}

export function fraudAlert(ip: string, reason: string): void {
  blockIp(ip);
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
    console.warn(`[Fortress] Fraud alert: ${reason} — IP blocked: ${ip}`);
  }
}

/** Master Handshake: mark address as Presence_Verified (Sovryn Bridge). */
export function markAttested(address: string): void {
  attestedAddresses.add(address.toLowerCase());
}

export function isAttested(address: string): boolean {
  return attestedAddresses.has(address.toLowerCase());
}
