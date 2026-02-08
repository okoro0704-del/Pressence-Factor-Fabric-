'use client';

import { useRouter } from 'next/navigation';
import { SovereignCompanion } from '@/components/dashboard/SovereignCompanion';
import { SovereignCompanionChat } from '@/components/dashboard/SovereignCompanionChat';
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
          Voice and text. Say &quot;Sovereign&quot; or tap the mic; or type below and press Enter. Replies in chat + voice.
        </p>
      </div>

      {/* Unified message history + input (Era of Light: Gold Ring focus, Architect right / Sentinel left, typing indicator, Vibration sync) */}
      <div className="flex-1 min-h-0 flex flex-col">
        <SovereignCompanionChat userName="Architect" />
      </div>

      {/* Voice: avatar + mic (floating) */}
      <SovereignCompanion
        userName="Architect"
        phoneNumber={phoneNumber}
        autoActivate
        onScrollToBalance={() => router.push('/dashboard#balance')}
        onOpenSwapModal={() => router.push('/treasury?swap=1')}
        onShowVitalizationStatus={() => router.push('/vitalization')}
        onTriggerLockdown={() => {}}
      />
    </main>
  );
}
