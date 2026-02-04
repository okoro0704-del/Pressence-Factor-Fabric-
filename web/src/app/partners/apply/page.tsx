'use client';

import { PartnerApplication } from '@/components/dashboard/PartnerApplication';

const BG = '#0d0d0f';
const GOLD_DIM = 'rgba(212, 175, 55, 0.6)';

/**
 * Partner Application Portal — companies applying to join the PFF Network.
 * Multi-step form: Company Name, Industry, Integration Intent; consent for 5% Royalty and Sovereign Privacy.
 */
export default function PartnersApplyPage() {
  return (
    <main className="min-h-screen py-12 px-4" style={{ background: BG, color: GOLD_DIM }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2 text-center" style={{ color: '#D4AF37' }}>
          Partner Application Portal
        </h1>
        <p className="text-sm text-center mb-8 opacity-80">
          Apply to join the PFF Network. Complete the form and accept the Foundation terms.
        </p>
        <PartnerApplication />
      </div>
    </main>
  );
}
