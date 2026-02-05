'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import { deriveRSKWalletFromSeed } from '@/lib/sovryn/derivedWallet';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  /** Local wallet.address from state (e.g. useNativeBalances). If set, show immediately; else derive. */
  walletAddress?: string | null;
}

/** Unified Receive: one RSK address with QR and Copy. Uses local wallet.address when available; else derives. */
export function ReceiveModal({ isOpen, onClose, phoneNumber, walletAddress }: ReceiveModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setCopied(false);
    if (walletAddress?.trim()) {
      setAddress(walletAddress.trim());
      setLoading(false);
      return;
    }
    if (!phoneNumber?.trim()) {
      setLoading(false);
      setError('Identity required');
      return;
    }
    setLoading(true);
    deriveRSKWalletFromSeed(phoneNumber.trim())
      .then((r) => {
        if (r.ok) setAddress(r.address);
        else setError(r.error ?? 'Could not derive address');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  }, [isOpen, phoneNumber, walletAddress]);

  useEffect(() => {
    if (!address || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, address, {
      width: 220,
      margin: 2,
      color: { dark: '#0d0d0f', light: '#ffffff' },
    }).catch(() => {});
  }, [address]);

  const copyAddress = useCallback(() => {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [address]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="rounded-2xl border-2 border-[#D4AF37]/50 bg-[#16161a] p-6 max-w-sm w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#e8c547] uppercase tracking-wider">Receive</h3>
          <button type="button" onClick={onClose} className="text-[#6b6b70] hover:text-white p-1" aria-label="Close">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-xs font-medium text-[#e8c547] mb-2 uppercase tracking-wider">
          Your Universal Sovereign Address (RSK)
        </p>
        <p className="text-xs text-[#6b6b70] mb-4">
          This address accepts VIDA, DLLR, USDT, and vNGN on Rootstock. Same address for all.
        </p>
        {loading && <p className="text-sm text-[#e8c547]">Loading…</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {address && !loading && (
          <>
            <div className="flex justify-center bg-white rounded-lg p-3 mb-4">
              <canvas ref={canvasRef} aria-label="Receive address QR" style={{ width: 220, height: 220 }} />
            </div>
            <p className="text-[10px] font-mono text-[#6b6b70] break-all text-center mb-3">{address}</p>
            <button
              type="button"
              onClick={copyAddress}
              className="w-full py-3 rounded-lg font-bold uppercase tracking-wider border transition-all hover:opacity-90"
              style={{ background: '#D4AF37', color: '#0d0d0f', borderColor: 'rgba(212, 175, 55, 0.5)' }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
