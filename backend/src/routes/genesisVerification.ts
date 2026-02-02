/**
 * PFF Backend — Genesis Verification API Routes
 * Endpoints for Architect's Final Genesis Verification (The Master Key)
 * Architect: Isreal Okoro (mrfundzman)
 */

import express, { Request, Response } from 'express';
import {
  executeGenesisVerification,
  verifyGenesisAuthority,
  getStasisReleaseStatus,
  GenesisHandshakePayload,
} from '../services/genesisVerification';
import { initiateSecureHandshake, HardwareSyncRequest } from '../services/hardwareSync';

export const genesisVerificationRouter = express.Router();

/**
 * POST /api/genesis/initiate-hardware-sync
 * Initiate secure handshake between HP Laptop and Mobile Device
 */
genesisVerificationRouter.post('/initiate-hardware-sync', async (req: Request, res: Response) => {
  try {
    const {
      laptopDeviceUUID,
      mobileDeviceUUID,
      laptopTPMAttestation,
      mobileSecureEnclaveAttestation,
      syncSessionId,
    } = req.body;

    if (!laptopDeviceUUID || !mobileDeviceUUID || !laptopTPMAttestation || !mobileSecureEnclaveAttestation || !syncSessionId) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
      return;
    }

    const syncRequest: HardwareSyncRequest = {
      laptopDeviceUUID,
      mobileDeviceUUID,
      laptopTPMAttestation,
      mobileSecureEnclaveAttestation,
      syncSessionId,
      timestamp: new Date(),
    };

    const result = await initiateSecureHandshake(syncRequest);

    if (result.success) {
      res.json({
        success: true,
        result,
        message: 'HARDWARE_SYNC_ESTABLISHED',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Hardware sync failed',
        result,
      });
    }
  } catch (e) {
    const err = e as Error;
    console.error('[GENESIS API] Hardware sync failed:', err);
    res.status(500).json({
      success: false,
      error: 'Hardware sync failed',
      details: err.message,
    });
  }
});

/**
 * POST /api/genesis/execute-verification
 * Execute complete Genesis Verification ceremony
 */
genesisVerificationRouter.post('/execute-verification', async (req: Request, res: Response) => {
  try {
    const {
      laptopDeviceUUID,
      mobileDeviceUUID,
      laptopTPMAttestation,
      mobileSecureEnclaveAttestation,
      handshakePayload,
      architectPffId,
      architectCitizenId,
    } = req.body;

    if (!laptopDeviceUUID || !mobileDeviceUUID || !handshakePayload || !architectPffId || !architectCitizenId) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
      return;
    }

    const payload: GenesisHandshakePayload = {
      sessionId: handshakePayload.sessionId,
      faceSignature: handshakePayload.faceSignature,
      fingerSignature: handshakePayload.fingerSignature,
      heartSignature: handshakePayload.heartSignature,
      voiceSignature: handshakePayload.voiceSignature,
      faceScore: handshakePayload.faceScore,
      fingerScore: handshakePayload.fingerScore,
      heartScore: handshakePayload.heartScore,
      voiceScore: handshakePayload.voiceScore,
      livenessScore: handshakePayload.livenessScore,
      totalDuration: handshakePayload.totalDuration,
      captureTimestamp: new Date(handshakePayload.captureTimestamp),
    };

    const result = await executeGenesisVerification(
      laptopDeviceUUID,
      mobileDeviceUUID,
      laptopTPMAttestation,
      mobileSecureEnclaveAttestation,
      payload,
      architectPffId,
      architectCitizenId
    );

    if (result.success) {
      res.json({
        success: true,
        result,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Genesis verification failed',
        result,
      });
    }
  } catch (e) {
    const err = e as Error;
    console.error('[GENESIS API] Verification failed:', err);
    res.status(500).json({
      success: false,
      error: 'Genesis verification failed',
      details: err.message,
    });
  }
});

/**
 * POST /api/genesis/verify-authority
 * Verify Genesis Authority Hash for subsequent authentications
 */
genesisVerificationRouter.post('/verify-authority', async (req: Request, res: Response) => {
  try {
    const { architectPffId, providedGenesisHash } = req.body;

    if (!architectPffId || !providedGenesisHash) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
      return;
    }

    const isValid = await verifyGenesisAuthority(architectPffId, providedGenesisHash);

    res.json({
      success: true,
      isValid,
      message: isValid ? 'GENESIS_AUTHORITY_VERIFIED' : 'GENESIS_AUTHORITY_INVALID',
    });
  } catch (e) {
    const err = e as Error;
    console.error('[GENESIS API] Authority verification failed:', err);
    res.status(500).json({
      success: false,
      error: 'Authority verification failed',
      details: err.message,
    });
  }
});

/**
 * GET /api/genesis/stasis-status
 * Get Stasis Release Status
 */
genesisVerificationRouter.get('/stasis-status/:architectPffId', async (req: Request, res: Response) => {
  try {
    const { architectPffId } = req.params;

    if (!architectPffId) {
      res.status(400).json({
        success: false,
        error: 'Missing architectPffId',
      });
      return;
    }

    const status = await getStasisReleaseStatus(architectPffId);

    res.json({
      success: true,
      stasisReady: status.stasisReady,
      unveilingDate: status.unveilingDate,
      message: status.stasisReady ? 'STASIS_READY_TRUE' : 'STASIS_READY_FALSE',
    });
  } catch (e) {
    const err = e as Error;
    console.error('[GENESIS API] Stasis status check failed:', err);
    res.status(500).json({
      success: false,
      error: 'Stasis status check failed',
      details: err.message,
    });
  }
});

