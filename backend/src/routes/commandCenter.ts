/**
 * PFF Backend — Architect's Command Center API Routes
 * Endpoints for telemetry, security status, and sovereign actions
 * Architect: Isreal Okoro (mrfundzman)
 */

import express, { Request, Response } from 'express';
import { 
  getCommandCenterTelemetry, 
  getSecurityStatus, 
  broadcastToMesh, 
  triggerEmergencyStasis,
  getTopNationsByLiquidity 
} from '../services/commandCenter';

export const commandCenterRouter = express.Router();

/**
 * GET /api/command-center/telemetry
 * Get real-time telemetry data
 */
commandCenterRouter.get('/telemetry', async (req: Request, res: Response) => {
  try {
    const telemetry = await getCommandCenterTelemetry();
    
    res.json({
      success: true,
      telemetry,
    });
  } catch (e) {
    const err = e as Error;
    console.error('[COMMAND CENTER API] Failed to fetch telemetry:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch telemetry',
      details: err.message,
    });
  }
});

/**
 * GET /api/command-center/security-status
 * Get ROOT_SOVEREIGN_PAIR security status
 */
commandCenterRouter.get('/security-status', async (req: Request, res: Response) => {
  try {
    const status = await getSecurityStatus();
    
    res.json({
      success: true,
      status,
    });
  } catch (e) {
    const err = e as Error;
    console.error('[COMMAND CENTER API] Failed to fetch security status:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security status',
      details: err.message,
    });
  }
});

/**
 * GET /api/command-center/top-nations
 * Get top 10 nations by liquidity reserves
 */
commandCenterRouter.get('/top-nations', async (req: Request, res: Response) => {
  try {
    const nations = await getTopNationsByLiquidity(10);
    
    res.json({
      success: true,
      nations,
    });
  } catch (e) {
    const err = e as Error;
    console.error('[COMMAND CENTER API] Failed to fetch top nations:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top nations',
      details: err.message,
    });
  }
});

/**
 * POST /api/command-center/broadcast-mesh
 * Broadcast message to all Sentinels via Darknet Mesh
 */
commandCenterRouter.post('/broadcast-mesh', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Message is required',
      });
      return;
    }

    const result = await broadcastToMesh(message);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Broadcast sent successfully',
        result,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Broadcast failed',
        result,
      });
    }
  } catch (e) {
    const err = e as Error;
    console.error('[COMMAND CENTER API] Failed to broadcast to mesh:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast to mesh',
      details: err.message,
    });
  }
});

/**
 * POST /api/command-center/emergency-stasis
 * Trigger global emergency stasis lock
 */
commandCenterRouter.post('/emergency-stasis', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Reason is required',
      });
      return;
    }

    const result = await triggerEmergencyStasis(reason);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Emergency stasis activated',
        result,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Emergency stasis failed',
        result,
      });
    }
  } catch (e) {
    const err = e as Error;
    console.error('[COMMAND CENTER API] Failed to trigger emergency stasis:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger emergency stasis',
      details: err.message,
    });
  }
});

