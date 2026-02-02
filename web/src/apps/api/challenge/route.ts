import { NextRequest, NextResponse } from 'next/server';
import {
  getClientIp,
  isBlocked,
  getSessionId,
  storeChallenge,
  sessionCookieName,
} from '@/lib/fortress-server';

const CHALLENGE_BYTES = 32;

function generateChallenge(): { raw: Uint8Array; b64: string } {
  const raw = new Uint8Array(CHALLENGE_BYTES);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(raw);
  }
  const b64 = Buffer.from(raw).toString('base64url');
  return { raw, b64 };
}

/**
 * GET /api/challenge
 * Fortress: issue session-bound challenge for Presence Proof.
 * Client must use this challenge in getAssertion; sync-presence verifies it.
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (isBlocked(ip)) {
    return NextResponse.json({ error: 'Blocked' }, { status: 403 });
  }

  let sessionId = getSessionId(req);
  if (!sessionId) {
    sessionId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `pff_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  }

  const { b64 } = generateChallenge();
  storeChallenge(sessionId, b64);

  const res = NextResponse.json({ challenge: b64 });
  res.cookies.set(sessionCookieName(), sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 5,
    path: '/',
  });
  return res;
}
