/**
 * PFF Web — CRITICAL BYPASS MODULE (DISABLED FOR ZERO-PERSISTENCE)
 * Architect: Isreal Okoro (mrfundzman)
 *
 * IMPORTANT: This module is DISABLED to enforce mandatory 4-layer re-authentication
 * Even ROOT devices must complete all 4 layers on every entry
 * Zero-persistence rule applies to ALL users, including the Architect
 *
 * Purpose (LEGACY - NOW DISABLED):
 * - Force immediate access for ROOT_SOVEREIGN_PAIR devices
 * - Bypass all authentication checks
 * - Purge DOM overlays and lock screens
 * - Set persistent local storage flags
 */

// ROOT DEVICE IDENTIFIERS - DUAL-HASH RECOGNITION
const AUTHORIZED_DEVICE_IDS = [
  'HP-LAPTOP-ROOT-SOVEREIGN-001', // Legacy laptop identifier
  'DEVICE-3B5B738BB',              // Modern device fingerprint
];

const AUTHORIZED_HARDWARE_HASHES = [
  '8423250efbaecab0f28237786161709d794c71deb0dcfb8ebd92b14e1cc643db', // Legacy laptop hash
  'ed14836c09db1ddf316404fd39df41f9869494d428a5859e4419825dc8ea6dfd', // Modern hardware hash
];

const ROOT_ACCESS_KEY = 'PFF_ROOT_ACCESS';
const SOVEREIGN_COOKIE_KEY = 'PFF_SOVEREIGN_COOKIE';
const COOKIE_EXPIRY_DAYS = 365;

/**
 * Set Sovereign Cookie (365-day persistent bypass)
 */
function setSovereignCookie(): void {
  try {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);

    const cookieValue = {
      granted: true,
      timestamp: Date.now(),
      expiry: expiryDate.getTime(),
    };

    localStorage.setItem(SOVEREIGN_COOKIE_KEY, JSON.stringify(cookieValue));
    console.log('[CRITICAL BYPASS] ✅ SOVEREIGN COOKIE SET (365-day expiry)');
  } catch (err) {
    console.error('[CRITICAL BYPASS] Error setting sovereign cookie:', err);
  }
}

/**
 * Check if Sovereign Cookie is valid
 */
function hasSovereignCookie(): boolean {
  try {
    const cookieStr = localStorage.getItem(SOVEREIGN_COOKIE_KEY);
    if (!cookieStr) return false;

    const cookie = JSON.parse(cookieStr);
    const now = Date.now();

    if (cookie.granted && cookie.expiry > now) {
      console.log('[CRITICAL BYPASS] ✅ VALID SOVEREIGN COOKIE FOUND');
      return true;
    }

    // Cookie expired, remove it
    localStorage.removeItem(SOVEREIGN_COOKIE_KEY);
    return false;
  } catch (err) {
    return false;
  }
}

/**
 * Check if current device is ROOT_SOVEREIGN_PAIR
 * DISABLED: Always returns false to enforce mandatory 4-layer authentication
 */
export function isRootDevice(): boolean {
  // ZERO-PERSISTENCE ENFORCEMENT: Even ROOT devices must complete 4 layers
  console.log('[CRITICAL BYPASS] ⚠️ DISABLED - All users must complete 4-layer authentication');
  return false;

  /* LEGACY CODE - DISABLED FOR ZERO-PERSISTENCE
  try {
    // Check for valid Sovereign Cookie first (fastest path)
    if (hasSovereignCookie()) {
      return true;
    }

    // Check localStorage for device_id (array-based)
    const storedDeviceId = localStorage.getItem('device_id');
    if (storedDeviceId && AUTHORIZED_DEVICE_IDS.includes(storedDeviceId)) {
      console.log('[CRITICAL BYPASS] ✅ ROOT DEVICE DETECTED (Device ID Match)');
      setSovereignCookie(); // Set cookie for future visits
      return true;
    }

    // FALLBACK: If device_id is HP-LAPTOP-ROOT-SOVEREIGN-001, grant access even without hash match
    if (storedDeviceId === 'HP-LAPTOP-ROOT-SOVEREIGN-001') {
      console.log('[CRITICAL BYPASS] ✅ ROOT DEVICE DETECTED (Legacy Laptop Fallback)');
      setSovereignCookie();
      return true;
    }

    // Check for hardware hash match (array-based)
    const storedHardwareHash = localStorage.getItem('hardware_tpm_hash');
    if (storedHardwareHash && AUTHORIZED_HARDWARE_HASHES.includes(storedHardwareHash)) {
      console.log('[CRITICAL BYPASS] ✅ ROOT DEVICE DETECTED (Hardware Hash Match)');
      setSovereignCookie();
      return true;
    }

    // Check for root access flag
    const rootAccess = localStorage.getItem(ROOT_ACCESS_KEY);
    if (rootAccess === 'GRANTED') {
      console.log('[CRITICAL BYPASS] ✅ ROOT ACCESS GRANTED (Persistent Flag)');
      setSovereignCookie();
      return true;
    }

    return false;
  } catch (err) {
    console.error('[CRITICAL BYPASS] Error checking root device:', err);
    return false;
  }
  */
}

