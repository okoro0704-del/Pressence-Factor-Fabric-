/**
 * Palm geometry from MediaPipe Hands — unique descriptor for palm verification.
 * Captures distances between key landmarks and normalized ratios; hashed as palm_hash.
 * 21 landmarks: 0 wrist, 1-4 thumb, 5-8 index, 9-12 middle, 13-16 ring, 17-20 pinky.
 */

export interface Landmark2D {
  x: number;
  y: number;
  z?: number;
}

/** Distance between two points. */
function dist(a: Landmark2D, b: Landmark2D): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Line-line intersection in 2D (parametric). Returns null if parallel. */
function lineIntersection(
  p1: Landmark2D,
  p2: Landmark2D,
  p3: Landmark2D,
  p4: Landmark2D
): { x: number; y: number } | null {
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
  if (Math.abs(d) < 1e-10) return null;
  const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
  return {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y),
  };
}

/**
 * Build a stable geometry descriptor from 21 hand landmarks (MediaPipe Hands order).
 * - Normalize scale by wrist-to-middle-MCP distance.
 * - Include: key distances (wrist to finger bases, between finger tips, finger lengths).
 * - Include: one intersection (e.g. line wrist–middle_tip × index_base–pinky_base) for extra uniqueness.
 * Returns array of numbers suitable for hashing.
 */
export function palmGeometryDescriptor(landmarks: Landmark2D[]): number[] {
  if (landmarks.length < 21) return [];

  const w = landmarks[0];   // wrist
  const tTip = landmarks[4];   // thumb tip
  const iMcp = landmarks[5];  // index MCP
  const iTip = landmarks[8];  // index tip
  const mMcp = landmarks[9]; // middle MCP
  const mTip = landmarks[12]; // middle tip
  const rMcp = landmarks[13]; // ring MCP
  const rTip = landmarks[16]; // ring tip
  const pMcp = landmarks[17]; // pinky MCP
  const pTip = landmarks[20]; // pinky tip

  const scale = dist(w, mMcp) || 1;
  const d = (a: Landmark2D, b: Landmark2D) => dist(a, b) / scale;

  const distances = [
    d(w, mMcp),
    d(w, iMcp),
    d(w, rMcp),
    d(w, pMcp),
    d(iMcp, mMcp),
    d(mMcp, rMcp),
    d(rMcp, pMcp),
    d(iTip, mTip),
    d(mTip, rTip),
    d(rTip, pTip),
    d(iMcp, iTip),
    d(mMcp, mTip),
    d(rMcp, rTip),
    d(pMcp, pTip),
    d(w, tTip),
  ];

  const cross = lineIntersection(w, mTip, iMcp, pMcp);
  const crossNorm = cross
    ? [cross.x / scale, cross.y / scale]
    : [0, 0];

  return [...distances, ...crossNorm];
}

/**
 * SHA-256 hash of the geometry descriptor (rounded to 6 decimals for stability).
 * Returns hex string for storage as palm_hash.
 */
export async function palmDescriptorToHash(descriptor: number[]): Promise<string> {
  const rounded = descriptor.map((n) => Math.round(n * 1e6) / 1e6);
  const str = JSON.stringify(rounded);
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  const arr = Array.from(new Uint8Array(buf));
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Full pipeline: landmarks → descriptor → palm_hash (hex).
 */
export async function computePalmHash(landmarks: Landmark2D[]): Promise<string | null> {
  const desc = palmGeometryDescriptor(landmarks);
  if (desc.length === 0) return null;
  return palmDescriptorToHash(desc);
}
