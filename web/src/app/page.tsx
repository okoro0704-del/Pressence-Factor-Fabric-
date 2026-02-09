'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * ROOT PAGE — Redirects straight to the app. Manifesto and access gate hidden for now.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]" style={{ color: '#6b6b70' }} aria-busy="true">
      <p className="text-sm">Loading…</p>
    </div>
  );
}
