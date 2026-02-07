'use client';

import { useEffect, useRef, useState } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import QRCode from 'qrcode';
import { subscribeToLoginRequest, completeLoginBridge } from '@/lib/loginRequest';
import { useGlobalPresenceGateway } from '@/contexts/GlobalPresenceGateway';
import { TripleLockSealAnimation } from './TripleLockSealAnimation';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });
const GOLD = '#D4AF37';

export interface LoginQRDisplayProps {
  requestId: string;
  onDenied: () => void;
  onError: (message: string) => void;
}

/**
 * Laptop: shows Session QR code for Link Device. Phone scans → sends Device ID + device-signed token →
 * Supabase Realtime → this component runs Triple Lock animation then unlocks Dashboard.
 * Stores laptop as Trusted Device in completeLoginBridge.
 */
export function LoginQRDisplay({ requestId, onDenied, onError }: LoginQRDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showSeal, setShowSeal] = useState(false);
  const { setPresenceVerified } = useGlobalPresenceGateway();
  const doneRef = useRef(false);

  // Generate QR payload: open app on phone to /link-device?requestId=xxx
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/link-device?requestId=${encodeURIComponent(requestId)}`;
    QRCode.toDataURL(url, { width: 260, margin: 2 }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [requestId]);

  useEffect(() => {
    if (doneRef.current) return;
    const unsubscribe = subscribeToLoginRequest(requestId, (status) => {
      if (doneRef.current) return;
      doneRef.current = true;
      if (status === 'DENIED') {
        onDenied();
        return;
      }
      setShowSeal(true);
    });
    return () => unsubscribe();
  }, [requestId, onDenied]);

  const handleSealComplete = async () => {
    const result = await completeLoginBridge(requestId);
    if (result.ok) {
      setPresenceVerified(true);
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
    } else {
      onError(result.error ?? 'Login failed');
    }
  };

  if (showSeal) {
    return <TripleLockSealAnimation onComplete={handleSealComplete} />;
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.3) 0%, rgba(5, 5, 5, 0) 70%)' }} />
      <div className="relative max-w-xl w-full">
        <div className="text-center mb-6">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto border-2 mb-4" style={{ borderColor: GOLD, background: 'rgba(212,175,55,0.1)' }}>
            <span className="text-4xl" aria-hidden>📱</span>
          </div>
          <h1 className={`text-2xl font-black uppercase tracking-wider mb-2 ${jetbrains.className}`} style={{ color: GOLD }}>
            Scan with your phone
          </h1>
          <p className="text-sm text-[#a0a0a5]">
            Open PFF on your phone → Link Device → Scan this QR. You’ll be logged in instantly.
          </p>
        </div>
        <div
          className="rounded-2xl border-2 p-8 flex flex-col items-center"
          style={{ background: 'rgba(212,175,55,0.05)', borderColor: GOLD, boxShadow: `0 0 50px ${GOLD}25` }}
        >
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Session QR code - scan with Link Device" className="w-full max-w-[260px] h-auto aspect-square rounded-lg bg-white p-2" />
          ) : (
            <div className="w-full max-w-[260px] aspect-square rounded-lg bg-[#1a1a1a] flex items-center justify-center text-[#6b6b70]">Generating QR…</div>
          )}
          <p className="mt-6 text-xs text-[#6b6b70]">
            Session QR · Laptop will unlock when your phone approves
          </p>
          <div className="flex gap-2 mt-4">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
