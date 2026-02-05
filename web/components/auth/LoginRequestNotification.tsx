'use client';

import { useState } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import type { LoginRequestRow } from '@/lib/loginRequest';
import { approveLoginRequest, denyLoginRequest } from '@/lib/loginRequest';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

interface LoginRequestNotificationProps {
  request: LoginRequestRow;
  onApprove: () => void;
  onDeny: () => void;
  onClose: () => void;
}

/**
 * Phone: "Isreal, are you trying to log in on a new Computer?" — Approve / Deny.
 */
export function LoginRequestNotification({
  request,
  onApprove,
  onDeny,
  onClose,
}: LoginRequestNotificationProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const displayName = request.requested_display_name?.trim() || 'Someone';

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const res = await approveLoginRequest(request.id);
      if (res.ok) {
        onApprove();
        onClose();
      }
    } catch (e) {
      console.error('Approve failed', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeny = async () => {
    setIsProcessing(true);
    try {
      await denyLoginRequest(request.id);
      onDeny();
      onClose();
    } catch (e) {
      console.error('Deny failed', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" aria-hidden />
      <div
        className="relative max-w-md w-full rounded-2xl border-2 border-[#D4AF37] p-8 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(10, 10, 10, 0.98) 100%)',
          boxShadow: '0 0 60px rgba(212, 175, 55, 0.3)',
        }}
      >
        <div className="text-center mb-6">
          <span className="text-5xl" aria-hidden>💻</span>
        </div>
        <h2
          className={`text-xl font-bold text-center mb-4 ${jetbrains.className}`}
          style={{ color: '#e8c547' }}
        >
          Log in on new device?
        </h2>
        <p className="text-center text-[#e0e0e0] text-sm mb-6">
          <span className="font-semibold text-[#D4AF37]">{displayName}</span>, are you trying to log in on a new Computer?
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleApprove}
            disabled={isProcessing}
            className="w-full py-3 rounded-xl bg-[#D4AF37] text-black font-bold text-sm uppercase tracking-wider hover:bg-[#c9a227] disabled:opacity-60 transition-colors"
          >
            {isProcessing ? '…' : 'Approve'}
          </button>
          <button
            type="button"
            onClick={handleDeny}
            disabled={isProcessing}
            className="w-full py-3 rounded-xl border-2 border-[#4a4a4e] text-[#a0a0a5] font-semibold text-sm hover:bg-[#2a2a2e] disabled:opacity-60 transition-colors"
          >
            Deny
          </button>
        </div>
      </div>
    </div>
  );
}
