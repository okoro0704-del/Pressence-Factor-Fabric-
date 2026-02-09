'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getIdentityAnchorPhone, setIdentityAnchorForSession } from '@/lib/sentinelActivation';
import { setPillarLocationFromLiveCoords } from '@/lib/biometricAuth';
import { recordClockIn } from '@/lib/workPresence';
import { ROUTES } from '@/lib/constants';
import { useGlobalPresenceGateway } from '@/contexts/GlobalPresenceGateway';

const GOLD = '#D4AF37';
const GOOGLE_MAPS_URL = 'https://www.google.com/maps';

/**
 * Share Live Location — When GPS fails, user can share live location (browser geolocation)
 * or open Google Maps to improve fix, then try again. Replaces failed GPS for the pillar.
 */
export default function ShareLocationPage() {
  const router = useRouter();
  const { setPresenceVerified } = useGlobalPresenceGateway();
  const [status, setStatus] = useState<'idle' | 'getting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleShareLiveLocation = () => {
    const phone = getIdentityAnchorPhone();
    if (!phone) {
      router.replace('/');
      return;
    }

    setStatus('getting');
    setErrorMessage(null);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 30_000,
      maximumAge: 0,
    };

    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMessage('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setPillarLocationFromLiveCoords(phone, coords.latitude, coords.longitude);
        setIdentityAnchorForSession(phone);
        setPresenceVerified(true);
        recordClockIn(phone, coords).catch(() => {});
        try {
          localStorage.removeItem('sov_status');
        } catch {
          /* ignore */
        }
        setStatus('success');
        router.push(ROUTES.DASHBOARD);
      },
      (err) => {
        setStatus('error');
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Allow location for this site and try again.'
            : err.code === err.TIMEOUT
            ? 'Location timed out. Try opening Google Maps first, then come back and tap Share live location again.'
            : err.message || 'Could not get location. Try again or use Enter city/country below.';
        setErrorMessage(msg);
      },
      options
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, rgba(5, 5, 5, 0) 70%)' }}
        aria-hidden
      />
      <div
        className="relative z-10 rounded-2xl border-2 p-8 max-w-md w-full space-y-6"
        style={{
          background: 'linear-gradient(180deg, rgba(30, 28, 22, 0.98) 0%, rgba(15, 14, 10, 0.99) 100%)',
          borderColor: 'rgba(212, 175, 55, 0.5)',
        }}
      >
        <div className="text-center">
          <p className="text-2xl mb-2" aria-hidden>📍</p>
          <h1 className="text-xl font-bold mb-2" style={{ color: GOLD }}>
            Share live location
          </h1>
          <p className="text-sm text-[#a0a0a5]">
            GPS could not be detected. Share your live location to complete setup — or enter city and country instead.
          </p>
        </div>

        <button
          type="button"
          onClick={handleShareLiveLocation}
          disabled={status === 'getting'}
          className="w-full py-4 rounded-xl font-bold text-base uppercase tracking-wider transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)',
            color: '#0d0d0f',
            boxShadow: '0 0 24px rgba(212, 175, 55, 0.3)',
          }}
        >
          {status === 'getting' ? (
            <>
              <span className="w-5 h-5 border-2 border-[#0d0d0f] border-t-transparent rounded-full animate-spin" />
              Getting location…
            </>
          ) : (
            'Share live location'
          )}
        </button>

        <p className="text-xs text-center" style={{ color: '#6b6b70' }}>
          Tip: If location fails, open Google Maps first to get a fix, then return here and tap Share live location again.
        </p>

        <a
          href={GOOGLE_MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-3 rounded-xl border-2 text-center font-medium text-sm transition-colors hover:opacity-90"
          style={{ borderColor: 'rgba(212, 175, 55, 0.4)', color: GOLD }}
        >
          Open Google Maps
        </a>

        {status === 'error' && errorMessage && (
          <div
            className="rounded-lg border px-4 py-3 text-sm"
            style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        <div className="border-t pt-4" style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}>
          <p className="text-xs text-center mb-3" style={{ color: '#6b6b70' }}>
            Prefer to enter your city and country instead?
          </p>
          <Link
            href={ROUTES.VITALIZATION_GPS_MANUAL_SETUP}
            className="block w-full py-3 rounded-xl border-2 text-center font-bold text-sm uppercase tracking-wider transition-colors hover:opacity-90"
            style={{ borderColor: 'rgba(107, 107, 112, 0.5)', color: '#a0a0a5' }}
          >
            Enter city & country
          </Link>
        </div>
      </div>
    </div>
  );
}
