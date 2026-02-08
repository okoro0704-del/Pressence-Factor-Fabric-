'use client';

import { VitalizationScreen } from '@/components/VitalizationScreen';
import { SovereignGuardRedirect } from '@/components/dashboard/SovereignGuardRedirect';

export function VitalizationPageClient() {
  return (
    <SovereignGuardRedirect>
      <VitalizationScreen />
    </SovereignGuardRedirect>
  );
}
