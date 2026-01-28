import { NextRequest, NextResponse } from 'next/server';
import {
  getClientIp,
  isBlocked,
  getSessionId,
  consumeMatchingChallenge,
  burnNonce,
  fraudAlert,
  markAttested,
  isAttested,
} from '@/lib/fortress-server';

const SOVRYN_WEALTH_DASHBOARD = 'https://sovryn.app';

function base64UrlToBuffer(s: string): Buffer | null {
  try {
    let b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    if (pad) b64 += '='.repeat(4 - pad);
    return Buffer.from(b64, 'base64');
  } catch {
    return null;
  }
}

function decodeClientDataJSON(b64: string): { challenge?: string } | null {
  try {
    const buf = base64UrlToBuffer(b64);
    if (!buf) return null;
    return JSON.parse(buf.toString('utf-8')) as { challenge?: string };
  } catch {
    return null;
  }
}

function isEthAddress(s: unknown): s is string {
  return typeof s === 'string' && /^0x[a-fA-F0-9]{40}$/.test(s);
}

/**
 * POST /api/master-handshake
 * Master Handshake: verify Presence Proof, mark address attested, return redirect URL.
 * Sovryn Bridge: Presence_Verified signal for wallet on Rootstock.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isBlocked(ip)) {
    return NextResponse.json({ error: 'Blocked', fraud: true }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { address, handshakeId, proof } = body as {
      address?: unknown;
      handshakeId?: string;
      proof?: unknown;
    };

    if (!isEthAddress(address)) {
      return NextResponse.json({ error: 'Missing or invalid address' }, { status: 400 });
    }
    if (!handshakeId || typeof handshakeId !== 'string') {
      return NextResponse.json({ error: 'Missing handshakeId' }, { status: 400 });
    }
    if (!proof || typeof proof !== 'object') {
      return NextResponse.json({ error: 'Missing proof' }, { status: 400 });
    }

    const sessionId = getSessionId(req);
    if (!sessionId) {
      fraudAlert(ip, 'master-handshake: no session');
      return NextResponse.json({ error: 'No session', fraud: true }, { status: 403 });
    }

    const po = proof as { clientDataJSON?: string };
    const clientDataB64 = po.clientDataJSON;
    if (typeof clientDataB64 !== 'string') {
      fraudAlert(ip, 'master-handshake: missing clientDataJSON');
      return NextResponse.json({ error: 'Invalid proof', fraud: true }, { status: 403 });
    }

    const decoded = decodeClientDataJSON(clientDataB64);
    const proofChallenge = decoded?.challenge;
    if (typeof proofChallenge !== 'string') {
      fraudAlert(ip, 'master-handshake: invalid clientDataJSON');
      return NextResponse.json({ error: 'Invalid proof', fraud: true }, { status: 403 });
    }

    const consumed = consumeMatchingChallenge(sessionId, proofChallenge);
    if (!consumed) {
      fraudAlert(ip, 'master-handshake: challenge mismatch or expired');
      return NextResponse.json({ error: 'Challenge mismatch or expired', fraud: true }, { status: 403 });
    }

    if (!burnNonce(handshakeId)) {
      fraudAlert(ip, 'master-handshake: replay detected');
      return NextResponse.json({ error: 'Replay detected', fraud: true }, { status: 403 });
    }

    markAttested(address);

    return NextResponse.json({
      ok: true,
      redirectUrl: SOVRYN_WEALTH_DASHBOARD,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
}

/**
 * GET /api/master-handshake?address=0x...
 * Check if address has completed Master Handshake (Presence_Verified).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');
  if (!isEthAddress(address)) {
    return NextResponse.json({ error: 'Missing or invalid address' }, { status: 400 });
  }
  return NextResponse.json({ attested: isAttested(address) });
}
