'use client';

import { useState, useEffect } from 'react';
import { 
  createRemoteAuthSession, 
  subscribeToRemoteAuthSession,
  type RemoteAuthSession 
} from '@/lib/remoteAuth';

interface RemoteAuthBridgeProps {
  deviceId: string;
  onVerified: (identityHash: string) => void;
  onError?: (error: string) => void;
}

export function RemoteAuthBridge({ deviceId, onVerified, onError }: RemoteAuthBridgeProps) {
  const [session, setSession] = useState<RemoteAuthSession | null>(null);
  const [qrCodeSvg, setQrCodeSvg] = useState<string>('');
  const [status, setStatus] = useState<'initializing' | 'waiting' | 'scanning' | 'verified' | 'expired' | 'error'>('initializing');
  const [timeRemaining, setTimeRemaining] = useState<number>(300);

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const newSession = await createRemoteAuthSession(deviceId);
        
        if (!mounted) return;
        
        setSession(newSession);
        setStatus('waiting');

        const qrData = JSON.parse(newSession.qr_code_data);
        const svg = generateQRCodeSVG(qrData.verify_url);
        setQrCodeSvg(svg);
      } catch (error) {
        console.error('Error initializing remote auth:', error);
        setStatus('error');
        onError?.('Failed to initialize remote authentication');
      }
    }

    initSession();
    return () => { mounted = false; };
  }, [deviceId, onError]);

  useEffect(() => {
    if (!session) return;

    const unsubscribe = subscribeToRemoteAuthSession(session.session_id, (updatedSession) => {
      setSession(updatedSession);
      
      if (updatedSession.status === 'scanning') setStatus('scanning');
      else if (updatedSession.status === 'verified') {
        setStatus('verified');
        if (updatedSession.identity_hash) onVerified(updatedSession.identity_hash);
      } else if (updatedSession.status === 'expired') {
        setStatus('expired');
        onError?.('Session expired');
      } else if (updatedSession.status === 'failed') {
        setStatus('error');
        onError?.('Authentication failed');
      }
    });

    return unsubscribe;
  }, [session, onVerified, onError]);

  useEffect(() => {
    if (status !== 'waiting' && status !== 'scanning') return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => prev <= 1 ? 0 : prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div 
        className="max-w-2xl w-full rounded-2xl border p-12"
        style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.6) 100%)',
          borderColor: 'rgba(212, 175, 55, 0.3)',
          boxShadow: '0 0 60px rgba(212, 175, 55, 0.2)'
        }}
      >
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📱💻</div>
          <h1 className="text-3xl font-black mb-3" style={{ color: '#D4AF37', textShadow: '0 0 30px rgba(212, 175, 55, 0.5)' }}>
            Remote Biometric Authentication
          </h1>
          <p className="text-sm" style={{ color: '#6b6b70' }}>
            No camera detected. Hold your palm to the camera for Sovereign Palm scan.
          </p>
        </div>

        {status === 'waiting' && session && (
          <>
            <div className="flex justify-center mb-8">
              <div 
                className="p-6 rounded-xl border bg-white"
                style={{
                  borderColor: 'rgba(212, 175, 55, 0.5)',
                  boxShadow: '0 0 40px rgba(212, 175, 55, 0.3)'
                }}
              >
                <div className="w-64 h-64" dangerouslySetInnerHTML={{ __html: qrCodeSvg }} />
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {[
                'Open your phone\'s camera or QR code scanner',
                'Scan the QR code above to open PFF Fortress Gate',
                'Complete the 4 Layers of Truth on your phone',
                'This screen will automatically unlock when verified'
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: '#D4AF37', color: '#0d0d0f' }}>
                    {i + 1}
                  </div>
                  <p className="text-sm" style={{ color: '#a0a0a5' }}>{text}</p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <p className="text-xs mb-2" style={{ color: '#6b6b70' }}>Session expires in</p>
              <p className="text-2xl font-bold font-mono" style={{ color: '#D4AF37' }}>
                {formatTime(timeRemaining)}
              </p>
            </div>
          </>
        )}

        {status === 'scanning' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-6 animate-pulse">🔐</div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: '#D4AF37' }}>Phone Connected</h2>
            <p className="text-sm mb-6" style={{ color: '#6b6b70' }}>Performing biometric verification...</p>
          </div>
        )}

        {status === 'verified' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: '#D4AF37' }}>Verification Complete!</h2>
            <p className="text-sm" style={{ color: '#6b6b70' }}>Unlocking dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function generateQRCodeSVG(url: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
    <rect fill="#fff" width="256" height="256"/>
    <text x="128" y="128" text-anchor="middle" font-size="10" fill="#000">
      Scan to verify
    </text>
    <text x="128" y="145" text-anchor="middle" font-size="8" fill="#666">
      ${url.substring(0, 40)}...
    </text>
  </svg>`;
}

