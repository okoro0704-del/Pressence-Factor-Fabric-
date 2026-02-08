'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ManualLocationInputScreen } from '@/components/auth/ManualLocationInputScreen';
import { setPillarLocationFromManualEntry } from '@/lib/biometricAuth';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { useGlobalPresenceGateway } from '@/contexts/GlobalPresenceGateway';

/**
 * GPS Manual Setup — One-Way Ticket to Dashboard
 * Shown when Face, Palm, and Identity Anchor are verified but GPS is not.
 * Once location is confirmed, Complete uses router.push('/dashboard') only.
 */
export default function GpsManualSetupPage() {
  const router = useRouter();
  const { setPresenceVerified } = useGlobalPresenceGateway();

  useEffect(() => {
    const phone = getIdentityAnchorPhone();
    if (!phone) {
      router.replace('/');
    }
  }, [router]);

  const handleProceed = (city: string, country: string) => {
    const phone = getIdentityAnchorPhone();
    if (!phone) {
      router.replace('/');
      return;
    }
    setPillarLocationFromManualEntry(phone, city, country);
    setPresenceVerified(true);
    router.push('/dashboard');
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <ManualLocationInputScreen
      onProceed={handleProceed}
      onCancel={handleCancel}
      submitLabel="Complete"
    />
  );
}
