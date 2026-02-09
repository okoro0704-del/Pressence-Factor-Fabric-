'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getVitalizationAnchor, clearVitalizationAnchor, type VitalizationAnchor } from '@/lib/vitalizationAnchor';
import { getAssertion, isWebAuthnSupported, isUserVerifyingPlatformAuthenticatorAvailable } from '@/lib/webauthn';
import { deriveFaceHashFromCredential } from '@/lib/biometricAnchorSync';
import { setIdentityAnchorForSession } from '@/lib/sentinelActivation';
import { setSessionIdentity } from '@/lib/sessionIsolation';
import { useGlobalPresenceGateway } from '@/contexts/GlobalPresenceGateway';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { getTimeBasedGreeting } from '@/lib/timeBasedGreeting';
import { setVitalizationComplete } from '@/lib/vitalizationState';
import { createLoginRequest, completeLoginBridge } from '@/lib/loginRequest';
import { AwaitingLoginApproval } from '@/components/auth/AwaitingLoginApproval';
import { resolveIdentityFromCredentialId } from '@/lib/deviceAnchors';
import { isCurrentDevicePrimary } from '@/lib/phoneIdBridge';
import { getCurrentDeviceInfo } from '@/lib/multiDeviceVitalization';
import { executeSentinelActivationDebit } from '@/lib/masterArchitectInit';

/**
 * Pre-flight: verify face (and device passkey) to confirm user has vitalized.
 * Master device = first device that captured face for this number (locked to mobile number).
 * When this number is used on another device, sign-in requires verification/approval from the master device.
 */
