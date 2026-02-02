/**
 * PFF Backend — Monthly Truth Dividend Routes
 * API endpoints for monthly dividend management
 * Architect: Isreal Okoro (mrfundzman)
 */

import { Router, Request, Response } from 'express';
import { registerTruthTeller, executeMonthlyFlush } from '../services/monthlyDividend';
import { sendDividendNotifications, getDividendNotificationHistory } from '../services/dividendNotification';
import { query } from '../db/client';
import { verifyPresenceToken } from '../lib/presenceToken';

const router = Router();

/**
 * POST /api/monthly-dividend/register-truth-teller
 * Register a citizen as a verified truth-teller after successful handshake
 * Called automatically after successful 4-layer PFF handshake
 */
router.post('/register-truth-teller', async (req: Request, res: Response) => {
  try {
    const { citizenId, pffId, handshakeSessionId } = req.body;

    if (!citizenId || !pffId || !handshakeSessionId) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: citizenId, pffId, handshakeSessionId',
      });
      return;
    }

    const success = await registerTruthTeller(citizenId, pffId, handshakeSessionId);

    if (success) {
      res.status(200).json({
        success: true,
        message: 'Citizen registered as verified truth-teller for current month',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to register truth-teller',
      });
    }
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/monthly-dividend/execute-flush
 * Manually trigger monthly dividend distribution (admin only)
 */
router.post('/execute-flush', async (req: Request, res: Response) => {
  try {
    // TODO: Add admin authentication check

    const result = await executeMonthlyFlush();

    if (result.success) {
      // Send notifications to all recipients
      await sendDividendNotifications(result.distributionMonth, result.sharePerCitizen);

      res.status(200).json({
        success: true,
        result,
        message: 'Monthly dividend distributed successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        result,
      });
    }
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/monthly-dividend/status
 * Get current month's dividend status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const currentMonth = new Date().toISOString().substring(0, 7);

    // Get total Global Citizen Block balance
    const blockResult = await query<{ total: string }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM global_citizen_block`
    );
    const totalBlockValue = parseFloat(blockResult.rows[0]?.total || '0');

    // Get total verified truth-tellers for current month
    const truthTellersResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM verified_truth_tellers WHERE verified_month = $1`,
      [currentMonth]
    );
    const totalTruthTellers = parseInt(truthTellersResult.rows[0]?.count || '0');

    // Calculate projected share per citizen
    const projectedSharePerCitizen = totalTruthTellers > 0 ? totalBlockValue / totalTruthTellers : 0;

    res.status(200).json({
      success: true,
      currentMonth,
      totalBlockValue,
      totalTruthTellers,
      projectedSharePerCitizen,
    });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/monthly-dividend/history
 * Get monthly dividend distribution history
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const result = await query<{
      distribution_month: string;
      total_block_value: string;
      total_truth_tellers: number;
      share_per_citizen: string;
      distributed_at: Date;
    }>(
      `SELECT 
         distribution_month,
         total_block_value,
         total_truth_tellers,
         share_per_citizen,
         distributed_at
       FROM monthly_dividend_history
       ORDER BY distributed_at DESC
       LIMIT 12`
    );

    res.status(200).json({
      success: true,
      history: result.rows.map((row) => ({
        distributionMonth: row.distribution_month,
        totalBlockValue: parseFloat(row.total_block_value),
        totalTruthTellers: row.total_truth_tellers,
        sharePerCitizen: parseFloat(row.share_per_citizen),
        distributedAt: row.distributed_at,
      })),
    });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;

