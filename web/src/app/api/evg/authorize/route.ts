/**
 * EVG OAuth-style: Create authorization code after user consent.
 * POST body: { client_id, redirect_uri, state, identity_anchor }.
 * Returns { redirect_url } for partner callback (ZKP: code only; no biometric data).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuthorizationCode } from '@/lib/evg';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientId = typeof body.client_id === 'string' ? body.client_id.trim() : '';
    const redirectUri = typeof body.redirect_uri === 'string' ? body.redirect_uri.trim() : '';
    const state = typeof body.state === 'string' ? body.state : '';
    const identityAnchor = typeof body.identity_anchor === 'string' ? body.identity_anchor.trim() : '';

    if (!clientId || !redirectUri || !identityAnchor) {
      return NextResponse.json(
        { error: 'client_id, redirect_uri, and identity_anchor are required' },
        { status: 400 }
      );
    }

    const result = await createAuthorizationCode(clientId, redirectUri, state, identityAnchor);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ redirect_url: result.redirectUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
