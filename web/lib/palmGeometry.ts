/**
 * Palm geometry from MediaPipe Hands — unique descriptor for palm verification.
 * AI detection parameters:
 * - Dermatoglyphic mapping: Life, Head, Heart flexure-line proxies from landmarks.
 * - Minutiae-like: ridge-intersection and delta proxies (angles, cross points).
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

/** Angle at b (radians) from a->b->c. */
function angleAt(a: Landmark2D, b: Landmark2D, c: Landmark2D): number {
  const ux = a.x - b.x, uy = a.y - b.y;
  const vx = c.x - b.x, vy = c.y - b.y;
  const dot = ux * vx + uy * vy;
  const mag = Math.hypot(ux, uy) * Math.hypot(vx, vy) || 1e-10;
  return Math.acos(Math.max(-1, Math.min(1, dot / mag)));
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
 * - Scale normalized by wrist-to-middle-MCP.
 * - Dermatoglyphic: Life (wrist–thumb path), Head (MCP line), Heart (above MCP) proxies.
 * - Minutiae-like: angles at MCPs (ridge-intersection proxies), delta (cross point).
 * Returns array of numbers suitable for hashing.
 */
export function palmGeometryDescriptor(landmarks: Landmark2D[]): number[] {
  if (landmarks.length < 21) return [];

  const w = landmarks[0];   // wrist
  const tIp = landmarks[3];   // thumb IP
  const tTip = landmarks[4];  // thumb tip
  const iMcp = landmarks[5];
  const iPip = landmarks[6];
  const iTip = landmarks[8];
  const mMcp = landmarks[9];
  const mPip = landmarks[10];
  const mTip = landmarks[12];
  const rMcp = landmarks[13];
  const rPip = landmarks[14];
  const rTip = landmarks[16];
  const pMcp = landmarks[17];
  const pPip = landmarks[18];
  const pTip = landmarks[20];

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
  const crossNorm = cross ? [cross.x / scale, cross.y / scale] : [0, 0];

  // Dermatoglyphic: Life (wrist→thumb base path), Head (index MCP–pinky MCP), Heart (PIP line)
  const lifeRatio = d(w, tIp) / (d(w, mMcp) || 1);
  const headLine = dist(iMcp, pMcp) / scale;
  const heartLine = dist(iPip, pPip) / scale;
  const dermatoglyphic = [lifeRatio, headLine, heartLine];

  // Minutiae-like: angles at index/middle/ring MCP (ridge-intersection proxies), one delta
  const angleIndex = angleAt(w, iMcp, iTip);
  const angleMiddle = angleAt(iMcp, mMcp, mTip);
  const angleRing = angleAt(mMcp, rMcp, rTip);
  const deltaNorm = cross ? (dist({ x: mMcp.x, y: mMcp.y }, cross) / scale) : 0;
  const minutiae = [angleIndex, angleMiddle, angleRing, deltaNorm];

  return [...distances, ...crossNorm, ...dermatoglyphic, ...minutiae];
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
