/**
 * Save Four Pillars — Face ID, Palm Scan, Device ID, GPS
 *
 * THE DOORKEEPER PROTOCOL:
 * This endpoint is now a STATELESS PROXY to the Sentinel Backend.
 *
 * FORBIDDEN ACTIONS (moved to Sentinel):
 * - ❌ Write to database directly
 * - ❌ Use Supabase service role key
 * - ❌ Execute business logic
 *
 * Frontend ONLY collects and forwards biometric data.
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
    const geo = body?.geolocation;
    const geolocation =
      geo != null &&
      typeof geo.latitude === 'number' &&
      typeof geo.longitude === 'number'
        ? { latitude: geo.latitude, longitude: geo.longitude, accuracy: typeof geo.accuracy === 'number' ? geo.accuracy : undefined }
        : null;

    if (!phone_number || !face_hash || !palm_hash || !device_id || !geolocation) {
      return NextResponse.json(
        { ok: false, error: 'phone_number, face_hash, palm_hash, device_id, and geolocation (latitude, longitude) required' },
        { status: 400 }
      );
    }

    // Build complete pillar data object
    const pillarData = {
      face: { hash: face_hash, confidence: 1.0 },
      palm: { hash: palm_hash, confidence: 1.0 },
      device: { id: device_id, fingerprint: device_id },
      geolocation,
    };

    // Forward to Sentinel
    const result = await sentinelClient.savePillarsAll({
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
    console.error('[SAVE-FOUR-PILLARS ERROR]', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to save pillar data' },
      { status: 500 }
    );
  }
}
