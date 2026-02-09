'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

interface ManualLocationInputScreenProps {
  onProceed: (city: string, country: string) => void;
  onCancel: () => void;
  /** Button label when location is confirmed (e.g. "Complete" for one-way ticket to dashboard). */
  submitLabel?: string;
  /** When true (e.g. on GPS manual setup page), show "Share live location" link. */
  showShareLiveLocation?: boolean;
}

const GOLD = '#D4AF37';

export function ManualLocationInputScreen({
  onProceed,
  onCancel,
  submitLabel = 'Proceed',
  showShareLiveLocation = false,
}: ManualLocationInputScreenProps) {
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (city.trim() && country.trim()) {
      onProceed(city.trim(), country.trim());
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, rgba(5, 5, 5, 0) 70%)' }}
        aria-hidden
      />
      <div
        className="relative z-10 rounded-2xl border-2 p-8 max-w-md w-full"
        style={{
          background: 'linear-gradient(180deg, rgba(30, 28, 22, 0.98) 0%, rgba(15, 14, 10, 0.99) 100%)',
          borderColor: 'rgba(212, 175, 55, 0.5)',
        }}
      >
        <p className="text-center text-lg font-bold mb-2" style={{ color: GOLD }}>
          Set up GPS to your location
        </p>
        <p className="text-center text-sm text-[#a0a0a5] mb-4">
          Location could not be detected. Share live location or enter your city and country to proceed.
        </p>
        {showShareLiveLocation && (
          <Link
            href={ROUTES.VITALIZATION_SHARE_LOCATION}
            className="block w-full py-4 rounded-xl font-bold text-base uppercase tracking-wider text-center mb-6 transition-all hover:opacity-95"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)',
              color: '#0d0d0f',
              boxShadow: '0 0 24px rgba(212, 175, 55, 0.3)',
            }}
          >
            Share live location
          </Link>
        )}
        <p className="text-center text-xs text-[#6b6b70] mb-4">
          {showShareLiveLocation ? 'Or enter city and country:' : 'Enter your city and country:'}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#0d0d0f] border-2 border-[#2a2a2e] text-white placeholder-[#6b6b70] focus:border-[#D4AF37] focus:outline-none"
            required
          />
          <input
            type="text"
            placeholder="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#0d0d0f] border-2 border-[#2a2a2e] text-white placeholder-[#6b6b70] focus:border-[#D4AF37] focus:outline-none"
            required
          />
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border-2 border-[#6b6b70] text-[#a0a0a5] font-bold uppercase tracking-wider hover:bg-[#6b6b70]/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!city.trim() || !country.trim()}
              className="flex-1 py-3 rounded-xl bg-[#D4AF37] text-black font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              style={{ boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)' }}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
