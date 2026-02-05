'use client';

import { useState, useCallback, useRef } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { sha256FromUint8Array, persistFingerprintHashToRecoverySeed } from '@/lib/biometricAnchorSync';
import { dispatchExternalFingerprint } from '@/lib/externalScannerBridge';

const jetbrains = JetBrains_Mono({ weight: ['400', '600'], subsets: ['latin'] });

type ScannerState =
  | 'waiting'
  | 'connecting'
  | 'ready_to_capture'
  | 'capturing'
  | 'finger_detected'
  | 'hashing'
  | 'secured'
  | 'error';

interface BiometricPillarProps {
  phoneNumber: string;
  onComplete?: (payload: { fingerprintHash: string; scannerSerialNumber: string }) => void;
}

/** Find first IN endpoint on interface 0 (typical for HID/vendor fingerprint scanners). */
function findInEndpoint(device: USBDevice): number | null {
  try {
    const config = device.configuration;
    if (!config?.interfaces?.[0]) return null;
    const iface = config.interfaces[0];
    const alt = iface.alternate ?? (iface as { alternates?: { endpoints: USBEndpoint[] }[] }).alternates?.[0];
    const endpoints = alt?.endpoints ?? [];
    const inEp = endpoints.find((e) => e.direction === 'in');
    return inEp ? inEp.endpointNumber : null;
  } catch {
    return null;
  }
}

/** Find first OUT endpoint on interface 0 (for sending capture command). */
function findOutEndpoint(device: USBDevice): number | null {
  try {
    const config = device.configuration;
    if (!config?.interfaces?.[0]) return null;
    const iface = config.interfaces[0];
    const alt = iface.alternate ?? (iface as { alternates?: { endpoints: USBEndpoint[] }[] }).alternates?.[0];
    const endpoints = alt?.endpoints ?? [];
    const outEp = endpoints.find((e) => e.direction === 'out');
    return outEp ? outEp.endpointNumber : null;
  } catch {
    return null;
  }
}

/** Send a capture request to the scanner (vendor/class command or bulk OUT). Many scanners accept 0x01 = capture. */
async function sendCaptureRequest(device: USBDevice): Promise<void> {
  const outEp = findOutEndpoint(device);
  if (outEp != null) {
    try {
      await device.transferOut(outEp, new Uint8Array([0x01]));
    } catch {
      // Ignore; some scanners don't need OUT or use different command
    }
    return;
  }
  try {
    await device.controlTransferOut(
      {
        requestType: 'vendor',
        recipient: 'interface',
        request: 0x01,
        value: 0,
        index: 0,
      },
      new Uint8Array([0x01])
    );
  } catch {
    // Ignore; scanner may use interrupt IN only and trigger on finger presence
  }
}

