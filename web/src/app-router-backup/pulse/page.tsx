import { NationalPulseDashboard } from '@/components/pulse/NationalPulseDashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'National Pulse | PFF — Global Portal',
  description:
    'Live vitalization density, handshake pulses, and sovereign leaderboard. Born in Lagos. Built for the World.',
};

export default function PulsePage() {
  return (
    <main className="min-h-screen bg-obsidian-bg">
      <NationalPulseDashboard />
    </main>
  );
}
