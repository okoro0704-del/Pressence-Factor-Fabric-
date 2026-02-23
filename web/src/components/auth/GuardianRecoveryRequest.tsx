'use client';

import { useState } from 'react';
import {
  getCurrentDeviceInfo,
  createGuardianRecoveryRequest,
} from '@/lib/multiDeviceVitalization';

interface GuardianRecoveryRequestProps {
  phoneNumber: string;
  fullName: string;
  oldPrimaryDeviceId: string | null;
  onRecoveryRequestCreated: (requestId: string) => void;
  onCancel: () => void;
}

/**
 * GUARDIAN RECOVERY REQUEST
 * UI for creating a guardian recovery request when primary device is lost
 */
export function GuardianRecoveryRequest({
  phoneNumber,
  fullName,
  oldPrimaryDeviceId,
  onRecoveryRequestCreated,
  onCancel,
}: GuardianRecoveryRequestProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deviceInfo = getCurrentDeviceInfo();

  const handleCreateRequest = async () => {
    setLoading(true);
    setError(null);

    try {
      const requestId = await createGuardianRecoveryRequest(
        phoneNumber,
        oldPrimaryDeviceId,
        deviceInfo
      );

      console.log('✅ Guardian recovery request created:', requestId);
      onRecoveryRequestCreated(requestId);
    } catch (err) {
      console.error('❌ Failed to create guardian recovery request:', err);
      setError('Failed to create recovery request. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/95 backdrop-blur-md">
      <div className="w-full max-w-2xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold text-[#D4AF37] font-mono">
            GUARDIAN RECOVERY
          </h1>
          <p className="text-[#C9A227] font-mono text-lg">
            Lost Your Primary Sentinel Device?
          </p>
        </div>

        {/* Info Box */}
        <div className="p-6 bg-[#D4AF37]/10 border-2 border-[#D4AF37] rounded-lg space-y-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1 space-y-2 text-sm font-mono text-[#D4AF37]">
              <p className="font-bold">SECURITY PROTOCOL ACTIVATED</p>
              <p>
                To authorize this new device as your PRIMARY SENTINEL, you must request approval
                from 3 of your registered Guardians (Dependents or Others).
              </p>
            </div>
          </div>

          <div className="border-t border-[#D4AF37]/30 pt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-mono">
              <span className="text-[#6b6b70]">Required Approvals:</span>
              <span className="text-[#D4AF37] font-bold">3 Guardians</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-mono">
              <span className="text-[#6b6b70]">Expiry Time:</span>
              <span className="text-[#D4AF37] font-bold">24 Hours</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-mono">
              <span className="text-[#6b6b70]">Verification Method:</span>
              <span className="text-[#D4AF37] font-bold">4-Layer Biometric Scan</span>
            </div>
          </div>
        </div>

        {/* New Device Info */}
        <div className="p-6 bg-[#050505]/50 border-2 border-[#C9A227]/30 rounded-lg space-y-3">
          <h3 className="text-lg font-bold text-[#C9A227] font-mono">NEW DEVICE INFORMATION</h3>
          <div className="grid grid-cols-2 gap-4 text-sm font-mono">
            <div>
              <span className="text-[#6b6b70]">Device Type:</span>{' '}
              <span className="text-[#D4AF37]">{deviceInfo.deviceType}</span>
            </div>
            <div>
              <span className="text-[#6b6b70]">Device Name:</span>{' '}
              <span className="text-[#D4AF37]">{deviceInfo.deviceName}</span>
            </div>
            <div>
              <span className="text-[#6b6b70]">Platform:</span>{' '}
              <span className="text-[#D4AF37]">{deviceInfo.platform}</span>
            </div>
            <div>
              <span className="text-[#6b6b70]">Screen:</span>{' '}
              <span className="text-[#D4AF37]">{deviceInfo.screenResolution}</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-[#ef4444]/10 border-2 border-[#ef4444] rounded-lg">
            <p className="text-[#ef4444] font-mono text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleCreateRequest}
            disabled={loading}
            className="flex-1 px-6 py-4 bg-[#D4AF37] text-[#050505] font-bold font-mono text-lg rounded-lg hover:bg-[#FFD700] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(212,175,55,0.4)]"
          >
            {loading ? 'CREATING REQUEST...' : 'REQUEST GUARDIAN RECOVERY'}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-4 bg-[#6b6b70] text-white font-bold font-mono text-lg rounded-lg hover:bg-[#6b6b70]/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            CANCEL
          </button>
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-[#6b6b70] font-mono space-y-1">
          <p>Once created, share the Recovery Request ID with your 3 Guardians.</p>
          <p>They must scan their faces to approve your new device.</p>
        </div>
      </div>
    </div>
  );
}

