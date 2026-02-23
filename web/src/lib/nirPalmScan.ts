/**
 * NIR-Simulation Palm Scan — Sub-surface mapping, reflectance check, pulse detection.
 * Produces a 256-bit vascular hash for storage (user_profiles.palm_hash / citizen_signatures).
 */

/** Result of sampling palm region: Cyan and Deep Red channels for vascular contrast. */
export interface VascularDescriptor {
  /** Deep Red (R channel) — venous contrast in RGB simulation */
  meanRed: number;
  /** Cyan proxy: (G+B)/2 — complementary to red for vein-like patterns */
  meanCyan: number;
  varianceRed: number;
  varianceCyan: number;
  /** Grid of R values (3x3) normalized 0–1 for spatial pattern */
  redGrid: number[];
}

/** Reflectance check: pass if material looks like skin (not plastic/paper). */
export interface ReflectanceResult {
  pass: boolean;
  reason?: string;
}

/** Palm region from ImageData: (x, y, width, height) in pixel coords. */
function getPalmRegionPixels(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  sx: number,
  sy: number,
  size: number
): { r: number; g: number; b: number }[] {
  const out: { r: number; g: number; b: number }[] = [];
  for (let y = sy; y < Math.min(sy + size, h); y++) {
    for (let x = sx; x < Math.min(sx + size, w); x++) {
      const i = (y * w + x) * 4;
      out.push({
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
      });
    }
  }
  return out;
}

/**
 * Sub-surface mapping: extract Cyan and Deep Red channel features from palm region.
 * Helps identify vascular patterns (veins) rather than just skin creases.
 */
export function extractVascularDescriptor(
  imageData: ImageData,
  centerX: number,
  centerY: number,
  regionSize: number = 24
): VascularDescriptor {
  const { data, width: w, height: h } = imageData;
  const sx = Math.max(0, Math.floor(centerX - regionSize / 2));
  const sy = Math.max(0, Math.floor(centerY - regionSize / 2));
  const pixels = getPalmRegionPixels(data, w, h, sx, sy, regionSize);

  if (pixels.length === 0) {
    return {
      meanRed: 0,
      meanCyan: 0,
      varianceRed: 0,
      varianceCyan: 0,
      redGrid: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
  }

  const reds = pixels.map((p) => p.r);
  const cyans = pixels.map((p) => (p.g + p.b) / 2);
  const meanRed = reds.reduce((a, b) => a + b, 0) / reds.length;
  const meanCyan = cyans.reduce((a, b) => a + b, 0) / cyans.length;
  const varianceRed = reds.reduce((a, v) => a + (v - meanRed) ** 2, 0) / reds.length;
  const varianceCyan = cyans.reduce((a, v) => a + (v - meanCyan) ** 2, 0) / cyans.length;

  const gridSize = 3;
  const step = Math.max(1, Math.floor(regionSize / gridSize));
  const redGrid: number[] = [];
  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      const px = sx + gx * step;
      const py = sy + gy * step;
      if (px < w && py < h) {
        const i = (py * w + px) * 4;
        redGrid.push(data[i] / 255);
      } else {
        redGrid.push(0);
      }
    }
  }

  return {
    meanRed: meanRed / 255,
    meanCyan: meanCyan / 255,
    varianceRed: varianceRed / (255 * 255),
    varianceCyan: varianceCyan / (255 * 255),
    redGrid: redGrid.length === 9 ? redGrid : [...redGrid, 0, 0, 0].slice(0, 9),
  };
}

/**
 * Reflectance check: detect specular (plastic) or too matte (paper).
 * Skin has moderate variance and few saturated highlights.
 */
