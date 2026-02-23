/**
 * PFF Backend — Vitalize routes.
 * /vitalize/register (DOORKEEPER PROTOCOL - new 4-pillar vitalization)
 * /vitalize/legacy-register (old create citizen endpoint)
 * /vitalize/verify (validate signed handshake)
 */

import { Router, Request, Response } from 'express';
import * as crypto from 'crypto';
import { verifyHandshake } from '../lib/verifyHandshake';
import { signPresenceToken } from '../lib/jwt';
import { query } from '../db/client';
import { mintOnVitalization } from '../economic/vidaCap';
import { processHubAccessFee } from '../economic/hubAccessFee';
import type { VitalizeVerifyRequest } from '../types';
import { config } from '../config';

export const vitalizeRouter = Router();

/**
 * POST /vitalize/register (DOORKEEPER PROTOCOL)
 *
 * THE SINGLE SOURCE OF TRUTH for vitalization.
 * Frontend is FORBIDDEN from executing this logic - it only forwards data here.
 *
 * Flow:
 * 1. Receive 4-pillar biometric data from frontend
 * 2. Validate biometric data (face hash, device ID, geolocation)
 * 3. Check if user already vitalized
 * 4. Execute 5-5-1 VIDA distribution (5 Citizen, 5 Treasury, 1 Foundation)
 * 5. Update user_profiles.vitalization_status to 'VITALIZED'
 * 6. Return vitalization result to frontend
 *
 * Body: {
 *   phoneNumber: string,
 *   sovereignId: string,
 *   biometricData: {
 *     faceHash: string,
 *     palmHash?: string,
 *     deviceId: string,
 *     geolocation?: { latitude: number, longitude: number, accuracy?: number }
 *   },
 *   walletAddress?: string
 * }
 */
vitalizeRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, sovereignId, biometricData, walletAddress } = req.body;

    // 1. Validate input
    if (!phoneNumber || !sovereignId || !biometricData) {
      res.status(400).json({
        success: false,
        code: 'MISSING_FIELDS',
        message: 'phoneNumber, sovereignId, and biometricData required',
      });
      return;
    }

    if (!biometricData.faceHash || !biometricData.deviceId) {
      res.status(400).json({
        success: false,
        code: 'MISSING_BIOMETRIC_DATA',
        message: 'faceHash and deviceId required in biometricData',
      });
      return;
    }

    // 2. Check if user exists in user_profiles
    const { rows: profileRows } = await query<{
      phone_number: string;
      vitalization_status: string;
      spendable_vida: number;
    }>(
      `SELECT phone_number, vitalization_status, spendable_vida
       FROM user_profiles
       WHERE phone_number = $1
       LIMIT 1`,
      [phoneNumber]
    );

    if (profileRows.length === 0) {
      res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User profile not found. Please create account first.',
      });
      return;
    }

    const profile = profileRows[0];

    // 3. Check if already vitalized
    if (profile.vitalization_status === 'VITALIZED') {
      res.status(400).json({
        success: false,
        code: 'ALREADY_VITALIZED',
        message: 'User is already vitalized',
        data: {
          vitalizationStatus: 'VITALIZED',
          vidaBalance: profile.spendable_vida,
        },
      });
      return;
    }

    // 4. Generate PFF ID
    const pffId = 'PFF-' + crypto.randomUUID().substring(0, 8).toUpperCase();

    // 5. Execute 5-5-1 VIDA distribution
    const citizenVida = config.economic.citizenVaultVida;
    const treasuryVida = config.economic.nationalTreasuryVida;
    const foundationVida = config.economic.foundationVaultVida;
    const totalVida = config.economic.totalVidaPerVitalization;

    // Generate transaction hash (mock for Phase 1 - database-driven)
    const transactionHash = crypto
      .createHash('sha256')
      .update(`${phoneNumber}-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`)
      .digest('hex');

    // 6. Update user_profiles with vitalization data
    const { rows: updatedRows } = await query<{
      phone_number: string;
      vitalization_status: string;
      vitalized_at: string;
      spendable_vida: number;
    }>(
      `UPDATE user_profiles
       SET vitalization_status = 'VITALIZED',
           vitalized_at = NOW(),
           vitalization_tx_hash = $1,
           face_hash = $2,
           device_id = $3,
           spendable_vida = $4,
           pff_id = $5,
           is_minted = true,
           humanity_score = 1.0,
           updated_at = NOW()
       WHERE phone_number = $6
       RETURNING phone_number, vitalization_status, vitalized_at, spendable_vida`,
      [transactionHash, biometricData.faceHash, biometricData.deviceId, citizenVida, pffId, phoneNumber]
    );

    if (updatedRows.length === 0) {
      res.status(500).json({
        success: false,
        code: 'UPDATE_FAILED',
        message: 'Failed to update vitalization status',
      });
      return;
    }

    // 7. Update treasury and foundation balances
    await updateTreasuryBalance(treasuryVida);
    await updateFoundationBalance(foundationVida);

    // 8. Log vitalization event
    await logVitalizationEvent(phoneNumber, sovereignId, pffId, {
      citizenVida,
      treasuryVida,
      foundationVida,
      totalVida,
      transactionHash,
      faceHash: biometricData.faceHash,
      deviceId: biometricData.deviceId,
    });

    // 9. Return success response
    res.status(200).json({
      success: true,
      data: {
        vitalizationStatus: 'VITALIZED',
        vitalizedAt: updatedRows[0].vitalized_at,
        pffId,
        vidaDistribution: {
          citizen: citizenVida,
          treasury: treasuryVida,
          foundation: foundationVida,
          total: totalVida,
        },
        transactionHash,
      },
    });
  } catch (e) {
    const err = e as Error;
    console.error('[VITALIZE/REGISTER ERROR]', err);
    res.status(500).json({
      success: false,
      code: 'VITALIZATION_FAILED',
      message: err.message || 'Vitalization failed',
    });
  }
});

