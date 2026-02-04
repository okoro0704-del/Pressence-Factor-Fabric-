'use client';

import { useCallback, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { getMerchantPaymentUri } from '@/lib/merchantMode';

interface MerchantStoreSignProps {
  walletAddress: string;
  onDownload?: () => void;
}

const W = 800;
const H = 1000;
const LOGO_TEXT = 'Sovereign Mesh';
const TAGLINE = 'VIDA ACCEPTED HERE – Secured by Presence';

export function MerchantStoreSign({ walletAddress, onDownload }: MerchantStoreSignProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const qrDataUrlRef = useRef<string | null>(null);

  const downloadStoreSign = useCallback(async () => {
    if (!walletAddress) {
      setError('No wallet address');
      return;
    }
    setDownloading(true);
    setError(null);
    try {
      const uri = getMerchantPaymentUri(walletAddress);
      const qrDataUrl = await QRCode.toDataURL(uri, {
        width: 320,
        margin: 2,
        color: { dark: '#0d0d0f', light: '#ffffff' },
      });
      qrDataUrlRef.current = qrDataUrl;

      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2d not available');

      // Background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
      bgGradient.addColorStop(0, '#16161a');
      bgGradient.addColorStop(1, '#0d0d0f');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, W, H);

      // Border
      ctx.strokeStyle = '#e8c547';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, W - 4, H - 4);

      // Sovereign Mesh logo (text)
      ctx.fillStyle = '#e8c547';
      ctx.font = 'bold 48px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(LOGO_TEXT, W / 2, 120);

      // Decorative line under logo
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 120, 150);
      ctx.lineTo(W / 2 + 120, 150);
      ctx.stroke();

      // QR code image
      const qrImg = new Image();
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => reject(new Error('QR image load failed'));
        qrImg.src = qrDataUrl;
      });
      const qrSize = 320;
      ctx.drawImage(qrImg, (W - qrSize) / 2, 200, qrSize, qrSize);

      // Tagline
      ctx.fillStyle = '#f5f5f5';
      ctx.font = '28px system-ui, sans-serif';
      ctx.fillText(TAGLINE, W / 2, 580);

      // Subtext
      ctx.fillStyle = '#6b6b70';
      ctx.font = '18px system-ui, sans-serif';
      ctx.fillText('Scan to pay with VIDA from your Sovereign Liquidity', W / 2, 620);

      // Footer
      ctx.fillStyle = '#3d3d45';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('PFF × Sovereign Mesh · Secured by Presence', W / 2, H - 40);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 1));
      if (!blob) throw new Error('Export failed');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vida-accepted-here-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      onDownload?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  }, [walletAddress, onDownload]);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={downloadStoreSign}
        disabled={downloading || !walletAddress}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#c9a227] to-[#e8c547] text-black font-bold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {downloading ? 'Generating…' : 'Download Store Sign'}
      </button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
