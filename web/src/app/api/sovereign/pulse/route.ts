/**
 * Sovereign Pulse API Endpoint
 *
 * THE DOORKEEPER PROTOCOL:
 * This endpoint is now a STATELESS PROXY to the Sentinel Backend.
 *
 * Flow:
 * 1. Collect biometric data from frontend
 * 2. Forward to Sentinel Backend
 * 3. Return Sentinel's response
 *
 * FORBIDDEN ACTIONS (moved to Sentinel):
 * - ❌ Calculate VIDA splits
 * - ❌ Update database directly
 * - ❌ Execute blockchain transactions
 * - ❌ Validate biometric data
 * - ❌ Use SUPABASE_SERVICE_ROLE_KEY
 *
 * This endpoint is a "Front Door" only.
 */

import { NextRequest, NextResponse } from "next/server";
import { sentinelClient } from "@/lib/sentinel/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sovereignId, biometricData, phoneNumber, walletAddress } = body;

    // Validate input (basic validation only - Sentinel does the real validation)
    if (!sovereignId || !biometricData) {
      return NextResponse.json(
        { error: "Missing required fields: sovereignId, biometricData" },
        { status: 400 }
      );
    }

    // THE DOORKEEPER PROTOCOL:
    // Forward to Sentinel - do NOT execute any logic here
    const result = await sentinelClient.executeVitalization({
      phoneNumber: phoneNumber || sovereignId,
      sovereignId,
      biometricData,
      walletAddress,
    });

    // Return Sentinel's response as-is
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Vitalization failed", code: result.code },
        { status: 400 }
      );
    }

    // Return Sentinel's response to frontend
    return NextResponse.json({
      success: true,
      message: "Sovereign Pulse completed successfully",
      ...result.data,
    });
  } catch (error: any) {
    console.error("[SOVEREIGN PULSE PROXY ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to connect to Sentinel" },
      { status: 500 }
    );
  }
}
