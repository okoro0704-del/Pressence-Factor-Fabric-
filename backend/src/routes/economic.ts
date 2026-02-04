/**
 * PFF Backend — Economic Layer Routes.
 * VIDA CAP, $VIDA, Recovery Split APIs.
 */

import { Router, Request, Response } from 'express';
import { requirePresenceToken, getPff } from '../middleware/pffAuth';
import {
  getCitizenVidaCapBalance,
  getNationalReserve,
  getTotalNationalReserveAccumulated,
  getCitizenImpactFeed,
  getTreasuryGrowthLastNDays,
} from '../economic/vidaCap';
import { issueVida, getCitizenVidaHistory, getTotalVidaInCirculation } from '../economic/vidaCurrency';
import { processRecovery, getRecoveryHistory } from '../economic/recovery';
import { query } from '../db/client';

export const economicRouter = Router();

/**
 * GET /economic/vida-cap/balance
 * Get citizen VIDA CAP balance. Requires Presence Token.
 */
economicRouter.get('/vida-cap/balance', requirePresenceToken, async (req: Request, res: Response) => {
  try {
    const { citizenId } = getPff(req);
    const citizenVault = await getCitizenVidaCapBalance(citizenId);
    const nationalReserve = await getNationalReserve();

    if (!citizenVault) {
      res.status(404).json({
        success: false,
        code: 'VAULT_NOT_FOUND',
        message: 'Citizen vault not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      citizenVault: {
        vidaCapBalance: citizenVault.vidaCapBalance,
        pffId: citizenVault.pffId,
      },
      nationalReserve: {
        totalVidaCap: nationalReserve.totalVidaCap,
      },
    });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      code: 'BALANCE_FETCH_FAILED',
      message: err.message,
    });
  }
});

/**
 * GET /economic/vida-cap/reserve
 * Get National Reserve VIDA CAP total (public, no auth).
 */
economicRouter.get('/vida-cap/reserve', async (req: Request, res: Response) => {
  try {
    const reserve = await getNationalReserve();
    const totalVida = await getTotalVidaInCirculation();

    // Calculate backing ratio (should be >= 1.0 for debt-free backing)
    const backingRatio = reserve.totalVidaCap > 0 ? reserve.totalVidaCap / (totalVida || 1) : 1.0;

    res.status(200).json({
      success: true,
      totalVidaCap: reserve.totalVidaCap,
      totalVidaInCirculation: totalVida,
      backingRatio,
      lastUpdated: reserve.lastUpdated,
    });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      code: 'RESERVE_FETCH_FAILED',
      message: err.message,
    });
  }
});

/**
 * GET /economic/vida-cap/national-reserve-accumulated
 * Government view: Total National Reserve Accumulated — sum of all 5 VIDA splits from every citizen (sovereign_mint_ledger).
 */
economicRouter.get('/vida-cap/national-reserve-accumulated', async (req: Request, res: Response) => {
  try {
    const total = await getTotalNationalReserveAccumulated();
    res.status(200).json({
      success: true,
      totalNationalReserveAccumulated: total,
    });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      code: 'RESERVE_ACCUMULATED_FETCH_FAILED',
      message: err.message,
    });
  }
});

/**
 * GET /economic/treasury/citizen-impact
 * Government view: recent government_treasury_vault entries (3-of-4 verified → +5 VIDA).
 */
economicRouter.get('/treasury/citizen-impact', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100);
    const rows = await getCitizenImpactFeed(limit);
    res.status(200).json({
      success: true,
      entries: rows.map((r) => ({
        id: r.id,
        pffId: r.pff_id,
        amountVida: r.amount_vida,
        createdAt: r.created_at,
        message: 'New Citizen Verified → +5.00 VIDA to Treasury',
      })),
    });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      code: 'CITIZEN_IMPACT_FETCH_FAILED',
      message: err.message,
    });
  }
});

/**
 * GET /economic/treasury/growth?days=30
 * Treasury growth over last N days (daily cumulative).
 */
economicRouter.get('/treasury/growth', async (req: Request, res: Response) => {
  try {
    const days = Math.min(Math.max(parseInt((req.query.days as string) || '30', 10), 1), 365);
    const rows = await getTreasuryGrowthLastNDays(days);
    res.status(200).json({
      success: true,
      days: rows.map((r) => ({
        date: r.date,
        totalVida: r.total_vida,
        cumulativeVida: r.cumulative_vida,
      })),
    });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      code: 'TREASURY_GROWTH_FETCH_FAILED',
      message: err.message,
    });
  }
});

