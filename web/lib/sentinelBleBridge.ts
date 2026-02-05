/**
 * Bluetooth Sentinel Bridge — BLE interface to Bridge Box (device name SENTINEL_BRIDGE).
 * App sends '1' to power ZKTeco and wait for finger; Bridge sends Base64 hash back; app auto-submits to Supabase.
 */

const SENTINEL_BRIDGE_NAME = 'SENTINEL_BRIDGE';
const NORDIC_UART_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const NORDIC_UART_TX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const NORDIC_UART_RX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

export interface SentinelBleBridgeHandle {
  device: BluetoothDevice;
  txChar: BluetoothRemoteGATTCharacteristic;
  rxChar: BluetoothRemoteGATTCharacteristic;
}

let bridgeHandle: SentinelBleBridgeHandle | null = null;
let hashResolver: ((hashHex: string) => void) | null = null;

/**
 * Scan for BLE device named SENTINEL_BRIDGE and connect. Returns handle for sendCaptureCommand.
 */
export async function connectSentinelBleBridge(): Promise<{
  ok: true;
  handle: SentinelBleBridgeHandle;
} | { ok: false; error: string }> {
  if (typeof navigator === 'undefined' || !navigator.bluetooth) {
    return { ok: false, error: 'Web Bluetooth is not supported. Use Chrome/Edge and HTTPS.' };
  }

  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ name: SENTINEL_BRIDGE_NAME }],
      optionalServices: [NORDIC_UART_SERVICE],
    });

    const server = await device.gatt!.connect();
    const service = await server.getPrimaryService(NORDIC_UART_SERVICE);
    const txChar = await service.getCharacteristic(NORDIC_UART_TX);
    const rxChar = await service.getCharacteristic(NORDIC_UART_RX);

    bridgeHandle = { device, txChar, rxChar };

    device.addEventListener('gattserverdisconnected', () => {
      bridgeHandle = null;
    });

    return { ok: true, handle: bridgeHandle };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Send capture command '1' to the Bridge Box. Bridge powers ZKTeco and waits for finger.
 * Call this when the user reaches the fingerprint stage.
 */
export async function sendCaptureCommand(): Promise<{ ok: true } | { ok: false; error: string }> {
  const handle = bridgeHandle;
  if (!handle) {
    return { ok: false, error: 'Bluetooth Bridge not connected. Connect to SENTINEL_BRIDGE first.' };
  }

  try {
    const encoder = new TextEncoder();
    await handle.txChar.writeValueWithResponse(encoder.encode('1'));
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Start listening for the Base64 hash from the Bridge. Resolves when Bridge sends the hash after a successful scan.
 * Call this after sendCaptureCommand(); the Bridge sends the hash back via BLE notification.
 */
export function startHashListener(
  onHash: (hashHex: string) => void,
  timeoutMs: number = 120_000
): () => void {
  const handle = bridgeHandle;
  if (!handle) {
    return () => {};
  }

  let cancelled = false;
  const timeoutId = setTimeout(() => {
    if (!cancelled && hashResolver) {
      hashResolver = null;
      onHash(''); // or could reject; caller can treat empty as timeout
    }
  }, timeoutMs);

  hashResolver = (hashHex: string) => {
    if (cancelled) return;
    clearTimeout(timeoutId);
    hashResolver = null;
    if (hashHex) onHash(hashHex);
  };

  (async () => {
    try {
      await handle.rxChar.startNotifications();
      handle.rxChar.addEventListener('characteristicvaluechanged', (ev: Event) => {
        if (cancelled) return;
        const char = (ev as { target?: BluetoothRemoteGATTCharacteristic }).target as BluetoothRemoteGATTCharacteristic | undefined;
        const value = char?.value;
        if (!value) return;
        const bytes = new Uint8Array(value.buffer);
        const str = new TextDecoder().decode(bytes);
        const trimmed = str.replace(/\s/g, '').trim();
        if (trimmed.length > 0) {
          base64ToHashHexAsync(trimmed).then((hashHex) => {
            if (hashHex && hashResolver) hashResolver(hashHex);
          });
        }
      });
    } catch {
      if (hashResolver) hashResolver('');
    }
  })();

  return () => {
    cancelled = true;
    clearTimeout(timeoutId);
    hashResolver = null;
  };
}

/**
 * Decode Base64 from Bridge to SHA-256 hex. Bridge may send raw template Base64 or hash Base64.
 * If 32 bytes after decode, treat as SHA-256 and convert to hex; else SHA-256 the bytes and return hex.
 */
async function base64ToHashHexAsync(base64: string): Promise<string> {
  try {
    const binary = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    if (bytes.length === 32) {
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
    return sha256ToHex(bytes);
  } catch {
    return '';
  }
}

function sha256ToHex(bytes: Uint8Array): Promise<string> {
  return crypto.subtle.digest('SHA-256', bytes).then((buf) => {
    const arr = new Uint8Array(buf);
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  });
}

export function getBridgeHandle(): SentinelBleBridgeHandle | null {
  return bridgeHandle;
}

export function disconnectSentinelBleBridge(): void {
  if (bridgeHandle?.device?.gatt?.connected) {
    bridgeHandle.device.gatt.disconnect();
  }
  bridgeHandle = null;
  hashResolver = null;
}
