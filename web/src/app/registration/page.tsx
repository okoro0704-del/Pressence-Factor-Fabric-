'use client';

import { RegistrationHub } from '@/components/registration/RegistrationHub';
import { ProtectedRoute } from '@/components/dashboard/ProtectedRoute';

export default function RegistrationPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#050505]">
        <RegistrationHub />
      </main>
    </ProtectedRoute>
  );
}