/**
 * Helper: Update National Treasury VIDA balance
 */
async function updateTreasuryBalance(amount: number): Promise<void> {
  const { rows } = await query<{ vida_cap_balance: number }>(
    `SELECT vida_cap_balance FROM sovereign_internal_wallets WHERE phone_number = 'NATIONAL_TREASURY' LIMIT 1`
  );

  if (rows.length === 0) {
    // Create treasury wallet
    await query(
      `INSERT INTO sovereign_internal_wallets (phone_number, vida_cap_balance, created_at, updated_at)
       VALUES ('NATIONAL_TREASURY', $1, NOW(), NOW())`,
      [amount]
    );
  } else {
    // Update existing balance
    await query(
      `UPDATE sovereign_internal_wallets
       SET vida_cap_balance = vida_cap_balance + $1, updated_at = NOW()
       WHERE phone_number = 'NATIONAL_TREASURY'`,
      [amount]
    );
  }
}

/**
 * Helper: Update Foundation VIDA balance
 */
async function updateFoundationBalance(amount: number): Promise<void> {
  const { rows } = await query<{ vida_cap_balance: number }>(
    `SELECT vida_cap_balance FROM sovereign_internal_wallets WHERE phone_number = 'PFF_FOUNDATION' LIMIT 1`
  );

  if (rows.length === 0) {
    // Create foundation wallet
    await query(
      `INSERT INTO sovereign_internal_wallets (phone_number, vida_cap_balance, created_at, updated_at)
       VALUES ('PFF_FOUNDATION', $1, NOW(), NOW())`,
      [amount]
    );
  } else {
    // Update existing balance
    await query(
      `UPDATE sovereign_internal_wallets
       SET vida_cap_balance = vida_cap_balance + $1, updated_at = NOW()
       WHERE phone_number = 'PFF_FOUNDATION'`,
      [amount]
    );
  }
}

/**
 * Helper: Log vitalization event
 */
async function logVitalizationEvent(
  phoneNumber: string,
  sovereignId: string,
  pffId: string,
  data: {
    citizenVida: number;
    treasuryVida: number;
    foundationVida: number;
    totalVida: number;
    transactionHash: string;
    faceHash: string;
    deviceId: string;
  }
): Promise<void> {
  await query(
    `INSERT INTO vitalization_log
     (phone_number, sovereign_id, pff_id, face_hash, device_id, tx_hash,
      citizen_vida, treasury_vida, foundation_vida, total_vida, status, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'SUCCESS', NOW())`,
    [
      phoneNumber,
      sovereignId,
      pffId,
      data.faceHash,
      data.deviceId,
      data.transactionHash,
      data.citizenVida,
      data.treasuryVida,
      data.foundationVida,
      data.totalVida,
    ]
  );
}

/**
 * POST /vitalize/legacy-register (DEPRECATED)
 * Old endpoint for creating citizens with hardware anchor.
 * Use /vitalize/register (DOORKEEPER PROTOCOL) for new vitalizations.
 *
 * Body: { publicKey, deviceId, keyId, legalIdentityRef?, guestMode?, hostDeviceId? }
 */
vitalizeRouter.post('/legacy-register', async (req: Request, res: Response) => {
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

    // Mint on Vitalization: 10 VIDA (or 2 after cap) — 50/50 National_Vault (70/30) + Citizen_Vault (4/1)
    let vidaCap = null;
    try {
      vidaCap = await mintOnVitalization(citizenId, finalPffId);
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
