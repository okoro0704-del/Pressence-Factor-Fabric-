/**
 * Route protection for /government, /sentinel, and /master.
 * Reads pff_role cookie (set client-side after role is loaded from Supabase).
 * If role is missing or insufficient, redirects to /dashboard with ?unauthorized=1.
 *
 * EMERGENCY BYPASS (temporary): Set PFF_EMERGENCY_BYPASS_IP to your IP, or set
 * cookie pff_emergency_bypass to PFF_EMERGENCY_BYPASS_SECRET, to allow /master
 * without MASTER_ARCHITECT role. Remove after restoring access.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ROLE_COOKIE = 'pff_role';
const GOVERNMENT_ROLES = ['GOVERNMENT_ADMIN', 'MASTER_ARCHITECT'];
const SENTINEL_ROLES = ['SENTINEL_OFFICER', 'MASTER_ARCHITECT', 'GOVERNMENT_ADMIN', 'SENTINEL_STAFF'];
const MASTER_ROLES = ['MASTER_ARCHITECT'];
const STAFF_PORTAL_ROLES = ['SENTINEL_STAFF', 'MASTER_ARCHITECT', 'GOVERNMENT_ADMIN'];

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null;
  return request.headers.get('x-real-ip') ?? null;
}

/** Temporary bypass: allow /master for whitelisted IP or secret cookie. */
function isMasterBypassAllowed(request: NextRequest): boolean {
  const bypassIp = process.env.PFF_EMERGENCY_BYPASS_IP?.trim();
  const bypassSecret = process.env.PFF_EMERGENCY_BYPASS_SECRET?.trim();
  if (!bypassIp && !bypassSecret) return false;
  if (bypassIp) {
    const clientIp = getClientIp(request);
    if (clientIp === bypassIp) return true;
  }
  if (bypassSecret) {
    const cookie = request.cookies.get('pff_emergency_bypass')?.value;
    if (cookie === bypassSecret) return true;
  }
  return false;
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const role = request.cookies.get(ROLE_COOKIE)?.value?.toUpperCase() ?? '';

  if (path.startsWith('/government')) {
    if (!GOVERNMENT_ROLES.includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.searchParams.set('unauthorized', '1');
      return NextResponse.redirect(url);
    }
  }

  if (path.startsWith('/sentinel') && !path.startsWith('/sentinel-vault')) {
    if (!SENTINEL_ROLES.includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.searchParams.set('unauthorized', '1');
      return NextResponse.redirect(url);
    }
  }

  if (path.startsWith('/staff-portal')) {
    if (!STAFF_PORTAL_ROLES.includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.searchParams.set('unauthorized', '1');
      return NextResponse.redirect(url);
    }
  }

  if (path.startsWith('/master')) {
    if (isMasterBypassAllowed(request)) {
      const res = NextResponse.next();
      res.cookies.set(ROLE_COOKIE, 'MASTER_ARCHITECT', { path: '/', maxAge: 86400 });
      return res;
    }
    if (!MASTER_ROLES.includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.searchParams.set('unauthorized', '1');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/government/:path*', '/sentinel/:path*', '/master/:path*', '/staff-portal/:path*'],
};
