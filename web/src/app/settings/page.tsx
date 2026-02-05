'use client';

import Link from 'next/link';
import { BiometricStrictnessSlider } from '@/components/settings/BiometricStrictnessSlider';
import { AppShell } from '@/components/layout/AppShell';

const GOLD = '#D4AF37';

export default function SettingsPage() {
  return (
    <AppShell>
      <main className="p-4 md:p-6 max-w-xl mx-auto">
        <h1 className="text-xl font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
          Settings
        </h1>
        <p className="text-sm text-[#6b6b70] mb-6">
          Your preferences are saved to your profile and apply on all devices.
        </p>

        <div className="space-y-6">
          <BiometricStrictnessSlider />
        </div>

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="text-sm text-[#6b6b70] hover:text-[#e8c547] transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </AppShell>
  );
}
