'use client';

import { useRouter } from 'next/navigation';
import { RemoteLoginScreen } from '@/components/auth/RemoteLoginScreen';

/**
 * Remote Device Handshake — Identity-First Login.
 * Only requires Sovereign ID; Face Pulse verifies against Supabase face_hash.
 * New device → Bind New Device screen → update primary_sentinel_device_id → dashboard (5 VIDA CAP) + security notification.
 */
export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center p-4" data-testid="login-page">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, rgba(5, 5, 5, 0) 70%)' }}
        aria-hidden
      />
      <RemoteLoginScreen
        onSuccess={() => router.push('/dashboard?minted=1')}
        onCancel={() => router.push('/')}
      />
    </main>
  );
}
