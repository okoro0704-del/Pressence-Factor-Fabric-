'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { deriveRSKWalletFromSeed } from '@/lib/sovryn/derivedWallet';

interface SpendQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
}

/** QR encodes the user's RSK address so they can receive USDT/DLLR/RBTC without leaving the app. */
export function SpendQRModal({ isOpen, onClose, phoneNumber }: SpendQRModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !phoneNumber?.trim()) return;
    setLoading(true);
    setError(null);
    deriveRSKWalletFromSeed(phoneNumber.trim())
      .then((r) => {
        if (r.ok) setAddress(r.address);
        else setError(r.error ?? 'Could not derive address');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  }, [isOpen, phoneNumber]);

  useEffect(() => {
    if (!address || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, address, {
      width: 220,
      margin: 2,
      color: { dark: '#0d0d0f', light: '#ffffff' },
    }).catch(() => {});
  }, [address]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="rounded-2xl border-2 border-[#D4AF37]/50 bg-[#16161a] p-6 max-w-sm w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#e8c547] uppercase tracking-wider">Spend — Receive / Pay</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6b6b70] hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-[#6b6b70] mb-4">
          Show this QR to receive USDT, DLLR, or RBTC on Rootstock. Same address every time.
        </p>
        {loading && <p className="text-sm text-[#e8c547]">Loading…</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {address && !loading && (
          <>
            <div className="flex justify-center bg-white rounded-lg p-3 mb-4">
              <canvas ref={canvasRef} aria-label="Receive address QR code" style={{ width: 220, height: 220 }} />
            </div>
            <p className="text-[10px] font-mono text-[#6b6b70] break-all text-center">{address}</p>
          </>
        )}
      </div>
    </div>
  );
}
