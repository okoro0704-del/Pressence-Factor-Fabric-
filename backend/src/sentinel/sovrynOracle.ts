/**
 * PFF Backend — SOVRYN Oracle Integration
 * Real-time USD to VIDA conversion using SOVRYN price feeds
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * Purpose:
 * - Get real-time VIDA/USD price from SOVRYN Oracle
 * - Convert $10 USD Sentinel fee to ngVIDA/ghVIDA equivalent
 * - Ensure accurate pricing at moment of handshake
 */

import { Contract, JsonRpcProvider } from 'ethers';
import { VIDA_CAP_BASE_PRICE_USD } from '../../../core/goldRush';

// SOVRYN Oracle contract address (RSK mainnet)
// TODO: Replace with actual SOVRYN price feed contract address
const SOVRYN_ORACLE_ADDRESS = '0x0000000000000000000000000000000000000000'; // Placeholder

// Price feed ABI (Chainlink-compatible)
const PRICE_FEED_ABI = [
  'function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
  'function decimals() view returns (uint8)',
];

// RSK RPC endpoint
const RSK_RPC_URL = process.env.RSK_RPC_URL || 'https://public-node.rsk.co';

export interface OraclePriceData {
  vidaUsdPrice: number; // VIDA/USD price
  usdVidaPrice: number; // USD/VIDA price (inverse)
  decimals: number;
  timestamp: number;
  roundId: string;
}

export interface USDConversionResult {
  usdAmount: number;
  vidaAmount: number;
  vidaAmountNano: number; // ngVIDA (nano-VIDA)
  vidaAmountGiga: number; // ghVIDA (giga-VIDA)
  oraclePrice: number;
  timestamp: number;
}

/**
 * Get VIDA/USD price from SOVRYN Oracle
 * Uses VIDA Cap base price ($1,000 USD) as fallback if oracle unavailable
 */
export async function getVIDAUSDPrice(): Promise<OraclePriceData> {
  try {
    const provider = new JsonRpcProvider(RSK_RPC_URL);
    const oracle = new Contract(SOVRYN_ORACLE_ADDRESS, PRICE_FEED_ABI, provider);
    
    const [roundData, decimals] = await Promise.all([
      oracle.latestRoundData() as Promise<{
        roundId: bigint;
        answer: bigint;
        startedAt: bigint;
        updatedAt: bigint;
        answeredInRound: bigint;
      }>,
      oracle.decimals() as Promise<number>,
    ]);
    
    // Convert price from oracle format
    const price = Number(roundData.answer) / (10 ** decimals);
    
    return {
      vidaUsdPrice: price,
      usdVidaPrice: 1 / price,
      decimals,
      timestamp: Number(roundData.updatedAt) * 1000,
      roundId: roundData.roundId.toString(),
    };
  } catch (error) {
    // Fallback to VIDA Cap base price if oracle unavailable
    console.warn('SOVRYN Oracle unavailable, using VIDA Cap base price as fallback:', error);
    
    return {
      vidaUsdPrice: VIDA_CAP_BASE_PRICE_USD, // $1,000 USD per VIDA
      usdVidaPrice: 1 / VIDA_CAP_BASE_PRICE_USD,
      decimals: 18,
      timestamp: Date.now(),
      roundId: 'fallback',
    };
  }
}

/**
 * Convert USD amount to VIDA using SOVRYN Oracle
 * Returns amount in VIDA, ngVIDA (nano), and ghVIDA (giga)
 */
export async function convertUSDToVIDA(usdAmount: number): Promise<USDConversionResult> {
  const oracleData = await getVIDAUSDPrice();
  
  // Calculate VIDA amount
  const vidaAmount = usdAmount * oracleData.usdVidaPrice;
  
  // Convert to different units
  const vidaAmountNano = vidaAmount * 1e9; // ngVIDA (nano-VIDA, 10^-9)
  const vidaAmountGiga = vidaAmount / 1e9; // ghVIDA (giga-VIDA, 10^9)
  
  return {
    usdAmount,
    vidaAmount,
    vidaAmountNano,
    vidaAmountGiga,
    oraclePrice: oracleData.vidaUsdPrice,
    timestamp: oracleData.timestamp,
  };
}

/**
 * Get Sentinel activation fee in VIDA
 * Converts $10 USD to VIDA using real-time SOVRYN Oracle price
 */
export async function getSentinelActivationFeeInVIDA(feeUSD: number = 10.0): Promise<USDConversionResult> {
  return convertUSDToVIDA(feeUSD);
}

/**
 * Verify payment amount matches expected USD value
 * Allows 1% tolerance for price fluctuations during handshake
 */
export async function verifyPaymentAmount(
  paidVIDA: number,
  expectedUSD: number
): Promise<{ valid: boolean; expectedVIDA: number; difference: number; percentDifference: number }> {
  const conversion = await convertUSDToVIDA(expectedUSD);
  const difference = Math.abs(paidVIDA - conversion.vidaAmount);
  const percentDifference = (difference / conversion.vidaAmount) * 100;
  
  // Allow 1% tolerance for price fluctuations
  const valid = percentDifference <= 1.0;
  
  return {
    valid,
    expectedVIDA: conversion.vidaAmount,
    difference,
    percentDifference,
  };
}

