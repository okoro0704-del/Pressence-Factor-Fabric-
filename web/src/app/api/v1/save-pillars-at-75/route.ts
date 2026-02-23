/**
 * Save pillars at 75% (Face, Palm, Mobile ID)
 *
 * THE DOORKEEPER PROTOCOL:
 * This endpoint is now a STATELESS PROXY to the Sentinel Backend.
 *
 * FORBIDDEN ACTIONS (moved to Sentinel):
 * - ❌ Set vitalization_status directly
 * - ❌ Write to database
 * - ❌ Use Supabase service role key
 *
 * Frontend ONLY collects and forwards data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { sentinelClient } from '@/lib/sentinel/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Basic validation only
    const phone_number = typeof body?.phone_number === 'string' ? body.phone_number.trim() : '';
    const face_hash = typeof body?.face_hash === 'string' ? body.face_hash.trim() : '';
    const palm_hash = typeof body?.palm_hash === 'string' ? body.palm_hash.trim() : '';
    const device_id = typeof body?.device_id === 'string' ? body.device_id.trim() : '';

    if (!phone_number) {
      return NextResponse.json(
        { ok: false, error: 'phone_number required' },
        { status: 400 }
      );
    }

    // Build pillar data object
    const pillarData: any = {};
    if (face_hash) pillarData.face = { hash: face_hash, confidence: 1.0 };
    if (palm_hash) pillarData.palm = { hash: palm_hash, confidence: 1.0 };
    if (device_id) pillarData.device = { id: device_id, fingerprint: device_id };

    // Forward to Sentinel
    const result = await sentinelClient.savePillarsAt75({
      phoneNumber: phone_number,
      pillarData,
    });

    // Return Sentinel response as-is
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, ...result.data });
  } catch (error) {
    console.error('[SAVE-PILLARS-AT-75 ERROR]', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to save pillar data' },
      { status: 500 }
    );
  }
}
