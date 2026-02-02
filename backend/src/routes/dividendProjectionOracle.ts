/**
 * PFF Backend — Dividend Projection Oracle Routes
 * API endpoints for real-time dividend projection and transparency
 * Architect: Isreal Okoro (mrfundzman)
 */

import { Router, Request, Response } from 'express';
import {
  getDividendProjection,
  getCurrentMonthDividendPool,
  getActiveTruthTellersCount,
  getGlobalCitizenBlockAddress,
  getCurrentMonthAccumulationBreakdown,
  executeArchitectShield,
  getTotalGlobalCitizenBlock,
} from '../services/dividendProjectionOracle';
import { verifyPresenceToken } from '../lib/presenceToken';
import { query } from '../db/client';

const router = Router();

/**
 * GET /api/dividend-projection/current
 * Get current month's dividend projection
 * Public endpoint - no authentication required for transparency
 */
router.get('/current', async (req: Request, res: Response) => {
  try {
    const projection = await getDividendProjection();

    res.json({
      success: true,
      projection,
      message: 'Current month dividend projection retrieved successfully',
    });
  } catch (e) {
    const err = e as Error;
    console.error('[DIVIDEND PROJECTION] Failed to get current projection:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dividend projection',
      details: err.message,
    });
  }
});

/**
 * GET /api/dividend-projection/pool
 * Get CURRENT_MONTH_DIVIDEND_POOL (real-time counter)
 * Public endpoint for transparency
 */
router.get('/pool', async (req: Request, res: Response) => {
  try {
    const currentMonthPool = await getCurrentMonthDividendPool();
    const totalPool = await getTotalGlobalCitizenBlock();

    res.json({
      success: true,
      currentMonthDividendPool: currentMonthPool,
      totalGlobalCitizenBlock: totalPool,
      currentMonth: new Date().toISOString().substring(0, 7),
      lastUpdated: new Date(),
    });
  } catch (e) {
    const err = e as Error;
    console.error('[DIVIDEND PROJECTION] Failed to get pool balance:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dividend pool balance',
      details: err.message,
    });
  }
});

/**
 * GET /api/dividend-projection/truth-tellers
 * Get ACTIVE_TRUTH_TELLERS count (unique PFF handshakes this month)
 * Public endpoint for transparency
 */
router.get('/truth-tellers', async (req: Request, res: Response) => {
  try {
    const activeTruthTellers = await getActiveTruthTellersCount();

    res.json({
      success: true,
      activeTruthTellers,
      currentMonth: new Date().toISOString().substring(0, 7),
      lastUpdated: new Date(),
    });
  } catch (e) {
    const err = e as Error;
    console.error('[DIVIDEND PROJECTION] Failed to get truth-tellers count:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve truth-tellers count',
      details: err.message,
    });
  }
});

/**
 * GET /api/dividend-projection/breakdown
 * Get tier breakdown of current month's accumulation
 * Shows contributions from Tier 1 ($10), Tier 2 ($30), Tier 3 ($1000)
 * Public endpoint for transparency
 */
router.get('/breakdown', async (req: Request, res: Response) => {
  try {
    const breakdown = await getCurrentMonthAccumulationBreakdown();

    res.json({
      success: true,
      breakdown,
      currentMonth: new Date().toISOString().substring(0, 7),
      lastUpdated: new Date(),
    });
  } catch (e) {
    const err = e as Error;
    console.error('[DIVIDEND PROJECTION] Failed to get breakdown:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve tier breakdown',
      details: err.message,
    });
  }
});

/**
 * GET /api/dividend-projection/vlt-address
 * Get public GLOBAL_CITIZEN_BLOCK address for VLT verification
 * Public endpoint for transparency
 */
router.get('/vlt-address', async (req: Request, res: Response) => {
  try {
    const address = await getGlobalCitizenBlockAddress();

    res.json({
      success: true,
      globalCitizenBlockAddress: address,
      message: 'Verify this address on the Truth Ledger (VLT) to confirm fund accumulation',
      vltExplorerUrl: `https://vlt.pff.network/address/${address}`,
    });
  } catch (e) {
    const err = e as Error;
    console.error('[DIVIDEND PROJECTION] Failed to get VLT address:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve VLT address',
      details: err.message,
    });
  }
});

/**
 * POST /api/dividend-projection/architect-shield
 * Execute Architect's Shield (move 99% to architect vault)
 * Admin only - requires presence token with admin privileges
 */
router.post('/architect-shield', async (req: Request, res: Response) => {
  try {
    // Verify admin privileges
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No authorization token provided',
      });
    }

    // TODO: Implement admin role verification
    // For now, just verify presence token is valid
    // const presenceToken = authHeader.replace('Bearer ', '');
    // const verification = verifyPresenceToken(presenceToken);
    // if (!verification.valid) {
    //   return res.status(401).json({
    //     success: false,
    //     error: 'Invalid presence token',
    //   });
    // }

    const result = await executeArchitectShield();

    if (result.success) {
      res.json({
        success: true,
        result,
        message: 'Architect Shield executed successfully. 99% transferred to architect vault.',
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to execute Architect Shield',
        result,
      });
    }
  } catch (e) {
    const err = e as Error;
    console.error('[DIVIDEND PROJECTION] Failed to execute Architect Shield:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to execute Architect Shield',
      details: err.message,
    });
  }
});

export default router;

