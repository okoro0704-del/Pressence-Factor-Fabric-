'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useGlobalPresenceGateway } from '@/contexts/GlobalPresenceGateway';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * PROTECTED ROUTE WRAPPER
 * Redirects to 4-Layer Gate if presence is not verified
 * Used to protect all authenticated pages
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isPresenceVerified, loading } = useGlobalPresenceGateway();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Don't redirect if we're already on the gate page
    if (pathname === '/') {
      setIsChecking(false);
      return;
    }

    // Wait for loading to complete
    if (loading) {
      return;
    }

    // Redirect to gate if not verified
    if (!isPresenceVerified) {
      console.warn('[ProtectedRoute] Presence not verified, redirecting to gate');
      router.push('/');
    } else {
      setIsChecking(false);
    }
  }, [isPresenceVerified, loading, pathname, router]);

  // Show loading state while checking
  if (loading || isChecking) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg text-[#D4AF37] font-semibold">Verifying Presence...</p>
        </div>
      </div>
    );
  }

  // Only render children if presence is verified
  if (!isPresenceVerified) {
    return null;
  }

  return <>{children}</>;
}

