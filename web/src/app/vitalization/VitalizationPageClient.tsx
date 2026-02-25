'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
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
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0d0d0f] border border-[#D4AF37]/30 hover:border-[#D4AF37] transition-all duration-200 group"
          style={{ color: '#D4AF37' }}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <VitalizationHubContent onVitalizeOthers={() => setShowGateForOthers(true)} />
      </SovereignGuardRedirect>
    );
  }

  return (
    <SovereignGuardRedirect>
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0d0d0f] border border-[#D4AF37]/30 hover:border-[#D4AF37] transition-all duration-200 group"
        style={{ color: '#D4AF37' }}
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <FourLayerGate vitalizeOthersMode={showGateForOthers} />
    </SovereignGuardRedirect>
  );
}
