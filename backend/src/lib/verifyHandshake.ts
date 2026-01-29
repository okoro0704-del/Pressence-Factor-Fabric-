/**
 * PFF Backend — Verify signed handshake from device.
 * Signature check, replay protection (nonce + timestamp), liveness > 0.99.
 */

import * as crypto from 'crypto';
import type { SignedPresenceProof, PresenceProofPayload } from '../types';
import { config } from '../config';
import { query } from '../db/client';

const REPLAY_WINDOW_MS = config.handshake.replayWindowMs;
const MIN_LIVENESS = config.handshake.minLivenessScore;
const REQUIRE_LIVENESS = config.handshake.requireLiveness;

/** Must match mobile handshake payload exactly (incl. livenessOk when present). */
function canonicalPayload(p: PresenceProofPayload): string {
  const base: Record<string, unknown> = {
    nonce: p.nonce,
    timestamp: p.timestamp,
    keyId: p.keyId,
    deviceId: p.deviceId,
  };
  if (p.livenessOk !== undefined) base.livenessOk = p.livenessOk;
  return JSON.stringify(base);
}

function payloadHash(payloadString: string): string {
  return crypto.createHash('sha256').update(payloadString).digest('hex');
}

export interface VerifyResultOk {
  ok: true;
  citizenId: string;
  pffId: string;
  livenessScore: number;
}

export interface VerifyResultFail {
  ok: false;
  code: string;
  message: string;
}

export type VerifyResult = VerifyResultOk | VerifyResultFail;

/**
 * Verify Signed Presence Proof:
 * 1. Lookup citizen by device_id + key_id.
 * 2. Verify RSA-SHA256 signature with stored public key.
 * 3. Replay check: timestamp within window, nonce not seen.
 * 4. Liveness: require score > 0.99 (use livenessScore or livenessOk -> 1.0).
 */
export async function verifyHandshake(
  signed: SignedPresenceProof,
  options?: { nation?: string }
): Promise<VerifyResult> {
  const { payload, signature } = signed;
  const now = Date.now();

  if (Math.abs(now - payload.timestamp) > REPLAY_WINDOW_MS) {
    return { ok: false, code: 'REPLAY_WINDOW', message: 'Proof timestamp outside replay window' };
  }

  const livenessScore =
    typeof payload.livenessScore === 'number'
      ? payload.livenessScore
      : payload.livenessOk === true
        ? 1.0
        : REQUIRE_LIVENESS ? 0 : 1.0;
  if (livenessScore <= MIN_LIVENESS) {
    return {
      ok: false,
      code: 'LIVENESS_REQUIRED',
      message: `Liveness score > ${MIN_LIVENESS} required (got ${livenessScore}). Send livenessOk: true or livenessScore.`,
    };
  }

  const { rows: citizens } = await query<{
    id: string;
    pff_id: string;
    public_key: string;
    vitalization_status: string;
  }>(
    `SELECT id, pff_id, public_key, vitalization_status
     FROM citizens
     WHERE device_id = $1 AND key_id = $2 AND vitalization_status = 'vitalized'
     LIMIT 1`,
    [payload.deviceId, payload.keyId]
  );

  if (citizens.length === 0) {
    return {
      ok: false,
      code: 'CITIZEN_NOT_FOUND',
      message: 'No vitalized citizen for this device and key',
    };
  }

  const c = citizens[0];
  let publicKey: crypto.KeyObject;
  try {
    publicKey = crypto.createPublicKey(c.public_key);
  } catch {
    return { ok: false, code: 'INVALID_PUBLIC_KEY', message: 'Stored public key invalid' };
  }

  const payloadString = canonicalPayload(payload);
  const sigBuf = Buffer.from(signature, 'base64');
  const payloadBuf = Buffer.from(payloadString, 'utf8');

  const verified = crypto.verify(
    'RSA-SHA256',
    payloadBuf,
    { key: publicKey, padding: crypto.constants.RSA_PKCS1_PADDING },
    sigBuf
  );
  if (!verified) {
    return { ok: false, code: 'SIGNATURE_INVALID', message: 'Signature verification failed' };
  }

  const hash = payloadHash(payloadString);
  try {
    await query(
      `INSERT INTO presence_handshakes (citizen_id, nonce_used, payload_hash, attestation_info, liveness_score, nation)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        c.id,
        payload.nonce,
        hash,
        payload.attestationCertChain ?? null,
        livenessScore,
        options?.nation ?? (payload as { nation?: string }).nation ?? null,
      ]
    );
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === '23505') {
      return { ok: false, code: 'REPLAY_NONCE', message: 'Nonce already used (replay)' };
    }
    throw e;
  }

  return {
    ok: true,
    citizenId: c.id,
    pffId: c.pff_id,
    livenessScore,
  };
}
