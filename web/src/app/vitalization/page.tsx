import { VitalizationPageClient } from './VitalizationPageClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vitalization | PFF — VIDA CAP Minting',
  description: 'Prove your presence. Mint your VIDA CAP with a 50/50 split. Born in Lagos. Built for the World.',
};

export default function VitalizationPage() {
  return <VitalizationPageClient />;
}
