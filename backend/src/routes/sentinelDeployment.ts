/**
 * PFF Backend — Sentinel Deployment API Routes
 * Endpoints for Sovereign Sentinel & Identity Authority deployment
 * Architect: Isreal Okoro (mrfundzman)
 */

import express, { Request, Response } from 'express';
import { executeSentinelDeployment } from '../services/sentinelDeployment';
import { executeDeepTruthFeedAccess, DeepTruthFeedRequest, DeepTruthFeedType } from '../services/deepTruthFeed';
import { monitorDaemonHealth, detectKillAttempt } from '../services/antiKillDaemon';
import { SENTINEL_TIER_CONFIGS } from '../../../core/sentinelOptIn';
import { ROOT_SOVEREIGN_PAIR, ARCHITECT_IDENTITY, validateProtocolChangeRequest, ProtocolChangeType } from '../../../core/rootPairBinding';

export const sentinelDeploymentRouter = express.Router();

/**
 * POST /api/sentinel-deployment/execute
 * Execute complete Sentinel deployment validation
 */
sentinelDeploymentRouter.post('/execute', async (req: Request, res: Response) => {
  try {
    const result = await executeSentinelDeployment();

    if (result.success) {
      res.json({
        success: true,
        result,
        message: result.validationMessage,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Deployment validation failed',
        result,
      });
    }
  } catch (e) {
    const err = e as Error;
    console.error('[SENTINEL DEPLOYMENT API] Deployment failed:', err);
    res.status(500).json({
      success: false,
      error: 'Deployment validation failed',
      details: err.message,
    });
  }
});

/**
 * GET /api/sentinel-deployment/pricing-tiers
 * Get current Sentinel pricing tiers
 */
sentinelDeploymentRouter.get('/pricing-tiers', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      tiers: SENTINEL_TIER_CONFIGS,
      message: 'SENTINEL_PRICING_TIERS_RETRIEVED',
    });
  } catch (e) {
    const err = e as Error;
    console.error('[SENTINEL DEPLOYMENT API] Failed to retrieve pricing tiers:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve pricing tiers',
      details: err.message,
    });
  }
});

/**
 * GET /api/sentinel-deployment/root-pair
 * Get Root Sovereign Pair information
 */
sentinelDeploymentRouter.get('/root-pair', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      rootPair: {
        laptopDeviceUUID: ROOT_SOVEREIGN_PAIR.LAPTOP_DEVICE_UUID,
        mobileDeviceUUID: ROOT_SOVEREIGN_PAIR.MOBILE_DEVICE_UUID,
        activationTimestamp: ROOT_SOVEREIGN_PAIR.ACTIVATION_TIMESTAMP,
      },
      architect: {
        pffId: ARCHITECT_IDENTITY.PFF_ID,
        fullName: ARCHITECT_IDENTITY.FULL_NAME,
        role: ARCHITECT_IDENTITY.ROLE,
        authorityLevel: ARCHITECT_IDENTITY.AUTHORITY_LEVEL,
      },
      message: 'ROOT_SOVEREIGN_PAIR_RETRIEVED',
    });
  } catch (e) {
    const err = e as Error;
    console.error('[SENTINEL DEPLOYMENT API] Failed to retrieve root pair:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve root pair',
      details: err.message,
    });
  }
});

/**
 * POST /api/sentinel-deployment/deep-truth-access
 * Access Deep Truth Feed (requires 10% tribute)
 */
sentinelDeploymentRouter.post('/deep-truth-access', async (req: Request, res: Response) => {
  try {
    const { businessId, businessName, feedType, dataQuery, businessRevenueVIDA } = req.body;

    if (!businessId || !businessName || !feedType || !dataQuery || !businessRevenueVIDA) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
      return;
    }

    const request: DeepTruthFeedRequest = {
      businessId,
      businessName,
      feedType: feedType as DeepTruthFeedType,
      dataQuery,
      requestTimestamp: new Date(),
    };

    const result = await executeDeepTruthFeedAccess(request, businessRevenueVIDA);

    if (result.success) {
      res.json({
        success: true,
        result,
        message: 'DEEP_TRUTH_ACCESS_GRANTED',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Deep Truth access failed',
        result,
      });
    }
  } catch (e) {
    const err = e as Error;
    console.error('[SENTINEL DEPLOYMENT API] Deep Truth access failed:', err);
    res.status(500).json({
      success: false,
      error: 'Deep Truth access failed',
      details: err.message,
    });
  }
});

/**
 * GET /api/sentinel-deployment/daemon-health/:processId/:deviceUUID
 * Monitor Anti-Kill Daemon health
 */
sentinelDeploymentRouter.get('/daemon-health/:processId/:deviceUUID', async (req: Request, res: Response) => {
  try {
    const { processId, deviceUUID } = req.params;

    if (!processId || !deviceUUID) {
      res.status(400).json({
        success: false,
        error: 'Missing processId or deviceUUID',
      });
      return;
    }

    const health = await monitorDaemonHealth(processId, deviceUUID);

    res.json({
      success: true,
      health,
      message: 'DAEMON_HEALTH_RETRIEVED',
    });
  } catch (e) {
    const err = e as Error;
    console.error('[SENTINEL DEPLOYMENT API] Daemon health check failed:', err);
    res.status(500).json({
      success: false,
      error: 'Daemon health check failed',
      details: err.message,
    });
  }
});

/**
 * POST /api/sentinel-deployment/protocol-change-request
 * Request protocol-level change (requires Genesis Authority Hash)
 */
sentinelDeploymentRouter.post('/protocol-change-request', async (req: Request, res: Response) => {
  try {
    const { changeType, requestedBy, genesisAuthorityHash, handshakeScore, livenessScore } = req.body;

    if (!changeType || !requestedBy || !genesisAuthorityHash || handshakeScore === undefined || livenessScore === undefined) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
      return;
    }

    const validation = validateProtocolChangeRequest(
      changeType as ProtocolChangeType,
      requestedBy,
      genesisAuthorityHash,
      handshakeScore,
      livenessScore
    );

    if (validation.valid) {
      res.json({
        success: true,
        authorized: true,
        message: 'PROTOCOL_CHANGE_AUTHORIZED',
      });
    } else {
      res.status(403).json({
        success: false,
        authorized: false,
        error: validation.error,
        message: 'PROTOCOL_CHANGE_DENIED',
      });
    }
  } catch (e) {
    const err = e as Error;
    console.error('[SENTINEL DEPLOYMENT API] Protocol change request failed:', err);
    res.status(500).json({
      success: false,
      error: 'Protocol change request failed',
      details: err.message,
    });
  }
});

