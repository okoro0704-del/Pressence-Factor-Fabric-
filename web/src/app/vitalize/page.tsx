'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NINVerification } from '@/components/vitalization/NINVerification';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { getCitizenStatusForPhone } from '@/lib/supabaseTelemetry';

/**
 * Vitalize Page — NIN Verification Flow
 * 
 * Gateway Flow Step 3: Vitalization Hub
 * - Request 11-digit NIN
 * - Sentinel verifies against NIMC/FIRS 2026 database
 * - On success, trigger Sovereign Strike (11 VIDA mint: 5-5-1 split)
 * - Redirect to Dashboard with wallet unlocked
 */
export default function VitalizePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      const identityPhone = getIdentityAnchorPhone();
      
      if (!identityPhone) {
        // No phone anchor - redirect to root (Language/SMS Gate)
        router.replace('/');
        return;
      }

      setPhone(identityPhone);

      // Check if already vitalized
      const status = await getCitizenStatusForPhone(identityPhone);
      if (status === 'VITALIZED') {
        // Already vitalized - redirect to dashboard
        router.replace('/dashboard');
        return;
      }

      setChecking(false);
    };

    checkStatus();
  }, [router]);

  const handleVerificationComplete = () => {
    // Verification successful - redirect to dashboard
    router.push('/dashboard?vitalized=1');
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]" style={{ color: '#6b6b70' }}>
        <p className="text-sm">Checking vitalization status…</p>
      </div>
    );
  }

  return <NINVerification onVerificationComplete={handleVerificationComplete} />;
}

