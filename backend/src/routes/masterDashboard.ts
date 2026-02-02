/**
 * PFF Backend — Master Dashboard API Routes (Architect's Eye)
 * API endpoints for the supreme oversight dashboard
 * Architect: Isreal Okoro (mrfundzman)
 */

import { Router, Request, Response } from 'express';
import {
  verifyHardwareLock,
  getVitalizationDensity,
  getNationDeathClocks,
  getRevenueTelemetry,
  getAIGovernanceLogs,
  logAIGovernanceDecision,
  initializeHeartbeatSync,
  updateHeartbeat,
  executeMasterOverride,
} from '../services/masterDashboard';

export const masterDashboardRouter = Router();

// ============================================================================
// HARDWARE LOCK VERIFICATION
// ============================================================================

/**
 * POST /api/master-dashboard/verify-hardware-lock
 * Verify ROOT_SOVEREIGN_PAIR and Genesis Handshake
 * Dashboard only renders if this returns authorized: true
 */
masterDashboardRouter.post('/verify-hardware-lock', async (req: Request, res: Response) => {
  try {
    const { deviceUUID, hardwareTPMHash, handshakeSignature } = req.body;

    if (!deviceUUID || !hardwareTPMHash || !handshakeSignature) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: deviceUUID, hardwareTPMHash, handshakeSignature',
      });
      return;
    }

    const lockStatus = await verifyHardwareLock(deviceUUID, hardwareTPMHash, handshakeSignature);

    if (lockStatus.isAuthorized) {
      res.json({
        success: true,
        authorized: true,
        rootPairVerified: lockStatus.rootPairVerified,
        genesisHandshakeVerified: lockStatus.genesisHandshakeVerified,
        alphaNodeStatus: lockStatus.alphaNodeStatus,
        lastVerificationTimestamp: lockStatus.lastVerificationTimestamp,
        message: 'Hardware lock verified. Dashboard access granted.',
      });
    } else {
      res.status(403).json({
        success: false,
        authorized: false,
        rootPairVerified: lockStatus.rootPairVerified,
        genesisHandshakeVerified: lockStatus.genesisHandshakeVerified,
        alphaNodeStatus: lockStatus.alphaNodeStatus,
        error: lockStatus.error,
        message: 'Hardware lock verification failed. Dashboard access denied.',
      });
    }
  } catch (e) {
    const err = e as Error;
    console.error('[MASTER DASHBOARD] Failed to verify hardware lock:', err);
    res.status(500).json({
      success: false,
      authorized: false,
      error: 'Failed to verify hardware lock',
      details: err.message,
    });
  }
});

// ============================================================================
// GLOBAL HEATMAP LAYER
// ============================================================================

/**
 * GET /api/master-dashboard/vitalization-density
 * Get global vitalization density heatmap data
 */
masterDashboardRouter.get('/vitalization-density', async (req: Request, res: Response) => {
  try {
    const densityData = await getVitalizationDensity();

    res.json({
      success: true,
      data: densityData,
      count: densityData.length,
      message: 'Vitalization density data retrieved successfully',
    });
  } catch (e) {
    const err = e as Error;
    console.error('[MASTER DASHBOARD] Failed to get vitalization density:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to get vitalization density',
      details: err.message,
    });
  }
});

// ============================================================================
// ULTIMATUM MONITOR (NATION DEATH CLOCKS)
// ============================================================================

/**
 * GET /api/master-dashboard/nation-death-clocks
 * Get 180-day SNAT countdown for all nations
 */
masterDashboardRouter.get('/nation-death-clocks', async (req: Request, res: Response) => {
  try {
    const deathClocks = await getNationDeathClocks();

    // Separate nations by status
    const imminent = deathClocks.filter(n => n.status === 'IMMINENT');
    const critical = deathClocks.filter(n => n.status === 'CRITICAL');
    const warning = deathClocks.filter(n => n.status === 'WARNING');
    const safe = deathClocks.filter(n => n.status === 'SAFE');

    res.json({
      success: true,
      data: deathClocks,
      summary: {
        total: deathClocks.length,
        imminent: imminent.length,
        critical: critical.length,
        warning: warning.length,
        safe: safe.length,
      },
      message: 'Nation death clocks retrieved successfully',
    });
  } catch (e) {
    const err = e as Error;
    console.error('[MASTER DASHBOARD] Failed to get nation death clocks:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to get nation death clocks',
      details: err.message,
    });
  }
});

// ============================================================================
// REVENUE FLOW ANALYTICS
// ============================================================================

/**
 * GET /api/master-dashboard/revenue-telemetry
 * Get live revenue flow analytics
 */
masterDashboardRouter.get('/revenue-telemetry', async (req: Request, res: Response) => {
  try {
    const telemetry = await getRevenueTelemetry();

    res.json({
      success: true,
      data: telemetry,
      message: 'Revenue telemetry retrieved successfully',
    });
  } catch (e) {
    const err = e as Error;
    console.error('[MASTER DASHBOARD] Failed to get revenue telemetry:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to get revenue telemetry',
      details: err.message,
    });
  }
});

