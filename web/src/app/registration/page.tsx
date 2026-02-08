'use client';

import { RegistrationHub } from '@/components/registration/RegistrationHub';
import { ProtectedRoute } from '@/components/dashboard/ProtectedRoute';
import { SovereignGuardRedirect } from '@/components/dashboard/SovereignGuardRedirect';

export default function RegistrationPage() {
  return (
    <SovereignGuardRedirect>
      <ProtectedRoute>
        <main className="min-h-screen bg-[#050505]">
          <RegistrationHub />
        </main>
      </ProtectedRoute>
    </SovereignGuardRedirect>
  );
}

