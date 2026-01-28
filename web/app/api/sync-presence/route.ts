import { NextRequest, NextResponse } from 'next/server';
import {
  getClientIp,
  isBlocked,
  getSessionId,
  consumeMatchingChallenge,
  burnNonce,
  fraudAlert,
} from '@/lib/fortress-server';

/**
 * PFF — Sync Presence Proof (Fortress Security).
 * - Challenge verification: proof's clientDataJSON challenge must match session-issued challenge.
 * - Replay protection: handshakeId is one-time nonce; burned after verification. Replay → fraud + block.
 * - On challenge mismatch or replay: Fraud Alert, block IP, 403.
 */

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
    const json = buf.toString('utf-8');
    return JSON.parse(json) as { challenge?: string };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isBlocked(ip)) {
    return NextResponse.json({ error: 'Blocked', fraud: true }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { handshakeId, proof } = body as { handshakeId?: string; proof?: unknown };

    if (!handshakeId || typeof handshakeId !== 'string') {
      return NextResponse.json({ error: 'Missing handshakeId' }, { status: 400 });
    }
    if (!proof || typeof proof !== 'object') {
      return NextResponse.json({ error: 'Missing proof' }, { status: 400 });
    }

    const sessionId = getSessionId(req);
    if (!sessionId) {
      fraudAlert(ip, 'sync-presence: no session');
      return NextResponse.json({ error: 'No session', fraud: true }, { status: 403 });
    }

    const po = proof as { clientDataJSON?: string };
    const clientDataB64 = po.clientDataJSON;
    if (typeof clientDataB64 !== 'string') {
      fraudAlert(ip, 'sync-presence: missing clientDataJSON');
      return NextResponse.json({ error: 'Invalid proof', fraud: true }, { status: 403 });
    }

    const decoded = decodeClientDataJSON(clientDataB64);
    const proofChallenge = decoded?.challenge;
    if (typeof proofChallenge !== 'string') {
      fraudAlert(ip, 'sync-presence: invalid clientDataJSON');
      return NextResponse.json({ error: 'Invalid proof', fraud: true }, { status: 403 });
    }

    const consumed = consumeMatchingChallenge(sessionId, proofChallenge);
    if (!consumed) {
      fraudAlert(ip, 'sync-presence: challenge not found or mismatch');
      return NextResponse.json({ error: 'Challenge mismatch or expired', fraud: true }, { status: 403 });
    }

    if (!burnNonce(handshakeId)) {
      fraudAlert(ip, 'sync-presence: replay detected');
      return NextResponse.json({ error: 'Replay detected', fraud: true }, { status: 403 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
}
