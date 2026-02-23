/**
 * External Hardware Bridge — Industrial-Only Enrollment
 * Waits for a signal from an External USB/Bluetooth Fingerprint Scanner.
 * The Biometric Pillar (Minting phase) uses this instead of the built-in phone fingerprint.
 *
 * Bridge integration: A companion app, Web Bluetooth/Web Serial script, or backend
 * that receives scanner data should dispatch the custom event:
 *   window.dispatchEvent(new CustomEvent('pff_external_fingerprint', {
 *     detail: { fingerprintHash: string, scannerSerialNumber: string }
 *   }));
 */

const EXTERNAL_FINGERPRINT_EVENT = 'pff_external_fingerprint';
const DEFAULT_TIMEOUT_MS = 60_000;

export interface ExternalFingerprintSignal {
  fingerprintHash: string;
  scannerSerialNumber: string;
}

let pendingResolve: ((value: ExternalFingerprintSignal) => void) | null = null;
let pendingReject: ((reason: Error) => void) | null = null;
let timeoutId: ReturnType<typeof setTimeout> | null = null;

function handleExternalFingerprint(e: Event): void {
  const ev = e as CustomEvent<ExternalFingerprintSignal>;
  const detail = ev?.detail;
  if (!detail?.fingerprintHash || !detail?.scannerSerialNumber) return;
  const hash = String(detail.fingerprintHash).trim();
  const serial = String(detail.scannerSerialNumber).trim();
  if (!hash || !serial) return;
  if (typeof window !== 'undefined') {
    window.removeEventListener(EXTERNAL_FINGERPRINT_EVENT, handleExternalFingerprint);
  }
  if (timeoutId != null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  if (pendingResolve) {
    pendingResolve({ fingerprintHash: hash, scannerSerialNumber: serial });
    pendingResolve = null;
    pendingReject = null;
  }
}

/**
 * Wait for a signal from the External USB/Bluetooth Scanner.
 * Resolves when the bridge dispatches 'pff_external_fingerprint' with fingerprintHash and scannerSerialNumber.
 * Rejects on timeout or if no valid signal is received.
 */
export function waitForExternalFingerprint(
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ExternalFingerprintSignal> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('External scanner bridge requires a browser environment.'));
  }
  return new Promise<ExternalFingerprintSignal>((resolve, reject) => {
    pendingReject = reject;
    pendingResolve = resolve;
    window.addEventListener(EXTERNAL_FINGERPRINT_EVENT, handleExternalFingerprint);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      window.removeEventListener(EXTERNAL_FINGERPRINT_EVENT, handleExternalFingerprint);
      if (pendingReject) {
        pendingReject(new Error('Sovereign Palm scanner timeout. Hold your palm to the camera or connect Hub scanner and try again.'));
        pendingResolve = null;
        pendingReject = null;
      }
    }, timeoutMs);
  });
}

/**
 * Dispatch a fingerprint signal (for bridge/companion app or testing).
 * Call this when the external hardware sends fingerprint hash + scanner serial.
 */
export function dispatchExternalFingerprint(payload: ExternalFingerprintSignal): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(EXTERNAL_FINGERPRINT_EVENT, { detail: payload })
  );
}
