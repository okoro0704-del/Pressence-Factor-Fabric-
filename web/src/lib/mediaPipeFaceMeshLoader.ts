/**
 * Global MediaPipe Face Mesh loader — single WASM init to avoid Safari/iOS "Module.arguments has been replaced" error.
 * Use getMediaPipeFaceMesh() everywhere; do not create new FaceMesh() in components.
 * Config uses only locateFile (no direct Module.arguments assignment).
 */

const MEDIAPIPE_FACE_MESH_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619';

let faceMeshInstance: Promise<any> | null = null;

function defaultLocateFile(file: string, _prefix?: string): string {
  return `${MEDIAPIPE_FACE_MESH_CDN}/${file}`;
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
 * Get the singleton MediaPipe Face Mesh instance. Initializes WASM once globally.
 * Uses locateFile only (no direct Module.arguments); patches Module before WASM load for iOS.
 */
export async function getMediaPipeFaceMesh(options?: {
  locateFile?: (path: string, prefix?: string) => string;
}): Promise<any> {
  const customLocate = options?.locateFile;
  const locateFile = (file: string, prefix?: string) => {
    if (file.includes('wasm') && file.endsWith('.js')) patchModuleArgumentsOnce();
    return customLocate ? customLocate(file, prefix) : defaultLocateFile(file, prefix);
  };

  if (faceMeshInstance) {
    return faceMeshInstance;
  }

  faceMeshInstance = (async () => {
    const { FaceMesh } = await import('@mediapipe/face_mesh');
    const faceMesh = new FaceMesh({ locateFile });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
      selfieMode: true,
    });
    await faceMesh.initialize();
    return faceMesh;
  })();

  return faceMeshInstance;
}

/**
 * Reset the singleton (e.g. after close or for tests). Next getMediaPipeFaceMesh() will create a new instance.
 */
export function resetMediaPipeFaceMesh(): void {
  faceMeshInstance = null;
}
