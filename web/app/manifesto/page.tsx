import { ManifestoContent } from '@/components/ManifestoContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vitalization Manifesto | PFF — Presence Factor Fabric',
  description:
    'Presence over passwords. Phone, Finger, Face. Born in Lagos. Built for the World.',
  openGraph: {
    title: 'Vitalization Manifesto | PFF',
    description: 'Born in Lagos. Built for the World. The Vitalization Manifesto.',
  },
};

export default function ManifestoPage() {
  return <ManifestoContent />;
}