export function AnchoredLanding() {
  const router = useRouter();
  const { setPresenceVerified } = useGlobalPresenceGateway();
  const [anchor, setAnchor] = useState<VitalizationAnchor | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [faceDone, setFaceDone] = useState(false);
  /** No passkey on this device: show Request Handshake (login_request) instead of generic error. */
  const [requestHandshakeMode, setRequestHandshakeMode] = useState(false);
  const [phoneForRequest, setPhoneForRequest] = useState('');
  const [loginRequestId, setLoginRequestId] = useState<string | null>(null);
  const [requestHandshakeError, setRequestHandshakeError] = useState<string | null>(null);
  /** When user cancels native prompt: show only "Retry Secure Login" (no login form). */
  const [showRetrySecureLogin, setShowRetrySecureLogin] = useState(false);
  /** Auto-trigger credentials.get once on mount when anchor exists and this device is the master. */
  const autoLoginAttemptedRef = useRef(false);
  /** When false, this number is linked to another (master) device — require verification from master before login. */
  const [isMasterDevice, setIsMasterDevice] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    getVitalizationAnchor().then((a) => {
      if (cancelled) return;
      if (a.isVitalized && a.citizenHash) {
        setAnchor(a);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!anchor?.phone) return;
    let cancelled = false;
    isCurrentDevicePrimary(anchor.phone).then((primary) => {
      if (!cancelled) {
        setIsMasterDevice(primary);
        if (primary === false) {
          setPhoneForRequest(anchor.phone);
          setRequestHandshakeMode(true);
        }
      }
    });
    return () => { cancelled = true; };
  }, [anchor?.phone]);

  useEffect(() => {
    if (!anchor?.citizenHash || !anchor?.phone || loading || autoLoginAttemptedRef.current || !isWebAuthnSupported()) return;
    if (isMasterDevice === false) return; // Non-master device: do not auto-login; require verification from master
    let cancelled = false;
    (async () => {
      const hasNative = await isUserVerifyingPlatformAuthenticatorAvailable();
      if (!hasNative || cancelled) return;
      autoLoginAttemptedRef.current = true;
      try {
        const assertion = await getAssertion();
        if (!assertion?.credential) {
          setShowRetrySecureLogin(true);
          return;
        }
        const cred = assertion.credential;
        let phone = anchor.phone;
        let citizenHash = anchor.citizenHash ?? '';
        const resolved = await resolveIdentityFromCredentialId(cred.id);
        if (resolved) {
          phone = resolved.phone;
          citizenHash = resolved.citizenHash;
        }
        setIdentityAnchorForSession(phone);
        setPresenceVerified(true);
        setSessionIdentity(phone);
        setVitalizationComplete();
        await executeSentinelActivationDebit(phone);
        router.replace('/dashboard');
      } catch {
        setShowRetrySecureLogin(true);
      }
    })();
    return () => { cancelled = true; };
  }, [anchor?.citizenHash, anchor?.phone, loading, isMasterDevice, setPresenceVerified, router]);

  const handleFaceScan = useCallback(async () => {
    const phone = anchor?.phone ?? getIdentityAnchorPhone();
    if (!anchor?.citizenHash || !phone) return;
    if (isMasterDevice === false) {
      setRequestHandshakeMode(true);
      setPhoneForRequest(phone);
      setError(null);
      return;
    }
    setError(null);
    setRequestHandshakeMode(false);
    setScanning(true);
    try {
      const assertion = await getAssertion();
      if (!assertion?.credential) {
        setShowRetrySecureLogin(true);
        if (isWebAuthnSupported()) {
          setRequestHandshakeMode(true);
          setPhoneForRequest(phone);
          setError(null);
        } else {
          setError('Passkeys not supported. Use a supported browser or request sign-in from your phone.');
        }
        return;
      }
      const cred = assertion.credential;
      const credentialForHash = {
        id: cred.id,
        rawId: cred.rawId,
        response: {
          clientDataJSON: cred.response.clientDataJSON,
          authenticatorData: cred.response.authenticatorData,
        },
      };
      const liveHash = await deriveFaceHashFromCredential(credentialForHash);
      const stored = (anchor.citizenHash ?? '').trim();
      if (liveHash.trim() !== stored) {
        setError('Face did not match. Try again.');
        return;
      }
      setIdentityAnchorForSession(phone);
      setPresenceVerified(true);
      setSessionIdentity(phone);
      setFaceDone(true);
      setGreeting(getTimeBasedGreeting());
      setVitalizationComplete();
      await executeSentinelActivationDebit(phone);
      setShowOverlay(true);
      setTimeout(() => router.replace('/dashboard'), 1200);
    } catch (e) {
      setShowRetrySecureLogin(true);
      setError(e instanceof Error ? e.message : 'Face scan failed. Try again.');
    } finally {
      setScanning(false);
    }
  }, [anchor, isMasterDevice, setPresenceVerified, router]);

  const handleVitalizeNewSoul = useCallback(() => {
    clearVitalizationAnchor();
    window.location.reload();
  }, []);

  const handleSendRequestHandshake = useCallback(async () => {
    const phone = phoneForRequest.trim();
    if (!phone) {
      setRequestHandshakeError('Enter your registered phone number.');
      return;
    }
    setRequestHandshakeError(null);
    setScanning(true);
    try {
      const deviceInfo = getCurrentDeviceInfo();
      const res = await createLoginRequest(phone, anchor?.name, {
        device_id: deviceInfo?.deviceId,
        device_name: deviceInfo?.deviceName,
        device_type: deviceInfo?.deviceType,
        laptop_device_name: deviceInfo?.deviceName,
      });
      if (res.ok) {
        setLoginRequestId(res.requestId);
      } else {
        setRequestHandshakeError(res.error ?? 'Failed to send request.');
      }
    } catch (e) {
      setRequestHandshakeError(e instanceof Error ? e.message : 'Failed to send request.');
    } finally {
      setScanning(false);
    }
  }, [phoneForRequest, anchor?.name]);

  const handleLoginApproved = useCallback(async () => {
    if (!loginRequestId) return;
    try {
      const result = await completeLoginBridge(loginRequestId);
      if (result.ok) {
        setPresenceVerified(true);
        setVitalizationComplete();
        setLoginRequestId(null);
        setRequestHandshakeMode(false);
        router.replace('/dashboard');
      } else {
        setRequestHandshakeError(result.error ?? 'Login failed.');
      }
    } catch (e) {
      setRequestHandshakeError(e instanceof Error ? e.message : 'Login failed.');
    }
  }, [loginRequestId, setPresenceVerified, router]);

  const handleLoginDenied = useCallback(() => {
    setLoginRequestId(null);
    setRequestHandshakeError('Sign-in was denied on your phone.');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]" style={{ color: '#6b6b70' }} aria-busy="true">
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  // No saved identity (e.g. cleared or race): offer fallback to full registration
  if (!anchor?.citizenHash) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] p-4">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(212, 175, 55, 0.15) 0%, transparent 60%)' }}
          aria-hidden
        />
        <p className="relative z-10 text-sm text-center max-w-xs mb-6" style={{ color: '#a0a0a5' }}>
          No saved identity found.
        </p>
        <button
          type="button"
          onClick={() => {
            clearVitalizationAnchor();
            router.replace('/vitalization');
          }}
          className="relative z-10 px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
          style={{
            background: 'linear-gradient(145deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.08) 100%)',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            color: '#D4AF37',
          }}
        >
          Continue to registration
        </button>
      </div>
    );
  }

  if (loginRequestId) {
    return (
      <AwaitingLoginApproval
        requestId={loginRequestId}
        onApproved={handleLoginApproved}
        onDenied={handleLoginDenied}
      />
    );
  }

  if (showRetrySecureLogin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] p-4">
        <p className="text-sm text-[#a0a0a5] mb-6 text-center max-w-xs">
          Secure login was cancelled. Use your device biometric to try again.
        </p>
        <button
          type="button"
          onClick={() => { setShowRetrySecureLogin(false); setError(null); }}
          className="min-h-[48px] px-8 py-3 rounded-lg font-bold bg-[#D4AF37] text-black hover:bg-[#e8c547] transition-colors"
        >
          Retry Secure Login
        </button>
      </div>
    );
  }

  if (showOverlay) {
    return (
      <div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505]/95 backdrop-blur-sm p-6"
        role="status"
        aria-live="polite"
      >
        <div
          className="rounded-2xl border-2 p-8 max-w-md w-full text-center shadow-2xl"
          style={{
            background: 'linear-gradient(180deg, rgba(20, 20, 18, 0.98) 0%, rgba(10, 10, 8, 0.99) 100%)',
            borderColor: 'rgba(34, 197, 94, 0.6)',
            boxShadow: '0 0 60px rgba(34, 197, 94, 0.25), inset 0 1px 0 rgba(34, 197, 94, 0.15)',
          }}
        >
          <p className="text-xl font-bold mb-2" style={{ color: '#22c55e' }}>
            Identity Verified. Welcome Home to Vitalie, Architect.
          </p>
          <p className="text-sm mt-4" style={{ color: '#a0a0a5' }}>
            {greeting}
          </p>
          <p className="text-xs mt-6" style={{ color: '#6b6b70' }}>
            Taking you to the Dashboard…
          </p>
        </div>
      </div>
    );
  }

  const showMasterApprovalFlow = isMasterDevice === false && anchor?.phone;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] p-4">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(212, 175, 55, 0.15) 0%, transparent 60%)' }}
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center">
        {showMasterApprovalFlow ? (
          <>
            <p className="text-sm uppercase tracking-widest mb-4" style={{ color: '#6b6b70' }}>
              Master device required
            </p>
            <p className="text-center text-sm max-w-xs mb-6" style={{ color: '#a0a0a5' }}>
              This number is linked to your master device (the one that captured your face first). Sign-in on this device requires approval from that device.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm uppercase tracking-widest mb-8" style={{ color: '#6b6b70' }}>
              One-tap access
            </p>
            <button
              type="button"
              onClick={handleFaceScan}
              disabled={scanning}
              className="relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/40 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(145deg, rgba(30, 28, 22, 0.98) 0%, rgba(15, 14, 10, 0.99) 100%)',
                border: '2px solid rgba(212, 175, 55, 0.5)',
                boxShadow: scanning
                  ? '0 0 40px rgba(212, 175, 55, 0.4), inset 0 0 30px rgba(212, 175, 55, 0.08)'
                  : '0 0 30px rgba(212, 175, 55, 0.2), inset 0 0 20px rgba(0,0,0,0.3)',
              }}
              aria-label="Face scan to enter"
            >
              {scanning ? (
                <span className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-5xl" aria-hidden>👤</span>
              )}
            </button>
            <p className="mt-6 text-sm max-w-xs text-center" style={{ color: '#a0a0a5' }}>
              {scanning ? 'Verifying…' : 'Face Scan to enter — no email or password'}
            </p>
          </>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-400 text-center max-w-xs" role="alert">
            {error}
          </p>
        )}

        {(requestHandshakeMode || showMasterApprovalFlow) && !loginRequestId && (
          <div className="mt-8 w-full max-w-xs rounded-xl border border-[#D4AF37]/40 bg-black/40 p-4">
            <p className="text-sm font-medium text-[#D4AF37] mb-2">
              {showMasterApprovalFlow ? 'Send verification to master device' : 'No passkey on this device'}
            </p>
            <p className="text-xs text-[#a0a0a5] mb-3">
              {showMasterApprovalFlow
                ? 'A verification request will be sent to your master device. Approve there to sign in here.'
                : 'Request a sign-in from your registered phone. Approve there to unlock this device.'}
            </p>
            <input
              type="tel"
              value={phoneForRequest}
              onChange={(e) => setPhoneForRequest(e.target.value)}
              placeholder="+234..."
              className="w-full px-3 py-2 rounded-lg bg-[#1a1a1e] border border-[#6b6b70] text-white text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              aria-label="Phone number"
            />
            {requestHandshakeError && (
              <p className="text-xs text-red-400 mb-2" role="alert">{requestHandshakeError}</p>
            )}
            <button
              type="button"
              onClick={handleSendRequestHandshake}
              disabled={scanning}
              className="w-full py-2.5 rounded-lg font-semibold text-sm bg-[#D4AF37] text-black hover:bg-[#e8c547] disabled:opacity-70"
            >
              {scanning ? 'Sending…' : showMasterApprovalFlow ? 'Send verification to master device' : 'Send request to my phone'}
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleVitalizeNewSoul}
        className="absolute bottom-8 left-0 right-0 mx-auto w-fit text-xs uppercase tracking-wider transition-colors hover:underline"
        style={{ color: '#6b6b70' }}
      >
        Vitalize New Soul
      </button>
    </div>
  );
}
