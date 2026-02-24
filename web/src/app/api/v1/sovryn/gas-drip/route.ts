/**
 * PFF Protocol - Polygon MATIC Gas Drip Endpoint
 * Sends small amount of MATIC to users who need gas for transactions
 * Uses deployer wallet with 41.52 MATIC
 */

import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Security: Only allow requests with valid secret
const SOVRYN_SECRET = process.env.PFF_EMERGENCY_BYPASS_SECRET || 'Pff-Sen-Sov-555-2026';

// Polygon Mainnet RPC
const POLYGON_RPC_URL = 'https://polygon-bor-rpc.publicnode.com';

// Deployer wallet private key (from environment)
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || '4cfc678b4ae455c0b44b5b25ebd221be5749935a33017b4c1649e6cc63a48492';

// Amount to send: 0.01 MATIC (enough for ~50 transactions)
const GAS_DRIP_AMOUNT = '0.01';

// Minimum balance required before drip (0.005 MATIC)
const MIN_BALANCE_THRESHOLD = '0.005';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify secret header
    const secret = request.headers.get('x-sovryn-secret');
    if (secret !== SOVRYN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid x-sovryn-secret header' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { address, phone } = body;

    if (!address && !phone) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Either address or phone is required' },
        { status: 400 }
      );
    }

    // 3. Determine recipient address
    let recipientAddress = address;

    // If phone provided, derive address (simple derivation for now)
    if (!recipientAddress && phone) {
      // TODO: Implement proper phone-to-address derivation
      // For now, return error
      return NextResponse.json(
        { error: 'Not Implemented', message: 'Phone-to-address derivation not yet implemented. Please provide address directly.' },
        { status: 501 }
      );
    }

    // 4. Validate address
    if (!ethers.utils.isAddress(recipientAddress)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid Ethereum address' },
        { status: 400 }
      );
    }

    // 5. Connect to Polygon
    const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC_URL);
    const wallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);

    // 6. Check recipient's current balance
    const recipientBalance = await provider.getBalance(recipientAddress);
    const balanceInMatic = ethers.utils.formatEther(recipientBalance);

    // If recipient already has enough gas, don't send
    if (recipientBalance.gte(ethers.utils.parseEther(MIN_BALANCE_THRESHOLD))) {
      return NextResponse.json({
        success: false,
        message: 'Recipient already has sufficient MATIC for gas',
        recipientAddress,
        currentBalance: balanceInMatic,
        threshold: MIN_BALANCE_THRESHOLD,
      });
    }

    // 7. Check deployer wallet balance
    const deployerBalance = await wallet.getBalance();
    const deployerBalanceInMatic = ethers.utils.formatEther(deployerBalance);

    if (deployerBalance.lt(ethers.utils.parseEther(GAS_DRIP_AMOUNT))) {
      return NextResponse.json(
        {
          error: 'Insufficient Funds',
          message: 'Deployer wallet has insufficient MATIC',
          deployerBalance: deployerBalanceInMatic,
        },
        { status: 500 }
      );
    }

    // 8. Send MATIC
    const tx = await wallet.sendTransaction({
      to: recipientAddress,
      value: ethers.utils.parseEther(GAS_DRIP_AMOUNT),
    });

    // 9. Wait for confirmation
    const receipt = await tx.wait();

    // 10. Return success
    return NextResponse.json({
      success: true,
      message: 'MATIC gas drip sent successfully',
      recipientAddress,
      amount: GAS_DRIP_AMOUNT,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      deployerBalance: deployerBalanceInMatic,
      recipientBalanceBefore: balanceInMatic,
    });

  } catch (error: any) {
    console.error('Gas drip error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error.message || 'Failed to send gas drip',
      },
      { status: 500 }
    );
  }
}

// GET method to check deployer wallet status
export async function GET(request: NextRequest) {
  try {
    // Verify secret header
    const secret = request.headers.get('x-sovryn-secret');
    if (secret !== SOVRYN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to Polygon
    const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC_URL);
    const wallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);

    // Get balance
    const balance = await wallet.getBalance();
    const balanceInMatic = ethers.utils.formatEther(balance);

    return NextResponse.json({
      deployerAddress: wallet.address,
      balance: balanceInMatic,
      network: 'Polygon Mainnet',
      chainId: 137,
      gasDripAmount: GAS_DRIP_AMOUNT,
      minBalanceThreshold: MIN_BALANCE_THRESHOLD,
    });

  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}

