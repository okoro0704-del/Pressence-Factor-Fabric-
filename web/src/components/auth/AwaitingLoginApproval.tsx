'use client';

import { useEffect, useState } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { subscribeToLoginRequest } from '@/lib/loginRequest';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

interface AwaitingLoginApprovalProps {
  requestId: string;
  onApproved: () => void;
  onDenied: () => void;
}

/**
 * Computer: shows "Waiting for approval on your phone" and subscribes to login_request.
 * When phone approves, onApproved() runs and computer logs into Vault.
 */
export function AwaitingLoginApproval({ requestId, onApproved, onDenied }: AwaitingLoginApprovalProps) {
  const [pulseScale, setPulseScale] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseScale((prev) => (prev === 1 ? 1.2 : 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToLoginRequest(requestId, (status) => {
      if (status === 'APPROVED') onApproved();
      else if (status === 'DENIED') onDenied();
    });
    return () => unsubscribe();
  }, [requestId, onApproved, onDenied]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.3) 0%, rgba(5, 5, 5, 0) 70%)',
        }}
      />
      <div className="relative max-w-xl w-full">
        <div className="text-center mb-8">
          <div
            className="inline-block transition-transform duration-1000"
            style={{ transform: `scale(${pulseScale})` }}
          >
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center mx-auto"
              style={{
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.05) 100%)',
                border: '3px solid #D4AF37',
                boxShadow: '0 0 50px rgba(212, 175, 55, 0.5)',
              }}
            >
              <span className="text-5xl" aria-hidden>📱</span>
            </div>
          </div>
        </div>
        <div
          className="rounded-2xl border-2 p-8"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.9) 100%)',
            borderColor: '#D4AF37',
            boxShadow: '0 0 50px rgba(212, 175, 55, 0.25)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <h1
            className={`text-2xl font-black text-center mb-4 uppercase tracking-wider ${jetbrains.className}`}
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Waiting for approval from your master device
          </h1>
          <p className="text-center text-[#a0a0a5] text-sm mb-6">
            This number is linked to your master device (the one that captured your face first). Open PFF on that device — you&apos;ll see a verification request to approve. When you approve, you&apos;ll be logged in here.
          </p>
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
