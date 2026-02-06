'use client';

import { useRouter } from 'next/navigation';
import { SovereignCompanion } from '@/components/dashboard/SovereignCompanion';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';

const GOLD = '#D4AF37';

export default function CompanionPage() {
  const router = useRouter();
  const phoneNumber = getIdentityAnchorPhone();

  return (
    <main className="min-h-screen flex flex-col bg-[#0d0d0f]">
      <div className="shrink-0 px-4 py-4 border-b border-[#2a2a2e]">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: GOLD }}>
          SOVRYN Companion
        </h1>
        <p className="text-xs text-[#6b6b70] mt-1">
          Voice-first. Say &quot;Sovereign&quot; or tap the mic. Active on this page.
        </p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <p className="text-sm text-[#a0a0a5] text-center max-w-md mb-8">
          Your Sovereign Intelligence is active. Use voice commands: &quot;Show my PFF balance&quot;, &quot;Swap VIDA to DLLR&quot;, &quot;Vitalization status&quot;, or &quot;Lockdown&quot;.
        </p>
        <SovereignCompanion
          userName="Architect"
          phoneNumber={phoneNumber}
          autoActivate
          onScrollToBalance={() => router.push('/dashboard#balance')}
          onOpenSwapModal={() => router.push('/treasury?swap=1')}
          onShowVitalizationStatus={() => router.push('/vitalization')}
          onTriggerLockdown={() => {}}
        />
      </div>
    </main>
  );
}