export function reflectanceCheck(imageData: ImageData): ReflectanceResult {
  const { data } = imageData;
  const n = data.length / 4;
  let sumL = 0;
  const luminances: number[] = [];
  let highCount = 0;
  let lowCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    sumL += L;
    luminances.push(L);
    if (L >= 0.95) highCount++;
    if (L <= 0.15) lowCount++;
  }

  const meanL = sumL / n;
  const variance = luminances.reduce((a, v) => a + (v - meanL) ** 2, 0) / n;
  const fractionHigh = highCount / n;
  const fractionLow = lowCount / n;

  if (fractionHigh > 0.25) {
    return { pass: false, reason: 'Fake Material Detected — surface too reflective (plastic/screen).' };
  }
  if (variance < 0.002 && n >= 50) {
    return { pass: false, reason: 'Fake Material Detected — surface too flat (paper/print).' };
  }
  if (fractionLow > 0.9) {
    return { pass: false, reason: 'Fake Material Detected — no skin tone detected.' };
  }
  return { pass: true };
}

/** Human pulse range: ~0.8–2.5 Hz (48–150 bpm). */
const PULSE_MIN_HZ = 0.8;
const PULSE_MAX_HZ = 2.5;

/**
 * Pulse detection: look for micro-fluctuations in skin tone in the 0.8–2.5 Hz band.
 * Uses simple autocorrelation at lags corresponding to ~1–2 Hz at given fps.
 */
export function pulseFromTimeSeries(
  samples: number[],
  fps: number
): { pulseDetected: boolean; pulseScore: number } {
  if (samples.length < 30 || fps < 10) {
    return { pulseDetected: false, pulseScore: 0 };
  }

  const n = samples.length;
  const mean = samples.reduce((a, b) => a + b, 0) / n;
  const variance = samples.reduce((a, v) => a + (v - mean) ** 2, 0) / n;
  if (variance < 1e-6) return { pulseDetected: false, pulseScore: 0 };

  const minLag = Math.max(1, Math.floor(fps / PULSE_MAX_HZ));
  const maxLag = Math.min(n - 1, Math.ceil(fps / PULSE_MIN_HZ));
  let maxCorr = 0;
  let bestLag = minLag;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    let count = 0;
    for (let i = 0; i < n - lag; i++) {
      corr += (samples[i] - mean) * (samples[i + lag] - mean);
      count++;
    }
    const r = count > 0 ? corr / (count * variance) : 0;
    if (r > maxCorr) {
      maxCorr = r;
      bestLag = lag;
    }
  }

  const periodSec = bestLag / fps;
  const freqHz = 1 / periodSec;
  const inRange = freqHz >= PULSE_MIN_HZ && freqHz <= PULSE_MAX_HZ;
  const pulseScore = inRange ? Math.min(1, maxCorr * 1.5) : 0;
  const pulseDetected = inRange && maxCorr > 0.15;

  return { pulseDetected, pulseScore };
}

/**
 * Combine geometry descriptor, vascular descriptor, and pulse into a single 256-bit (SHA-256) hash.
 * Stored as palm_hash in user_profiles (and/or citizen_signatures table if present).
 */
export async function vascularHash256(
  geometryDescriptor: number[],
  vascularDescriptor: VascularDescriptor,
  pulseScore: number
): Promise<string> {
  const payload = {
    g: geometryDescriptor.map((n) => Math.round(n * 1e6) / 1e6),
    v: {
      meanRed: Math.round(vascularDescriptor.meanRed * 1e6) / 1e6,
      meanCyan: Math.round(vascularDescriptor.meanCyan * 1e6) / 1e6,
      varianceRed: Math.round(vascularDescriptor.varianceRed * 1e6) / 1e6,
      varianceCyan: Math.round(vascularDescriptor.varianceCyan * 1e6) / 1e6,
      redGrid: vascularDescriptor.redGrid.map((n) => Math.round(n * 1e6) / 1e6),
    },
    p: Math.round(pulseScore * 1e6) / 1e6,
  };
  const str = JSON.stringify(payload);
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  const arr = Array.from(new Uint8Array(buf));
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('');
}
