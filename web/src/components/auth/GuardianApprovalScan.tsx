'use client';

import { useState } from 'react';
import { resolveSovereignByPresence, AuthStatus, type AuthLayer } from '@/lib/biometricAuth';
import { submitGuardianApproval } from '@/lib/multiDeviceVitalization';
import type { GlobalIdentity } from '@/lib/phoneIdentity';

interface GuardianApprovalScanProps {
  recoveryRequestId: string;
  guardianPhoneNumber: string;
  guardianFullName: string;
  onApprovalComplete: () => void;
  onCancel: () => void;
}

/**
 * GUARDIAN APPROVAL SCAN
 * UI for guardians to scan their faces and approve recovery request
 */
export function GuardianApprovalScan({
  recoveryRequestId,
  guardianPhoneNumber,
  guardianFullName,
  onApprovalComplete,
  onCancel,
}: GuardianApprovalScanProps) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthStatus.IDLE);
  const [currentLayer, setCurrentLayer] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleStartScan = async () => {
    setAuthStatus(AuthStatus.SCANNING);
    setError(null);

    try {
      // Perform 4-layer biometric authentication
      const authResult = await resolveSovereignByPresence(
        guardianPhoneNumber,
        (layer: AuthLayer | null, status: AuthStatus) => {
          setCurrentLayer(layer != null ? 1 : 0);
          setAuthStatus(status);
        }
      );

      if (!authResult.success || !authResult.identity) {
        setError('Biometric authentication failed. Please try again.');
        setAuthStatus(AuthStatus.FAILED);
        return;
      }

      // Submit guardian approval
      setSubmitting(true);

      // Get IP address (simplified - in production use a proper IP detection service)
      const ipAddress = 'unknown';

      // Get geolocation (simplified - in production use browser Geolocation API)
      const geolocation = {
        city: 'Lagos',
        country: 'Nigeria',
        latitude: 6.5244,
        longitude: 3.3792,
      };

      const identity = authResult.identity as GlobalIdentity & { biometricHash?: string; variance?: number };
      const ext = identity as { biometricHash?: string; variance?: number };
      await submitGuardianApproval(
        recoveryRequestId,
        guardianPhoneNumber,
        guardianFullName,
        ext.biometricHash ?? '',
        ext.variance ?? 0,
        ipAddress,
        geolocation
      );

      console.log('✅ Guardian approval submitted successfully');
      setAuthStatus(AuthStatus.BANKING_UNLOCKED);
      
      // Wait 2 seconds to show success message, then complete
      setTimeout(() => {
        onApprovalComplete();
      }, 2000);
    } catch (err) {
      console.error('❌ Failed to submit guardian approval:', err);
      setError('Failed to submit approval. Please try again.');
      setAuthStatus(AuthStatus.FAILED);
      setSubmitting(false);
    }
  };

  const getStatusMessage = () => {
    switch (authStatus) {
      case AuthStatus.IDLE:
        return 'Ready to scan';
      case AuthStatus.SCANNING:
        return `Scanning Layer ${currentLayer}/4...`;
      case AuthStatus.IDENTIFIED:
        return 'Identity verified';
      case AuthStatus.BANKING_UNLOCKED:
        return 'Approval submitted successfully!';
      case AuthStatus.FAILED:
        return 'Authentication failed';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (authStatus) {
      case AuthStatus.BANKING_UNLOCKED:
        return 'text-[#22c55e]';
      case AuthStatus.FAILED:
        return 'text-[#ef4444]';
      case AuthStatus.SCANNING:
        return 'text-[#FFD700]';
      default:
        return 'text-[#D4AF37]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/95 backdrop-blur-md">
      <div className="w-full max-w-2xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-6xl mb-4">🛡️</div>
          <h1 className="text-3xl font-bold text-[#D4AF37] font-mono">
            GUARDIAN APPROVAL
          </h1>
          <p className="text-[#C9A227] font-mono text-lg">
            Verify Your Identity to Approve
          </p>
        </div>

        {/* Guardian Info */}
        <div className="p-6 bg-[#D4AF37]/10 border-2 border-[#D4AF37] rounded-lg space-y-3">
          <h3 className="text-lg font-bold text-[#D4AF37] font-mono">GUARDIAN INFORMATION</h3>
          <div className="space-y-2 text-sm font-mono">
            <div>
              <span className="text-[#6b6b70]">Name:</span>{' '}
              <span className="text-[#D4AF37] font-bold">{guardianFullName}</span>
            </div>
            <div>
              <span className="text-[#6b6b70]">Phone:</span>{' '}
              <span className="text-[#D4AF37] font-bold">{guardianPhoneNumber}</span>
            </div>
          </div>
        </div>

        {/* Recovery Request ID */}
        <div className="p-4 bg-[#050505]/50 border-2 border-[#C9A227]/30 rounded-lg">
          <div className="text-center space-y-1">
            <p className="text-sm text-[#6b6b70] font-mono">RECOVERY REQUEST ID</p>
            <p className="text-sm text-[#D4AF37] font-mono break-all">{recoveryRequestId}</p>
          </div>
        </div>

        {/* Status Message */}
        <div className={`text-center text-xl font-bold font-mono ${getStatusColor()}`}>
          {getStatusMessage()}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-[#ef4444]/10 border-2 border-[#ef4444] rounded-lg">
            <p className="text-[#ef4444] font-mono text-sm text-center">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        {authStatus === AuthStatus.IDLE && (
          <div className="flex gap-4">
            <button
              onClick={handleStartScan}
              className="flex-1 px-6 py-4 bg-[#D4AF37] text-[#050505] font-bold font-mono text-lg rounded-lg hover:bg-[#FFD700] transition-all shadow-[0_0_30px_rgba(212,175,55,0.4)]"
            >
              START 4-LAYER SCAN
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-4 bg-[#6b6b70] text-white font-bold font-mono text-lg rounded-lg hover:bg-[#6b6b70]/80 transition-all"
            >
              CANCEL
            </button>
          </div>
        )}

        {authStatus === AuthStatus.SCANNING && (
          <div className="text-center">
            <div className="inline-block animate-spin text-6xl">⏳</div>
          </div>
        )}

        {authStatus === AuthStatus.BANKING_UNLOCKED && (
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-[#22c55e] font-mono text-lg">
              Your approval has been recorded!
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center text-sm text-[#6b6b70] font-mono space-y-1">
          <p>Complete all 4 layers of biometric authentication to approve this recovery request.</p>
          <p>Your face scan will be verified against your stored biometric signature.</p>
        </div>
      </div>
    </div>
  );
}

