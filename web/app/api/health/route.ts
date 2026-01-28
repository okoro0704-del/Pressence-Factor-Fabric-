import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * PFF System Health Check — backend liveness ping.
 * National Pulse layer uses this to verify connectivity.
 */
export async function GET() {
  return NextResponse.json({ ok: true });
}
