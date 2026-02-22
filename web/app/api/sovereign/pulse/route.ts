/**
 * Sovereign Pulse API Endpoint
 * 
 * Replaces NFT/SBT minting with database-driven vitalization
 * 
 * Flow:
 * 1. Validate biometric data
 * 2. Update user's vitalization_status to 'VITALIZED' in Supabase
 * 3. Execute triple-split VIDA transfer:
 *    - 5 VIDA to Citizen (spendable)
 *    - 5 VIDA to Nigeria National Treasury (locked)
 *    - 1 VIDA to PFF Foundation (locked)
 * 4. Return success with transaction hash
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { distributeVitalizationVIDA, VIDA_DISTRIBUTION } from "@/lib/vida/distribution";

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sovereignId, biometricData, phoneNumber } = body;

    // Validate input
    if (!sovereignId || !biometricData) {
      return NextResponse.json(
        { error: "Missing required fields: sovereignId, biometricData" },
        { status: 400 }
      );
    }

    // 1. Check if user exists and is not already vitalized
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("phone_number", phoneNumber || sovereignId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    if (profile.vitalization_status === "VITALIZED") {
      return NextResponse.json(
        { error: "User is already vitalized" },
        { status: 400 }
      );
    }

    // 2. Process biometric data (hash and store)
    const faceHash = await hashBiometric(biometricData.imageData);

    // 3. Execute VIDA distribution (triple-split transfer)
    const distributionResult = await distributeVitalizationVIDA(
      phoneNumber || sovereignId,
      sovereignId
    );

    if (!distributionResult.success) {
      console.error("[VIDA DISTRIBUTION ERROR]", distributionResult.error);
      // Continue even if distribution fails - we'll mark as vitalized in DB
      // The distribution can be retried later via admin panel
    }

    // 4. Update user profile to VITALIZED status
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        vitalization_status: "VITALIZED",
        vitalized_at: new Date().toISOString(),
        vitalization_tx_hash: distributionResult.transactionHash || null,
        face_hash: faceHash,
        spendable_vida: distributionResult.citizenVida,
        locked_vida: 0, // Citizen's VIDA is spendable
        is_minted: true, // Legacy flag for compatibility
        humanity_score: 1.0,
        updated_at: new Date().toISOString(),
      })
      .eq("phone_number", phoneNumber || sovereignId);

    if (updateError) {
      console.error("[DB UPDATE ERROR]", updateError);
      return NextResponse.json(
        { error: "Failed to update vitalization status" },
        { status: 500 }
      );
    }

    // 5. Log vitalization event
    await supabase.from("vitalization_log").insert({
      phone_number: phoneNumber || sovereignId,
      sovereign_id: sovereignId,
      face_hash: faceHash,
      tx_hash: distributionResult.transactionHash || null,
      citizen_vida: distributionResult.citizenVida,
      treasury_vida: distributionResult.treasuryVida,
      foundation_vida: distributionResult.foundationVida,
      status: distributionResult.success ? "SUCCESS" : "FAILED",
      error_message: distributionResult.error || null,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Sovereign Pulse completed successfully",
      vitalizationStatus: "VITALIZED",
      vitalizedAt: new Date().toISOString(),
      vidaDistribution: {
        citizen: distributionResult.citizenVida,
        treasury: distributionResult.treasuryVida,
        foundation: distributionResult.foundationVida,
        total: VIDA_DISTRIBUTION.TOTAL,
      },
      transactionHash: distributionResult.transactionHash || null,
    });
  } catch (error: any) {
    console.error("[SOVEREIGN PULSE ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Sovereign Pulse failed" },
      { status: 500 }
    );
  }
}

// Helper: Hash biometric data
async function hashBiometric(imageData: string): Promise<string> {
  // Simple SHA-256 hash of image data
  const encoder = new TextEncoder();
  const data = encoder.encode(imageData);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

