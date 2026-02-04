'use client';

import { useRouter } from 'next/navigation';
import { RecoverMyAccountScreen } from '@/components/auth/RecoverMyAccountScreen';

/**
 * Recovery route: /recover
 * 12-word seed + Face Pulse required to unbind account from lost device and re-bind to new hardware.
 */
export default function RecoverPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, rgba(5, 5, 5, 0) 70%)' }}
        aria-hidden
      />
      <RecoverMyAccountScreen
        onComplete={() => router.push('/')}
        onCancel={() => router.push('/')}
      />
    </main>
  );
}
