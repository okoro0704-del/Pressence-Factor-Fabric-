/**
 * PFF Backend — Sovereign Gold Rush & Burn Logic API Routes
 * Genesis Protocol v1.0
 * Architect: Isreal Okoro (mrfundzman)
 */

import { Router, Request, Response } from 'express';
import {
  getCurrentEraStatus,
  getNextMintAmount,
  getTotalVidaCapSupply,
  getTotalCitizens,
  getTotalBurned,
  checkBurnToOneStatus,
  applyTransactionBurn,
} from '../economic/goldRush';
import { requirePresenceToken, getPff } from '../middleware/pffAuth';

export const goldRushRouter = Router();

/**
 * GET /gold-rush/era-status
 * Get current economic era status (Pre-Burn, Post-Burn, etc.)
 */
goldRushRouter.get('/era-status', async (_req: Request, res: Response) => {
  try {
    const eraStatus = await getCurrentEraStatus();
    
    res.status(200).json({
      success: true,
      ...eraStatus,
    });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      code: 'ERA_STATUS_FAILED',
      message: err.message,
    });
  }
});

/**
 * GET /gold-rush/next-mint
 * Get minting amount for next vitalization
 */
goldRushRouter.get('/next-mint', async (_req: Request, res: Response) => {
  try {
    const mintInfo = await getNextMintAmount();
    
    res.status(200).json({
      success: true,
      ...mintInfo,
    });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      code: 'NEXT_MINT_FAILED',
      message: err.message,
    });
  }
});

/**
 * GET /gold-rush/supply
 * Get total VIDA Cap supply and citizen count
 */
goldRushRouter.get('/supply', async (_req: Request, res: Response) => {
  try {
    const totalSupply = await getTotalVidaCapSupply();
    const totalCitizens = await getTotalCitizens();
    const totalBurned = await getTotalBurned();
    
    res.status(200).json({
      success: true,
      totalSupply,
      totalCitizens,
      totalBurned,
      circulatingSupply: totalSupply - totalBurned,
    });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      code: 'SUPPLY_QUERY_FAILED',
      message: err.message,
    });
  }
});

/**
 * GET /gold-rush/burn-to-one
 * Get Burn-to-One progress and status
 */
goldRushRouter.get('/burn-to-one', async (_req: Request, res: Response) => {
  try {
    const burnStatus = await checkBurnToOneStatus();
    
    res.status(200).json({
      success: true,
      ...burnStatus,
    });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      code: 'BURN_STATUS_FAILED',
      message: err.message,
    });
  }
});

/**
 * POST /gold-rush/apply-burn
 * Apply transaction burn (1% burn rate)
 * Requires presence token
 */
goldRushRouter.post('/apply-burn', requirePresenceToken, async (req: Request, res: Response) => {
  try {
    const { amount, transactionType } = req.body;
    
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({
        success: false,
        code: 'INVALID_AMOUNT',
        message: 'Amount must be a positive number',
      });
      return;
    }
    
    if (!transactionType || typeof transactionType !== 'string') {
      res.status(400).json({
        success: false,
        code: 'INVALID_TRANSACTION_TYPE',
        message: 'Transaction type is required',
      });
      return;
    }
    
    const { citizenId } = getPff(req);
    const burnResult = await applyTransactionBurn(amount, citizenId, transactionType);
    
    res.status(200).json({
      success: true,
      ...burnResult,
    });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      code: 'BURN_APPLICATION_FAILED',
      message: err.message,
    });
  }
});

/**
 * GET /gold-rush/scarcity-clock
 * Get scarcity clock data for dashboard display
 */
goldRushRouter.get('/scarcity-clock', async (_req: Request, res: Response) => {
  try {
    const eraStatus = await getCurrentEraStatus();
    const burnStatus = await checkBurnToOneStatus();
    const totalBurned = await getTotalBurned();
    
    res.status(200).json({
      success: true,
      scarcityClock: {
        currentEra: eraStatus.currentEra,
        remainingPreBurnSlots: eraStatus.remainingSlotsInPreBurn,
        percentageToGreatBurn: eraStatus.percentageToGreatBurn,
        totalSupply: eraStatus.totalSupply,
        totalCitizens: eraStatus.totalCitizens,
        mintAmountPerCitizen: eraStatus.mintAmountPerCitizen,
        burnToOneProgress: burnStatus.progress,
        burnToOneTarget: burnStatus.targetSupply,
        totalBurned,
        vidaCapBasePrice: 1000, // $1,000 USD
      },
    });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      code: 'SCARCITY_CLOCK_FAILED',
      message: err.message,
    });
  }
});

