'use client';

import { useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { sha256FromUint8Array, persistFingerprintHashToRecoverySeed } from '@/lib/biometricAnchorSync';
import { dispatchExternalFingerprint } from '@/lib/externalScannerBridge';
import { getSupabase } from '@/lib/supabase';
import {
  connectSentinelBleBridge,
  sendCaptureCommand,
  startHashListener,
  getBridgeHandle,
  disconnectSentinelBleBridge,
} from '@/lib/sentinelBleBridge';

const jetbrains = JetBrains_Mono({ weight: ['400', '600'], subsets: ['latin'] });

const AUTO_POLL_INTERVAL_MS = 500;
const TRANSFER_POLL_MS = 200;

type ScannerState =
  | 'waiting'
  | 'connecting'
  | 'ready_to_capture'
  | 'auto_on'
  | 'capturing'
  | 'finger_detected'
  | 'hashing'
  | 'secured'
  | 'error';

export interface BiometricPillarHandle {
  /** Call when Face Pulse is successfully saved to send command to USB/Serial or Bluetooth bridge and start Auto-On polling. */
  triggerExternalCapture: () => void;
}

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

/** Quick poll for transfer (one short wait). Returns data if available, else null. */
async function tryTransferIn(device: USBDevice, endpointNumber: number, maxWaitMs: number): Promise<Uint8Array | null> {
  const length = 64;
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    try {
      const result = await device.transferIn(endpointNumber, length);
      if (result.status === 'ok' && result.data && result.data.byteLength > 0) {
        return new Uint8Array(result.data.buffer, result.data.byteOffset, result.data.byteLength);
      }
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 20));
  }
  return null;
}

/** Poll for transfer result (finger data). Max length 64 bytes typical for interrupt IN. */
async function waitForTransferIn(device: USBDevice, endpointNumber: number, maxWaitMs: number): Promise<Uint8Array> {
  const arr = await tryTransferIn(device, endpointNumber, maxWaitMs);
  if (arr) return arr;
  throw new Error('No palm data received. Hold your palm to the camera and try again.');
}

