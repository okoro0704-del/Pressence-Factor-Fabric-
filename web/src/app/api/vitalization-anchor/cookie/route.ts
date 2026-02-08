import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'pff_vitalized';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

/** Set Secure HttpOnly cookie when client has completed vitalization (citizen_hash stored in encrypted localStorage). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const citizenHash = typeof body?.citizenHash === 'string' ? body.citizenHash.trim() : null;
    if (!citizenHash) {
      return NextResponse.json({ ok: false, error: 'citizenHash required' }, { status: 400 });
    }
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, citizenHash.slice(0, 64), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}

/** Clear the vitalization cookie (e.g. Vitalize Someone Else). */
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