// ============================================================================
// AI GOVERNANCE FEED
// ============================================================================

/**
 * GET /api/master-dashboard/ai-governance-logs
 * Get SOVRYN AI decision logs
 */
masterDashboardRouter.get('/ai-governance-logs', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = await getAIGovernanceLogs(limit);

    res.json({
      success: true,
      data: logs,
      count: logs.length,
      message: 'AI governance logs retrieved successfully',
    });
  } catch (e) {
    const err = e as Error;
    console.error('[MASTER DASHBOARD] Failed to get AI governance logs:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI governance logs',
      details: err.message,
    });
  }
});

/**
 * POST /api/master-dashboard/ai-governance-logs
 * Log AI governance decision (called by SOVRYN AI)
 */
masterDashboardRouter.post('/ai-governance-logs', async (req: Request, res: Response) => {
  try {
    const { decisionType, description, affectedEntities, outcome, metadata } = req.body;

    if (!decisionType || !description || !affectedEntities || !outcome) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: decisionType, description, affectedEntities, outcome',
      });
      return;
    }

    const logId = await logAIGovernanceDecision(
      decisionType,
      description,
      affectedEntities,
      outcome,
      metadata || {}
    );

    res.json({
      success: true,
      logId,
      message: 'AI governance decision logged successfully',
    });
  } catch (e) {
    const err = e as Error;
    console.error('[MASTER DASHBOARD] Failed to log AI governance decision:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to log AI governance decision',
      details: err.message,
    });
  }
});

// ============================================================================
// EMERGENCY COMMAND CONSOLE
// ============================================================================

/**
 * POST /api/master-dashboard/heartbeat/initialize
 * Initialize heartbeat-sync for emergency command console
 */
masterDashboardRouter.post('/heartbeat/initialize', async (req: Request, res: Response) => {
  try {
    const { deviceUUID } = req.body;

    if (!deviceUUID) {
      res.status(400).json({
        success: false,
        error: 'Missing required field: deviceUUID',
      });
      return;
    }

    const sessionId = await initializeHeartbeatSync(deviceUUID);

    res.json({
      success: true,
      sessionId,
      heartbeatInterval: 5000,
      message: 'Heartbeat-sync initialized. Send heartbeat every 5 seconds to maintain MASTER_OVERRIDE access.',
    });
  } catch (e) {
    const err = e as Error;
    console.error('[MASTER DASHBOARD] Failed to initialize heartbeat-sync:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize heartbeat-sync',
      details: err.message,
    });
  }
});

/**
 * POST /api/master-dashboard/heartbeat/update
 * Update heartbeat for emergency command console
 */
masterDashboardRouter.post('/heartbeat/update', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'Missing required field: sessionId',
      });
      return;
    }

    const status = await updateHeartbeat(sessionId);

    res.json({
      success: true,
      status,
      message: status.isActive ? 'Heartbeat updated. MASTER_OVERRIDE enabled.' : 'Heartbeat missed. MASTER_OVERRIDE disabled.',
    });
  } catch (e) {
    const err = e as Error;
    console.error('[MASTER DASHBOARD] Failed to update heartbeat:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update heartbeat',
      details: err.message,
    });
  }
});

/**
 * POST /api/master-dashboard/master-override
 * Execute MASTER_OVERRIDE command
 */
masterDashboardRouter.post('/master-override', async (req: Request, res: Response) => {
  try {
    const { sessionId, overrideType, targetEntity, reason } = req.body;

    if (!sessionId || !overrideType || !targetEntity || !reason) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, overrideType, targetEntity, reason',
      });
      return;
    }

    const result = await executeMasterOverride(sessionId, overrideType, targetEntity, reason);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(403).json({
        success: false,
        error: result.error,
        message: result.message,
      });
    }
  } catch (e) {
    const err = e as Error;
    console.error('[MASTER DASHBOARD] Failed to execute MASTER_OVERRIDE:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to execute MASTER_OVERRIDE',
      details: err.message,
    });
  }
});

/**
 * GET /api/master-dashboard/full-status
 * Get complete dashboard status (all data in one call)
 */
masterDashboardRouter.get('/full-status', async (req: Request, res: Response) => {
  try {
    const [densityData, deathClocks, telemetry, aiLogs] = await Promise.all([
      getVitalizationDensity(),
      getNationDeathClocks(),
      getRevenueTelemetry(),
      getAIGovernanceLogs(20),
    ]);

    res.json({
      success: true,
      data: {
        vitalizationDensity: densityData,
        nationDeathClocks: deathClocks,
        revenueTelemetry: telemetry,
        aiGovernanceLogs: aiLogs,
      },
      timestamp: new Date(),
      message: 'Full dashboard status retrieved successfully',
    });
  } catch (e) {
    const err = e as Error;
    console.error('[MASTER DASHBOARD] Failed to get full status:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to get full dashboard status',
      details: err.message,
    });
  }
});