/**
 * Grant ROOT access and set persistent flags
 */
export function grantRootAccess(): void {
  try {
    localStorage.setItem(ROOT_ACCESS_KEY, 'GRANTED');
    localStorage.setItem('presence_verified', 'true');
    localStorage.setItem('device_authorized', 'true');
    localStorage.setItem('isLocked', 'false');
    localStorage.setItem('isAuthorized', 'true');
    
    console.log('[CRITICAL BYPASS] ✅ ROOT ACCESS GRANTED - PERSISTENT FLAGS SET');
  } catch (err) {
    console.error('[CRITICAL BYPASS] Error granting root access:', err);
  }
}

/**
 * DOM Purge: Remove all lock overlays and hover screens
 */
export function purgeLockOverlays(): void {
  try {
    // Find and remove elements with lock-related classes/IDs
    const selectors = [
      '[class*="overlay"]',
      '[class*="lockscreen"]',
      '[class*="lock-screen"]',
      '[class*="hoverboard"]',
      '[class*="hover-board"]',
      '[id*="overlay"]',
      '[id*="lockscreen"]',
      '[id*="lock-screen"]',
      '[id*="hoverboard"]',
      '[id*="hover-board"]',
      '[class*="verification"]',
      '[class*="pending"]',
      '[class*="loading-overlay"]',
    ];

    let purgedCount = 0;
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const htmlEl = el as HTMLElement;
        // Check if it's actually a lock/overlay element (not a legitimate component)
        const classList = htmlEl.className.toLowerCase();
        const id = htmlEl.id.toLowerCase();
        
        if (
          classList.includes('lock') ||
          classList.includes('overlay') ||
          classList.includes('hoverboard') ||
          classList.includes('verification') ||
          classList.includes('pending') ||
          id.includes('lock') ||
          id.includes('overlay') ||
          id.includes('hoverboard')
        ) {
          htmlEl.style.display = 'none';
          htmlEl.style.visibility = 'hidden';
          htmlEl.style.opacity = '0';
          htmlEl.style.pointerEvents = 'none';
          htmlEl.setAttribute('data-purged', 'true');
          purgedCount++;
        }
      });
    });

    if (purgedCount > 0) {
      console.log(`[CRITICAL BYPASS] ✅ PURGED ${purgedCount} LOCK OVERLAYS FROM DOM`);
    }
  } catch (err) {
    console.error('[CRITICAL BYPASS] Error purging overlays:', err);
  }
}

/**
 * Force state overrule for ROOT devices
 */
export function forceRootState(): { isLocked: boolean; isAuthorized: boolean } {
  if (isRootDevice()) {
    grantRootAccess();
    purgeLockOverlays();
    
    return {
      isLocked: false,
      isAuthorized: true,
    };
  }

  return {
    isLocked: true,
    isAuthorized: false,
  };
}

/**
 * Initialize CRITICAL BYPASS on page load
 * DISABLED: No bypass allowed - all users must complete 4-layer authentication
 */
export function initializeCriticalBypass(): void {
  console.log('[CRITICAL BYPASS] ⚠️ DISABLED - ZERO-PERSISTENCE ENFORCEMENT ACTIVE');
  console.log('[CRITICAL BYPASS] 🔐 All users (including Architect) must complete 4-layer authentication');
  console.log('[CRITICAL BYPASS] 🔥 Session destroyed on tab close, phone lock, or background');

  // ZERO-PERSISTENCE ENFORCEMENT: No bypass allowed
  // All users must complete 4 layers on every entry

  /* LEGACY CODE - DISABLED FOR ZERO-PERSISTENCE
  const state = forceRootState();

  if (state.isAuthorized) {
    console.log('[CRITICAL BYPASS] ✅ ROOT DEVICE AUTHORIZED - ALL LOCKS TERMINATED');

    // Run DOM purge after a short delay to catch dynamically rendered overlays
    setTimeout(() => purgeLockOverlays(), 100);
    setTimeout(() => purgeLockOverlays(), 500);
    setTimeout(() => purgeLockOverlays(), 1000);
  } else {
    console.log('[CRITICAL BYPASS] ⚠️ NON-ROOT DEVICE - STANDARD AUTHENTICATION REQUIRED');
  }
  */
}

