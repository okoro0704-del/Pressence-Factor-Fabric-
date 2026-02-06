import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manifesto of Truth | PFF — Sovereign Education & Context',
  description:
    'Glossary: PFF, VITALIE, ATE, VIDA CAP, ALT. The Evolution of the Digital Era. Proof of Personhood. Born in Lagos. Built for the World.',
};

export default function EducationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
