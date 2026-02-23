'use client';

import { useEffect, useState } from 'react';
import {
  getGuardianRecoveryStatus,
  subscribeToGuardianRecoveryRequest,
} from '@/lib/multiDeviceVitalization';

interface GuardianRecoveryStatusProps {
  requestId: string;
  onApproved: () => void;
  onExpired: () => void;
  onDenied: () => void;
}

/**
 * GUARDIAN RECOVERY STATUS
 * Shows real-time approval progress for guardian recovery request
 */
export function GuardianRecoveryStatus({
  requestId,
  onApproved,
  onExpired,
  onDenied,
}: GuardianRecoveryStatusProps) {
  const [currentApprovals, setCurrentApprovals] = useState(0);
  const [requiredApprovals, setRequiredApprovals] = useState(3);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial status
    const loadStatus = async () => {
      const status = await getGuardianRecoveryStatus(requestId);
      if (status) {
        setCurrentApprovals(status.current_approvals);
        setRequiredApprovals(status.required_approvals);
        setExpiresAt(new Date(status.expires_at));
        setLoading(false);
      }
    };

    loadStatus();

    // Subscribe to status changes
    const unsubscribe = subscribeToGuardianRecoveryRequest(
      requestId,
      (status, approvals) => {
        setCurrentApprovals(approvals);

        if (status === 'APPROVED') {
          onApproved();
        } else if (status === 'EXPIRED') {
          onExpired();
        } else if (status === 'DENIED') {
          onDenied();
        }
      }
    );

    return () => unsubscribe();
  }, [requestId, onApproved, onExpired, onDenied]);

  // Update countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('EXPIRED');
        clearInterval(interval);
        onExpired();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/95 backdrop-blur-md">
        <div className="text-[#D4AF37] text-xl font-mono">Loading recovery status...</div>
      </div>
    );
  }

  const progress = (currentApprovals / requiredApprovals) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/95 backdrop-blur-md">
      <div className="w-full max-w-2xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-6xl mb-4 animate-pulse">🔐</div>
          <h1 className="text-3xl font-bold text-[#D4AF37] font-mono">
            GUARDIAN RECOVERY IN PROGRESS
          </h1>
          <p className="text-[#C9A227] font-mono text-lg">
            Waiting for Guardian Approvals
          </p>
        </div>

        {/* Request ID */}
        <div className="p-4 bg-[#D4AF37]/10 border-2 border-[#D4AF37] rounded-lg">
          <div className="text-center space-y-1">
            <p className="text-sm text-[#6b6b70] font-mono">RECOVERY REQUEST ID</p>
            <p className="text-lg text-[#D4AF37] font-mono font-bold break-all">{requestId}</p>
            <p className="text-xs text-[#6b6b70] font-mono">Share this ID with your Guardians</p>
          </div>
        </div>

        {/* Approval Progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#C9A227] font-mono">APPROVAL PROGRESS</h3>
            <div className="text-2xl font-bold text-[#D4AF37] font-mono">
              {currentApprovals}/{requiredApprovals}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-8 bg-[#050505] border-2 border-[#D4AF37]/30 rounded-lg overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#FFD700] transition-all duration-500 flex items-center justify-center"
              style={{ width: `${progress}%` }}
            >
              {progress > 0 && (
                <span className="text-[#050505] font-bold font-mono text-sm">
                  {Math.round(progress)}%
                </span>
              )}
            </div>
          </div>

          {/* Guardian Checkboxes */}
          <div className="flex gap-4 justify-center">
            {[...Array(requiredApprovals)].map((_, index) => (
              <div
                key={index}
                className={`
                  w-20 h-20 rounded-lg border-2 flex items-center justify-center text-3xl
                  ${
                    index < currentApprovals
                      ? 'border-[#22c55e] bg-[#22c55e]/20'
                      : 'border-[#6b6b70] bg-[#6b6b70]/10'
                  }
                  transition-all duration-300
                `}
              >
                {index < currentApprovals ? '✅' : '⏳'}
              </div>
            ))}
          </div>
        </div>

        {/* Time Remaining */}
        <div className="p-6 bg-[#050505]/50 border-2 border-[#C9A227]/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-[#6b6b70] font-mono">Time Remaining:</span>
            <span
              className={`text-2xl font-bold font-mono ${
                timeRemaining === 'EXPIRED' ? 'text-[#ef4444]' : 'text-[#D4AF37]'
              }`}
            >
              {timeRemaining}
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-[#6b6b70] font-mono space-y-1">
          <p>Your Guardians must complete a 4-Layer Biometric Scan to approve.</p>
          <p>Once {requiredApprovals} Guardians approve, your new device will be authorized.</p>
        </div>
      </div>
    </div>
  );
}

