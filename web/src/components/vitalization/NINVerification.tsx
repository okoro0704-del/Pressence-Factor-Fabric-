'use client';

import { useState } from 'react';
import { Shield, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';

const GOLD = '#D4AF37';
const GRAY = '#6b6b70';

interface NINVerificationProps {
  onVerificationComplete: () => void;
}

/**
 * NIN Verification Component
 * 
 * Step A: Request 11-digit NIN
 * Step B: Sentinel verifies against NIMC/FIRS 2026 database
 * Step C: On success, trigger Sovereign Strike (11 VIDA mint: 5-5-1 split)
 * Step D: Unhide wallet balance and display first 5 VIDA
 */
export function NINVerification({ onVerificationComplete }: NINVerificationProps) {
  const [nin, setNin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleNINChange = (value: string) => {
    // Only allow digits, max 11 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    setNin(cleaned);
    setError(null);
  };

  const handleVerify = async () => {
    if (nin.length !== 11) {
      setError('NIN must be exactly 11 digits');
      return;
    }

    const phone = getIdentityAnchorPhone();
    if (!phone) {
      setError('Identity anchor required. Please complete phone login first.');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      // Call Sentinel API for NIN verification
      const response = await fetch('/api/sentinel/verify-nin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nin, phone }),
      });

      const data = await response.json();

      if (!response.ok || !data.verified) {
        setError(data.error || 'NIN verification failed. Please check your NIN and try again.');
        setVerifying(false);
        return;
      }

      // Verification successful!
      setSuccess(true);
      setVerifying(false);

      // Wait 2 seconds to show success message, then trigger completion
      setTimeout(() => {
        onVerificationComplete();
      }, 2000);
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      setVerifying(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center animate-pulse"
              style={{ background: `rgba(212, 175, 55, 0.2)` }}
            >
              <CheckCircle2 className="w-12 h-12" style={{ color: GOLD }} />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: GOLD }}>
            Sovereign Strike Triggered!
          </h2>
          <p className="text-sm" style={{ color: GRAY }}>
            Your identity has been verified. 11 VIDA CAP minted (5 Citizen, 5 Treasury, 1 Foundation).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: `rgba(212, 175, 55, 0.2)` }}
            >
              <Shield className="w-8 h-8" style={{ color: GOLD }} />
            </div>
          </div>
          <h1 className="text-xl font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
            Identity Vitalization
          </h1>
          <p className="text-sm" style={{ color: GRAY }}>
            Verify your National Identity Number (NIN) to unlock your Sovereign Wallet
          </p>
        </div>

        {/* NIN Input */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: GRAY }}>
            National Identity Number (NIN)
          </label>
          <input
            type="text"
            value={nin}
            onChange={(e) => handleNINChange(e.target.value)}
            placeholder="Enter 11-digit NIN"
            disabled={verifying}
            className="w-full px-4 py-3 rounded-lg bg-[#16161a] border border-[#2a2a2e] text-white text-center text-lg font-mono tracking-widest focus:outline-none focus:border-[#D4AF37] transition-colors disabled:opacity-50"
            maxLength={11}
          />
          <p className="text-xs mt-2 text-center" style={{ color: GRAY }}>
            {nin.length}/11 digits
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 rounded-lg border border-red-500/50 bg-red-500/10 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={nin.length !== 11 || verifying}
          className="w-full py-3 rounded-lg font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            background: nin.length === 11 && !verifying ? GOLD : '#2a2a2e',
            color: nin.length === 11 && !verifying ? '#050505' : GRAY,
          }}
        >
          {verifying ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Verifying with Sentinel...
            </>
          ) : (
            'Verify Identity'
          )}
        </button>
      </div>
    </div>
  );
}

