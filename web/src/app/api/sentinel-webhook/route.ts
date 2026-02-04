/**
 * Sentinel Success Webhook — Cross-Domain Sentinel Handshake.
 * Called by the PFF Sentinel App (pffsentinel.com) after payment is confirmed:
 * sentinel_licenses is updated in Supabase (Shared Vault); this endpoint notifies
 * the Main PFF App so it can refresh or log the event.
 *
 * Note: With Next.js static export (output: 'export'), API routes are not built.
 * Use a serverless function or backend (e.g. Vercel serverless, or PFF_BACKEND_URL)
 * to receive this webhook in production if the Main app is statically exported.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-static';

export interface SentinelWebhookBody {
  uid: string;
  tier?: string;
  success: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SentinelWebhookBody;
    const { uid, tier, success } = body;

    if (!uid || success !== true) {
      return NextResponse.json(
        { error: 'Invalid payload: uid required, success must be true' },
        { status: 400 }
      );
    }

    // Optional: verify shared secret if SENTINEL_WEBHOOK_SECRET is set
    const secret = process.env.SENTINEL_WEBHOOK_SECRET;
    if (secret) {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace(/^Bearer\s+/i, '') ?? '';
      if (token !== secret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // License is already updated in Supabase by the Sentinel site (processSentinelPayment).
    // Main app re-checks hasActiveSentinelLicense when user returns; no server-side action required.
    // Log or trigger realtime refresh if needed.
    console.log('[SENTINEL-WEBHOOK] Success:', { uid, tier });

    return NextResponse.json({ ok: true, received: { uid, tier } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
