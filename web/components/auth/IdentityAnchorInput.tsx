'use client';

import { useState } from 'react';
import { fetchIdentityAnchor, type BiometricIdentityRecord } from '@/lib/universalIdentityComparison';

/** KILL AUTO-VERIFY: Anchor verification only transitions to biometric scan step. Actual verification happens after real-time hardware scan. */
export interface AnchorVerifiedPayload {
  phoneNumber: string;
  fullName: string;
  /** Used for Elder & Minor Exemption: skip Vocal Resonance when age < 18 or > 65 */
  identity?: BiometricIdentityRecord;
}

interface IdentityAnchorInputProps {
  /** Called when anchor is locked. Does NOT mean verified — verification occurs only after hardware scan. */
  onAnchorVerified: (payload: AnchorVerifiedPayload) => void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
}

export function IdentityAnchorInput({ 
  onAnchorVerified, 
  onCancel,
  title = "Identity Anchor Required",
  subtitle = "Enter your phone number to proceed to hardware biometric scan. Verification occurs only after the scan."
}: IdentityAnchorInputProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyAnchor = async () => {
    setError('');

    // Validate phone number format (E.164)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError('Invalid phone number format. Use E.164 format (e.g., +2348012345678)');
      return;
    }

    setIsVerifying(true);

    try {
      // Fetch identity anchor from database
      const result = await fetchIdentityAnchor(phoneNumber);

      if (!result.success || !result.identity) {
        setError(result.error || 'Identity not found. Please register first.');
        setIsVerifying(false);
        return;
      }

      // KILL AUTO-VERIFY: Only transition to biometric scan step; do NOT mark as verified
      onAnchorVerified({
        phoneNumber,
        fullName: result.identity.full_name,
        identity: result.identity,
      });
    } catch (err) {
      console.error('Identity anchor verification error:', err);
      setError('System error. Please try again.');
      setIsVerifying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && phoneNumber && !isVerifying) {
      handleVerifyAnchor();
    }
  };

  return (
    <div 
      className="rounded-2xl border p-8"
      style={{
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%)',
        borderColor: 'rgba(212, 175, 55, 0.3)',
        boxShadow: '0 0 60px rgba(212, 175, 55, 0.2)'
      }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🔗</div>
        <h2 className="text-3xl font-black mb-2" style={{ color: '#D4AF37' }}>
          {title}
        </h2>
        <p className="text-sm" style={{ color: '#6b6b70' }}>
          {subtitle}
        </p>
      </div>

      {/* Info Box */}
      <div 
        className="rounded-lg border p-4 mb-6"
        style={{
          background: 'rgba(212, 175, 55, 0.05)',
          borderColor: 'rgba(212, 175, 55, 0.2)'
        }}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl">ℹ️</div>
          <div>
            <p className="text-xs font-bold mb-2" style={{ color: '#D4AF37' }}>
              Universal Security Policy
            </p>
            <ul className="text-xs space-y-1" style={{ color: '#a0a0a5' }}>
              <li>• Identity anchor establishes 1-to-1 comparison</li>
              <li>• Biometric scan will ONLY match YOUR specific hash</li>
              <li>• 0.5% variance threshold (unique even in identical twins)</li>
              <li>• No generalized matching - must be YOU</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Phone Number Input */}
      <div className="mb-6">
        <label className="block text-sm font-bold mb-2" style={{ color: '#D4AF37' }}>
          Phone Number (E.164 Format)
        </label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="+2348012345678"
          disabled={isVerifying}
          className="w-full px-4 py-3 rounded-lg border font-mono text-lg"
          style={{
            background: '#0d0d0f',
            borderColor: error ? '#ef4444' : 'rgba(212, 175, 55, 0.3)',
            color: '#D4AF37'
          }}
        />
        <p className="text-xs mt-2" style={{ color: '#6b6b70' }}>
          Example: +234 (Nigeria), +1 (USA), +44 (UK)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div 
          className="rounded-lg border p-3 mb-6"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)'
          }}
        >
          <p className="text-sm font-bold" style={{ color: '#ef4444' }}>
            {error}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isVerifying}
            className="flex-1 px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #6b6b70 0%, #4a4a4e 100%)',
              color: '#ffffff'
            }}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleVerifyAnchor}
          disabled={!phoneNumber || isVerifying}
          className="flex-1 px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: phoneNumber && !isVerifying
              ? 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)'
              : 'linear-gradient(135deg, #6b6b70 0%, #4a4a4e 100%)',
            color: phoneNumber && !isVerifying ? '#0d0d0f' : '#ffffff',
            boxShadow: phoneNumber && !isVerifying
              ? '0 0 30px rgba(212, 175, 55, 0.4)'
              : 'none'
          }}
        >
          {isVerifying ? 'Verifying Identity Anchor...' : 'Continue to Biometric Scan'}
        </button>
      </div>
    </div>
  );
}

