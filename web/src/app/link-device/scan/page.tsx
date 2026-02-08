'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Smartphone, Loader2 } from 'lucide-react';

const GOLD = '#D4AF37';

/**
 * Link Device — QR Scanner. Opens mobile camera to scan the laptop's QR code.
 * On scan: navigates to /link-device?requestId=... so user can approve and send anchor.
 */
export default function LinkDeviceScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<'idle' | 'requesting' | 'scanning' | 'found' | 'unsupported' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scanLoopRef = useRef<number | null>(null);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported');
      setErrorMessage('Camera not available.');
      return;
    }
    setStatus('requesting');
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setStatus('scanning');
    } catch (e) {
      setStatus('error');
      setErrorMessage(e instanceof Error ? e.message : 'Camera access denied.');
    }
  }, []);

  useEffect(() => {
    if (status !== 'scanning') return;
    const video = videoRef.current;
    const BarcodeDetector = typeof window !== 'undefined' ? (window as any).BarcodeDetector : null;
    if (!BarcodeDetector || !video) {
      setStatus('unsupported');
      setErrorMessage('QR scanning not supported in this browser. Use the Link Device page and open the URL from your laptop.');
      return;
    }
    let cancelled = false;
    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const tick = async () => {
      if (cancelled || video.readyState < 2 || !ctx) {
        scanLoopRef.current = requestAnimationFrame(tick);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      try {
        const barcodes = await detector.detect(canvas);
        const qr = barcodes.find((b: { format: string }) => b.format === 'qr_code');
        if (qr?.rawValue) {
          const url = qr.rawValue.trim();
          const ourOrigin = typeof window !== 'undefined' ? window.location.origin : '';
          if (url.startsWith(ourOrigin + '/link-device') || url.startsWith('/link-device')) {
            const parsed = url.startsWith('http') ? new URL(url) : new URL(url, ourOrigin);
            const requestId = parsed.searchParams.get('requestId');
            if (requestId) {
              cancelled = true;
              setStatus('found');
              streamRef.current?.getTracks().forEach((t) => t.stop());
              streamRef.current = null;
              router.replace(`/link-device?requestId=${encodeURIComponent(requestId)}`);
              return;
            }
          }
        }
      } catch {
        // ignore single-frame errors
      }
      scanLoopRef.current = requestAnimationFrame(tick);
    };
    scanLoopRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
    };
  }, [status, router]);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [startCamera]);

  if (status === 'unsupported' || status === 'error') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 bg-red-500/10" style={{ borderColor: GOLD }}>
            <Smartphone className="w-10 h-10" style={{ color: GOLD }} />
          </div>
          <h1 className="text-xl font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
            QR scanner unavailable
          </h1>
          <p className="text-[#a0a0a5] text-sm mb-6">{errorMessage}</p>
          <p className="text-[#6b6b70] text-xs mb-6">
            On your laptop, open the PFF login screen and tap &quot;Log in via my phone&quot;. Then open this page on your phone and enter the link from the laptop, or use your phone&apos;s camera app to scan the QR and open the link.
          </p>
          <Link
            href="/link-device"
            className="inline-block px-6 py-3 rounded-xl font-bold uppercase tracking-wider"
            style={{ background: GOLD, color: '#0d0d0f' }}
          >
            Open Link Device
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <div className="p-4 text-center">
        <h1 className="text-lg font-bold uppercase tracking-wider" style={{ color: GOLD }}>
          Scan laptop QR code
        </h1>
        <p className="text-sm text-[#6b6b70] mt-1">
          Point your camera at the QR code on your laptop screen.
        </p>
      </div>
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          style={{ transform: 'scaleX(-1)' }}
        />
        {status === 'requesting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Loader2 className="w-12 h-12 animate-spin" style={{ color: GOLD }} />
          </div>
        )}
        {status === 'scanning' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 rounded-2xl border-4 border-dashed opacity-80" style={{ borderColor: GOLD }} />
          </div>
        )}
        {status === 'found' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <p className="text-lg font-bold uppercase" style={{ color: GOLD }}>Opening…</p>
          </div>
        )}
      </div>
      <div className="p-4 text-center">
        <Link href="/link-device" className="text-sm text-[#6b6b70] hover:text-[#e8c547]">
          Cancel — open Link Device manually
        </Link>
      </div>
    </div>
  );
}
