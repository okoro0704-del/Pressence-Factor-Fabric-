'use client';

import { MasterKeyRecovery } from '@/components/auth/MasterKeyRecovery';
import Link from 'next/link';

export default function VitalizationMasterKeyPage() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-[#D4AF37] text-center">
          ANCHOR 2/4 — Master Key
        </p>
        <MasterKeyRecovery>
          <div className="rounded-2xl border-2 border-[#D4AF37]/50 bg-[#0d0d0f] p-8 text-center">
            <p className="text-[#e8c547] font-bold mb-2">Face hash verified</p>
            <p className="text-[#a0a0a5] text-sm mb-6">
              Complete your Master Key (recovery seed) in the main vitalization flow to secure your vault.
            </p>
            <Link
              href="/"
              className="inline-block w-full py-3 rounded-xl bg-[#c9a227] text-black font-bold uppercase tracking-wider hover:opacity-95 text-center"
            >
              Continue to Gate
            </Link>
          </div>
        </MasterKeyRecovery>
      </div>
    </div>
  );
}
