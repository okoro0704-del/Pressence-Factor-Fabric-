/**
 * Route protection for /government, /sentinel, and /master.
 * Reads pff_role cookie (set client-side after role is loaded from Supabase).
 * If role is missing or insufficient, redirects to /dashboard with ?unauthorized=1.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ROLE_COOKIE = 'pff_role';
const GOVERNMENT_ROLES = ['GOVERNMENT_ADMIN', 'MASTER_ARCHITECT'];
const SENTINEL_ROLES = ['SENTINEL_OFFICER', 'MASTER_ARCHITECT', 'GOVERNMENT_ADMIN'];
const MASTER_ROLES = ['MASTER_ARCHITECT'];

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

  if (path.startsWith('/master')) {
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
  matcher: ['/government/:path*', '/sentinel/:path*', '/master/:path*'],
};
