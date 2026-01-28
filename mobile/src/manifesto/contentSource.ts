/**
 * PFF — Manifesto content source.
 * Fetches from MANIFESTO_CONFIG_URL if set; else uses bundled default.
 * CMS-ready for future Contentful adapter.
 */

import type { ManifestoConfig, ManifestoSlide } from './types';

const DEFAULT_CONFIG = require('./manifesto.json') as ManifestoConfig;

/** Set via app config or env (e.g. react-native-config) for no-redeploy updates. */
export const MANIFESTO_CONFIG_URL: string | undefined = undefined;

let cachedSlides: ManifestoSlide[] | null = null;

/**
 * Load Manifesto slides. Tries config URL first; falls back to bundled default.
 */
export async function getManifestoSlides(): Promise<ManifestoSlide[]> {
  if (cachedSlides) return cachedSlides;

  if (typeof MANIFESTO_CONFIG_URL === 'string' && MANIFESTO_CONFIG_URL) {
    try {
      const res = await fetch(MANIFESTO_CONFIG_URL);
      if (res.ok) {
        const data = (await res.json()) as ManifestoConfig;
        if (data?.slides?.length) {
          cachedSlides = data.slides;
          return cachedSlides;
        }
      }
    } catch {
      // Fall through to default
    }
  }

  cachedSlides = DEFAULT_CONFIG.slides ?? [];
  return cachedSlides;
}

/**
 * Sync access to default slides (e.g. for initial render before async load).
 */
export function getDefaultManifestoSlides(): ManifestoSlide[] {
  return DEFAULT_CONFIG.slides ?? [];
}
