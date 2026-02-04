/**
 * PFF Backend — Vitalize routes.
 * /vitalize/register (create citizen), /vitalize/verify (validate signed handshake).
 */

import { Router, Request, Response } from 'express';
import * as crypto from 'crypto';
import { verifyHandshake } from '../lib/verifyHandshake';
import { signPresenceToken } from '../lib/jwt';
import { query } from '../db/client';
import { mintVidaCap } from '../economic/vidaCap';
import { processHubAccessFee } from '../economic/hubAccessFee';
import type { VitalizeVerifyRequest } from '../types';

export const vitalizeRouter = Router();

/**
 * POST /vitalize/register
 * Create citizen (Identity Metadata). No biometric data.
 * Body: { publicKey, deviceId, keyId, legalIdentityRef?, guestMode?, hostDeviceId? }
 * When guestMode is true and hostDeviceId is set, after mint the Sovereign Hub Access Fee (0.1 VIDA) is
 * deducted from the new user's Liquid and transferred to the device owner's primary wallet, if balance >= 1.0 VIDA.
 */
vitalizeRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { publicKey, deviceId, keyId, legalIdentityRef, guestMode, hostDeviceId } = req.body as {
      publicKey?: string;
      deviceId?: string;
      keyId?: string;
      legalIdentityRef?: string;
      guestMode?: boolean;
      hostDeviceId?: string;
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

    const { rows: insertedRows } = await query<{ id: string; pff_id: string }>(
      `INSERT INTO citizens (pff_id, vitalization_status, hardware_anchor_hash, public_key, key_id, device_id, legal_identity_ref, attested_at)
       VALUES ($1, 'vitalized', $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (device_id, key_id) DO UPDATE SET
         public_key = EXCLUDED.public_key,
         hardware_anchor_hash = EXCLUDED.hardware_anchor_hash,
         vitalization_status = 'vitalized',
         legal_identity_ref = EXCLUDED.legal_identity_ref,
         attested_at = NOW(),
         updated_at = NOW()
       RETURNING id, pff_id`,
      [pffId, hardwareAnchorHash, publicKey, keyId, deviceId, legalIdentityRef ?? null]
    );

    // Check if this was an update (already registered)
    if (insertedRows.length === 0) {
      const { rows } = await query<{ id: string; pff_id: string }>(
        `SELECT id, pff_id FROM citizens WHERE device_id = $1 AND key_id = $2 LIMIT 1`,
        [deviceId, keyId]
      );
      if (rows.length > 0) {
        res.status(200).json({
          success: true,
          pffId: rows[0].pff_id,
          message: 'Already registered',
        });
        return;
      }
    }

    const citizenId = insertedRows[0].id;
    const finalPffId = insertedRows[0].pff_id;

    // Mint VIDA CAP with 50/50 split (only for new registrations)
    let vidaCap = null;
    try {
      vidaCap = await mintVidaCap(citizenId, finalPffId);
    } catch (mintError) {
      // Log error but don't fail registration
      console.error('VIDA CAP minting failed:', mintError);
    }

    // Sovereign Hub Access Fee: when registered via Guest Mode, deduct 0.1 VIDA from new user's Liquid
    // and transfer to device owner's primary wallet. Only if new user balance >= 1.0 VIDA (grant issued).
    let hubFee = null;
    if (guestMode && hostDeviceId && typeof hostDeviceId === 'string') {
      try {
        const hubResult = await processHubAccessFee(citizenId, finalPffId, hostDeviceId);
        if (hubResult.processed) {
          hubFee = { processed: true, transactionHash: hubResult.transactionHash, label: 'Sovereign Hub Access Fee' };
        }
      } catch (hubError) {
        console.error('Sovereign Hub Access Fee failed:', hubError);
      }
    }

    res.status(201).json({
      success: true,
      pffId: finalPffId,
      vidaCap: vidaCap || undefined,
      hubAccessFee: hubFee || undefined,
    });
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
  }
});

/**
 * POST /vitalize/verify
 * Validate signed handshake from device. Log attestation; require liveness > 0.99.
 * Body: { signedProof: SignedPresenceProof }
 */
vitalizeRouter.post('/verify', async (req: Request, res: Response) => {
  try {
    const { signedProof, nation } = req.body as VitalizeVerifyRequest;
    if (!signedProof?.payload || !signedProof?.signature) {
      res.status(400).json({
        success: false,
        code: 'MISSING_PROOF',
        message: 'signedProof.payload and signedProof.signature required',
      });
      return;
    }

    const result = await verifyHandshake(signedProof, { nation });
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
