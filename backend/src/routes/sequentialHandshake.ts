/**
 * PFF Backend — Sequential Handshake API Routes
 * The Unbending Gate: 4-Phase Sequential Authentication
 * Architect: Isreal Okoro (mrfundzman)
 */

import { Router, Request, Response } from 'express';
import { logHandshakeError, getCitizenErrorLogs, getHardwareErrorStats } from '../lib/vltErrorLog';
import { signPresenceToken } from '../lib/presenceToken';
import { requirePresenceToken, getPff } from '../middleware/pffAuth';
import type { SequentialHandshakeResult } from '../../../core/sequentialHandshakeEngine';

export const sequentialHandshakeRouter = Router();

/**
 * POST /sequential-handshake/verify
 * Verify sequential handshake result and issue Presence Token if successful
 * 
 * Body: {
 *   handshakeResult: SequentialHandshakeResult,
 *   citizenId: string,
 *   deviceInfo?: { platform, osVersion, deviceModel, appVersion }
 * }
 */
sequentialHandshakeRouter.post('/verify', async (req: Request, res: Response) => {
  try {
    const { handshakeResult, citizenId, deviceInfo } = req.body as {
      handshakeResult: SequentialHandshakeResult;
      citizenId: string;
      deviceInfo?: Record<string, unknown>;
    };

    if (!handshakeResult || !citizenId) {
      res.status(400).json({
        success: false,
        code: 'MISSING_PARAMS',
        message: 'handshakeResult and citizenId are required',
      });
      return;
    }

    // Check if handshake was successful
    if (!handshakeResult.success || !handshakeResult.sovereignAuthSignal) {
      // Log error to VLT_ERROR_LOG
      if (handshakeResult.error) {
        const errorLogId = await logHandshakeError({
          sessionId: handshakeResult.sessionId,
          citizenId,
          error: handshakeResult.error,
          deviceInfo: deviceInfo as any,
        });

        res.status(401).json({
          success: false,
          code: handshakeResult.error.code,
          message: handshakeResult.error.message,
          phase: handshakeResult.error.phase,
          hardwareError: handshakeResult.error.hardwareError,
          vltErrorLogId: errorLogId,
          totalDuration: handshakeResult.totalDuration,
        });
        return;
      }

      res.status(401).json({
        success: false,
        code: 'HANDSHAKE_FAILED',
        message: 'Sequential handshake failed',
        totalDuration: handshakeResult.totalDuration,
      });
      return;
    }

    // SUCCESS: Issue Presence Token
    // TODO: Lookup citizen's pffId from database
    const pffId = `PFF-${citizenId.substring(0, 8)}`; // Placeholder

    const presenceToken = signPresenceToken({
      sub: citizenId,
      pffId,
    });

    res.status(200).json({
      success: true,
      presenceToken,
      sessionId: handshakeResult.sessionId,
      totalDuration: handshakeResult.totalDuration,
      phases: {
        phase1Duration: handshakeResult.phases.phase1?.duration,
        phase2Duration: handshakeResult.phases.phase2?.duration,
        phase3Duration: handshakeResult.phases.phase3?.duration,
      },
      sovereignAuthSignal: true,
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

/**
 * GET /sequential-handshake/error-logs/:citizenId
 * Get error logs for a specific citizen
 * Requires presence token
 */
sequentialHandshakeRouter.get(
  '/error-logs/:citizenId',
  requirePresenceToken,
  async (req: Request, res: Response) => {
    try {
      const { citizenId } = req.params;
      const { limit } = req.query;

      const logs = await getCitizenErrorLogs(
        citizenId,
        limit ? parseInt(limit as string, 10) : 50
      );

      res.status(200).json({
        success: true,
        logs,
        count: logs.length,
      });
    } catch (e) {
      const err = e as Error;
      res.status(500).json({
        success: false,
        code: 'ERROR_LOGS_FAILED',
        message: err.message,
      });
    }
  }
);

/**
 * GET /sequential-handshake/hardware-stats
 * Get hardware error statistics
 * Requires presence token (admin only in production)
 */
sequentialHandshakeRouter.get(
  '/hardware-stats',
  requirePresenceToken,
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      const stats = await getHardwareErrorStats(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.status(200).json({
        success: true,
        ...stats,
      });
    } catch (e) {
      const err = e as Error;
      res.status(500).json({
        success: false,
        code: 'STATS_FAILED',
        message: err.message,
      });
    }
  }
);

