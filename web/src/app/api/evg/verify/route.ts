/**
 * EVG ZKP: Verify humanity — returns ONLY { verified: true|false }.
 * No fingerprint, no face hash. Partner sends Authorization: Bearer <access_token>.
 * Optionally records Data Integrity Fee and revenue share (Sentinel + User).
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessTokenAndHumanity, getEvgPartner, recordEvgRevenueShare } from '@/lib/evg';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization');
    const token = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (!token) {
      return NextResponse.json({ error: 'Authorization: Bearer <access_token> required' }, { status: 401 });
    }

    const result = await verifyAccessTokenAndHumanity(token);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    if (result.verified && result.partnerId && result.phoneNumber) {
      const partnerResult = await getEvgPartner(result.partnerId);
      if (partnerResult.ok && partnerResult.partner.data_integrity_fee_cents > 0) {
        await recordEvgRevenueShare(
          result.partnerId,
          result.phoneNumber,
          partnerResult.partner.data_integrity_fee_cents,
          partnerResult.partner.revenue_share_user_pct
        );
      }
    }

    return NextResponse.json({ verified: result.verified });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
