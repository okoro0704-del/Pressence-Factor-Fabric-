import { DashboardContent } from '@/components/sovryn/DashboardContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | PFF × Sovryn — Presence-Gated DeFi',
  description:
    'My wealth is secured by my presence. DLLR balance, presence-gated Sovryn actions on Rootstock.',
};

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#0d0d0f]">
      <DashboardContent />
    </main>
  );
}
