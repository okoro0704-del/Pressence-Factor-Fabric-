/**
 * EVG: Public partner info for consent screen (name only).
 * GET ?client_id=xxx → { name } or 400 if invalid/revoked.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEvgPartner } from '@/lib/evg';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get('client_id')?.trim() ?? '';
  if (!clientId) {
    return NextResponse.json({ error: 'client_id required' }, { status: 400 });
  }
  const result = await getEvgPartner(clientId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ name: result.partner.name });
}
