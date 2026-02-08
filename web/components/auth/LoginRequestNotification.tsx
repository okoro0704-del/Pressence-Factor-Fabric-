'use client';

import { useState } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import type { LoginRequestRow } from '@/lib/loginRequest';
import {
  approveLoginRequestWithDeviceToken,
  denyLoginRequest,
} from '@/lib/loginRequest';
import { getCompositeDeviceFingerprint } from '@/lib/biometricAuth';
import { getVitalizationAnchor } from '@/lib/vitalizationAnchor';
import { getDeviceAnchorToken } from '@/lib/sovereignSSO';
import { sendHandshakePayload } from '@/lib/sovereignDeviceHandshake';
import { logUnauthorizedAccessBlocked } from '@/lib/remoteAuthAudit';
import { RemoteAuthDNAModal } from './RemoteAuthDNAModal';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

interface LoginRequestNotificationProps {
  request: LoginRequestRow;
  onApprove: () => void;
  onDeny: () => void;
  onClose: () => void;
}

/**
 * Phone: Sentinel push — "Access requested from [Laptop Name]. Verify DNA to Grant."
 * Primary action opens 2s Face/Palm scanner; 95%+ match approves and sends handshake to laptop.
 * Deny or scan fail → audit log "Unauthorized Access Blocked."
 */
export function LoginRequestNotification({
  request,
  onApprove,
  onDeny,
  onClose,
}: LoginRequestNotificationProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDNAModal, setShowDNAModal] = useState(false);

  const deviceInfo = request.device_info as { laptop_device_name?: string } | null;
  const laptopName = deviceInfo?.laptop_device_name?.trim() || 'Laptop';
  const phone = request.phone_number?.trim() || '';

  const denyAndAudit = async (reason: 'denied' | 'scan_failed' = 'denied') => {
    try {
      await denyLoginRequest(request.id);
      await logUnauthorizedAccessBlocked({
        phone_number: phone,
        request_id: request.id,
        requesting_device_name: laptopName,
        reason,
      });
    } catch (e) {
      console.error('Deny/audit failed', e);
    }
    onDeny();
    onClose();
  };

  const handleVerifyDNAGrant = () => {
    setShowDNAModal(true);
  };

  const handleDNASuccess = async () => {
    setIsProcessing(true);
    try {
      const deviceId = await getCompositeDeviceFingerprint();
      const fingerprintToken =
        typeof crypto !== 'undefined' && crypto.getRandomValues
          ? btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
              .replace(/\+/g, '-')
              .replace(/\//g, '_')
              .replace(/=+$/, '')
          : `bio_${Date.now()}`;

      const res = await approveLoginRequestWithDeviceToken(
        request.id,
        deviceId,
        fingerprintToken
      );
      if (res.ok) {
        const anchor = await getVitalizationAnchor();
        const deviceAnchorToken = getDeviceAnchorToken();
        if (anchor.citizenHash) {
          await sendHandshakePayload(request.id, anchor.citizenHash, deviceAnchorToken);
        }
        onApprove();
        onClose();
      }
    } catch (e) {
      console.error('Approve/handshake failed', e);
      await denyAndAudit('scan_failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDNAFail = () => {
    setShowDNAModal(false);
    denyAndAudit('scan_failed');
  };

  const handleDeny = async () => {
    setIsProcessing(true);
    await denyAndAudit('denied');
    setIsProcessing(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" aria-hidden />
        <div
          className="relative max-w-md w-full rounded-2xl border-2 border-[#D4AF37] p-8 shadow-2xl"
          style={{
            background:
              'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(10, 10, 10, 0.98) 100%)',
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
            Authorization Requested on Master Device
          </h2>
          <p className="text-center text-[#e0e0e0] text-sm mb-6">
            Access requested from <span className="font-semibold text-[#D4AF37]">{laptopName}</span>.
            Verify DNA to Grant.
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleVerifyDNAGrant}
              disabled={isProcessing}
              className="w-full py-3 rounded-xl bg-[#D4AF37] text-black font-bold text-sm uppercase tracking-wider hover:bg-[#c9a227] disabled:opacity-60 transition-colors"
            >
              {isProcessing ? '…' : 'Verify DNA to Grant'}
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

      {showDNAModal && (
        <RemoteAuthDNAModal
          isOpen={showDNAModal}
          onClose={() => setShowDNAModal(false)}
          phone={phone}
          onSuccess={handleDNASuccess}
          onFail={handleDNAFail}
        />
      )}
    </>
  );
}
