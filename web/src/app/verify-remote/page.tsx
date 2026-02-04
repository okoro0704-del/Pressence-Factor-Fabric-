'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MobileFortressGate } from '@/components/auth/MobileFortressGate';

function VerifyRemoteContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!sessionId) {
      setError('Invalid session. Please scan the QR code again.');
    }
  }, [sessionId]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div 
          className="max-w-md w-full rounded-2xl border p-8 text-center"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            borderColor: '#ef4444'
          }}
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: '#ef4444' }}>
            Invalid Session
          </h1>
          <p className="text-sm" style={{ color: '#6b6b70' }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return null;
  }

  return <MobileFortressGate sessionId={sessionId} />;
}

export default function VerifyRemotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-4xl animate-spin">⏳</div>
      </div>
    }>
      <VerifyRemoteContent />
    </Suspense>
  );
}

