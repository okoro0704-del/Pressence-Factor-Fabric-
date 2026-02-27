'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LanguageGate } from '@/components/gateway/LanguageGate';
import { PhoneOTPLogin } from '@/components/gateway/PhoneOTPLogin';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { setIdentityAnchorForSession } from '@/lib/sentinelActivation';
import { setVitalizationComplete } from '@/lib/vitalizationState';
import type { LanguageCode } from '@/lib/i18n/config';

type GatewayStep = 'language' | 'sms' | 'loading';

/**
 * ROOT PAGE — Gateway Flow Entry Point.
 * Step 1: Language Selection (English, Yoruba, Hausa, Igbo)
 * Step 2: SMS/OTP Login
 * Step 3: Route to Dashboard (Zero-State if not vitalized)
 */
export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<GatewayStep>('loading');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if user already has identity anchor (phone)
    const existingPhone = getIdentityAnchorPhone();
    if (existingPhone?.trim()) {
      // User already logged in, go to dashboard
      router.replace('/dashboard');
    } else {
      // New user, start Gateway Flow
      setStep('language');
    }
  }, [router]);

  const handleLanguageSelected = (language: LanguageCode) => {
    // Language stored in LanguageGate component
    setStep('sms');
  };

  const handleSMSSuccess = (phoneNumber: string) => {
    // Store identity anchor
    setIdentityAnchorForSession(phoneNumber);

    // Note: User is NOT vitalized yet - they need to complete NIN verification
    // Dashboard will show Zero-State (global data only, wallet hidden)

    // Route to dashboard
    router.push('/dashboard');
  };

  const handleBackToLanguage = () => {
    setStep('language');
  };

  if (!mounted || step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]" style={{ color: '#6b6b70' }} aria-busy="true">
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (step === 'language') {
    return <LanguageGate onLanguageSelected={handleLanguageSelected} />;
  }

  if (step === 'sms') {
    return <PhoneOTPLogin onSuccess={handleSMSSuccess} onBack={handleBackToLanguage} />;
  }

  return null;
}