export const BiometricPillar = forwardRef<BiometricPillarHandle, BiometricPillarProps>(function BiometricPillar(
  { phoneNumber, onComplete },
  ref
) {
  const [state, setState] = useState<ScannerState>('waiting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [bridgeMode, setBridgeMode] = useState<'usb' | 'ble' | null>(null);
  const deviceRef = useRef<USBDevice | null>(null);
  const inEndpointRef = useRef<number | null>(null);
  const autoPollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isProcessingRef = useRef(false);
  const bleConnectedRef = useRef(false);
  const hashListenerCancelRef = useRef<(() => void) | null>(null);

  /** Process raw fingerprint buffer: hash, persist, dispatch, onComplete. */
  const processRawBuffer = useCallback(
    async (device: USBDevice, rawBuffer: Uint8Array) => {
      const serial = device.serialNumber ?? 'USB';
      setState('hashing');
      setCaptureProgress(70);
      const hashHex = await sha256FromUint8Array(rawBuffer);
      setCaptureProgress(90);
      const persistResult = await persistFingerprintHashToRecoverySeed(phoneNumber.trim(), hashHex, {
        alsoSetExternalFingerprintHash: true,
      });
      if (!persistResult.ok) {
        setState('error');
        setErrorMessage(persistResult.error ?? 'Failed to save to database.');
        return;
      }
      setCaptureProgress(100);
      setState('secured');
      dispatchExternalFingerprint({ fingerprintHash: hashHex, scannerSerialNumber: serial });
      onComplete?.({ fingerprintHash: hashHex, scannerSerialNumber: serial });
    },
    [phoneNumber, onComplete]
  );

  /** Persist BLE hash to recovery_seed_hash and complete (auto-submit 5 VIDA MINT path). */
  const processBleHash = useCallback(
    async (hashHex: string) => {
      hashListenerCancelRef.current?.();
      hashListenerCancelRef.current = null;
      if (!hashHex?.trim()) {
        setState(bleConnectedRef.current ? 'ready_to_capture' : 'waiting');
        setErrorMessage('Timed out. Place finger on Bridge and try again.');
        return;
      }
      setState('finger_detected');
      setCaptureProgress(50);
      setState('hashing');
      setCaptureProgress(70);
      const persistResult = await persistFingerprintHashToRecoverySeed(phoneNumber.trim(), hashHex.trim(), {
        alsoSetExternalFingerprintHash: true,
      });
      if (!persistResult.ok) {
        setState('error');
        setErrorMessage(persistResult.error ?? 'Failed to save to database.');
        return;
      }
      setCaptureProgress(100);
      setState('secured');
      dispatchExternalFingerprint({ fingerprintHash: hashHex.trim(), scannerSerialNumber: 'SENTINEL_BRIDGE' });
      onComplete?.({ fingerprintHash: hashHex.trim(), scannerSerialNumber: 'SENTINEL_BRIDGE' });
    },
    [phoneNumber, onComplete]
  );

  /** Send command to USB/Serial or BLE Bridge; start Auto-On (USB polling or BLE hash listener). */
  const triggerExternalCapture = useCallback(() => {
    const bleHandle = getBridgeHandle();
    if (bleHandle && bleConnectedRef.current) {
      hashListenerCancelRef.current?.();
      sendCaptureCommand()
        .then((r) => {
          if (!r.ok) {
            setErrorMessage(r.error ?? 'Failed to send capture command.');
            return;
          }
          setState('auto_on');
          setErrorMessage(null);
          setCaptureProgress(20);
          hashListenerCancelRef.current = startHashListener(
            (hashHex) => processBleHash(hashHex),
            120_000
          );
        })
        .catch((e) => setErrorMessage(e instanceof Error ? e.message : String(e)));
      return;
    }

    const device = deviceRef.current;
    const inEp = inEndpointRef.current;

    if (device && inEp != null) {
      sendCaptureRequest(device).catch(() => {});
      setState('auto_on');
      setErrorMessage(null);
      if (autoPollIntervalRef.current) {
        clearInterval(autoPollIntervalRef.current);
        autoPollIntervalRef.current = null;
      }
      autoPollIntervalRef.current = setInterval(async () => {
        if (isProcessingRef.current) return;
        const d = deviceRef.current;
        const ep = inEndpointRef.current;
        if (!d || ep == null) return;
        try {
          await sendCaptureRequest(d);
          const raw = await tryTransferIn(d, ep, TRANSFER_POLL_MS);
          if (raw && raw.byteLength > 0) {
            if (autoPollIntervalRef.current) {
              clearInterval(autoPollIntervalRef.current);
              autoPollIntervalRef.current = null;
            }
            isProcessingRef.current = true;
            setState('capturing');
            setCaptureProgress(20);
            setState('finger_detected');
            setCaptureProgress(50);
            await processRawBuffer(d, raw);
            isProcessingRef.current = false;
          }
        } catch {
          // no finger this tick
        }
      }, AUTO_POLL_INTERVAL_MS);
      return;
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pff_sentinel_wake_scanner', { detail: { phoneNumber } }));
    }
  }, [phoneNumber, processRawBuffer, processBleHash]);

  useImperativeHandle(ref, () => ({ triggerExternalCapture }), [triggerExternalCapture]);

  useEffect(() => {
    return () => {
      if (autoPollIntervalRef.current) {
        clearInterval(autoPollIntervalRef.current);
        autoPollIntervalRef.current = null;
      }
      hashListenerCancelRef.current?.();
      hashListenerCancelRef.current = null;
      if (bleConnectedRef.current) {
        disconnectSentinelBleBridge();
        bleConnectedRef.current = false;
      }
      setBridgeMode(null);
    };
  }, []);

  useEffect(() => {
    if (!phoneNumber?.trim()) return;
    const supabase = getSupabase();
    if (!supabase?.channel) return;

    const channel = (supabase as any)
      .channel(`sentinel_remote_commands_${phoneNumber.trim()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sentinel_remote_commands',
          filter: `phone_number=eq.${phoneNumber.trim()}`,
        },
        (payload: { new: { command?: string } }) => {
          const cmd = payload?.new?.command;
          if (cmd === 'wake_scanner') triggerExternalCapture();
        }
      )
      .subscribe();

    return () => {
      (supabase as any).removeChannel(channel);
    };
  }, [phoneNumber, triggerExternalCapture]);

  const connectScanner = useCallback(async () => {
    setBridgeMode(null);
    bleConnectedRef.current = false;
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
      setBridgeMode('usb');
      setState('ready_to_capture');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setState('error');
      setErrorMessage(msg);
    }
  }, []);

  /** Connect to BLE device named SENTINEL_BRIDGE (Bridge Box). Enables cable-free fingerprint via ZKTeco. */
  const connectBleBridge = useCallback(async () => {
    deviceRef.current = null;
    inEndpointRef.current = null;
    setState('connecting');
    setErrorMessage(null);
    try {
      const result = await connectSentinelBleBridge();
      if (!result.ok) {
        setState('error');
        setErrorMessage(result.error ?? 'Could not connect to Sentinel Bridge.');
        return;
      }
      bleConnectedRef.current = true;
      setBridgeMode('ble');
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
    setCaptureProgress(0);
    setErrorMessage(null);

    try {
      await sendCaptureRequest(device);
      setCaptureProgress(20);
      const rawBuffer = await waitForTransferIn(device, inEp, 30_000);
      setState('finger_detected');
      setCaptureProgress(50);
      await processRawBuffer(device, rawBuffer);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setState('ready_to_capture');
      setCaptureProgress(0);
      setErrorMessage(msg);
    }
  }, [processRawBuffer]);

  const getStatusText = () => {
    switch (state) {
      case 'waiting':
        return 'Waiting for Scanner';
      case 'connecting':
        return 'Connecting…';
      case 'ready_to_capture':
        return 'Scanner ready';
      case 'auto_on':
        return 'Sensor Ready (Auto-On)';
      case 'capturing':
        return 'Capturing Digital DNA…';
      case 'finger_detected':
        return 'Capturing Digital DNA…';
      case 'hashing':
        return 'Capturing Digital DNA…';
      case 'secured':
        return 'Biometric Anchor Secured';
      case 'error':
        return 'Error';
      default:
        return 'Waiting for Scanner';
    }
  };

  const sensorActive = state === 'ready_to_capture' || state === 'auto_on';
  const capturingDna = state === 'capturing' || state === 'finger_detected' || state === 'hashing';

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

      {sensorActive && (
        <div className="mb-4">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-[#D4AF37] animate-pulse"
            style={{ boxShadow: '0 0 24px rgba(212, 175, 55, 0.3)' }}
          >
            <span className="text-2xl text-[#D4AF37]">◇</span>
          </div>
          <p className="text-sm font-medium text-[#e8c547] mt-2">{getStatusText()}</p>
          {bridgeMode === 'ble' && state === 'auto_on' ? (
            <p className="text-[10px] text-[#6b6b70] mt-1">Hold your palm to the scanner. Hash will auto-submit.</p>
          ) : bridgeMode !== 'ble' ? (
            <p className="text-[10px] text-[#6b6b70] mt-1">Scanner polling every {AUTO_POLL_INTERVAL_MS}ms</p>
          ) : null}
        </div>
      )}

      {capturingDna && (
        <div className="mb-4">
          <p className="text-sm font-medium text-[#e8c547] mb-2">Capturing Digital DNA…</p>
          <div className="w-full h-2 bg-[#2a2a2e] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#c9a227] to-[#e8c547] rounded-full transition-all duration-300"
              style={{ width: `${Math.max(5, captureProgress)}%` }}
            />
          </div>
        </div>
      )}

      {state === 'waiting' && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={connectScanner}
            className="w-full py-4 rounded-lg bg-[#D4AF37] text-[#0d0d0f] font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            Connect USB Scanner
          </button>
          <button
            type="button"
            onClick={connectBleBridge}
            className="w-full py-4 rounded-lg border-2 border-[#D4AF37] text-[#D4AF37] font-bold text-sm uppercase tracking-wider hover:bg-[#D4AF37]/10 transition-colors"
          >
            Connect Sentinel Bridge (BLE)
          </button>
        </div>
      )}

      {state === 'ready_to_capture' && (
        <>
          {bridgeMode === 'ble' ? (
            <>
              <p className="text-xs text-[#6b6b70] mb-4">Use the Hub Bridge scanner for Sovereign Palm. Request capture to power ZKTeco and receive hash (no cable).</p>
              <button
                type="button"
                onClick={() => triggerExternalCapture()}
                className="w-full py-4 rounded-lg bg-[#D4AF37] text-[#0d0d0f] font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
              >
                Request Palm Scan
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-[#6b6b70] mb-4">Hold your palm to the camera, or use the Hub scanner when available.</p>
              <button
                type="button"
                onClick={captureFingerprint}
                className="w-full py-4 rounded-lg bg-[#D4AF37] text-[#0d0d0f] font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
              >
                Sovereign Palm Scan
              </button>
            </>
          )}
        </>
      )}

      {state === 'auto_on' && (
        <p className="text-xs text-[#6b6b70]">
          {bridgeMode === 'ble' ? 'Hold your palm to the camera or use Bridge scanner. Hash will be sent via BLE and saved.' : 'Hold your palm to the camera. Capturing automatically.'}
        </p>
      )}

      {state !== 'waiting' && !sensorActive && !capturingDna && (
        <p
          className={`text-sm font-medium ${
            state === 'secured' ? 'text-green-400' : state === 'error' ? 'text-red-400' : 'text-[#e8c547]'
          } ${jetbrains.className}`}
        >
          {getStatusText()}
        </p>
      )}

      {state === 'secured' && (
        <p className="text-xs text-green-400/80 mt-2">Database confirmed. You can continue.</p>
      )}

      {state === 'error' && errorMessage && (
        <p className="text-xs text-red-400 mt-2" role="alert">
          {errorMessage}
        </p>
      )}

      {(state === 'ready_to_capture' || state === 'auto_on') && errorMessage && (
        <p className="text-xs text-red-400 mt-2" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
});
