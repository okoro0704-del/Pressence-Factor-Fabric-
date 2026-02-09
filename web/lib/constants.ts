/**
 * Sovereign Pillar & feature toggles.
 * Core Triple-Pillar: Face → Sovereign Palm → Identity Anchor (Phone).
 * Quad-Pillar Shield (Ghost Economy): + GPS with work-site geofencing.
 */

/** When true, GPS runs as 4th pillar (Quad-Pillar Shield). Work-site geofence applies; Clock-In requires all 4. Mobile: enableHighAccuracy: true to reduce spoofing/ghost locations. */
export const ENABLE_GPS_AS_FOURTH_PILLAR = true;

/** Work-site geofence radius in meters. GPS pillar turns green only when user is within this radius of registered work location. */
export const WORK_SITE_RADIUS_METERS = 100;

/** Pillar labels for Progress Ring and LayerStatusBar */
export const PILLAR_LABEL_FACE = 'Sovereign Face';
export const PILLAR_LABEL_PALM = 'Sovereign Palm';
export const PILLAR_LABEL_IDENTITY_ANCHOR = 'Identity Anchor';
export const PILLAR_LABEL_GPS = 'GPS Presence';

/** Quad-Pillar Shield: four active sensors. Labels aligned with header (LayerStatusBar). */
export const QUAD_PILLAR_DEFINITIONS = [
  { id: 1, label: 'Face', sensor: 'Biometric', confirm: 'I see you.' },
  { id: 2, label: 'Palm', sensor: 'Physical Pattern', confirm: 'Your hand is true.' },
  { id: 3, label: 'Phone Anchor', sensor: 'Hardware Anchor', confirm: 'Phone Anchor verified.' },
  { id: 4, label: 'GPS', sensor: 'Geofenced Work-Site', confirm: 'You are at your post.' },
] as const;

/** One-sentence confirmation when each pillar clears (for brevity) */
export const PILLAR_CONFIRMATIONS = QUAD_PILLAR_DEFINITIONS.map((p) => p.confirm);

/** Vitalization is always Face first (MediaPipe Face Mesh), then Palm (MediaPipe Hands + NIR). No side-by-side capture. */

/** Verified routes for Quad-Pillar / Vitalization flow. Use these constants to avoid 404s. */
export const ROUTES = {
  DASHBOARD: '/dashboard',
  VITALIZATION: '/vitalization',
  VITALIZATION_GPS_MANUAL_SETUP: '/vitalization/gps-manual-setup',
  VITALIZATION_SHARE_LOCATION: '/vitalization/share-location',
  VITALIZATION_MASTER_KEY: '/vitalization/master-key',
  VITALIZATION_RESTORE_IDENTITY: '/vitalization/restore-identity',
} as const;
