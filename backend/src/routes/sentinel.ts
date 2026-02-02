/**
 * PFF Backend — Sentinel Opt-In API Routes
 * Sovereign Decision Engine: SENTINEL_DEPLOYMENT_REQUISITION
 * Architect: Isreal Okoro (mrfundzman)
 */

import { Router, Request, Response } from 'express';
import { requirePresenceToken, getPff } from '../middleware/pffAuth';
import { executeSovereignHandoff } from '../sentinel/sovereignHandoff';
import { getSentinelActivationStatus } from '../sentinel/hardwareHandover';
import { generateLifeOSCallback, sendLifeOSCallback } from '../sentinel/lifeosCallback';
import { query } from '../db/client';
import type {
  SentinelOptInRequest,
  SentinelOptInResponse,
  SentinelBindingHandshakePayload,
  SentinelGateStatus,
} from '../../../core/sentinelOptIn';
import type { SentinelDaemonInfo } from '../sentinel/hardwareHandover';

export const sentinelRouter = Router();

/**
 * POST /sentinel/request-activation
 * Open the SENTINEL_DEPLOYMENT_REQUISITION gate
 * Requires verified PFF identity (Presence Token)
 */
sentinelRouter.post(
  '/request-activation',
  requirePresenceToken,
  async (req: Request, res: Response) => {
    try {
      const { citizenId, pffId } = getPff(req);
      const { deviceInfo } = req.body as { deviceInfo: SentinelOptInRequest['deviceInfo'] };

      if (!deviceInfo || !deviceInfo.hasSecureEnclave) {
        res.status(400).json({
          success: false,
          error: 'Device must have secure enclave for Sentinel activation',
        });
        return;
      }

      // Check if already activated
      const existingActivation = await query<{ status: string }>(
        `SELECT status FROM sentinel_activations
         WHERE citizen_id = $1 AND status IN ('REQUESTED', 'BINDING', 'ACTIVE')
         ORDER BY created_at DESC
         LIMIT 1`,
        [citizenId]
      );

      if (existingActivation.rows.length > 0) {
        const status = existingActivation.rows[0].status as SentinelGateStatus;
        res.status(200).json({
          success: true,
          gateStatus: status,
          message: `Sentinel already ${status.toLowerCase()}`,
        } satisfies SentinelOptInResponse);
        return;
      }

      // Open the gate: Create activation request
      const sessionId = `sentinel-${Date.now()}-${citizenId.substring(0, 8)}`;
      
      await query(
        `INSERT INTO sentinel_activations 
         (citizen_id, pff_id, status, session_id, device_info, requested_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [citizenId, pffId, 'REQUESTED', sessionId, JSON.stringify(deviceInfo)]
      );

      res.status(200).json({
        success: true,
        gateStatus: 'REQUESTED',
        sessionId,
      } satisfies SentinelOptInResponse);
    } catch (e) {
      const err = e as Error;
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

/**
 * POST /sentinel/verify-binding
 * Execute Sovereign Handoff with payment gating
 *
 * CRITICAL: Payment ONLY triggers after 100% successful 4-layer handshake
 * If liveness check or any layer fails, NO payment is taken
 *
 * Flow:
 * 1. Verify 100% successful 4-layer handshake
 * 2. ONLY IF handshake succeeds: Execute $10 USD payment (45-10-45 split)
 * 3. Generate hardware-bound MASTER_SECURITY_TOKEN (lifetime validity)
 * 4. Hand over token to Sentinel Daemon
 * 5. Send LifeOS callback
 */
sentinelRouter.post(
  '/verify-binding',
  requirePresenceToken,
  async (req: Request, res: Response) => {
    try {
      const { citizenId, pffId } = getPff(req);
      const { handshakePayload, daemonInfo, deviceId, secureEnclaveAttestation } = req.body as {
        handshakePayload: SentinelBindingHandshakePayload;
        daemonInfo: SentinelDaemonInfo;
        deviceId: string;
        secureEnclaveAttestation: string;
      };

      if (!handshakePayload || !daemonInfo || !deviceId || !secureEnclaveAttestation) {
        res.status(400).json({
          success: false,
          error: 'handshakePayload, daemonInfo, deviceId, and secureEnclaveAttestation are required',
        });
        return;
      }

      // Check gate status
      const gateCheck = await query<{ status: string }>(
        `SELECT status FROM sentinel_activations
         WHERE citizen_id = $1 AND session_id = $2
         ORDER BY created_at DESC
         LIMIT 1`,
        [citizenId, handshakePayload.sessionId]
      );

      if (gateCheck.rows.length === 0 || gateCheck.rows[0].status !== 'REQUESTED') {
        res.status(403).json({
          success: false,
          error: 'SENTINEL_DEPLOYMENT_REQUISITION gate not open. Request activation first.',
        });
        return;
      }

      // Update status to BINDING
      await query(
        `UPDATE sentinel_activations
         SET status = $1, updated_at = NOW()
         WHERE citizen_id = $2 AND session_id = $3`,
        ['BINDING', citizenId, handshakePayload.sessionId]
      );

      // Execute Sovereign Handoff (with payment gating)
      const handoffResult = await executeSovereignHandoff(
        citizenId,
        pffId,
        handshakePayload,
        daemonInfo,
        deviceId,
        secureEnclaveAttestation
      );

      if (!handoffResult.success) {
        res.status(401).json({
          success: false,
          error: handoffResult.error?.message,
          code: handoffResult.error?.code,
          layer: handoffResult.error?.layer,
        });
        return;
      }

      // SUCCESS: Return complete handoff result
      res.status(200).json({
        success: true,
        sessionId: handoffResult.sessionId,
        masterSecurityToken: handoffResult.masterSecurityToken,
        sentinelDaemonId: handoffResult.sentinelDaemonId,
        paymentTransactionHash: handoffResult.paymentTransactionHash,
        feeAmountUSD: handoffResult.feeAmountUSD,
        feeAmountVIDA: handoffResult.feeAmountVIDA,
        oraclePrice: handoffResult.oraclePrice,
        encryptedChannel: handoffResult.encryptedChannel,
        totalDuration: handoffResult.totalDuration,
      });
    } catch (e) {
      const err = e as Error;
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

/**
 * GET /sentinel/status
 * Get Sentinel activation status for current citizen
 * Requires Presence Token
 */
sentinelRouter.get(
  '/status',
  requirePresenceToken,
  async (req: Request, res: Response) => {
    try {
      const { citizenId } = getPff(req);

      const status = await getSentinelActivationStatus(citizenId);
      const callback = await generateLifeOSCallback(citizenId);

      res.status(200).json({
        success: true,
        isActive: status.isActive,
        sentinelDaemonId: status.sentinelDaemonId,
        activatedAt: status.activatedAt,
        expiresAt: status.expiresAt,
        securityStatus: callback.securityStatus,
        statusBadge: callback.statusBadge,
      });
    } catch (e) {
      const err = e as Error;
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

/**
 * POST /sentinel/refresh-callback
 * Manually refresh LifeOS security status callback
 * Requires Presence Token
 */
sentinelRouter.post(
  '/refresh-callback',
  requirePresenceToken,
  async (req: Request, res: Response) => {
    try {
      const { citizenId } = getPff(req);
      const { callbackUrl } = req.body as { callbackUrl?: string };

      const result = await sendLifeOSCallback(citizenId, callbackUrl);

      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error,
        });
        return;
      }

      const callback = await generateLifeOSCallback(citizenId);

      res.status(200).json({
        success: true,
        callback,
      });
    } catch (e) {
      const err = e as Error;
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

