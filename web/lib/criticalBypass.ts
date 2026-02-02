/**
 * PFF Web — CRITICAL BYPASS MODULE
 * Terminates all lock overlays for ROOT devices
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * Purpose:
 * - Force immediate access for ROOT_SOVEREIGN_PAIR devices
 * - Bypass all authentication checks
 * - Purge DOM overlays and lock screens
 * - Set persistent local storage flags
 */

// ROOT DEVICE IDENTIFIERS
const ROOT_DEVICE_ID = 'HP-LAPTOP-ROOT-SOVEREIGN-001';
const ROOT_HARDWARE_HASH = '8423250efbaecab0f28237786161709d794c71deb0dcfb8ebd92b14e1cc643db';
const ROOT_ACCESS_KEY = 'PFF_ROOT_ACCESS';

/**
 * Check if current device is ROOT_SOVEREIGN_PAIR
 */
export function isRootDevice(): boolean {
  try {
    // Check localStorage for device_id
    const storedDeviceId = localStorage.getItem('device_id');
    if (storedDeviceId === ROOT_DEVICE_ID) {
      console.log('[CRITICAL BYPASS] ✅ ROOT DEVICE DETECTED (Device ID Match)');
      return true;
    }

    // Check for hardware hash match
    const storedHardwareHash = localStorage.getItem('hardware_tpm_hash');
    if (storedHardwareHash === ROOT_HARDWARE_HASH) {
      console.log('[CRITICAL BYPASS] ✅ ROOT DEVICE DETECTED (Hardware Hash Match)');
      return true;
    }

    // Check for root access flag
    const rootAccess = localStorage.getItem(ROOT_ACCESS_KEY);
    if (rootAccess === 'GRANTED') {
      console.log('[CRITICAL BYPASS] ✅ ROOT ACCESS GRANTED (Persistent Flag)');
      return true;
    }

    return false;
  } catch (err) {
    console.error('[CRITICAL BYPASS] Error checking root device:', err);
    return false;
  }
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
 */
export function initializeCriticalBypass(): void {
  console.log('[CRITICAL BYPASS] 🔥 INITIALIZING CRITICAL BYPASS PROTOCOL');
  
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
}

