/**
 * Global MediaPipe Hands loader — single WASM init to avoid Safari/iOS "Module.arguments has been replaced" error.
 * Use getMediaPipeHands() everywhere; do not create new Hands() in components.
 * Config uses only locateFile (no direct Module.arguments assignment).
 */

const MEDIAPIPE_HANDS_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240';

let handsInstance: Promise<any> | null = null;
let handsResolve: ((instance: any) => void) | null = null;

function defaultLocateFile(file: string, _prefix?: string): string {
  return `${MEDIAPIPE_HANDS_CDN}/${file}`;
}

/**
 * Patches window.createMediapipeSolutionsWasm to add a safe 'arguments' descriptor
 * so Safari/iOS Emscripten does not throw "Module.arguments has been replaced".
 * Call this from locateFile when the WASM .js is requested (runs after library sets Module).
 */
function patchModuleArgumentsOnce(): void {
  if (typeof window === 'undefined') return;
  const w = window as any;
  const m = w.createMediapipeSolutionsWasm;
  if (!m || Object.getOwnPropertyDescriptor(m, 'arguments')) return;
  const args: string[] = [];
  Object.defineProperty(m, 'arguments', {
    get: () => args,
    set: (v: string[] | undefined) => {
      args.length = 0;
      if (v && v.length) args.push(...v);
    },
    configurable: true,
  });
}

/**
 * Get the singleton MediaPipe Hands instance. Initializes WASM once globally.
 * Uses locateFile only (no direct Module.arguments); patches Module before WASM load for iOS.
 */
export async function getMediaPipeHands(options?: {
  locateFile?: (path: string, prefix?: string) => string;
}): Promise<any> {
  const customLocate = options?.locateFile;
  const locateFile = (file: string, prefix?: string) => {
    if (file.includes('wasm') && file.endsWith('.js')) patchModuleArgumentsOnce();
    return customLocate ? customLocate(file, prefix) : defaultLocateFile(file, prefix);
  };

  if (handsInstance) {
    return handsInstance;
  }

  handsInstance = (async () => {
    const { Hands } = await import('@mediapipe/hands');
    const hands = new Hands({ locateFile });
    await hands.initialize();
    return hands;
  })();

  return handsInstance;
}

/**
 * Reset the singleton (e.g. after close or for tests). Next getMediaPipeHands() will create a new instance.
 */
export function resetMediaPipeHands(): void {
  handsInstance = null;
  handsResolve = null;
}
