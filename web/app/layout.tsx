import type { Metadata } from 'next';
import './globals.css';
import { HowToInstallTooltip } from '@/components/HowToInstallTooltip';

export const metadata: Metadata = {
  title: 'PFF — Vitalization Manifesto | Born in Lagos. Built for the World.',
  description:
    'The Vitalization Manifesto. Presence over passwords. Hardware-bound identity. Zero-knowledge handshakes.',
  openGraph: {
    title: 'PFF — Vitalization Manifesto',
    description: 'Born in Lagos. Built for the World. Presence over passwords.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#c9a227" />
      </head>
      <body className="bg-[#0d0d0f] text-[#f5f5f5] antialiased">
        {children}
        <HowToInstallTooltip />
      </body>
    </html>
  );
}