/** Poll for transfer result (finger data). Max length 64 bytes typical for interrupt IN. */
async function waitForTransferIn(device: USBDevice, endpointNumber: number, maxWaitMs: number): Promise<Uint8Array> {
  const length = 64;
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    try {
      const result = await device.transferIn(endpointNumber, length);
      if (result.status === 'ok' && result.data && result.data.byteLength > 0) {
        const arr = new Uint8Array(result.data.buffer, result.data.byteOffset, result.data.byteLength);
        return arr;
      }
    } catch {
      // Retry
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('No fingerprint data received. Place your finger on the scanner and tap Capture Fingerprint again.');
}

export function BiometricPillar({ phoneNumber, onComplete }: BiometricPillarProps) {
  const [state, setState] = useState<ScannerState>('waiting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deviceRef = useRef<USBDevice | null>(null);
  const inEndpointRef = useRef<number | null>(null);

  const connectScanner = useCallback(async () => {
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    const usb = nav?.usb;
    if (!usb) {
      setState('error');
      setErrorMessage('Web USB is not supported. Use Chrome and ensure the site is served over HTTPS.');
      return;
    }

    setState('connecting');
    setErrorMessage(null);

    try {
      const device = await usb.requestDevice({ filters: [] });
      deviceRef.current = device;

      await device.open();
      if (device.configuration?.configurationValue !== 1) {
        await device.selectConfiguration(1);
      }
      await device.claimInterface(0);

      const endpointNumber = findInEndpoint(device);
      if (endpointNumber == null) {
        setState('error');
        setErrorMessage('Could not find IN endpoint on scanner. Try another device.');
        return;
      }

      inEndpointRef.current = endpointNumber;
      setState('ready_to_capture');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setState('error');
      setErrorMessage(msg);
    }
  }, []);

  const captureFingerprint = useCallback(async () => {
    const device = deviceRef.current;
    const inEp = inEndpointRef.current;
    if (!device || inEp == null) {
      setState('error');
      setErrorMessage('Scanner not connected. Tap Connect Scanner first.');
      return;
    }

    setState('capturing');
    setErrorMessage(null);

    try {
      await sendCaptureRequest(device);

      const rawBuffer = await waitForTransferIn(device, inEp, 30_000);
      setState('finger_detected');

      setState('hashing');
      const hashHex = await sha256FromUint8Array(rawBuffer);

      const persistResult = await persistFingerprintHashToRecoverySeed(phoneNumber.trim(), hashHex, {
        alsoSetExternalFingerprintHash: true,
      });

      if (!persistResult.ok) {
        setState('error');
        setErrorMessage(persistResult.error ?? 'Failed to save to database.');
        return;
      }

      setState('secured');

      const serial = device.serialNumber ?? 'USB';
      dispatchExternalFingerprint({ fingerprintHash: hashHex, scannerSerialNumber: serial });
      onComplete?.({ fingerprintHash: hashHex, scannerSerialNumber: serial });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setState('ready_to_capture');
      setErrorMessage(msg);
    }
  }, [phoneNumber, onComplete]);

  const getStatusText = () => {
    switch (state) {
      case 'waiting':
        return 'Waiting for Scanner';
      case 'connecting':
        return 'Connecting…';
      case 'ready_to_capture':
        return 'Scanner ready';
      case 'capturing':
        return 'Capturing…';
      case 'finger_detected':
        return 'Finger Detected';
      case 'hashing':
        return 'Securing…';
      case 'secured':
        return 'Biometric Anchor Secured';
      case 'error':
        return 'Error';
      default:
        return 'Waiting for Scanner';
    }
  };

  return (
    <div
      className="rounded-2xl border border-[#2a2a2e] p-6 max-w-md mx-auto text-center"
      style={{
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.06) 0%, rgba(0, 0, 0, 0.4) 100%)',
        boxShadow: '0 0 0 1px rgba(212, 175, 55, 0.1)',
      }}
    >
      <h3 className={`text-sm font-bold text-[#D4AF37] uppercase tracking-wider mb-4 ${jetbrains.className}`}>
        Hardware Handshake
      </h3>

      {state === 'waiting' && (
        <button
          type="button"
          onClick={connectScanner}
          className="w-full py-4 rounded-lg bg-[#D4AF37] text-[#0d0d0f] font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          Connect Scanner
        </button>
      )}

      {state === 'ready_to_capture' && (
        <>
          <p className="text-sm font-medium text-[#e8c547] mb-4">{getStatusText()}</p>
          <p className="text-xs text-[#6b6b70] mb-4">Place your finger on the scanner, then tap the button below.</p>
          <button
            type="button"
            onClick={captureFingerprint}
            className="w-full py-4 rounded-lg bg-[#D4AF37] text-[#0d0d0f] font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            Capture Fingerprint
          </button>
        </>
      )}

      {state !== 'waiting' && state !== 'ready_to_capture' && (
        <p
          className={`text-sm font-medium ${
            state === 'secured' ? 'text-green-400' : state === 'error' ? 'text-red-400' : 'text-[#e8c547]'
          } ${jetbrains.className}`}
        >
          {getStatusText()}
        </p>
      )}

      {state === 'capturing' && (
        <p className="text-xs text-[#6b6b70] mt-2">Place your finger on the scanner now…</p>
      )}

      {state === 'secured' && (
        <p className="text-xs text-green-400/80 mt-2">Database confirmed. You can continue.</p>
      )}

      {state === 'error' && errorMessage && (
        <p className="text-xs text-red-400 mt-2" role="alert">
          {errorMessage}
        </p>
      )}

      {state === 'ready_to_capture' && errorMessage && (
        <p className="text-xs text-red-400 mt-2" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
