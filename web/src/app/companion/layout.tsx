'use client';

import { AppShell } from '@/components/layout/AppShell';

export default function CompanionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
