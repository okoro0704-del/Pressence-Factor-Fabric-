'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Language screen — entry point after Sign Out.
 * Redirects to root (/) where the 4-layer gate shows the language selection first.
 */
export default function LanguagePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0f]" style={{ color: '#6b6b70' }}>
      <p className="animate-pulse">Loading…</p>
    </div>
  );
}
