'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { getMerchantPaymentUri } from '@/lib/merchantMode';

interface MerchantQRCodeProps {
  walletAddress: string;
  size?: number;
  className?: string;
  /** High-contrast (black on white) for instant P2P scan in Merchant Mode. */
  highContrast?: boolean;
}

export function MerchantQRCode({ walletAddress, size = 200, className = '', highContrast = false }: MerchantQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress || !canvasRef.current) return;
    const uri = getMerchantPaymentUri(walletAddress);
    QRCode.toCanvas(canvasRef.current, uri, {
      width: size,
      margin: 2,
      color: highContrast ? { dark: '#000000', light: '#ffffff' } : { dark: '#0d0d0f', light: '#ffffff' },
    }).catch((e) => setError(e instanceof Error ? e.message : 'QR failed'));
  }, [walletAddress, size, highContrast]);

  if (error) {
    return <div className={`text-red-400 text-sm ${className}`}>QR error: {error}</div>;
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-label="Merchant payment QR code"
      style={{ width: size, height: size }}
    />
  );
}
