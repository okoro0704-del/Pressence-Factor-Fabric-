import { NextRequest, NextResponse } from 'next/server';
import * as cbor from 'cbor';

/**
 * POST /api/vitalize/register
 * WebAuthn registration: decode attestation, extract publicKey, forward to backend /vitalize/register.
 */

const AUTH_DATA_HEADER = 37;

function base64UrlToBuffer(s: string): Buffer {
  const base64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  return Buffer.from(padded, 'base64');
}

function bufferToBase64Url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function extractPublicKeyFromAttestation(attestationObjectBuf: Buffer): Buffer {
  const decoded = cbor.decodeFirstSync(attestationObjectBuf) as {
    authData?: Buffer;
    get?(k: string): unknown;
  };
  const authData = (decoded.authData ?? decoded.get?.('authData')) as Buffer | undefined;
  if (!Buffer.isBuffer(authData) || authData.length < AUTH_DATA_HEADER + 2) {
    throw new Error('Invalid authData');
  }
  const credIdLen = authData.readUInt16BE(AUTH_DATA_HEADER);
  const coseStart = AUTH_DATA_HEADER + 2 + credIdLen;
  if (authData.length < coseStart) throw new Error('authData too short');
  return authData.subarray(coseStart);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      credentialId?: string;
      attestationObject?: string;
      clientDataJSON?: string;
      deviceId?: string;
      userName?: string;
    };
    const { credentialId, attestationObject, deviceId } = body;
    if (!credentialId || !attestationObject) {
      return NextResponse.json(
        { success: false, message: 'credentialId and attestationObject required' },
        { status: 400 }
      );
    }
    const attBuf = base64UrlToBuffer(attestationObject);
    const publicKeyCose = extractPublicKeyFromAttestation(attBuf);
    const publicKey = bufferToBase64Url(publicKeyCose);
    const keyId = credentialId;
    const deviceIdFinal = deviceId ?? `pff_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;

    const backendUrl = process.env.PFF_BACKEND_URL;
    if (backendUrl) {
      const res = await fetch(`${backendUrl.replace(/\/$/, '')}/vitalize/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicKey,
          deviceId: deviceIdFinal,
          keyId,
          legalIdentityRef: body.userName ?? undefined,
        }),
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(
      {
        success: true,
        pffId: `pff_${keyId.slice(0, 8)}`,
        message: 'PFF_BACKEND_URL not set; registration logged only',
      },
      { status: 201 }
    );
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    return NextResponse.json(
      { success: false, message: err.message ?? 'Registration failed' },
      { status: 500 }
    );
  }
}
