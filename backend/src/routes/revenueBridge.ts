/**
 * PFF Backend — Unified Revenue-to-Dividend Bridge Routes
 * API endpoints for revenue consolidation, auto-split, and dividend distribution
 * Architect: Isreal Okoro (mrfundzman)
 */

import { Router, Request, Response } from 'express';
import {
  getTributePoolStatus,
  getNationalLiquidityVaultBalance,
  getAutoSplitHistory,
  consolidateRevenueToTributePool,
} from '../services/revenueBridge';
import { RevenueSourceType } from '../../../core/revenueBridge';
import { query } from '../db/client';
import { verifyPresenceToken } from '../lib/presenceToken';

export const revenueBridgeRouter = Router();

/**
 * GET /api/revenue-bridge/tribute-pool
 * Get current PROT_TRIBUTE_POOL status
 */
revenueBridgeRouter.get('/tribute-pool', async (req: Request, res: Response) => {
  try {
    const status = await getTributePoolStatus();

    res.status(200).json({
      success: true,
      tributePool: status,
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
 * GET /api/revenue-bridge/national-liquidity-vault
 * Get National Liquidity Vault balance
 */
revenueBridgeRouter.get('/national-liquidity-vault', async (req: Request, res: Response) => {
  try {
    const balance = await getNationalLiquidityVaultBalance();

    res.status(200).json({
      success: true,
      nationalLiquidityVaultBalance: balance,
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
 * GET /api/revenue-bridge/auto-split-history
 * Get auto-split execution history
 */
revenueBridgeRouter.get('/auto-split-history', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const history = await getAutoSplitHistory(limit);

    res.status(200).json({
      success: true,
      autoSplitHistory: history,
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
 * GET /api/revenue-bridge/auto-split-status
 * Get 50/50 auto-split status and verification
 */
revenueBridgeRouter.get('/auto-split-status', async (req: Request, res: Response) => {
  try {
    // Get total auto-split executions
    const totalResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM tribute_auto_split_log`
    );
    const totalExecutions = parseInt(totalResult.rows[0]?.count || '0');

    // Get total amounts split
    const amountsResult = await query<{
      total_tribute: string;
      total_national: string;
      total_global: string;
    }>(
      `SELECT 
         COALESCE(SUM(total_tribute_amount), 0) as total_tribute,
         COALESCE(SUM(national_liquidity_amount), 0) as total_national,
         COALESCE(SUM(global_citizen_amount), 0) as total_global
       FROM tribute_auto_split_log`
    );

    const totalTribute = parseFloat(amountsResult.rows[0]?.total_tribute || '0');
    const totalNational = parseFloat(amountsResult.rows[0]?.total_national || '0');
    const totalGlobal = parseFloat(amountsResult.rows[0]?.total_global || '0');

    // Verify 50/50 split
    const nationalPercentage = totalTribute > 0 ? (totalNational / totalTribute) * 100 : 0;
    const globalPercentage = totalTribute > 0 ? (totalGlobal / totalTribute) * 100 : 0;

    res.status(200).json({
      success: true,
      autoSplitStatus: {
        totalExecutions,
        totalTributeAmount: totalTribute,
        totalNationalLiquidityAmount: totalNational,
        totalGlobalCitizenAmount: totalGlobal,
        nationalPercentage: nationalPercentage.toFixed(2) + '%',
        globalPercentage: globalPercentage.toFixed(2) + '%',
        splitVerified: Math.abs(nationalPercentage - 50) < 0.01 && Math.abs(globalPercentage - 50) < 0.01,
      },
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
 * POST /api/revenue-bridge/manual-consolidation
 * Manually trigger revenue consolidation (for testing)
 * Requires presence token verification
 */
revenueBridgeRouter.post('/manual-consolidation', async (req: Request, res: Response) => {
  try {
    const { totalRevenueAmount, revenueSource, sourceTransactionHash, metadata } = req.body;

    if (!totalRevenueAmount || !revenueSource || !sourceTransactionHash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: totalRevenueAmount, revenueSource, sourceTransactionHash',
      });
    }

    // Validate revenue source
    if (!Object.values(RevenueSourceType).includes(revenueSource)) {
      return res.status(400).json({
        success: false,
        error: `Invalid revenue source. Must be one of: ${Object.values(RevenueSourceType).join(', ')}`,
      });
    }

    const result = await consolidateRevenueToTributePool(
      parseFloat(totalRevenueAmount),
      revenueSource as RevenueSourceType,
      sourceTransactionHash,
      metadata
    );

    res.status(200).json({
      success: result.success,
      consolidation: result,
    });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

