/**
 * Native app (PFF PROTOCOL) download. App is hosted on this site, not on stores.
 * Android: direct APK download. iOS: not available yet (web app or check back later).
 */

/** Direct download URL for the Android APK (hosted in /public/download/). */
export const ANDROID_APK_URL = '/download/pff-protocol.apk';

/**
 * Returns the best URL for "Get the app": always the /get-app page so we can show
 * platform-specific options (APK download for Android, iOS message for iPhone).
 */
export function getNativeAppUrl(): string {
  if (typeof window === 'undefined') return '/get-app';
  return '/get-app';
}