/**
 * GET /economic/treasury/dllr-converted
 * Placeholder: total DLLR converted by citizens in block (Sovryn bridge).
 */
economicRouter.get('/treasury/dllr-converted', async (req: Request, res: Response) => {
  try {
    // TODO: integrate Sovryn / bridge for real total
    res.status(200).json({
      success: true,
      totalDllr: null,
    });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      code: 'DLLR_FETCH_FAILED',
      message: err.message,
    });
  }
});

/**
 * POST /economic/vida/issue
 * Issue $VIDA against VIDA CAP Reserve (1:1).
 * Auth: Presence Token (citizen) or Admin Token (state).
 */
economicRouter.post('/vida/issue', requirePresenceToken, async (req: Request, res: Response) => {
  try {
    const { amount, type } = req.body as {
      amount?: number;
      type?: 'citizen' | 'state';
    };

    if (!amount || amount <= 0) {
      res.status(400).json({
        success: false,
        code: 'INVALID_AMOUNT',
        message: 'amount must be greater than 0',
      });
      return;
    }

    if (!type || (type !== 'citizen' && type !== 'state')) {
      res.status(400).json({
        success: false,
        code: 'INVALID_TYPE',
        message: 'type must be "citizen" or "state"',
      });
      return;
    }

    const { citizenId } = getPff(req);
    const result = await issueVida(amount, type, type === 'citizen' ? citizenId : undefined);

    res.status(200).json({
      success: true,
      vidaIssued: result.vidaIssued,
      vidaCapReserved: result.vidaCapReserved,
      reserveBalanceBefore: result.reserveBalanceBefore,
      reserveBalanceAfter: result.reserveBalanceAfter,
      transactionHash: result.transactionHash,
    });
  } catch (e) {
    const err = e as Error;
    if (err.message.includes('Insufficient VIDA CAP')) {
      res.status(400).json({
        success: false,
        code: 'INSUFFICIENT_RESERVE',
        message: err.message,
      });
      return;
    }
    res.status(500).json({
      success: false,
      code: 'ISSUANCE_FAILED',
      message: err.message,
    });
  }
});

/**
 * GET /economic/vida/history
 * Get $VIDA issuance history for citizen. Requires Presence Token.
 */
economicRouter.get('/vida/history', requirePresenceToken, async (req: Request, res: Response) => {
  try {
    const { citizenId } = getPff(req);
    const history = await getCitizenVidaHistory(citizenId);

    res.status(200).json({
      success: true,
      history,
    });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      code: 'HISTORY_FETCH_FAILED',
      message: err.message,
    });
  }
});

/**
 * POST /economic/recovery/split
 * Process external fund recovery (45-10-45 split).
 * Auth: Admin Token (TODO: implement admin auth middleware).
 */
economicRouter.post('/recovery/split', async (req: Request, res: Response) => {
  try {
    // TODO: Add admin authentication middleware
    // For now, allow but log for security review

    const { recoveryAmount, agentId, distributionMethod, metadata } = req.body as {
      recoveryAmount?: number;
      agentId?: string;
      distributionMethod?: 'proportional' | 'equal';
      metadata?: Record<string, unknown>;
    };

    if (!recoveryAmount || recoveryAmount <= 0) {
      res.status(400).json({
        success: false,
        code: 'INVALID_AMOUNT',
        message: 'recoveryAmount must be greater than 0',
      });
      return;
    }

    if (!agentId) {
      res.status(400).json({
        success: false,
        code: 'MISSING_AGENT_ID',
        message: 'agentId is required',
      });
      return;
    }

    const result = await processRecovery(
      recoveryAmount,
      agentId,
      distributionMethod || 'proportional',
      metadata
    );

    res.status(200).json({
      success: true,
      peopleShare: result.peopleShare,
      stateShare: result.stateShare,
      agentShare: result.agentShare,
      transactionHash: result.transactionHash,
    });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      code: 'RECOVERY_FAILED',
      message: err.message,
    });
  }
});

/**
 * GET /economic/recovery/history
 * Get recovery transaction history (public, no auth).
 */
economicRouter.get('/recovery/history', async (req: Request, res: Response) => {
  try {
    const limit = parseInt((req.query.limit as string) || '100', 10);
    const history = await getRecoveryHistory(limit);

    res.status(200).json({
      success: true,
      history,
    });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      code: 'HISTORY_FETCH_FAILED',
      message: err.message,
    });
  }
});
