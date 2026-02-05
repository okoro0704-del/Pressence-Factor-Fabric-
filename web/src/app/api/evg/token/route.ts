/**
 * EVG OAuth-style: Exchange authorization code for access_token.
 * POST body (JSON or form): client_id, client_secret, code, redirect_uri.
 * Partner uses access_token in Authorization: Bearer to call /api/evg/verify (ZKP YES/NO only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/evg';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    let clientId: string;
    let clientSecret: string;
    let code: string;
    let redirectUri: string;
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const form = await request.formData();
      clientId = (form.get('client_id') as string)?.trim() ?? '';
      clientSecret = (form.get('client_secret') as string) ?? '';
      code = (form.get('code') as string)?.trim() ?? '';
      redirectUri = (form.get('redirect_uri') as string)?.trim() ?? '';
    } else {
      const body = await request.json();
      clientId = typeof body.client_id === 'string' ? body.client_id.trim() : '';
      clientSecret = typeof body.client_secret === 'string' ? body.client_secret : '';
      code = typeof body.code === 'string' ? body.code.trim() : '';
      redirectUri = typeof body.redirect_uri === 'string' ? body.redirect_uri.trim() : '';
    }

    if (!clientId || !clientSecret || !code || !redirectUri) {
      return NextResponse.json(
        { error: 'client_id, client_secret, code, and redirect_uri are required' },
        { status: 400 }
      );
    }

    const result = await exchangeCodeForToken(clientId, clientSecret, code, redirectUri);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      access_token: result.access_token,
      token_type: result.token_type,
      expires_in: result.expires_in,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
