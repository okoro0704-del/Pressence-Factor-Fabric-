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
