/**
 * PFF × Sovryn — Gas Drip API Route
 * Provides RBTC gas for users who don't have enough for transactions
 * 
 * Endpoint: POST /v1/sovryn/gas-drip
 * Auth: x-sovryn-secret header
 * Body: { phone?: string, address?: string }
 * Response: { ok: boolean, txHash?: string, amount?: string, error?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

export const dynamic = 'force-dynamic';

const SOVRYN_SECRET = 'Pff-Sen-Sov-555-2026';
const RSK_RPC_URL = 'https://public-node.rsk.co';
const GAS_DRIP_AMOUNT = '0.001'; // 0.001 RBTC per drip

interface GasDripRequest {
  phone?: string;
  address?: string;
}

interface GasDripResponse {
  ok: boolean;
  txHash?: string;
  amount?: string;
  recipientAddress?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<GasDripResponse>> {
  try {
    // Validate secret header
    const secret = request.headers.get('x-sovryn-secret');
    if (secret !== SOVRYN_SECRET) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized: Invalid x-sovryn-secret header' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = (await request.json().catch(() => ({}))) as GasDripRequest;
    const { phone, address } = body;

    if (!phone && !address) {
      return NextResponse.json(
        { ok: false, error: 'Either phone or address is required' },
        { status: 400 }
      );
    }

    // Derive address from phone if needed
    let recipientAddress = address;
    if (phone && !address) {
      // Import deriveRSKWalletFromSeed dynamically to avoid build issues
      try {
        const { deriveRSKWalletFromSeed } = await import('@/lib/sovryn/derivedWallet');
        const derived = await deriveRSKWalletFromSeed(phone.trim());
        if (!derived.ok) {
          return NextResponse.json(
            { ok: false, error: `Failed to derive address: ${derived.error}` },
            { status: 400 }
          );
        }
        recipientAddress = derived.address;
      } catch (e) {
        return NextResponse.json(
          { ok: false, error: 'Failed to derive wallet address from phone' },
          { status: 500 }
        );
      }
    }

    if (!recipientAddress || !ethers.isAddress(recipientAddress)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid recipient address' },
        { status: 400 }
      );
    }

    // Check if relayer private key is configured
    const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
    if (!relayerPrivateKey) {
      return NextResponse.json(
        { ok: false, error: 'Relayer not configured (RELAYER_PRIVATE_KEY missing)' },
        { status: 503 }
      );
    }

    // Connect to RSK
    const provider = new ethers.JsonRpcProvider(RSK_RPC_URL);
    const relayerWallet = new ethers.Wallet(relayerPrivateKey, provider);
    const relayerAddress = await relayerWallet.getAddress();

    // Check relayer balance
    const relayerBalance = await provider.getBalance(relayerAddress);
    const minBalance = ethers.parseEther('0.01'); // Keep at least 0.01 RBTC in relayer
    if (relayerBalance < minBalance) {
      return NextResponse.json(
        {
          ok: false,
          error: `Relayer wallet low on RBTC (${ethers.formatEther(relayerBalance)} RBTC). Admin has been notified.`,
        },
        { status: 503 }
      );
    }

    // Check recipient balance - only drip if they have less than MIN_RBTC_FOR_GAS
    const recipientBalance = await provider.getBalance(recipientAddress);
    const minRbtcForGas = ethers.parseEther('0.0001');
    if (recipientBalance >= minRbtcForGas) {
      return NextResponse.json({
        ok: true,
        recipientAddress,
        amount: '0',
        error: 'Recipient already has sufficient gas',
      });
    }

    // Send gas drip
    const tx = await relayerWallet.sendTransaction({
      to: recipientAddress,
      value: ethers.parseEther(GAS_DRIP_AMOUNT),
    });

    // Wait for confirmation
    const receipt = await tx.wait();

    if (!receipt || receipt.status !== 1) {
      return NextResponse.json(
        { ok: false, error: 'Transaction failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      txHash: receipt.hash,
      amount: GAS_DRIP_AMOUNT,
      recipientAddress,
    });
  } catch (error) {
    console.error('[gas-drip] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { ok: false, error: `Gas drip failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

