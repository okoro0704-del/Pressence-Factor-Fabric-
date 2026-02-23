'use client';

import { useState } from 'react';
import { runMasterHandshake } from '@/lib/sovryn';
import { BiometricScanningHUD } from '@/components/BiometricScanningHUD';

export function LaunchSovereignVaultButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLaunch = async () => {
    setLoading(true);
    setError(null);
    const result = await runMasterHandshake();
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? 'Master handshake failed.');
      return;
    }
    /* redirect happens in runMasterHandshake */
  };

  return (
    <>
      <BiometricScanningHUD active={loading} />
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleLaunch}
          disabled={loading}
          className="w-full rounded-xl px-6 py-4 text-base font-bold disabled:opacity-60 transition-all"
          style={{
            background: 'linear-gradient(135deg, #c9a227 0%, #e8c547 100%)',
            color: '#0d0d0f',
            boxShadow: '0 0 24px rgba(201, 162, 39, 0.3)',
          }}
        >
          {loading ? 'Verifying presence…' : 'Launch Sovereign Vault'}
        </button>
        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}
        <p className="text-xs text-[#6b6b70] text-center">
          Triggers biometric scan → Presence_Verified signal → redirect to Sovryn Wealth Dashboard.
        </p>
      </div>
    </>
  );
}
