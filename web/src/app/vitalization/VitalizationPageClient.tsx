'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FourLayerGate } from '@/components/dashboard/FourLayerGate';
import { SovereignGuardRedirect } from '@/components/dashboard/SovereignGuardRedirect';
import { VitalizationHubContent } from '@/components/vitalization/VitalizationHubContent';
import { getVitalizationStatus } from '@/lib/vitalizationState';
import { ROUTES } from '@/lib/constants';
import { useTranslation } from '@/lib/i18n/TranslationContext';

/**
 * Vitalization page: full 4-pillar gate when not yet vitalized; when vitalized, show Vitalization Hub (dependent + others).
 * No redirect to dashboard when vitalized — show hub content so user can vitalize dependents or others.
 */
export function VitalizationPageClient() {
  const router = useRouter();
  const { t } = useTranslation();
  const [allowRegistration, setAllowRegistration] = useState<boolean | null>(null);
  const [isVitalized, setIsVitalized] = useState(false);
  const [showGateForOthers, setShowGateForOthers] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (cancelled) return;
      setAllowRegistration((prev) => (prev === null ? true : prev));
    }, 8000);
    getVitalizationStatus()
      .then((status) => {
        if (cancelled) return;
        if (status === 'vitalized') {
          setIsVitalized(true);
          setAllowRegistration(true);
          return;
        }
        if (status === 'needs_restore') {
          router.replace('/link-device');
          return;
        }
        setAllowRegistration(status === 'no_citizen_record' || status === 'no_user');
      })
      .catch(() => {
        if (cancelled) return;
        setAllowRegistration(true);
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [router]);

  if (allowRegistration === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]" style={{ color: '#6b6b70' }}>
        <p className="text-sm">{t('vitalization.checkingIdentity', 'Checking identity…')}</p>
      </div>
    );
  }

  if (!allowRegistration) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]" style={{ color: '#6b6b70' }}>
        <p className="text-sm">{t('vitalization.checkingIdentity', 'Checking identity…')}</p>
      </div>
    );
  }

  if (isVitalized && !showGateForOthers) {
    return (
      <SovereignGuardRedirect>
        <VitalizationHubContent onVitalizeOthers={() => setShowGateForOthers(true)} />
      </SovereignGuardRedirect>
    );
  }

  return (
    <SovereignGuardRedirect>
      <FourLayerGate vitalizeOthersMode={showGateForOthers} />
    </SovereignGuardRedirect>
  );
}
