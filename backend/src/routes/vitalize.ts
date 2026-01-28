/**
 * PFF Backend — Vitalize routes.
 * /vitalize/register (create citizen), /vitalize/verify (validate signed handshake).
 */

import { Router, Request, Response } from 'express';
import * as crypto from 'crypto';
import { verifyHandshake } from '../lib/verifyHandshake';
import { signPresenceToken } from '../lib/jwt';
import { query } from '../db/client';
import type { VitalizeVerifyRequest } from '../types';

export const vitalizeRouter = Router();

/**
 * POST /vitalize/register
 * Create citizen (Identity Metadata). No biometric data.
 * Body: { publicKey, deviceId, keyId, legalIdentityRef? }
 */
vitalizeRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { publicKey, deviceId, keyId, legalIdentityRef } = req.body as {
      publicKey?: string;
      deviceId?: string;
      keyId?: string;
      legalIdentityRef?: string;
    };
    if (!publicKey || !deviceId || !keyId) {
      res.status(400).json({
        success: false,
        code: 'MISSING_FIELDS',
        message: 'publicKey, deviceId, keyId required',
      });
      return;
    }

    const hardwareAnchorHash = crypto
      .createHash('sha256')
      .update(publicKey + '|' + deviceId)
      .digest('hex');
    const pffId = 'pff_' + crypto.randomUUID();

    await query(
      `INSERT INTO citizens (pff_id, vitalization_status, hardware_anchor_hash, public_key, key_id, device_id, legal_identity_ref, attested_at)
       VALUES ($1, 'vitalized', $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (device_id, key_id) DO UPDATE SET
         public_key = EXCLUDED.public_key,
         hardware_anchor_hash = EXCLUDED.hardware_anchor_hash,
         vitalization_status = 'vitalized',
         legal_identity_ref = EXCLUDED.legal_identity_ref,
         attested_at = NOW(),
         updated_at = NOW()`,
      [pffId, hardwareAnchorHash, publicKey, keyId, deviceId, legalIdentityRef ?? null]
    );
  } catch (e) {
    const err = e as Error;
    if (String(err.message).includes('unique') || (e as { code?: string }).code === '23505') {
      const { rows } = await query<{ pff_id: string }>(
        `SELECT pff_id FROM citizens WHERE device_id = $1 AND key_id = $2 LIMIT 1`,
        [deviceId, keyId]
      );
      res.status(200).json({
        success: true,
        pffId: rows[0]?.pff_id,
        message: 'Already registered',
      });
      return;
    }
    res.status(500).json({ success: false, code: 'REGISTER_FAILED', message: err.message });
    return;
  }

  const { rows } = await query<{ pff_id: string }>(
    `SELECT pff_id FROM citizens WHERE device_id = $1 AND key_id = $2 LIMIT 1`,
    [deviceId, keyId]
  );
  res.status(201).json({
    success: true,
    pffId: rows[0]?.pff_id,
  });
});

/**
 * POST /vitalize/verify
 * Validate signed handshake from device. Log attestation; require liveness > 0.99.
 * Body: { signedProof: SignedPresenceProof }
 */
vitalizeRouter.post('/verify', async (req: Request, res: Response) => {
  try {
    const { signedProof } = req.body as VitalizeVerifyRequest;
    if (!signedProof?.payload || !signedProof?.signature) {
      res.status(400).json({
        success: false,
        code: 'MISSING_PROOF',
        message: 'signedProof.payload and signedProof.signature required',
      });
      return;
    }

    const result = await verifyHandshake(signedProof);
    if (!result.ok) {
      res.status(401).json({
        success: false,
        code: result.code,
        message: result.message,
      });
      return;
    }

    const token = signPresenceToken({
      sub: result.citizenId,
      pffId: result.pffId,
    });
    const expiresInMs = 15 * 60 * 1000;

    res.status(200).json({
      success: true,
      presenceToken: token,
      expiresAt: Date.now() + expiresInMs,
      pffId: result.pffId,
    });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      code: 'VERIFY_FAILED',
      message: err.message,
    });
  }
});
