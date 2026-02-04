'use client';

import { useState } from 'react';
import { executeGenesisReset } from '@/lib/strictBiometricMatching';

export function GenesisResetPanel() {
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{ success: boolean; message: string } | null>(null);
  const [confirmationCode, setConfirmationCode] = useState('');

  const RESET_CODE = 'GENESIS-RESET-2026';

  const handleGenesisReset = async () => {
    if (confirmationCode !== RESET_CODE) {
      setResetResult({
        success: false,
        message: 'Invalid confirmation code. Genesis Reset aborted.'
      });
      return;
    }

    setIsResetting(true);
    setResetResult(null);

    try {
      const result = await executeGenesisReset();
      setResetResult(result);
      
      if (result.success) {
        // Clear local confirmation code
        setConfirmationCode('');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    } catch (error) {
      console.error('Genesis Reset error:', error);
      setResetResult({
        success: false,
        message: 'Genesis Reset system error. Please try again.'
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div 
      className="rounded-2xl border p-8"
      style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(0, 0, 0, 0.6) 100%)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
        boxShadow: '0 0 60px rgba(239, 68, 68, 0.2)'
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="text-5xl">🔄</div>
        <div>
          <h2 className="text-2xl font-black" style={{ color: '#ef4444' }}>
            Genesis Reset Protocol
          </h2>
          <p className="text-sm mt-1" style={{ color: '#6b6b70' }}>
            Clear all verified sessions and force Fresh Master Scan
          </p>
        </div>
      </div>

      {/* Warning */}
      <div 
        className="rounded-lg border p-4 mb-6"
        style={{
          background: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)'
        }}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl">⚠️</div>
          <div>
            <p className="font-bold text-sm mb-2" style={{ color: '#ef4444' }}>
              CRITICAL ACTION - READ CAREFULLY
            </p>
            <ul className="text-xs space-y-1" style={{ color: '#a0a0a5' }}>
              <li>• All presence verification sessions will be cleared</li>
              <li>• All sentinel identities will be suspended</li>
              <li>• Every user must perform a Fresh Master Scan</li>
              <li>• Biometric signatures will be recalibrated</li>
              <li>• You will be logged out immediately</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirmation Input */}
      <div className="mb-6">
        <label className="block text-sm font-bold mb-2" style={{ color: '#D4AF37' }}>
          Enter Confirmation Code
        </label>
        <input
          type="text"
          value={confirmationCode}
          onChange={(e) => setConfirmationCode(e.target.value)}
          placeholder="GENESIS-RESET-2026"
          disabled={isResetting}
          className="w-full px-4 py-3 rounded-lg border font-mono text-sm"
          style={{
            background: '#0d0d0f',
            borderColor: 'rgba(212, 175, 55, 0.3)',
            color: '#D4AF37'
          }}
        />
        <p className="text-xs mt-2" style={{ color: '#6b6b70' }}>
          Type <span className="font-mono font-bold" style={{ color: '#ef4444' }}>GENESIS-RESET-2026</span> to confirm
        </p>
      </div>

      {/* Result Message */}
      {resetResult && (
        <div 
          className="rounded-lg border p-4 mb-6"
          style={{
            background: resetResult.success 
              ? 'rgba(34, 197, 94, 0.1)' 
              : 'rgba(239, 68, 68, 0.1)',
            borderColor: resetResult.success 
              ? 'rgba(34, 197, 94, 0.3)' 
              : 'rgba(239, 68, 68, 0.3)'
          }}
        >
          <p className="text-sm font-bold" style={{ 
            color: resetResult.success ? '#22c55e' : '#ef4444' 
          }}>
            {resetResult.message}
          </p>
          {resetResult.success && (
            <p className="text-xs mt-2" style={{ color: '#6b6b70' }}>
              Redirecting to login in 3 seconds...
            </p>
          )}
        </div>
      )}

      {/* Execute Button */}
      <button
        onClick={handleGenesisReset}
        disabled={isResetting || confirmationCode !== RESET_CODE}
        className="w-full px-8 py-4 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: confirmationCode === RESET_CODE 
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
            : 'linear-gradient(135deg, #6b6b70 0%, #4a4a4e 100%)',
          color: '#ffffff',
          boxShadow: confirmationCode === RESET_CODE 
            ? '0 0 30px rgba(239, 68, 68, 0.4)' 
            : 'none'
        }}
      >
        {isResetting ? 'Executing Genesis Reset...' : 'Execute Genesis Reset'}
      </button>

      {/* Info */}
      <div className="mt-6 text-center">
        <p className="text-xs" style={{ color: '#6b6b70' }}>
          This action is logged and cannot be undone
        </p>
      </div>
    </div>
  );
}

